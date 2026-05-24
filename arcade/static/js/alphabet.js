// alphabet.js — state machine for the alphabet speed-typing game

// ── Constants ─────────────────────────────────────────────────────────────────

const GAME_ID = 2;                          // matches game table row for 'Alphabet'
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ── State ─────────────────────────────────────────────────────────────────────

const State = {
    IDLE: 'idle',
    PLAYING: 'playing',
    CHECKING: 'checking',
    FINISHED: 'finished'
};

const game = {
    state: State.IDLE,
    currentIdx: 0,          // which letter we are waiting for (0 = A, 25 = Z)
    errors: 0,
    startTime: null,
    endTime: null,
    timerHandle: null,       // setInterval handle for the on-screen clock

    // ── Transitions ─────────────────────────────────────────────────────────────

    start() {
        this.currentIdx = 0;
        this.errors = 0;
        this.startTime = Date.now();
        this.endTime = null;

        this.transition(State.PLAYING);
        this.startClock();
    },

    // Called by the keydown listener with every keypress while PLAYING
    handleKey(key) {
        if (this.state !== State.PLAYING) return;

        const pressed = key.toUpperCase();
        const expected = ALPHABET[this.currentIdx];

        this.transition(State.CHECKING);

        if (pressed === expected) {
            // Correct key
            this.currentIdx++;
            showFeedback('✓', 'correct');

            if (this.currentIdx === ALPHABET.length) {
                // Typed all 26 letters — game complete
                this.endTime = Date.now();
                this.stopClock();
                this.transition(State.FINISHED);
                return;
            }
        } else {
            // Wrong key — count the error but keep going
            this.errors++;
            showFeedback(`✗  (${pressed})`, 'wrong');
        }

        this.transition(State.PLAYING);
    },

    reset() {
        this.stopClock();
        this.transition(State.IDLE);
    },

    // ── Score saving ─────────────────────────────────────────────────────────────

    async saveScore() {
        const nickname = document.getElementById('nickname').value.trim().toUpperCase();

        if (nickname.length === 0) {
            setStatus('Please enter a 1–3 character tag.', 'error');
            return;
        }

        const timeTaken = (this.endTime - this.startTime) / 1000;   // seconds

        setStatus('Saving…', '');

        try {
            const response = await fetch('/submit_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game: 'alphabet',
                    game_id: GAME_ID,
                    nickname: nickname,
                    time_taken: timeTaken,
                    nr_of_errors: this.errors
                })
            });

            const data = await response.json();

            if (data.ok) {
                setStatus('Score saved!', 'success');
                // Redirect to scoreboard after a short delay
                setTimeout(() => {
                    window.location.href = '/scoreboard/alphabet';
                }, 1200);
            } else {
                setStatus('Error: ' + (data.error || 'unknown'), 'error');
            }
        } catch (err) {
            setStatus('Could not reach the server.', 'error');
        }
    },

    // ── Internal helpers ─────────────────────────────────────────────────────────

    transition(newState) {
        this.state = newState;
        render();
    },

    startClock() {
        this.timerHandle = setInterval(() => {
            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
            document.getElementById('display-time').textContent = elapsed + 's';
        }, 100);
    },

    stopClock() {
        clearInterval(this.timerHandle);
        this.timerHandle = null;
    }
};

// ── Rendering ─────────────────────────────────────────────────────────────────

function render() {
    // Show/hide the right screen
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    switch (game.state) {
        case State.IDLE:
            document.getElementById('screen-idle').classList.add('active');
            break;

        case State.PLAYING:
        case State.CHECKING:
            document.getElementById('screen-playing').classList.add('active');
            updatePlayingScreen();
            break;

        case State.FINISHED:
            document.getElementById('screen-gameover').classList.add('active');
            updateResultScreen();
            break;
    }
}

function updatePlayingScreen() {
    // Current letter to type
    const current = ALPHABET[game.currentIdx] || '—';
    document.getElementById('display-letter').textContent = current;

    // Error counter
    document.getElementById('display-errors').textContent = game.errors;

    // Keyboard hint row — grey out completed letters
    const hint = document.getElementById('keyboard-hint');
    hint.innerHTML = ALPHABET.map((letter, i) => {
        const cls = i < game.currentIdx ? 'letter done' : i === game.currentIdx ? 'letter current' : 'letter';
        return `<span class="${cls}">${letter}</span>`;
    }).join('');
}

function updateResultScreen() {
    const timeTaken = ((game.endTime - game.startTime) / 1000).toFixed(2);
    document.getElementById('result-time').textContent = timeTaken + 's';
    document.getElementById('result-errors').textContent = game.errors;
    document.getElementById('nickname').value = '';
    document.getElementById('save-status').textContent = '';
}

function showFeedback(text, type) {
    const el = document.getElementById('feedback');
    el.textContent = text;
    el.className = 'feedback ' + type;

    // Clear after 600ms
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.textContent = ''; el.className = 'feedback'; }, 600);
}

function setStatus(msg, type) {
    const el = document.getElementById('save-status');
    el.textContent = msg;
    el.className = 'save-status ' + type;
}

// ── Keyboard listener ─────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
    // Only care about single letter keys, ignore modifier combos
    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/) && !e.ctrlKey && !e.metaKey) {
        game.handleKey(e.key);
    }
});

// ── Initial render ────────────────────────────────────────────────────────────

render();