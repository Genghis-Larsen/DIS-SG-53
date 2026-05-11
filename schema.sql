-- Drop tables first so the schema can be re-run during development
DROP TABLE IF EXISTS score;
DROP TABLE IF EXISTS player;
DROP TABLE IF EXISTS game;

-- Players who submit scores
CREATE TABLE player (
    player_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- The different games in the arcade
CREATE TABLE game (
    game_id SERIAL PRIMARY KEY,
    game_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    score_order VARCHAR(10) NOT NULL CHECK (score_order IN ('ASC', 'DESC'))
);

-- Scores submitted by players for games
CREATE TABLE score (
    score_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    score_value INTEGER NOT NULL CHECK (score_value >= 0),
    achieved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (player_id) REFERENCES player(player_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);