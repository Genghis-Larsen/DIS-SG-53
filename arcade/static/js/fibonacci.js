
// ── Constants ─────────────────────────────────────────────────────────────────

const GAME_ID = 1;
const FIB_SEQUENCE = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 
                      610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 
                      46368, 75025, 121393, 196418, 317811, 514229, 832040];

// ── Regular expression patterns ───────────────────────────────────────────────

const RE_NICKNAME = /^[A-Z]{1,10}$/;

const RE_FIB_INPUT = /^\d+$/;

// ── State ─────────────────────────────────────────────────────────────────────
const State = { IDLE: 'idle',
                PLAYING: 'playing', 
                CHECKING: 'checking', 
                GAME_OVER: 'gameover' };

const game = {
    state: State.IDLE,
    currentIdx: 0,      // index into fib sequence
    maxValue: 0,        // largest Fibonacci number reached
    startTime: null,
    endTime: null,
    timerHandle: null,

    // ── Transitions ─────────────────────────────────────────────────────────────
    start() {
        this.currentIdx = 0;
        this.maxValue = 0;
        this.startTime = Date.now();
        this.endTime = null;

        this.transition(State.PLAYING);
        this.startClock();

    },

    submit(userInput) {
        if (this.state !== State.PLAYING) return;

        if (!RE_FIB_INPUT.test(userInput)) return;

        document.getElementById('fib-input').value = '';
        document.getElementById('fib-input').focus();

        this.transition(State.CHECKING);
        if (parseInt(userInput) === FIB_SEQUENCE[this.currentIdx]) {
            this.currentIdx++;
            this.maxValue = FIB_SEQUENCE[this.currentIdx - 1];
            if (this.currentIdx === FIB_SEQUENCE.length) {
                this.endTime = Date.now();
                this.stopClock();
                this.transition(State.GAME_OVER);
                return;
            }
            this.transition(State.PLAYING);
        } else {
            this.endTime = Date.now();
            this.stopClock();
            this.transition(State.GAME_OVER);
        }
    },

    reset() {
        this.stopClock();
        this.transition(State.IDLE);
    },

// ── Score saving ─────────────────────────────────────────────────────────────
    async saveScore() {
        const raw = document.getElementById('nickname').value.trim().toUpperCase();

        // RE_NICKNAME validates the tag before we bother sending a request
        if (!RE_NICKNAME.test(raw)) {
            setStatus('Tag must be 1-10 letters (A-Z only)', 'error');
            return;
        }

        const timeTaken = (this.endTime - this.startTime) / 1000;

        setStatus('Saving…', '');

        try {
            const response = await fetch('/submit_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game: 'fibonacci',
                    game_id: GAME_ID,
                    nickname: raw,
                    time_taken: timeTaken,
                    fib_value_reached: this.maxValue
                })
            });

            const data = await response.json();

            if (data.ok) {
                setStatus('Score saved!', 'success');
                setTimeout(() => {
                    window.location.href = '/scoreboard/fibonacci';
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

        case State.GAME_OVER:
            document.getElementById('screen-gameover').classList.add('active');
            updateResultScreen();
            break;
    }
}

function updatePlayingScreen() {
    document.getElementById('display-number').textContent = Math.max(FIB_SEQUENCE[game.currentIdx - 2], 0) + ' ' + Math.max(FIB_SEQUENCE[game.currentIdx - 1], 0);
    document.getElementById('display-progress').textContent = game.currentIdx + ' / ' + FIB_SEQUENCE.length;
    
    
}

function updateResultScreen() {
    const timeTaken = ((game.endTime - game.startTime) / 1000).toFixed(2);
    document.getElementById('result-time').textContent = timeTaken + 's';
    document.getElementById('result-value').textContent = game.maxValue;
    document.getElementById('nickname').value = '';
    document.getElementById('save-status').textContent = '';
}

function showFeedback(text, type) {
    const el = document.getElementById('feedback');
    el.textContent = text;
    el.className = 'feedback ' + type;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.textContent = ''; el.className = 'feedback'; }, 600);
}

function setStatus(msg, type) {
    const el = document.getElementById('save-status');
    el.textContent = msg;
    el.className = 'save-status ' + type;
}

// ── Initial render ────────────────────────────────────────────────────────────

render();