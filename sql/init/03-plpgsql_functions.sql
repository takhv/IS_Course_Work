-- Функция регистрации команды на турнир
CREATE OR REPLACE FUNCTION register_team_for_tournament(
    p_tournament_id BIGINT,
    p_team_id       BIGINT
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_rules              tournament_rules;
    v_active_players_cnt INTEGER;
    v_registration_id    BIGINT;
BEGIN
    PERFORM 1
    FROM tournament t
    WHERE t.tournament_id = p_tournament_id
      AND t.status = 'planned';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tournament % not found or not in planned status', p_tournament_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    SELECT *
    INTO v_rules
    FROM tournament_rules r
    WHERE r.tournament_id = p_tournament_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rules for tournament % not found', p_tournament_id;
    END IF;

    PERFORM 1
    FROM tournament_registration tr
    WHERE tr.tournament_id = p_tournament_id
      AND tr.team_id       = p_team_id;

    IF FOUND THEN
        RAISE EXCEPTION 'Registration for team % in tournament % already exists',
            p_team_id, p_tournament_id;
    END IF;

    SELECT COUNT(*)
    INTO v_active_players_cnt
    FROM team_membership tm
    WHERE tm.team_id = p_team_id
      AND tm.left_at IS NULL;

    IF v_active_players_cnt < v_rules.min_players_per_team THEN
        RAISE EXCEPTION 'Team % has % active players, required at least %',
            p_team_id, v_active_players_cnt, v_rules.min_players_per_team;
    END IF;

    IF v_active_players_cnt > v_rules.max_players_per_team THEN
        RAISE EXCEPTION 'Team % has % active players, allowed not more than %',
            p_team_id, v_active_players_cnt, v_rules.max_players_per_team;
    END IF;

    INSERT INTO tournament_registration (tournament_id, team_id, status)
    VALUES (p_tournament_id, p_team_id, 'approved')
    RETURNING registration_id INTO v_registration_id;

    RETURN v_registration_id;
END;
$$;


-- Функция создания матча между двумя командами в рамках турнира
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

    PERFORM 1
    FROM tournament_registration tr
    WHERE tr.tournament_id = p_tournament_id
      AND tr.team_id       = p_team_a_id
      AND tr.status        = 'approved';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Team % is not approved for tournament %', p_team_a_id, p_tournament_id;
    END IF;

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

-- Триггер для валидации команды при вставке заявки
CREATE OR REPLACE FUNCTION trg_validate_tournament_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_rules              tournament_rules;
    v_active_players_cnt INTEGER;
BEGIN
    SELECT *
    INTO v_rules
    FROM tournament_rules r
    WHERE r.tournament_id = NEW.tournament_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rules for tournament % not found', NEW.tournament_id;
    END IF;

    SELECT COUNT(*)
    INTO v_active_players_cnt
    FROM team_membership tm
    WHERE tm.team_id = NEW.team_id
      AND tm.left_at IS NULL;

    IF v_active_players_cnt < v_rules.min_players_per_team THEN
        RAISE EXCEPTION 'Team % has % active players, required at least %',
            NEW.team_id, v_active_players_cnt, v_rules.min_players_per_team;
    END IF;

    IF v_active_players_cnt > v_rules.max_players_per_team THEN
        RAISE EXCEPTION 'Team % has % active players, allowed not more than %',
            NEW.team_id, v_active_players_cnt, v_rules.max_players_per_team;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_insert_tournament_registration ON tournament_registration;

CREATE TRIGGER before_insert_tournament_registration
BEFORE INSERT ON tournament_registration
FOR EACH ROW
EXECUTE FUNCTION trg_validate_tournament_registration();


-- Триггер обновления статистики игроков при фиксации результата матча
CREATE OR REPLACE FUNCTION trg_update_player_stats_on_match_result()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_tournament_id BIGINT;
BEGIN
    SELECT m.tournament_id
    INTO v_tournament_id
    FROM match m
    WHERE m.match_id = NEW.match_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match % not found', NEW.match_id;
    END IF;

    INSERT INTO player_stats (player_id, tournament_id, games_played, wins, loses, kills, deaths, assists)
    SELECT                    tm.player_id, v_tournament_id, 1, 1, 0, 0, 0, 0
    FROM team_membership tm
    WHERE tm.team_id = NEW.winner_team_id
      AND tm.left_at IS NULL
    ON CONFLICT (player_id, tournament_id)
    DO UPDATE SET
        games_played = player_stats.games_played + 1,
        wins         = player_stats.wins + 1;

    INSERT INTO player_stats (player_id, tournament_id, games_played, wins, loses, kills, deaths, assists)
    SELECT                    tm.player_id, v_tournament_id, 1, 0, 1, 0, 0, 0
    FROM team_membership tm
    WHERE tm.team_id IN (
        SELECT CASE
                WHEN NEW.winner_team_id = m.team_a_id THEN m.team_b_id
                ELSE m.team_a_id
                END
        FROM match m
        WHERE m.match_id = NEW.match_id
    )
      AND tm.left_at IS NULL
    ON CONFLICT (player_id, tournament_id)
    DO UPDATE SET
        games_played = player_stats.games_played + 1,
        loses        = player_stats.loses + 1;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_insert_match_result ON match_result;

CREATE TRIGGER after_insert_match_result
AFTER INSERT ON match_result
FOR EACH ROW
EXECUTE FUNCTION trg_update_player_stats_on_match_result();


-- Функция генерации сетки матчей для турнира
CREATE OR REPLACE FUNCTION generate_tournament_bracket(
    p_tournament_id BIGINT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_teams BIGINT[];
    v_team_count INTEGER;
    v_match_count INTEGER := 0;
    v_scheduled_time TIMESTAMPTZ;
    i INTEGER;
BEGIN
    SELECT ARRAY_AGG(tr.team_id ORDER BY tr.registration_id)
    INTO v_teams
    FROM tournament_registration tr
    WHERE tr.tournament_id = p_tournament_id
      AND tr.status = 'approved';
    
    v_team_count := COALESCE(array_length(v_teams, 1), 0);
    
    IF v_team_count < 2 THEN
        RAISE EXCEPTION 'Tournament % needs at least 2 teams to generate bracket, but has %',
            p_tournament_id, v_team_count;
    END IF;
    
    PERFORM 1
    FROM match m
    WHERE m.tournament_id = p_tournament_id;
    
    IF FOUND THEN
        RAISE EXCEPTION 'Matches already exist for tournament %', p_tournament_id;
    END IF;
    
    v_scheduled_time := NOW() + INTERVAL '1 hour';
    
    FOR i IN 1..(v_team_count / 2) LOOP
        INSERT INTO match (
            tournament_id, 
            team_a_id, 
            team_b_id, 
            scheduled_at, 
            stage, 
            best_of
        )
        VALUES (
            p_tournament_id,
            v_teams[i * 2 - 1],
            v_teams[i * 2],
            v_scheduled_time,
            'round_1',
            1
        );
        
        v_match_count := v_match_count + 1;
        v_scheduled_time := v_scheduled_time + INTERVAL '1 hour';
    END LOOP;
    RETURN v_match_count;
END;
$$;


-- Функция получения невыбывших команд турнира
CREATE OR REPLACE FUNCTION get_remaining_teams(
    p_tournament_id BIGINT
)
RETURNS TABLE(team_id BIGINT, team_name VARCHAR)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT tr.team_id, t.name
    FROM tournament_registration tr
    JOIN team t ON tr.team_id = t.team_id
    WHERE tr.tournament_id = p_tournament_id
      AND tr.status = 'approved';
END;
$$;


-- Функция выбора следующего соперника для выигравшей команды
CREATE OR REPLACE FUNCTION get_next_opponent(
    p_tournament_id BIGINT,
    p_winning_team_id BIGINT
)
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_opponent_team_id BIGINT;
BEGIN
    SELECT tr.team_id
    INTO v_opponent_team_id
    FROM tournament_registration tr
    WHERE tr.tournament_id = p_tournament_id
      AND tr.status = 'approved'
      AND tr.team_id <> p_winning_team_id
    LIMIT 1;

    RETURN v_opponent_team_id;
END;
$$;


-- Функция исключения проигравшей команды после матча
CREATE OR REPLACE FUNCTION eliminate_loser_team(
    p_match_id BIGINT,
    p_winner_team_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_loser_team_id BIGINT;
    v_tournament_id BIGINT;
BEGIN
    SELECT tournament_id,
           CASE 
               WHEN team_a_id = p_winner_team_id THEN team_b_id
               ELSE team_a_id
           END
    INTO v_tournament_id, v_loser_team_id
    FROM match
    WHERE match_id = p_match_id;

    IF v_loser_team_id IS NULL THEN
        RAISE EXCEPTION 'Match % not found or invalid winner', p_match_id;
    END IF;

    UPDATE tournament_registration
    SET status = 'eliminated'
    WHERE tournament_id = v_tournament_id
      AND team_id = v_loser_team_id;
END;
$$;


-- Функция проверки завершения турнира
CREATE OR REPLACE FUNCTION complete_tournament_if_needed(
    p_tournament_id BIGINT
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_remaining_count INTEGER;
    v_champion_team_id BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO v_remaining_count
    FROM tournament_registration
    WHERE tournament_id = p_tournament_id
      AND status = 'approved';

    IF v_remaining_count = 1 THEN
        SELECT team_id
        INTO v_champion_team_id
        FROM tournament_registration
        WHERE tournament_id = p_tournament_id
          AND status = 'approved'
        LIMIT 1;

        UPDATE tournament_registration
        SET status = 'champion'
        WHERE tournament_id = p_tournament_id
          AND team_id = v_champion_team_id;

        UPDATE tournament
        SET status = 'finished'
        WHERE tournament_id = p_tournament_id;

        RETURN v_champion_team_id;
    END IF;

    RETURN NULL;
END;
$$;


-- Функция создания следующего матча после победы
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
    SELECT tournament_id, stage
    INTO v_tournament_id, v_current_stage
    FROM match
    WHERE match_id = p_match_id;

    IF v_tournament_id IS NULL THEN
        RAISE EXCEPTION 'Match % not found', p_match_id;
    END IF;

    PERFORM eliminate_loser_team(p_match_id, p_winner_team_id);

    SELECT COUNT(*)
    INTO v_remaining_count
    FROM tournament_registration
    WHERE tournament_id = v_tournament_id
      AND status = 'approved';

    IF v_remaining_count = 1 THEN
        v_champion_id := complete_tournament_if_needed(v_tournament_id);
        RETURN QUERY SELECT NULL::BIGINT as next_match_id, v_champion_id as champion_team_id;
        RETURN;
    END IF;

    v_next_stage := COALESCE(v_current_stage, 'round_1');
    IF v_next_stage LIKE 'round_%' THEN
        v_next_stage := 'round_' || (SUBSTRING(v_next_stage FROM 'round_(\d+)')::INTEGER + 1)::TEXT;
    ELSE
        v_next_stage := 'next_round';
    END IF;

    SELECT match_id
    INTO v_existing_match_id
    FROM match
    WHERE tournament_id = v_tournament_id
      AND team_b_id IS NULL
      AND stage = v_next_stage
    ORDER BY match_id
    LIMIT 1;

    IF v_existing_match_id IS NOT NULL THEN
        UPDATE match
        SET team_b_id = p_winner_team_id
        WHERE match_id = v_existing_match_id;

        RETURN QUERY SELECT v_existing_match_id as next_match_id, NULL::BIGINT as champion_team_id;
    ELSE
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
            NULL,
            v_scheduled_time,
            v_next_stage,
            1
        )
        RETURNING match.match_id INTO v_new_match_id;

        RETURN QUERY SELECT v_new_match_id as next_match_id, NULL::BIGINT as champion_team_id;
    END IF;
END;
$$;
