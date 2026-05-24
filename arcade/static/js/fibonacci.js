const State = { IDLE: 'idle', PLAYING: 'playing', CHECKING: 'checking', GAME_OVER: 'gameover' };

const game = {
    state: State.IDLE,
    current: 0,      // index into fib sequence
    sequence: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, ...],
    startTime: null,

    transition(newState) {
        this.state = newState;
        render();
    },

    start() {
        this.current = 0;
        this.startTime = Date.now();
        this.transition(State.PLAYING);
    },

    submit(userInput) {
        this.transition(State.CHECKING);
        if (parseInt(userInput) === this.sequence[this.current]) {
            this.current++;
            this.transition(State.PLAYING);
        } else {
            this.transition(State.GAME_OVER);
            saveScore();
        }
    }
};

function saveScore() {
    const timeTaken = (Date.now() - game.startTime) / 1000;
    fetch('/submit_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            game: 'fibonacci',
            game_id: 1,
            nickname: document.getElementById('tag').value.toUpperCase().slice(0, 3),
            time_taken: timeTaken,
            fib_value_reached: game.sequence[game.current - 1]
        })
    });
}