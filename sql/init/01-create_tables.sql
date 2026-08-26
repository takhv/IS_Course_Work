CREATE TABLE IF NOT EXISTS player (
    player_id      BIGSERIAL PRIMARY KEY,
    login          VARCHAR(64)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    nickname       VARCHAR(64)  NOT NULL,
    email          VARCHAR(128) NOT NULL UNIQUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team (
    team_id    BIGSERIAL PRIMARY KEY,
    name       VARCHAR(128) NOT NULL,
    tag        VARCHAR(16)  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS team_membership (
    membership_id BIGSERIAL PRIMARY KEY,
    player_id     BIGINT      NOT NULL,
    team_id       BIGINT      NOT NULL,
    is_captain    BOOLEAN     NOT NULL DEFAULT FALSE,
    role          VARCHAR(32),
    joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at       TIMESTAMPTZ,

    CONSTRAINT fk_team_membership_player
        FOREIGN KEY (player_id) REFERENCES player (player_id),

    CONSTRAINT fk_team_membership_team
        FOREIGN KEY (team_id)   REFERENCES team (team_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_membership_player_team_joined
    ON team_membership (player_id, team_id, joined_at);

CREATE TABLE IF NOT EXISTS tournament (
    tournament_id BIGSERIAL PRIMARY KEY,
    name          VARCHAR(128) NOT NULL,
    description   TEXT,
    start_date    TIMESTAMPTZ  NOT NULL,
    end_date      DATE,
    format        VARCHAR(64)  NOT NULL,
    status        VARCHAR(32)  NOT NULL
        CHECK (status IN ('planned', 'active', 'finished')),
    creator_login VARCHAR(64)  NOT NULL,

    CONSTRAINT fk_tournament_creator
        FOREIGN KEY (creator_login) REFERENCES player (login)
);

CREATE TABLE IF NOT EXISTS tournament_rules (
    rules_id             BIGSERIAL PRIMARY KEY,
    tournament_id        BIGINT      NOT NULL,
    min_players_per_team INTEGER     NOT NULL,
    max_players_per_team INTEGER     NOT NULL,
    max_teams            INTEGER,
    draft_type           VARCHAR(32) NOT NULL,
    additional_rules     TEXT,

    CONSTRAINT fk_tournament_rules_tournament
        FOREIGN KEY (tournament_id) REFERENCES tournament (tournament_id),

    CONSTRAINT chk_tournament_rules_team_size
        CHECK (min_players_per_team > 0 AND max_players_per_team >= min_players_per_team)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tournament_rules_tournament
    ON tournament_rules (tournament_id);

CREATE TABLE IF NOT EXISTS tournament_registration (
    registration_id BIGSERIAL PRIMARY KEY,
    tournament_id   BIGINT      NOT NULL,
    team_id         BIGINT      NOT NULL,
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status          VARCHAR(32) NOT NULL
        CHECK (status IN ('applied', 'approved', 'rejected', 'eliminated', 'champion')),

    CONSTRAINT fk_tournament_registration_tournament
        FOREIGN KEY (tournament_id) REFERENCES tournament (tournament_id),

    CONSTRAINT fk_tournament_registration_team
        FOREIGN KEY (team_id)       REFERENCES team (team_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tournament_registration_tournament_team
    ON tournament_registration (tournament_id, team_id);

CREATE TABLE IF NOT EXISTS match (
    match_id      BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT      NOT NULL,
    team_a_id     BIGINT      NOT NULL,
    team_b_id     BIGINT,
    scheduled_at  TIMESTAMPTZ NOT NULL,
    stage         VARCHAR(64),
    best_of       INTEGER     NOT NULL DEFAULT 1,

    CONSTRAINT fk_match_tournament
        FOREIGN KEY (tournament_id) REFERENCES tournament (tournament_id),

    CONSTRAINT fk_match_team_a
        FOREIGN KEY (team_a_id)     REFERENCES team (team_id),

    CONSTRAINT fk_match_team_b
        FOREIGN KEY (team_b_id)     REFERENCES team (team_id),

    CONSTRAINT chk_match_teams_different
        CHECK (team_b_id IS NULL OR team_a_id <> team_b_id),

    CONSTRAINT chk_match_best_of_positive
        CHECK (best_of >= 1)
);

CREATE TABLE IF NOT EXISTS match_result (
    match_result_id BIGSERIAL PRIMARY KEY,
    match_id        BIGINT  NOT NULL,
    winner_team_id  BIGINT  NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    team_a_score    INTEGER NOT NULL CHECK (team_a_score >= 0),
    team_b_score    INTEGER NOT NULL CHECK (team_b_score >= 0),

    CONSTRAINT fk_match_result_match
        FOREIGN KEY (match_id)       REFERENCES match (match_id),

    CONSTRAINT fk_match_result_winner_team
        FOREIGN KEY (winner_team_id) REFERENCES team (team_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_match_result_match
    ON match_result (match_id);

CREATE TABLE IF NOT EXISTS champion (
    champion_id BIGSERIAL PRIMARY KEY,
    name        VARCHAR(64) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS draft (
    draft_id     BIGSERIAL PRIMARY KEY,
    match_id     BIGINT      NOT NULL,
    team_id      BIGINT      NOT NULL,
    champion_id  BIGINT      NOT NULL,
    action_type  VARCHAR(16) NOT NULL
        CHECK (action_type IN ('pick', 'ban')),
    side         VARCHAR(16) NOT NULL
        CHECK (side IN ('blue', 'red')),
    order_number INTEGER     NOT NULL,

    CONSTRAINT fk_draft_match
        FOREIGN KEY (match_id)    REFERENCES match (match_id),

    CONSTRAINT fk_draft_team
        FOREIGN KEY (team_id)     REFERENCES team (team_id),

    CONSTRAINT fk_draft_champion
        FOREIGN KEY (champion_id) REFERENCES champion (champion_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_draft_match_order
    ON draft (match_id, order_number);

CREATE TABLE IF NOT EXISTS player_stats (
    player_stats_id BIGSERIAL PRIMARY KEY,
    player_id       BIGINT  NOT NULL,
    tournament_id   BIGINT  NOT NULL,
    games_played    INTEGER NOT NULL DEFAULT 0,
    wins            INTEGER NOT NULL DEFAULT 0,
    loses           INTEGER NOT NULL DEFAULT 0,
    kills           INTEGER NOT NULL DEFAULT 0,
    deaths          INTEGER NOT NULL DEFAULT 0,
    assists         INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT fk_player_stats_player
        FOREIGN KEY (player_id)     REFERENCES player (player_id),

    CONSTRAINT fk_player_stats_tournament
        FOREIGN KEY (tournament_id) REFERENCES tournament (tournament_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_player_stats_player_tournament
    ON player_stats (player_id, tournament_id);


CREATE INDEX IF NOT EXISTS idx_tournament_status_start_date
    ON tournament (status, start_date);

CREATE INDEX IF NOT EXISTS idx_match_tournament
    ON match (tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registration_tournament_status
    ON tournament_registration (tournament_id, status);

CREATE INDEX IF NOT EXISTS idx_draft_match
    ON draft (match_id);

CREATE INDEX IF NOT EXISTS idx_player_stats_player
    ON player_stats (player_id);

CREATE INDEX IF NOT EXISTS idx_team_membership_team
    ON team_membership (team_id);

CREATE TABLE IF NOT EXISTS draft_session (
    session_id BIGSERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL UNIQUE REFERENCES match(match_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    team_a_joined BOOLEAN DEFAULT FALSE,
    team_b_joined BOOLEAN DEFAULT FALSE,
    current_turn VARCHAR(1),
    current_phase VARCHAR(10),
    phase_number INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_draft_session_match ON draft_session(match_id);
CREATE INDEX idx_draft_session_status ON draft_session(status);
