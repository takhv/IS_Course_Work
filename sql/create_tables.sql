CREATE TABLE user (
    user_id INT SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    login TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE player (
    player_id INT SERIAL PRIMARY KEY,
    name TEXT,
    nickname TEXT NOT NULL,
    age INT CHECK(age >= 0),
    role TEXT,
    user_id INT NOT NULL UNIQUE REFERENCES user(user_id) ON DELETE CASCADE
);

CREATE TABLE team (
    team_id INT SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    tag TEXT NOT NULL UNIQUE,
    captain_id INT REFERENCES player(player_id) ON DELETE SET NULL
);

CREATE TABLE team_member (
    player_id INT REFERENCES player(player_id) ON DELETE CASCADE,
    team_id INT REFERENCES team(team_id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP,
    PRIMARY KEY(player_id, team_id)
);

CREATE TABLE tournament (
    tournament_id INT SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE CHECK(end_date >= start_date),
    prize INT CHECK(prize >= 0)
);

CREATE TABLE rules (
    rules_id INT SERIAL PRIMARY KEY,
    tournament_id INT NOT NULL REFERENCES tournament(tournament_id) ON DELETE CASCADE,
    format TEXT NOT NULL,
    description TEXT,
    max_teams INT CHECK(max_teams > 0),
    UNIQUE(tournament_id)
);

CREATE TABLE tournament_registration (
    team_id INT REFERENCES team(team_id) ON DELETE CASCADE,
    tournament_id INT REFERENCES tournament(tournament_id) ON DELETE CASCADE,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'waiting',
    PRIMARY KEY (team_id, tournament_id)
);

CREATE TABLE champion (
    champion_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE match (
    match_id SERIAL PRIMARY KEY,
    tournament_id INT NOT NULL REFERENCES tournament(tournament_id) ON DELETE CASCADE,
    team1_id INT NOT NULL REFERENCES team(team_id) ON DELETE RESTRICT,
    team2_id INT NOT NULL REFERENCES team(team_id) ON DELETE RESTRICT,
    round_number INT NOT NULL CHECK (round_number >= 1),
    time TIMESTAMP NOT NULL,
    team1_score INT NOT NULL DEFAULT 0 CHECK (team1_score >= 0),
    team2_score INT NOT NULL DEFAULT 0 CHECK (team2_score >= 0),
    winner_id INT REFERENCES team(team_id) ON DELETE SET NULL,
    CHECK (team1_id != team2_id)
);

CREATE TABLE draft (
    match_id INT NOT NULL REFERENCES match(match_id) ON DELETE CASCADE,
    champion_id INT NOT NULL REFERENCES champion(champion_id) ON DELETE RESTRICT,
    team_id INT NOT NULL REFERENCES team(team_id) ON DELETE RESTRICT,
    action TEXT NOT NULL CHECK (action IN ('pick', 'ban')),
    PRIMARY KEY (match_id, champion_id, team_id)
);

CREATE TABLE player_statistics (
    player_id INT REFERENCES player(player_id) ON DELETE CASCADE,
    match_id INT REFERENCES match(match_id) ON DELETE CASCADE,
    kills INT NOT NULL DEFAULT 0 CHECK (kills >= 0),
    deaths INT NOT NULL DEFAULT 0 CHECK (deaths >= 0),
    assists INT NOT NULL DEFAULT 0 CHECK (assists >= 0),
    win BOOLEAN,
    PRIMARY KEY (player_id, match_id)
);
