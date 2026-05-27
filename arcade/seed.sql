-- Demo/test data for the current arcade database schema.
-- Run schema.sql first, then run this file if you want example scores.

-- Fibonacci test scores
INSERT INTO score (nickname, game_id, time_taken)
VALUES
    ('FELIX', (SELECT game_id FROM game WHERE game_name = 'Fibonacci'), 18.4),
    ('MAJA',  (SELECT game_id FROM game WHERE game_name = 'Fibonacci'), 22.1),
    ('TEST',  (SELECT game_id FROM game WHERE game_name = 'Fibonacci'), 15.7);

INSERT INTO fib_score (score_id, fib_value_reached)
VALUES
    (1, 377),
    (2, 233),
    (3, 610);

-- Alphabet test scores
INSERT INTO score (nickname, game_id, time_taken)
VALUES
    ('FELIX', (SELECT game_id FROM game WHERE game_name = 'Alphabet'), 9.8),
    ('MAJA',  (SELECT game_id FROM game WHERE game_name = 'Alphabet'), 8.9),
    ('TEST',  (SELECT game_id FROM game WHERE game_name = 'Alphabet'), 11.2);

INSERT INTO alphabet_score (score_id, nr_of_errors)
VALUES
    (4, 2),
    (5, 0),
    (6, 1);

-- Gates test scores
INSERT INTO score (nickname, game_id, time_taken)
VALUES
    ('FELIX', (SELECT game_id FROM game WHERE game_name = 'Gates'), 30.5),
    ('MAJA',  (SELECT game_id FROM game WHERE game_name = 'Gates'), 28.3),
    ('TEST',  (SELECT game_id FROM game WHERE game_name = 'Gates'), 35.1);

INSERT INTO gates_score (score_id, nr_of_gates_passed, gate_value_reached)
VALUES
    (7, 8, 128),
    (8, 10, 256),
    (9, 6, 64);