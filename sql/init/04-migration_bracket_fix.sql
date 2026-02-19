------------------------------------------------------------
-- 2. Перезаписываем функции с обновленной логикой
------------------------------------------------------------

-- Функция создания матча теперь поддерживает NULL для team_b_id
CREATE OR REPLACE FUNCTION create_match_for_tournament(
    p_tournament_id BIGINT,
    p_team_a_id     BIGINT,
    p_team_b_id     BIGINT,
    p_scheduled_at  TIMESTAMPTZ,
    p_stage         VARCHAR,
    p_best_of       INTEGER DEFAULT 1
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_match_id BIGINT;
BEGIN
    IF p_team_b_id IS NOT NULL AND p_team_a_id = p_team_b_id THEN
        RAISE EXCEPTION 'Team A and Team B must be different';
    END IF;

    -- Проверяем, что team_a одобрена в турнире
    PERFORM 1
    FROM tournament_registration tr
    WHERE tr.tournament_id = p_tournament_id
      AND tr.team_id       = p_team_a_id
      AND tr.status        = 'approved';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Team % is not approved for tournament %', p_team_a_id, p_tournament_id;
    END IF;

    -- Проверяем team_b только если она указана
    IF p_team_b_id IS NOT NULL THEN
        PERFORM 1
        FROM tournament_registration tr
        WHERE tr.tournament_id = p_tournament_id
          AND tr.team_id       = p_team_b_id
          AND tr.status        = 'approved';

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Team % is not approved for tournament %', p_team_b_id, p_tournament_id;
        END IF;
    END IF;

    INSERT INTO match (tournament_id, team_a_id, team_b_id, scheduled_at, stage, best_of)
    VALUES (p_tournament_id, p_team_a_id, p_team_b_id, p_scheduled_at, p_stage, COALESCE(p_best_of, 1))
    RETURNING match_id INTO v_match_id;

    RETURN v_match_id;
END;
$$;

-- Функция создания следующего матча с правильной логикой турнирной сетки
CREATE OR REPLACE FUNCTION create_next_match_if_possible(
    p_match_id BIGINT,
    p_winner_team_id BIGINT
)
RETURNS TABLE(
    next_match_id BIGINT,
    champion_team_id BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_tournament_id BIGINT;
    v_current_stage VARCHAR;
    v_next_stage VARCHAR;
    v_existing_match_id BIGINT;
    v_new_match_id BIGINT;
    v_champion_id BIGINT;
    v_scheduled_time TIMESTAMPTZ;
    v_remaining_count INTEGER;
BEGIN
    -- Получаем турнир и текущую стадию матча
    SELECT tournament_id, stage
    INTO v_tournament_id, v_current_stage
    FROM match
    WHERE match_id = p_match_id;

    IF v_tournament_id IS NULL THEN
        RAISE EXCEPTION 'Match % not found', p_match_id;
    END IF;

    -- Исключаем проигравшую команду
    PERFORM eliminate_loser_team(p_match_id, p_winner_team_id);

    -- Считаем оставшихся (невыбывших) команд
    SELECT COUNT(*)
    INTO v_remaining_count
    FROM tournament_registration
    WHERE tournament_id = v_tournament_id
      AND status = 'approved';

    -- Если осталась 1 команда - это чемпион
    IF v_remaining_count = 1 THEN
        -- Завершаем турнир
        v_champion_id := complete_tournament_if_needed(v_tournament_id);
        RETURN QUERY SELECT NULL::BIGINT as next_match_id, v_champion_id as champion_team_id;
        RETURN;
    END IF;

    -- Определяем следующую стадию (упрощенная логика)
    v_next_stage := COALESCE(v_current_stage, 'round_1');
    IF v_next_stage LIKE 'round_%' THEN
        v_next_stage := 'round_' || (SUBSTRING(v_next_stage FROM 'round_(\d+)')::INTEGER + 1)::TEXT;
    ELSE
        v_next_stage := 'next_round';
    END IF;

    -- Ищем существующий матч следующего раунда, ожидающий второго участника
    SELECT match_id
    INTO v_existing_match_id
    FROM match
    WHERE tournament_id = v_tournament_id
      AND team_b_id IS NULL
      AND stage = v_next_stage
    ORDER BY match_id
    LIMIT 1;

    IF v_existing_match_id IS NOT NULL THEN
        -- Найден матч с пустым слотом - добавляем победителя как team_b
        UPDATE match
        SET team_b_id = p_winner_team_id
        WHERE match_id = v_existing_match_id;

        RETURN QUERY SELECT v_existing_match_id as next_match_id, NULL::BIGINT as champion_team_id;
    ELSE
        -- Нет матча с пустым слотом - создаем новый матч с одним участником
        v_scheduled_time := NOW() + INTERVAL '2 hours';

        INSERT INTO match (
            tournament_id,
            team_a_id,
            team_b_id,
            scheduled_at,
            stage,
            best_of
        )
        VALUES (
            v_tournament_id,
            p_winner_team_id,
            NULL,  -- второй участник пока не определен
            v_scheduled_time,
            v_next_stage,
            1
        )
        RETURNING match.match_id INTO v_new_match_id;

        RETURN QUERY SELECT v_new_match_id as next_match_id, NULL::BIGINT as champion_team_id;
    END IF;
END;
$$;
