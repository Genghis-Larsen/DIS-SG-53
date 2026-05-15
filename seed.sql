-- Insert games
INSERT INTO game (game_name, description, score_order)
VALUES
    ('Reaction Time', 'Click as fast as possible when the signal appears.', 'ASC'),
    ('Click Counter', 'Click as many times as possible within the time limit.', 'DESC'),
    ('Guessing Game', 'Guess the number in as few attempts as possible.', 'ASC');

-- Insert test players
INSERT INTO player (username)
VALUES
    ('Felix'),
    ('Maja'),
    ('TestPlayer');

-- Insert test scores
INSERT INTO score (player_id, game_id, score_value)
VALUES
    (1, 1, 320),
    (2, 1, 280),
    (3, 1, 410),

    (1, 2, 45),
    (2, 2, 52),
    (3, 2, 38),

    (1, 3, 6),
    (2, 3, 4),
    (3, 3, 8);