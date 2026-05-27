import psycopg2


def get_connection():
    return psycopg2.connect(
        dbname="arcade_test",
        user="felix",
        host="localhost",
        port="5432"
    )


def get_click_counter_scores():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT player.username, score.score_value
        FROM score
        JOIN player ON score.player_id = player.player_id
        JOIN game ON score.game_id = game.game_id
        WHERE game.game_name = 'Click Counter'
        ORDER BY score.score_value DESC;
    """)

    results = cursor.fetchall()

    cursor.close()
    connection.close()

    return results


if __name__ == "__main__":
    scores = get_click_counter_scores()

    for username, score_value in scores:
        print(username, score_value)