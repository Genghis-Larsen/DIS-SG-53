-- Drop tables first so the schema can be re-run during development
DROP TABLE IF EXISTS fib_score;
DROP TABLE IF EXISTS alphabet_score;
DROP TABLE IF EXISTS gates_score;
DROP TABLE IF EXISTS score;
DROP TABLE IF EXISTS game;

-- The different games in the arcade
CREATE TABLE game (
    game_id SERIAL PRIMARY KEY,
    game_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    score_order VARCHAR(5) NOT NULL CHECK (score_order IN ('ASC', 'DESC'))
);

INSERT INTO game (game_name, description, score_order) VALUES
    ('Fibonacci', 'Reach as high as you can in the Fibonacci sequence', 'DESC'),
    ('Alphabet',  'Type the alphabet as fast as possible with fewest errors', 'ASC'),
    ('Gates',     'Pick the highest-value gate to grow your number', 'DESC');

-- Scores submitted by players for games
CREATE TABLE score (
    score_id SERIAL PRIMARY KEY,
    nickname VARCHAR(10) NOT NULL,
    game_id INTEGER NOT NULL,
    time_taken REAL NOT NULL,
    achieved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);

CREATE TABLE fib_score (
    score_id          INTEGER PRIMARY KEY,
    fib_value_reached INTEGER NOT NULL,
    FOREIGN KEY (score_id) REFERENCES score(score_id) ON DELETE CASCADE
);

CREATE TABLE alphabet_score (
    score_id     INTEGER PRIMARY KEY,
    nr_of_errors INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (score_id) REFERENCES score(score_id) ON DELETE CASCADE
);

CREATE TABLE gates_score (
    score_id           INTEGER PRIMARY KEY,
    nr_of_gates_passed INTEGER NOT NULL,
    gate_value_reached INTEGER NOT NULL,
    FOREIGN KEY (score_id) REFERENCES score(score_id) ON DELETE CASCADE
);