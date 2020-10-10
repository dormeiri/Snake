const scoreSpan = document.getElementById('score');
const boardCanvas = document.getElementById('board');

DIRECTION = {
    UP: 38,
    RIGHT: 39,
    LEFT: 37,
    DOWN: 40
}

class GameManager {
    constructor(board, snake, opts = {}) {
        this.fps = opts.fps || 10;
        this.apple_rarity = opts.apple_rarity || 1 / 10;
        this.max_apples = opts.max_apples || 5;

        this.board = board;
        this.snake = snake;
        this.apples = [];
        this._score = 0;

        this.interval = null;
    }

    run() {
        this._update();
        this.interval = setInterval(() => this._update(), 1000 / this.fps);
        document.addEventListener("keydown", (event) => this._keyPressed(event));
    }

    _update() {
        this.snake.moveSnake();
        if (this.checkHitObstacle()) {
            clearInterval(this.interval);
        } else {
            // Handling apples
            if (this.apples.length < this.max_apples && Math.random() < this.apple_rarity) {
                this._addApple();
            }
            let apple_idx = this._checkHitApple();
            if (apple_idx >= 0) {
                this._appleEated(apple_idx);
            }

            // Draw
            this.board.clearCanvas();
            this.board.drawSnake(this.snake);
            this.board.drawApples(this.apples);
            scoreSpan.innerHTML = this._score;
        }
    }

    _addApple() {
        let x = null;
        let y = null;

        do {
            x = Math.trunc(Math.random() * this.board.tiles_x);
            y = Math.trunc(Math.random() * this.board.tiles_x);
        } while (this.apples.some(pos => pos[0] === x && pos[1] === y))
        this.apples.push([x, y]);
    }

    _keyPressed(event) {
        if (Object.values(DIRECTION).includes(event.keyCode)) {
            this.snake.move_direction = event.keyCode;
        }
    }

    _appleEated(apple_idx) {
        // Increase score
        this.snake.grow();
        this._score++;

        // Remove apple
        this.apples.splice(apple_idx, 1);
    }

    _checkHitApple() {
        let head = this.snake.head;

        for (let i = 0; i < this.apples.length; i++) {
            let hit = this.apples[i].every((e, i) => e === head[i]);
            if (hit) {
                return i;
            }
        }

        return -1;
    }

    checkHitObstacle() {
        let head = this.snake.head;

        let outOfBorder = () => head.some(a => a >= this.board.tiles_x || a < 0);
        let touchingSnake = () => this.snake.body.some(
            pos => pos !== head && pos.every((e, i) => e === head[i])
        );

        return outOfBorder() || touchingSnake();
    }
}

class Snake {
    _move_logic = {
        [DIRECTION.UP]: pos => [pos[0], pos[1] - 1],
        [DIRECTION.RIGHT]: pos => [pos[0] + 1, pos[1]],
        [DIRECTION.DOWN]: pos => [pos[0], pos[1] + 1],
        [DIRECTION.LEFT]: pos => [pos[0] - 1, pos[1]]
    };
    _oppsite_directions = {
        [DIRECTION.UP]: DIRECTION.DOWN,
        [DIRECTION.LEFT]: DIRECTION.RIGHT,
        [DIRECTION.DOWN]: DIRECTION.UP,
        [DIRECTION.RIGHT]: DIRECTION.LEFT
    };

    constructor(pos, opts = {}) {
        this._move_direction = opts.init_direction || DIRECTION.RIGHT;
        this._move_direction_suggestion = null;
        this._length = opts.LEFT || 5;
        this._growing = false;

        this.body = [];
        for (let i = 0; i < this._length; i++) {
            this.body.push([pos[0] - (this._length - i), pos[1]]);
        }
    }

    get head() {
        return this.body[this.body.length - 1];
    }

    set move_direction(value) {
        if (this._oppsite_directions[this._move_direction] !== value) {
            this._move_direction_suggestion = value;
        }
    }

    grow() {
        this._growing = true;
    }

    moveSnake() {
        if (this._move_direction_suggestion) {
            this._move_direction = this._move_direction_suggestion;
            this._move_direction_suggestion = null;
        }
        let old_head = this.head;
        let new_head = this._move_logic[this._move_direction](old_head);

        if (!this._growing) {
            this.body.shift();
        } else {
            this._growing = false;
        }
        this.body.push(new_head);
    }
}

class Board {
    constructor(opts = {}) {
        this.ctx = boardCanvas.getContext('2d');
        this.size = boardCanvas.width;

        this.border_color = opts.border_color || 'black';
        this.snake_color = opts.snake_color || 'black';
        this.apple_color = opts.apple_color || 'red';
        this.tiles_x = opts.tiles_x || 40;
        this.tile_size = this.size / this.tiles_x;
    }

    get center_tile() {
        let a = Math.trunc(this.tiles_x / 2);
        return [a, a];
    }

    clearCanvas() {
        this.ctx.strokeStyle = this.border_color;
        this.ctx.clearRect(0, 0, this.size, this.size);
        this.ctx.strokeRect(0, 0, this.size, this.size);
    }

    drawSnake(snake) {
        this._drawTiles(snake.body, this.snake_color);
    }

    drawApples(apples) {
        this._drawTiles(apples, this.apple_color);
    }

    _drawTiles(poss, color) {
        poss.forEach(pos => this._drawTile(pos, color));
    }

    _drawTile(pos, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            pos[0] * this.tile_size,
            pos[1] * this.tile_size,
            this.tile_size,
            this.tile_size
        );
    }
}

function main() {
    let board = new Board()
    let snake = new Snake(board.center_tile);
    let manager = new GameManager(board, snake);

    manager.run();
}

main();
