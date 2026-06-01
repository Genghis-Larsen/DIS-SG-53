// gates.js — state machine for the Gates game
// Uses a Context Free Grammar to generate and parse gate expressions

// ── Constants ─────────────────────────────────────────────────────────────────

const GAME_ID = 3;

// How many rounds of each polarity before switching (2 positive, then 2 negative, etc.)
const ROUNDS_PER_PHASE = 2;

// ── Regular expression patterns ───────────────────────────────────────────────

// Validates the arcade tag before submitting to the server
const RE_NICKNAME = /^[A-Z]{1,10}$/;

// Validates a gate expression string matches the CFG terminal form
// Matches: (+50) | (-35) | (*3) | (/4)  — value always in steps of 5
const RE_GATE_EXPR = /^\([+\-\*\/]\d+\)$/;

// ── Context Free Grammar ──────────────────────────────────────────────────────
//
// The grammar for a gate expression:
//
//   gate_expr  → '(' operator value ')'
//   operator   → '+' | '-' | '*' | '/'
//   value      → nonzero_digit (digit)*
//   digit      → '0' | nonzero_digit
//   nonzero_digit → '1' | '2' | ... | '9'
//
// We implement this as two functions:
//   generateGate(polarity, currentScore) — produces a gate_expr string
//   parseGate(expr)                      — parses a gate_expr string into {operator, value}
//   evaluateGate(expr, score)            — applies a gate to a score

const CFG = {

    // Generate a gate expression string following the grammar.
    // polarity: 'positive' | 'negative'
    // currentScore: needed to ensure negative gates don't go to 0 or below
    generateGate(polarity, currentScore) {
        let operator, value, result;
        let attempts = 0;

        do {
            if (polarity === 'positive') {
                // Positive gates: '+' or '*'
                operator = Math.random() < 0.5 ? '+' : '*';
            } else {
                // Negative gates: '-' or '/'
                operator = Math.random() < 0.5 ? '-' : '/';
            }

            // Generate value in steps of 5 within the allowed range
            if (operator === '*' || operator === '/') {
                // Multiply/divide: range 1–5, steps of 1 (already small numbers)
                
                const options = [1, 2, 3, 4, 5];
                value = options[Math.floor(Math.random() * options.length)];
            } else {
                // Add/subtract: range 5–100 in steps of 5
                const steps = 20;  // 5, 10, 15, ... 100
                value = (Math.floor(Math.random() * steps) + 1) * 5;
            }

            result = this.applyOperator(operator, currentScore, value);
            attempts++;

            // Retry if the result would drop to 0 or below, cap retries to avoid infinite loop
        } while (result <= 0 && attempts < 50);

        // Safety fallback: if we still can't find a valid gate, use a safe subtraction
        if (result <= 0) {
            operator = '-';
            value = 5;
        }

        // Build the gate expression string following the grammar rule:
        // gate_expr → '(' operator value ')'
        return `(${operator}${value})`;
    },

    // Parse a gate_expr string back into its components.
    // Returns { operator: string, value: number } or null if invalid.
    // This is the CFG recogniser — it checks the string matches the grammar
    // and extracts the terminal symbols.
    parseGate(expr) {
        // First validate against RE_GATE_EXPR (the grammar's terminal pattern)
        if (!RE_GATE_EXPR.test(expr)) {
            console.error('CFG parse error: invalid gate expression:', expr);
            return null;
        }

        // gate_expr → '(' operator value ')'
        // Strip the outer parentheses, then split operator from value
        const inner = expr.slice(1, -1);          // remove '(' and ')'
        const operator = inner[0];                    // first char is the operator terminal
        const value = parseInt(inner.slice(1), 10); // remainder is the value terminal

        return { operator, value };
    },

    // Evaluate a gate expression against the current score.
    // Returns the new score as a positive integer.
    evaluateGate(expr, score) {
        const parsed = this.parseGate(expr);
        if (!parsed) return score;   // parse error — return score unchanged
        return this.applyOperator(parsed.operator, score, parsed.value);
    },

    // Apply an operator to a score and value, always returning a positive integer.
    applyOperator(operator, score, value) {
        switch (operator) {
            case '+': return score + value;
            case '-': return score - value;
            case '*': return score * value;
            case '/': return Math.floor(score / value);   // integer division
            default: return score;
        }
    }
};

// ── Gate generation helpers ───────────────────────────────────────────────────

// Generate a pair of gates of the same polarity where one is strictly better.
// Returns [gateA, gateB] as expression strings.
function generateGatePair(polarity, currentScore) {
    let gateA, gateB;
    let attempts = 0;

    do {
        gateA = CFG.generateGate(polarity, currentScore);
        gateB = CFG.generateGate(polarity, currentScore);
        attempts++;
        // Keep regenerating until the two gates produce different results
        // (avoids a tie where there is no correct answer)
    } while (
        CFG.evaluateGate(gateA, currentScore) === CFG.evaluateGate(gateB, currentScore)
        && attempts < 50
    );

    return [gateA, gateB];
}

// Return the expression string of whichever gate gives the higher result.
function bestGate(gateA, gateB, currentScore) {
    const resultA = CFG.evaluateGate(gateA, currentScore);
    const resultB = CFG.evaluateGate(gateB, currentScore);
    return resultA >= resultB ? gateA : gateB;
}

// ── State ─────────────────────────────────────────────────────────────────────

const State = {
    IDLE: 'idle',
    PLAYING: 'playing',
    CHECKING: 'checking',
    GAME_OVER: 'gameover'
};

const game = {
    state: State.IDLE,
    score: 1,
    gatesPassed: 0,
    roundInPhase: 0,      // counts 0–1 within the current phase
    phase: 'positive',  // 'positive' | 'negative'
    gateA: null,   // current left gate expression string
    gateB: null,   // current right gate expression string
    startTime: null,
    endTime: null,
    timerHandle: null,

    // ── Transitions ──────────────────────────────────────────────────────────

    start() {
        this.score = 1;
        this.gatesPassed = 0;
        this.roundInPhase = 0;
        this.phase = 'positive';
        this.startTime = Date.now();
        this.endTime = null;

        this.nextRound();
        this.transition(State.PLAYING);
        this.startClock();
    },

    // Called when the player clicks a gate — side is 'a' or 'b'
    pick(side) {
        if (this.state !== State.PLAYING) return;

        this.transition(State.CHECKING);

        const chosenExpr = side === 'a' ? this.gateA : this.gateB;
        const correct = bestGate(this.gateA, this.gateB, this.score);

        if (chosenExpr === correct) {
            // Correct pick — apply the gate and move on
            this.score = CFG.evaluateGate(chosenExpr, this.score);
            this.gatesPassed++;

            // Advance phase counter
            this.roundInPhase++;
            if (this.roundInPhase >= ROUNDS_PER_PHASE) {
                this.roundInPhase = 0;
                this.phase = this.phase === 'positive' ? 'negative' : 'positive';
            }

            this.nextRound();
            this.transition(State.PLAYING);
        } else {
            // Wrong pick — game over
            this.score = CFG.evaluateGate(chosenExpr, this.score);
            this.endTime = Date.now();
            this.stopClock();
            this.transition(State.GAME_OVER);
        }
    },

    // Generate the next pair of gates for the current phase
    nextRound() {
        [this.gateA, this.gateB] = generateGatePair(this.phase, this.score);
    },

    reset() {
        this.stopClock();
        this.transition(State.IDLE);
    },

    // ── Score saving ──────────────────────────────────────────────────────────

    async saveScore() {
        const raw = document.getElementById('nickname').value.trim().toUpperCase();

        if (!RE_NICKNAME.test(raw)) {
            setStatus('Tag must be 1-10 letters (A-Z only).', 'error');
            return;
        }

        const timeTaken = (this.endTime - this.startTime) / 1000;

        setStatus('Saving…', '');

        try {
            const response = await fetch('/submit_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game: 'gates',
                    game_id: GAME_ID,
                    nickname: raw,
                    time_taken: timeTaken,
                    nr_of_gates_passed: this.gatesPassed,
                    gate_value_reached: this.score
                })
            });

            const data = await response.json();

            if (data.ok) {
                setStatus('Score saved!', 'success');
            } else {
                setStatus('Error: ' + (data.error || 'unknown'), 'error');
            }
        } catch (err) {
            setStatus('Could not reach the server.', 'error');
        }
    },

    // ── Internal helpers ──────────────────────────────────────────────────────

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
    document.getElementById('display-score').textContent = game.score;
    document.getElementById('display-gates').textContent = game.gatesPassed;
    document.getElementById('display-phase').textContent = game.phase === 'positive' ? '▲ POSITIVE' : '▼ NEGATIVE';

    const phaseClass = game.phase === 'positive' ? 'gate-positive' : 'gate-negative';

    // Gate A — store the expression in data-expr, show it in the label div
    const btnA = document.getElementById('gate-a');
    btnA.dataset.expr = game.gateA;
    btnA.className = `gate ${phaseClass}`;
    document.getElementById('gate-a-label').textContent = game.gateA;

    // Gate B
    const btnB = document.getElementById('gate-b');
    btnB.dataset.expr = game.gateB;
    btnB.className = `gate ${phaseClass}`;
    document.getElementById('gate-b-label').textContent = game.gateB;
}

function updateResultScreen() {
    const timeTaken = ((game.endTime - game.startTime) / 1000).toFixed(2);
    document.getElementById('result-score').textContent = game.score;
    document.getElementById('result-gates').textContent = game.gatesPassed;
    document.getElementById('result-time').textContent = timeTaken + 's';
    document.getElementById('nickname').value = '';
    document.getElementById('save-status').textContent = '';
}

function showFeedback(text, type) {
    const el = document.getElementById('feedback');
    el.textContent = text;
    el.className = 'feedback ' + type;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.textContent = ''; el.className = 'feedback'; }, 800);
}

function setStatus(msg, type) {
    const el = document.getElementById('save-status');
    el.textContent = msg;
    el.className = 'save-status ' + type;
}

// ── Initial render ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    render();
});