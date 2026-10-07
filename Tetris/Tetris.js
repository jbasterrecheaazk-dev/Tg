/* Tetris Classic Game Engine - Cyberpunk Style */

        // Game Board Constants
        const COLS = 10;
        const ROWS = 20;
        const BLOCK_SIZE = 24; // Canvas size 240x480

        // HTML Elements
        const canvas = document.getElementById('tetrisCanvas');
        const ctx = canvas.getContext('2d');
        const nextCanvas = document.getElementById('nextCanvas');
        const nextCtx = nextCanvas.getContext('2d');
        const holdCanvas = document.getElementById('holdCanvas');
        const holdCtx = holdCanvas.getContext('2d');

        const scoreText = document.getElementById('scoreText');
        const highScoreText = document.getElementById('highScoreText');
        const levelText = document.getElementById('levelText');
        const linesText = document.getElementById('linesText');
        const finalScoreText = document.getElementById('finalScoreText');

        const gameOverModal = document.getElementById('gameOverModal');
        const pauseModal = document.getElementById('pauseModal');
        const restartBtn = document.getElementById('restartBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const soundToggleBtn = document.getElementById('soundToggleBtn');
        const soundIcon = document.getElementById('soundIcon');

        // Web Audio API Synthesizer for Retro Sound Effects
        class SoundFX {
            constructor() {
                this.ctx = null;
                this.muted = false;
            }

            init() {
                if (!this.ctx) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    this.ctx = new AudioContext();
                }
            }

            playTone(freq, type, duration, vol = 0.1) {
                if (this.muted || !this.ctx) return;
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + duration);
                } catch(e) {}
            }

            move() { this.playTone(180, 'sine', 0.05, 0.05); }
            rotate() { this.playTone(300, 'triangle', 0.08, 0.08); }
            drop() { this.playTone(120, 'square', 0.12, 0.1); }
            hold() { this.playTone(250, 'sawtooth', 0.08, 0.06); }
            
            clearLine() {
                if (this.muted || !this.ctx) return;
                const notes = [440, 554.37, 659.25, 880];
                notes.forEach((freq, idx) => {
                    setTimeout(() => this.playTone(freq, 'sine', 0.15, 0.1), idx * 40);
                });
            }

            gameOver() {
                if (this.muted || !this.ctx) return;
                const notes = [300, 260, 220, 150];
                notes.forEach((freq, idx) => {
                    setTimeout(() => this.playTone(freq, 'sawtooth', 0.25, 0.12), idx * 100);
                });
            }
        }

        const audio = new SoundFX();

        // Tetromino Definitions & Colors
        const SHAPES = {
            I: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            J: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            L: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            O: [
                [1, 1],
                [1, 1]
            ],
            S: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            T: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            Z: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ]
        };

        const COLORS = {
            I: { main: '#00f0ff', border: '#80f8ff', shadow: 'rgba(0, 240, 255, 0.5)' }, // Cyan
            J: { main: '#0038ff', border: '#809cff', shadow: 'rgba(0, 56, 255, 0.5)' },  // Blue
            L: { main: '#ff7700', border: '#ffbb80', shadow: 'rgba(255, 119, 0, 0.5)' }, // Orange
            O: { main: '#ffe600', border: '#fff380', shadow: 'rgba(255, 230, 0, 0.5)' }, // Yellow
            S: { main: '#00ff66', border: '#80ffb3', shadow: 'rgba(0, 255, 102, 0.5)' }, // Green
            T: { main: '#cc00ff', border: '#e680ff', shadow: 'rgba(204, 0, 255, 0.5)' }, // Purple
            Z: { main: '#ff0055', border: '#ff80aa', shadow: 'rgba(255, 0, 85, 0.5)' }   // Red/Pink
        };

        // Game State Variables
        let grid = createGrid();
        let score = 0;
        let highScore = localStorage.getItem('tetris_high_score') || 0;
        let lines = 0;
        let level = 1;
        let gameOver = false;
        let isPaused = false;
        let dropCounter = 0;
        let dropInterval = 1000;
        let lastTime = 0;

        let currentPiece = null;
        let nextPiece = null;
        let holdPiece = null;
        let canHold = true;
        let flashingLines = [];

        highScoreText.textContent = highScore;

        function createGrid() {
            return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        }

        // Random Tetromino Generator using 7-bag algorithm
        let bag = [];
        function getNextPieceType() {
            if (bag.length === 0) {
                bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
                for (let i = bag.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [bag[i], bag[j]] = [bag[j], bag[i]];
                }
            }
            const type = bag.pop();
            return {
                type: type,
                matrix: SHAPES[type].map(row => [...row]),
                color: COLORS[type],
                x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2),
                y: 0
            };
        }

        function collide(board, piece) {
            const m = piece.matrix;
            const o = piece;
            for (let y = 0; y < m.length; ++y) {
                for (let x = 0; x < m[y].length; ++x) {
                    if (m[y][x] !== 0 &&
                       (board[y + o.y] === undefined || 
                        board[y + o.y][x + o.x] === undefined ||
                        board[y + o.y][x + o.x] !== 0)) {
                        return true;
                    }
                }
            }
            return false;
        }

        function rotate(matrix, dir) {
            const result = matrix.map((_, i) =>
                matrix.map(col => col[i])
            );
            if (dir > 0) return result.map(row => row.reverse());
            return result.reverse();
        }

        function playerRotate(dir) {
            if (gameOver || isPaused) return;
            audio.init();
            const pos = currentPiece.x;
            let offset = 1;
            const originalMatrix = currentPiece.matrix;
            currentPiece.matrix = rotate(currentPiece.matrix, dir);
            
            // Wall Kick implementation
            while (collide(grid, currentPiece)) {
                currentPiece.x += offset;
                offset = -(offset + (offset > 0 ? 1 : -1));
                if (offset > currentPiece.matrix[0].length) {
                    currentPiece.matrix = originalMatrix;
                    currentPiece.x = pos;
                    return;
                }
            }
            audio.rotate();
        }

        function playerMove(dir) {
            if (gameOver || isPaused) return;
            audio.init();
            currentPiece.x += dir;
            if (collide(grid, currentPiece)) {
                currentPiece.x -= dir;
            } else {
                audio.move();
            }
        }

        function playerDrop() {
            if (gameOver || isPaused) return;
            currentPiece.y++;
            if (collide(grid, currentPiece)) {
                currentPiece.y--;
                merge(grid, currentPiece);
                audio.drop();
                playerReset();
                clearLines();
                updateScore();
            }
            dropCounter = 0;
        }

        function hardDrop() {
            if (gameOver || isPaused) return;
            audio.init();
            while (!collide(grid, currentPiece)) {
                currentPiece.y++;
            }
            currentPiece.y--;
            merge(grid, currentPiece);
            audio.drop();
            playerReset();
            clearLines();
            updateScore();
            dropCounter = 0;
        }

        function actionHold() {
            if (gameOver || isPaused || !canHold) return;
            audio.init();
            audio.hold();

            if (!holdPiece) {
                holdPiece = {
                    type: currentPiece.type,
                    matrix: SHAPES[currentPiece.type].map(row => [...row]),
                    color: COLORS[currentPiece.type]
                };
                currentPiece = nextPiece;
                nextPiece = getNextPieceType();
            } else {
                const temp = holdPiece.type;
                holdPiece = {
                    type: currentPiece.type,
                    matrix: SHAPES[currentPiece.type].map(row => [...row]),
                    color: COLORS[currentPiece.type]
                };
                currentPiece = {
                    type: temp,
                    matrix: SHAPES[temp].map(row => [...row]),
                    color: COLORS[temp],
                    x: Math.floor(COLS / 2) - Math.ceil(SHAPES[temp][0].length / 2),
                    y: 0
                };
            }
            canHold = false;
            drawPreview(holdCtx, holdPiece);
            drawPreview(nextCtx, nextPiece);
        }

        function merge(board, piece) {
            piece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        board[y + piece.y][x + piece.x] = piece.color;
                    }
                });
            });
        }

        function playerReset() {
            if (!nextPiece) nextPiece = getNextPieceType();
            currentPiece = nextPiece;
            nextPiece = getNextPieceType();
            currentPiece.x = Math.floor(COLS / 2) - Math.ceil(currentPiece.matrix[0].length / 2);
            currentPiece.y = 0;
            canHold = true;

            drawPreview(nextCtx, nextPiece);
            drawPreview(holdCtx, holdPiece);

            // Check Game Over
            if (collide(grid, currentPiece)) {
                gameOver = true;
                audio.gameOver();
                finalScoreText.textContent = score;
                gameOverModal.classList.remove('hidden');
            }
        }

        function clearLines() {
            let linesCleared = 0;
            let rowsToClear = [];

            // Identificar todas las filas completas
            for (let y = ROWS - 1; y >= 0; --y) {
                if (grid[y].every(cell => cell !== 0)) {
                    rowsToClear.push(y);
                    linesCleared++;
                }
            }

            if (linesCleared > 0) {
                flashingLines = rowsToClear;
                audio.clearLine();
                
                // Efecto de parpadeo antes de eliminar las filas
                setTimeout(() => {
                    // Filtrar la cuadrícula manteniendo solo las filas no completadas
                    const newGrid = grid.filter((_, index) => !rowsToClear.includes(index));
                    
                    // Añadir filas vacías al principio por cada línea eliminada
                    while (newGrid.length < ROWS) {
                        newGrid.unshift(Array(COLS).fill(0));
                    }
                    
                    // Actualizar el estado del grid
                    grid = newGrid;
                    flashingLines = [];
                }, 150);

                lines += linesCleared;
                
                // Sistema de puntuación clásico
                const basePoints = [0, 100, 300, 500, 800];
                score += basePoints[linesCleared] * level;

                // Subida de nivel
                level = Math.floor(lines / 10) + 1;
                dropInterval = Math.max(100, 1000 - (level - 1) * 85);

                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('tetris_high_score', highScore);
                }

                updateScoreUI();
            }
        }

        function updateScoreUI() {
            scoreText.textContent = score;
            highScoreText.textContent = highScore;
            levelText.textContent = level;
            linesText.textContent = lines;
        }

        function updateScore() {
            updateScoreUI();
        }

        function drawBlock(context, x, y, color, size = BLOCK_SIZE) {
            context.fillStyle = color.main;
            context.fillRect(x * size, y * size, size, size);

            // Bevel effect
            context.fillStyle = color.border;
            context.fillRect(x * size, y * size, size, 2);
            context.fillRect(x * size, y * size, 2, size);

            context.fillStyle = 'rgba(0, 0, 0, 0.3)';
            context.fillRect(x * size, y * size + size - 2, size, 2);
            context.fillRect(x * size + size - 2, y * size, 2, size);
        }

        function drawGhostPiece(piece) {
            const ghost = {
                ...piece,
                matrix: piece.matrix,
                x: piece.x,
                y: piece.y
            };

            while (!collide(grid, ghost)) {
                ghost.y++;
            }
            ghost.y--;

            ghost.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        ctx.strokeStyle = piece.color.main;
                        ctx.lineWidth = 1;
                        ctx.strokeRect((ghost.x + x) * BLOCK_SIZE + 1, (ghost.y + y) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                        ctx.fillRect((ghost.x + x) * BLOCK_SIZE, (ghost.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                });
            });
        }

        function drawGrid() {
            ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
            ctx.lineWidth = 1;

            for (let x = 0; x <= COLS; x++) {
                ctx.beginPath();
                ctx.moveTo(x * BLOCK_SIZE, 0);
                ctx.lineTo(x * BLOCK_SIZE, canvas.height);
                ctx.stroke();
            }

            for (let y = 0; y <= ROWS; y++) {
                ctx.beginPath();
                ctx.moveTo(0, y * BLOCK_SIZE);
                ctx.lineTo(canvas.width, y * BLOCK_SIZE);
                ctx.stroke();
            }
        }

        function draw() {
            drawGrid();

            // Draw Locked Grid
            grid.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        if (flashingLines.includes(y)) {
                            // Line Flash Effect
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        } else {
                            drawBlock(ctx, x, y, value);
                        }
                    }
                });
            });

            // Draw Current & Ghost Piece
            if (currentPiece && !gameOver) {
                drawGhostPiece(currentPiece);

                currentPiece.matrix.forEach((row, y) => {
                    row.forEach((value, x) => {
                        if (value !== 0) {
                            drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
                        }
                    });
                });
            }
        }

        function drawPreview(context, piece) {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            if (!piece) return;

            const matrix = piece.matrix;
            const size = 20;
            const offsetX = (context.canvas.width - matrix[0].length * size) / 2;
            const offsetY = (context.canvas.height - matrix.length * size) / 2;

            matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        context.fillStyle = piece.color.main;
                        context.fillRect(offsetX + x * size, offsetY + y * size, size, size);

                        context.fillStyle = piece.color.border;
                        context.fillRect(offsetX + x * size, offsetY + y * size, size, 2);
                        context.fillRect(offsetX + x * size, offsetY + y * size, 2, size);
                    }
                });
            });
        }

        function update(time = 0) {
            const deltaTime = time - lastTime;
            lastTime = time;

            if (!isPaused && !gameOver) {
                dropCounter += deltaTime;
                if (dropCounter > dropInterval) {
                    playerDrop();
                }
            }

            draw();
            requestAnimationFrame(update);
        }

        function togglePause() {
            if (gameOver) return;
            isPaused = !isPaused;
            if (isPaused) {
                pauseModal.classList.remove('hidden');
                document.getElementById('pauseIcon').className = "fas fa-play";
                document.getElementById('pauseBtnText').textContent = "CONTINUAR";
            } else {
                pauseModal.classList.add('hidden');
                document.getElementById('pauseIcon').className = "fas fa-pause";
                document.getElementById('pauseBtnText').textContent = "PAUSA";
            }
        }

        function resetGame() {
            grid = createGrid();
            score = 0;
            lines = 0;
            level = 1;
            dropInterval = 1000;
            gameOver = false;
            isPaused = false;
            holdPiece = null;
            nextPiece = null;
            canHold = true;
            
            updateScoreUI();
            gameOverModal.classList.add('hidden');
            pauseModal.classList.add('hidden');
            document.getElementById('pauseIcon').className = "fas fa-pause";
            document.getElementById('pauseBtnText').textContent = "PAUSA";

            playerReset();
        }

        // Keyboard Controls
        document.addEventListener('keydown', event => {
            audio.init();

            if (event.key === 'p' || event.key === 'P') {
                togglePause();
                return;
            }

            if (isPaused || gameOver) return;

            switch (event.keyCode) {
                case 37: // Left Arrow
                    playerMove(-1);
                    break;
                case 39: // Right Arrow
                    playerMove(1);
                    break;
                case 40: // Down Arrow
                    playerDrop();
                    break;
                case 38: // Up Arrow
                case 88: // 'X' Key
                    playerRotate(1);
                    break;
                case 90: // 'Z' Key
                    playerRotate(-1);
                    break;
                case 32: // Space
                    event.preventDefault();
                    hardDrop();
                    break;
                case 67: // 'C' Key
                case 16: // Shift
                    actionHold();
                    break;
            }
        });

        // Touch Control Listeners
        const setupTouchBtn = (id, action) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                action();
            }, { passive: false });
            btn.addEventListener('click', () => action());
        };

        setupTouchBtn('btnLeft', () => playerMove(-1));
        setupTouchBtn('btnRight', () => playerMove(1));
        setupTouchBtn('btnDown', () => playerDrop());
        setupTouchBtn('btnRotate', () => playerRotate(1));
        setupTouchBtn('btnRotCCW', () => playerRotate(-1));
        setupTouchBtn('btnHardDrop', () => hardDrop());
        setupTouchBtn('btnHold', () => actionHold());
        setupTouchBtn('btnPauseTouch', () => togglePause());

        pauseBtn.addEventListener('click', togglePause);
        restartBtn.addEventListener('click', resetGame);

        soundToggleBtn.addEventListener('click', () => {
            audio.init();
            audio.muted = !audio.muted;
            if (audio.muted) {
                soundIcon.className = "fas fa-volume-mute text-pink-500";
            } else {
                soundIcon.className = "fas fa-volume-up text-cyan-400";
            }
        });

        window.onload = () => {
            playerReset();
            update();
        };