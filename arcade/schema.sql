-- Recreate the database tables during development.
-- Run this file again whenever the table structure needs to be reset.

DROP TABLE IF EXISTS fib_score;
DROP TABLE IF EXISTS alphabet_score;
DROP TABLE IF EXISTS gates_score;
DROP TABLE IF EXISTS score;
DROP TABLE IF EXISTS game;

-- The games available in the arcade.
CREATE TABLE game (
    game_id SERIAL PRIMARY KEY,
    game_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    score_order VARCHAR(5) NOT NULL CHECK (score_order IN ('ASC', 'DESC'))
);

INSERT INTO game (game_name, description, score_order) VALUES
    ('Fibonacci', 'Type the next number in the Fibonacci sequence. Highest reached value wins.', 'DESC'),
    ('Alphabet',  'Type the alphabet from A to Z. Fewest errors wins, then fastest time.', 'ASC'),
    ('Gates',     'Choose gates to grow your number. Highest reached value wins.', 'DESC');

-- Shared score information for all games.
-- Each score belongs to exactly one game.
CREATE TABLE score (
    score_id SERIAL PRIMARY KEY,
    nickname VARCHAR(10) NOT NULL CHECK (nickname ~ '^[A-Z]{1,10}$'),
    game_id INTEGER NOT NULL REFERENCES game(game_id) ON DELETE CASCADE,
    time_taken REAL NOT NULL CHECK (time_taken >= 0),
    achieved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fibonacci-specific score data.
CREATE TABLE fib_score (
    score_id INTEGER PRIMARY KEY REFERENCES score(score_id) ON DELETE CASCADE,
    fib_value_reached INTEGER NOT NULL CHECK (fib_value_reached >= 0)
);

-- Alphabet-specific score data.
CREATE TABLE alphabet_score (
    score_id INTEGER PRIMARY KEY REFERENCES score(score_id) ON DELETE CASCADE,
    nr_of_errors INTEGER NOT NULL DEFAULT 0 CHECK (nr_of_errors >= 0)
);

-- Gates-specific score data.
CREATE TABLE gates_score (
    score_id INTEGER PRIMARY KEY REFERENCES score(score_id) ON DELETE CASCADE,
    nr_of_gates_passed INTEGER NOT NULL CHECK (nr_of_gates_passed >= 0),
    gate_value_reached INTEGER NOT NULL CHECK (gate_value_reached >= 0)
);