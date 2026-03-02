// ===== GAME CONFIGURATION =====
const config = {
    // Canvas
    canvasWidth: 800,
    canvasHeight: 600,
    
    // Ball
    ballRadius: 8,
    ballSpeed: 5,
    
    // Paddle
    paddleWidth: 100,
    paddleHeight: 15,
    paddleSpeed: 8,
    
    // Bricks
    brickRows: 8,
    brickCols: 5,
    brickWidth: 80,
    brickHeight: 25,
    brickPadding: 10,
    brickOffsetTop: 50,
    brickOffsetLeft: 35,
    
    // Power-ups
    powerUpDuration: 5000, // 5 seconds
    
    // Scoring
    pointsPerBrick: 10,
    pointsPerPowerBrick: 20,
    pointsPerLevel: 50
};

// ===== GAME STATE =====
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    gameActive: false,
    gamePaused: false,
    soundEnabled: true,
    
    // Power-ups
    widePaddle: false,
    slowMotion: false,
    multiBall: false,
    powerUpTimer: null
};

// ===== GAME OBJECTS =====
let canvas, ctx;
let ball, paddle, bricks;
let powerUps = [];
let balls = [];

// ===== DOM ELEMENTS =====
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const gameOverlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const rulesBtn = document.getElementById('rulesBtn');
const soundBtn = document.getElementById('soundBtn');
const rulesModal = document.getElementById('rulesModal');
const closeRulesBtn = document.getElementById('closeRulesBtn');
const powerUpElements = document.querySelectorAll('.power-up');

// ===== INITIALIZE GAME =====
function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    
    // Initialize objects
    resetGame();
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    restartBtn.addEventListener('click', resetGame);
    menuBtn.addEventListener('click', () => showOverlay('PAUSED', 'Press SPACE to continue'));
    rulesBtn.addEventListener('click', () => rulesModal.classList.add('show'));
    closeRulesBtn.addEventListener('click', () => rulesModal.classList.remove('show'));
    soundBtn.addEventListener('click', toggleSound);
    
    // Start game
    startGame();
}

// ===== RESET GAME =====
function resetGame() {
    // Reset game state
    gameState = {
        score: 0,
        lives: 3,
        level: 1,
        gameActive: false,
        gamePaused: false,
        soundEnabled: gameState.soundEnabled,
        widePaddle: false,
        slowMotion: false,
        multiBall: false,
        powerUpTimer: null
    };
    
    // Reset objects
    createBall();
    createPaddle();
    createBricks();
    
    // Reset balls array
    balls = [ball];
    
    // Update UI
    updateStats();
    hideOverlay();
    
    // Clear power-ups
    powerUps = [];
    updatePowerUpUI();
}

// ===== CREATE OBJECTS =====
function createBall() {
    ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        dx: config.ballSpeed,
        dy: -config.ballSpeed,
        radius: config.ballRadius,
        active: true
    };
}

function createPaddle() {
    paddle = {
        x: canvas.width / 2 - config.paddleWidth / 2,
        y: canvas.height - 30,
        width: config.paddleWidth,
        height: config.paddleHeight,
        dx: 0,
        speed: config.paddleSpeed
    };
}

function createBricks() {
    bricks = [];
    for (let row = 0; row < config.brickRows; row++) {
        bricks[row] = [];
        for (let col = 0; col < config.brickCols; col++) {
            const brickX = col * (config.brickWidth + config.brickPadding) + config.brickOffsetLeft;
            const brickY = row * (config.brickHeight + config.brickPadding) + config.brickOffsetTop;
            
            // Random brick type
            const rand = Math.random();
            let type = 'normal';
            let health = 1;
            let points = config.pointsPerBrick;
            let color = '#00b894';
            
            if (rand < 0.2) { // 20% chance for power-up brick
                type = 'power';
                color = '#e84393';
                points = config.pointsPerPowerBrick;
            } else if (rand < 0.4) { // 20% chance for hard brick
                type = 'hard';
                health = 2;
                color = '#fdcb6e';
                points = config.pointsPerBrick * 2;
            }
            
            bricks[row][col] = {
                x: brickX,
                y: brickY,
                width: config.brickWidth,
                height: config.brickHeight,
                visible: true,
                type: type,
                health: health,
                points: points,
                color: color
            };
        }
    }
}

// ===== GAME LOOP =====
function gameLoop() {
    if (!gameState.gameActive || gameState.gamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update paddle
    paddle.x += paddle.dx;
    
    // Paddle boundaries
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
    
    // Update all balls
    balls.forEach((ball, index) => {
        if (!ball.active) return;
        
        // Move ball
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // Wall collisions
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.dx *= -1;
            playSound('bounce');
        }
        
        if (ball.y - ball.radius < 0) {
            ball.dy *= -1;
            playSound('bounce');
        }
        
        // Paddle collision
        if (ball.y + ball.radius > paddle.y &&
            ball.x > paddle.x &&
            ball.x < paddle.x + paddle.width) {
            
            // Calculate angle based on where ball hits paddle
            const hitPos = (ball.x - paddle.x) / paddle.width;
            const angle = (hitPos - 0.5) * Math.PI/2; // -45 to 45 degrees
            
            ball.dx = ball.speed * Math.sin(angle);
            ball.dy = -ball.speed * Math.cos(angle);
            
            playSound('paddle');
        }
        
        // Brick collisions
        for (let row = 0; row < bricks.length; row++) {
            for (let col = 0; col < bricks[row].length; col++) {
                const brick = bricks[row][col];
                
                if (brick.visible) {
                    if (ball.x + ball.radius > brick.x &&
                        ball.x - ball.radius < brick.x + brick.width &&
                        ball.y + ball.radius > brick.y &&
                        ball.y - ball.radius < brick.y + brick.height) {
                        
                        // Collision detection
                        const overlapLeft = ball.x + ball.radius - brick.x;
                        const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
                        const overlapTop = ball.y + ball.radius - brick.y;
                        const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
                        
                        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                        
                        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                            ball.dx *= -1;
                        } else {
                            ball.dy *= -1;
                        }
                        
                        // Handle brick hit
                        brick.health--;
                        
                        if (brick.health <= 0) {
                            brick.visible = false;
                            
                            // Add score
                            gameState.score += brick.points;
                            
                            // Spawn power-up if brick type is power
                            if (brick.type === 'power') {
                                spawnPowerUp(brick.x + brick.width/2, brick.y);
                            }
                            
                            playSound('brick');
                            
                            // Check if level complete
                            checkLevelComplete();
                        } else {
                            playSound('brick');
                        }
                        
                        updateStats();
                        break;
                    }
                }
            }
        }
        
        // Check if ball fell through bottom
        if (ball.y + ball.radius > canvas.height) {
            ball.active = false;
            
            // Remove ball from array
            balls.splice(index, 1);
            
            // If no balls left, lose a life
            if (balls.length === 0) {
                gameState.lives--;
                updateStats();
                
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    // Respawn ball
                    createBall();
                    balls = [ball];
                }
                
                playSound('lose');
            }
        }
    });
    
    // Update power-ups
    powerUps.forEach((power, index) => {
        power.y += power.dy;
        
        // Check if caught by paddle
        if (power.y + power.size > paddle.y &&
            power.x > paddle.x &&
            power.x < paddle.x + paddle.width) {
            
            activatePowerUp(power.type);
            powerUps.splice(index, 1);
            playSound('powerup');
        }
        
        // Remove if off screen
        if (power.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
}

// ===== DRAW =====
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e272e');
    gradient.addColorStop(1, '#2d3436');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Draw bricks
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.visible) {
                // Draw brick
                ctx.fillStyle = brick.color;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 3;
                
                // Draw main brick
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                
                // Draw highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.shadowBlur = 0;
                ctx.fillRect(brick.x, brick.y, brick.width, 3);
                
                // Draw brick type indicator
                if (brick.type === 'power') {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.beginPath();
                    ctx.arc(brick.x + brick.width/2, brick.y + brick.height/2, 5, 0, Math.PI * 2);
                    ctx.fill();
                } else if (brick.type === 'hard') {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    for (let i = 0; i < brick.health; i++) {
                        ctx.fillRect(brick.x + 10 + i * 20, brick.y + brick.height - 8, 10, 3);
                    }
                }
                
                // Reset shadow
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;
            }
        });
    });
    
    // Draw paddle
    ctx.fillStyle = gameState.widePaddle ? '#6c5ce7' : '#00cec9';
    ctx.shadowColor = gameState.widePaddle ? '#6c5ce7' : '#00cec9';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 10);
    ctx.fill();
    
    // Draw paddle highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, 3, 5);
    ctx.fill();
    
    // Draw all balls
    balls.forEach(ball => {
        if (!ball.active) return;
        
        // Draw ball glow
        ctx.shadowColor = '#00cec9';
        ctx.shadowBlur = 30;
        
        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        
        // Ball gradient
        const gradient = ctx.createRadialGradient(
            ball.x - 3, ball.y - 3, 0,
            ball.x, ball.y, ball.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#00cec9');
        gradient.addColorStop(1, '#008b8b');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw highlight
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(ball.x - 2, ball.y - 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    });
    
    // Draw power-ups
    powerUps.forEach(power => {
        ctx.shadowColor = power.color;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(power.x, power.y, power.size, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
            power.x - 3, power.y - 3, 0,
            power.x, power.y, power.size
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, power.color);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw icon
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = '12px "Font Awesome 6 Free"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '?';
        if (power.type === 'wide') icon = '⇔';
        if (power.type === 'slow') icon = '⏱';
        if (power.type === 'multi') icon = '⊕';
        
        ctx.fillText(icon, power.x, power.y);
    });
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Helper function for rounded rectangle
CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
};

// ===== POWER-UPS =====
function spawnPowerUp(x, y) {
    const types = ['wide', 'slow', 'multi'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: x,
        y: y,
        dy: 2,
        size: 15,
        type: type,
        color: type === 'wide' ? '#6c5ce7' : type === 'slow' ? '#00cec9' : '#e84393'
    });
}

function activatePowerUp(type) {
    switch(type) {
        case 'wide':
            gameState.widePaddle = true;
            paddle.width = config.paddleWidth * 1.5;
            break;
            
        case 'slow':
            gameState.slowMotion = true;
            balls.forEach(ball => {
                ball.speed = config.ballSpeed * 0.6;
                ball.dx *= 0.6;
                ball.dy *= 0.6;
            });
            break;
            
        case 'multi':
            gameState.multiBall = true;
            // Create two additional balls
            for (let i = 0; i < 2; i++) {
                const newBall = {
                    ...ball,
                    x: ball.x + (i === 0 ? 20 : -20),
                    y: ball.y - 20,
                    dx: ball.dx * (i === 0 ? 1 : -1),
                    dy: ball.dy,
                    active: true
                };
                balls.push(newBall);
            }
            break;
    }
    
    // Update UI
    updatePowerUpUI();
    
    // Set timer to deactivate
    if (gameState.powerUpTimer) clearTimeout(gameState.powerUpTimer);
    
    gameState.powerUpTimer = setTimeout(() => {
        deactivatePowerUps();
    }, config.powerUpDuration);
}

function deactivatePowerUps() {
    gameState.widePaddle = false;
    gameState.slowMotion = false;
    gameState.multiBall = false;
    
    // Reset paddle width
    paddle.width = config.paddleWidth;
    
    // Reset ball speed
    balls.forEach(ball => {
        ball.speed = config.ballSpeed;
        const angle = Math.atan2(ball.dy, ball.dx);
        ball.dx = config.ballSpeed * Math.cos(angle);
        ball.dy = config.ballSpeed * Math.sin(angle);
    });
    
    // Keep only one ball
    if (balls.length > 1) {
        balls = [balls[0]];
    }
    
    updatePowerUpUI();
}

function updatePowerUpUI() {
    powerUpElements.forEach(el => {
        const type = el.dataset.power;
        if (gameState[type + 'Paddle'] || gameState[type + 'Motion'] || gameState[type + 'Ball']) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// ===== GAME FLOW =====
function startGame() {
    gameState.gameActive = true;
    gameState.gamePaused = false;
    gameLoop();
}

function pauseGame() {
    gameState.gamePaused = true;
    showOverlay('PAUSED', 'Press SPACE to continue');
}

function resumeGame() {
    gameState.gamePaused = false;
    hideOverlay();
}

function gameOver() {
    gameState.gameActive = false;
    showOverlay('GAME OVER', `Final Score: ${gameState.score}`, true);
}

function checkLevelComplete() {
    const allBricksGone = bricks.every(row => row.every(brick => !brick.visible));
    
    if (allBricksGone) {
        gameState.level++;
        gameState.score += config.pointsPerLevel;
        
        // Create new level with harder bricks
        config.brickSpeed += 0.5;
        createBricks();
        
        updateStats();
        playSound('level');
    }
}

// ===== UI FUNCTIONS =====
function updateStats() {
    scoreElement.textContent = gameState.score;
    livesElement.textContent = gameState.lives;
    levelElement.textContent = gameState.level;
}

function showOverlay(title, message, showButtons = false) {
    overlayTitle.textContent = title;
    overlayMessage.textContent = message;
    
    if (showButtons) {
        document.querySelector('.overlay-buttons').style.display = 'flex';
    } else {
        document.querySelector('.overlay-buttons').style.display = 'none';
    }
    
    gameOverlay.classList.add('show');
}

function hideOverlay() {
    gameOverlay.classList.remove('show');
}

// ===== SOUND =====
function playSound(type) {
    if (!gameState.soundEnabled) return;
    
    // Create beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    
    switch(type) {
        case 'bounce':
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
            
        case 'paddle':
            oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
            
        case 'brick':
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.08);
            break;
            
        case 'powerup':
            oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
            
        case 'lose':
            oscillator.frequency.setValueAtTime(110, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
            
        case 'level':
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
    }
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const icon = soundBtn.querySelector('i');
    icon.className = gameState.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
}

// ===== EVENT HANDLERS =====
function handleKeyDown(e) {
    // Prevent page scrolling
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
    }
    
    // Paddle movement
    if (e.key === 'ArrowLeft') {
        paddle.dx = -paddle.speed;
    } else if (e.key === 'ArrowRight') {
        paddle.dx = paddle.speed;
    }
    
    // Space bar for pause
    if (e.key === ' ') {
        e.preventDefault();
        if (!gameState.gameActive) return;
        
        if (gameState.gamePaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
    
    // R key for restart
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        paddle.dx = 0;
    }
}

// ===== START GAME =====
document.addEventListener('DOMContentLoaded', init);