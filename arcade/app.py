import os
import re
import psycopg2
import psycopg2.extras
from flask import Flask, g, render_template, request, jsonify, redirect, url_for
from dotenv import load_dotenv
 
load_dotenv()
 
app = Flask(__name__)

RE_NICKNAME = re.compile(r'^[A-Z]{1,10}$')

RE_GAME_SLUG    = re.compile(r'^(fibonacci|alphabet|gates)$')
 
RE_SORT_PARAM   = re.compile(r'^(score|time)$')

RE_POS_INT      = re.compile(r'^\d+$')

RE_TIME_TAKEN   = re.compile(r'^\d+(\.\d+)?$')
 
 
def validate_nickname(value):
    """Return the cleaned nickname or raise ValueError."""
    cleaned = str(value).strip().upper()
    if not RE_NICKNAME.match(cleaned):
        raise ValueError(f"Tag must be 1-10 capital letters, got: {value!r}")
    return cleaned
 
 
def validate_pos_int(value, name):
    """Return value as int if it looks like a non-negative integer."""
    if not RE_POS_INT.match(str(value)):
        raise ValueError(f"{name} must be a non-negative integer, got: {value!r}")
    return int(value)
 
 
def validate_time(value):
    """Return value as float if it looks like a valid elapsed time."""
    if not RE_TIME_TAKEN.match(str(value)):
        raise ValueError(f"time_taken must be a positive number, got: {value!r}")
    return float(value)
 
# ── Database config ───────────────────────────────────────────────────────────
 
DB_CONFIG = {
    "dbname":   os.getenv("DB_NAME", "arcade"),
    "user":     os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     os.getenv("DB_PORT", "5432")
}
 
 
def get_db():
    """Open a database connection for the current request (reused if already open)."""
    if "db" not in g:
        g.db = psycopg2.connect(**DB_CONFIG)
    return g.db
 
 
@app.teardown_appcontext
def close_db(error):
    """Close the database connection at the end of every request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()
 
 
def get_cursor():
    """Return a cursor that gives back rows as dictionaries."""
    return get_db().cursor(cursor_factory=psycopg2.extras.RealDictCursor)
 
 
# ── Page routes ───────────────────────────────────────────────────────────────
 
@app.route("/")
def index():
    """Landing page — shows all three games."""
    return render_template("index.html")
 
 
@app.route("/fibonacci")
def fibonacci():
    return render_template("fibonacci.html")
 
 
@app.route("/alphabet")
def alphabet():
    return render_template("alphabet.html")
 
 
@app.route("/gates")
def gates():
    return render_template("gates.html")
 
 
# ── Scoreboard route ──────────────────────────────────────────────────────────
 
@app.route("/scoreboard/<game>")
def scoreboard(game):
    """
    Show the scoreboard for a given game.
    Accepts ?sort=score (default) or ?sort=time.
    """
    if not RE_GAME_SLUG.match(game):
        return "Game not found", 404
    
    sort = request.args.get("sort", "score")
    if not RE_SORT_PARAM.match(sort):
        sort = "score"

    cur = get_cursor()
 
    # Fetch the game row so we know the sort direction
    cur.execute("SELECT * FROM game WHERE game_name = %s", (game.capitalize(),))
    game_row = cur.fetchone()
 
    if game_row is None:
        return "Game not found", 404
 
    game_id     = game_row["game_id"]
    score_order = game_row["score_order"]   # 'ASC' or 'DESC'
 
    # Each game joins its own subtype table and exposes a 'main_score' alias
    # so the template does not need to know the underlying column name.
    queries = {
        "fibonacci": f"""
            SELECT s.nickname,
                   f.fib_value_reached  AS main_score,
                   s.time_taken,
                   s.achieved_at
            FROM score s
            JOIN fib_score f ON s.score_id = f.score_id
            WHERE s.game_id = %s
            ORDER BY
                {'main_score' if sort == 'score' else 's.time_taken'} {score_order if sort == 'score' else 'ASC'},
                s.time_taken ASC
        """,
        "alphabet": f"""
            SELECT s.nickname,
                   a.nr_of_errors       AS main_score,
                   s.time_taken,
                   s.achieved_at
            FROM score s
            JOIN alphabet_score a ON s.score_id = a.score_id
            WHERE s.game_id = %s
            ORDER BY
                {'main_score' if sort == 'score' else 's.time_taken'} {score_order if sort == 'score' else 'ASC'},
                s.time_taken ASC
        """,
        "gates": f"""
            SELECT s.nickname,
                   gs.gate_value_reached AS main_score,
                   gs.nr_of_gates_passed,
                   s.time_taken,
                   s.achieved_at
            FROM score s
            JOIN gates_score gs ON s.score_id = gs.score_id
            WHERE s.game_id = %s
            ORDER BY
                {'main_score' if sort == 'score' else 's.time_taken'} {score_order if sort == 'score' else 'ASC'},
                s.time_taken ASC
        """
    }
 
 
    cur.execute(queries[game], (game_id,))
    rows = cur.fetchall()
    cur.close()
 
    return render_template(
        "scoreboard.html",
        rows=rows,
        game=game,
        game_row=game_row,
        sort=sort
    )
 
 
# ── Score submission ──────────────────────────────────────────────────────────
 
@app.route("/submit_score", methods=["POST"])
def submit_score():
    """
    Receives JSON from the browser when a game ends.
    All fields are validated with regex before touching the database.

    Expected payload for all games:
        { game, game_id, nickname, time_taken, ...game-specific fields }
    """
    data = request.json
 
    if not data:
        return jsonify({"error": "No data received"}), 400

 
    try:
        # Validate game slug — must be one of the three known games
        game = data.get("game", "")
        if not RE_GAME_SLUG.match(game):
            return jsonify({"error": f"Unknown game: {game!r}"}), 400
 
        # Validate nickname — 1–3 capital letters
        nickname = validate_nickname(data.get("nickname", ""))
 
        # Validate time_taken — must be a positive decimal number
        time_taken = validate_time(data.get("time_taken", ""))
 
        # Validate game-specific numeric fields
        if game == "fibonacci":
            fib_value = validate_pos_int(data.get("fib_value_reached", ""), "fib_value_reached")
 
        elif game == "alphabet":
            nr_errors = validate_pos_int(data.get("nr_of_errors", ""), "nr_of_errors")
 
        elif game == "gates":
            nr_gates   = validate_pos_int(data.get("nr_of_gates_passed", ""),  "nr_of_gates_passed")
            gate_value = validate_pos_int(data.get("gate_value_reached", ""), "gate_value_reached")
 
    except ValueError as e:
        # Any regex validation failure returns a 400 with a clear message
        return jsonify({"error": str(e)}), 400
 
    # All inputs are clean — write to the database
    db  = get_db()
    cur = get_cursor()
 
    try:
        cur.execute(
            """
            INSERT INTO score (game_id, nickname, time_taken)
            VALUES (%s, %s, %s)
            RETURNING score_id
            """,
            (data["game_id"], nickname, time_taken)
        )
        score_id = cur.fetchone()["score_id"]
 
        if game == "fibonacci":
            cur.execute(
                "INSERT INTO fib_score (score_id, fib_value_reached) VALUES (%s, %s)",
                (score_id, fib_value)
            )
        elif game == "alphabet":
            cur.execute(
                "INSERT INTO alphabet_score (score_id, nr_of_errors) VALUES (%s, %s)",
                (score_id, nr_errors)
            )
        elif game == "gates":
            cur.execute(
                "INSERT INTO gates_score (score_id, nr_of_gates_passed, gate_value_reached) VALUES (%s, %s, %s)",
                (score_id, nr_gates, gate_value)
            )
 
        db.commit()
        cur.close()
        return jsonify({"ok": True, "score_id": score_id})
 
    except Exception as e:
        db.rollback()
        cur.close()
        return jsonify({"error": str(e)}), 500
 
 
# ── Run ───────────────────────────────────────────────────────────────────────
 
if __name__ == "__main__":
    app.run(debug=True)