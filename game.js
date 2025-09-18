// Responsive canvas sizing
const canvas = document.getElementById('pong');
const context = canvas.getContext('2d');
function resizeCanvas() {
    // base size 800x500
    let w = document.getElementById('game-container').clientWidth;
    let h = Math.round(w * 500 / 800);
    if (window.innerWidth < 600) h = Math.round(w * 0.6);
    canvas.width = w;
    canvas.height = h;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// UI elements
const overlay = document.getElementById('overlay');
const guide = document.getElementById('guide');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const difficultyEl = document.getElementById('difficulty-level');

// Audio
const audioPaddle = document.getElementById('audio-paddle');
const audioWall = document.getElementById('audio-wall');
const audioScore = document.getElementById('audio-score');
const audioWin = document.getElementById('audio-win');
const audioLose = document.getElementById('audio-lose');

// Game settings (will update on difficulty)
let PADDLE_WIDTH = 14;
let PADDLE_HEIGHT = 0; // Set below after canvas init
let BALL_SIZE = 0;
let PADDLE_SPEED = 6;
let ballInitSpeed = 5.5;

let DIFFICULTY = 1;
let WIN_SCORE = 5;

// Colors
const basePlayerColor = "#4CAF50";
const baseAiColor = "#E91E63";
const baseBallColor = "#FFEB3B";
const collisionBallColor = "#09f";
const collisionPlayerColor = "#0ff";
const collisionAiColor = "#f39";

// Paddle objects
let player, ai, ball;
let playerScore = 0, aiScore = 0;
let isPlaying = false;
let winner = null;
let collisionEffect = 0;

// Khởi tạo lại các thông số khi đổi độ khó hoặc reset
function resetObjects() {
    PADDLE_HEIGHT = Math.max(70, Math.floor(canvas.height * 0.2));
    BALL_SIZE = Math.max(13, Math.floor(canvas.width * 0.021));
    player = {
        x: 10,
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: basePlayerColor
    };
    ai = {
        x: canvas.width - PADDLE_WIDTH - 10,
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: baseAiColor
    };
    ball = {
        x: canvas.width / 2 - BALL_SIZE / 2,
        y: canvas.height / 2 - BALL_SIZE / 2,
        size: BALL_SIZE,
        speed: ballInitSpeed + (DIFFICULTY-1) * 1.1,
        dx: (Math.random() > 0.5 ? 1 : -1) * (ballInitSpeed + (DIFFICULTY-1) * 1.1),
        dy: ((Math.random() * 2 - 1) * (ballInitSpeed + (DIFFICULTY-1) * 1.1)) * 0.7,
        color: baseBallColor
    };
}

resetObjects();

// Draw rounded rectangle (paddle)
function drawRect(x, y, w, h, color, r = 10) {
    context.save();
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r);
    context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
    context.fillStyle = color;
    context.shadowColor = "#0ff8";
    context.shadowBlur = 10;
    context.fill();
    context.restore();
}

// Draw glowing ball
function drawBall(x, y, size, color) {
    context.save();
    context.shadowColor = "#fff";
    context.shadowBlur = 16 + (collisionEffect?10:0);
    context.fillStyle = color;
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
    context.restore();
}

// Draw net
function drawNet() {
    context.save();
    context.strokeStyle = "#0ff";
    context.lineWidth = 2.5;
    for (let i = 0; i < canvas.height; i += 36) {
        context.beginPath();
        context.moveTo(canvas.width / 2, i);
        context.lineTo(canvas.width / 2, i + 18);
        context.stroke();
    }
    context.restore();
}

// Draw scores and difficulty
function drawScores() {
    context.save();
    context.font = "bold " + Math.max(28, Math.floor(canvas.width/18)) + "px Segoe UI, Arial";
    context.textAlign = "center";
    context.shadowColor = "#0ff";
    context.shadowBlur = 8;
    context.fillStyle = "#fff";
    context.fillText(playerScore, canvas.width / 4, Math.max(38, Math.floor(canvas.height/12)));
    context.fillText(aiScore, 3 * canvas.width / 4, Math.max(38, Math.floor(canvas.height/12)));
    context.restore();
}

function drawVS() {
    context.save();
    context.font = "bold " + Math.max(16, Math.floor(canvas.width/40)) + "px Segoe UI, Arial";
    context.fillStyle = "#16e2f5";
    context.textAlign = "center";
    context.globalAlpha = 0.7;
    context.fillText("PLAYER", canvas.width / 4, Math.max(28, Math.floor(canvas.height/20)));
    context.fillText("AI", 3 * canvas.width / 4, Math.max(28, Math.floor(canvas.height/20)));
    context.globalAlpha = 1;
    context.font = "bold " + Math.max(19, Math.floor(canvas.width/36)) + "px Segoe UI, Arial";
    context.fillText("VS", canvas.width / 2, Math.max(36, Math.floor(canvas.height/14)));
    context.restore();
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2 - BALL_SIZE / 2;
    ball.y = canvas.height / 2 - BALL_SIZE / 2;
    ball.speed = ballInitSpeed + (DIFFICULTY-1) * 1.1;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = ((Math.random() * 2 - 1) * ball.speed) * 0.7;
    collisionEffect = 0;
}

// Paddle collisions
function collision(paddle, ball) {
    return (
        ball.x < paddle.x + paddle.width &&
        ball.x + ball.size > paddle.x &&
        ball.y < paddle.y + paddle.height &&
        ball.y + ball.size > paddle.y
    );
}

// Mouse control for player's paddle
canvas.addEventListener('mousemove', function (evt) {
    if (!isPlaying || winner) return;
    let rect = canvas.getBoundingClientRect();
    let mouseY = evt.clientY - rect.top;
    player.y = mouseY - player.height / 2;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
});

// AI movement
function moveAI() {
    // AI tăng tốc theo độ khó
    let target = ball.y + ball.size / 2 - ai.height / 2;
    let aiSpeed = PADDLE_SPEED + (DIFFICULTY-1)*1.2;
    if (ai.y < target) {
        ai.y += aiSpeed;
    } else if (ai.y > target) {
        ai.y -= aiSpeed;
    }
    if (ai.y < 0) ai.y = 0;
    if (ai.y + ai.height > canvas.height) ai.y = canvas.height - ai.height;
}

// Ball movement and logic
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision
    if (ball.y < 0) {
        ball.y = 0;
        ball.dy = -ball.dy * 1.04;
        playAudio(audioWall);
        visualCollision('wall');
    }
    if (ball.y + ball.size > canvas.height) {
        ball.y = canvas.height - ball.size;
        ball.dy = -ball.dy * 1.04;
        playAudio(audioWall);
        visualCollision('wall');
    }

    // Paddle collision (Player)
    if (collision(player, ball)) {
        ball.x = player.x + player.width;
        ball.dx = -ball.dx * 1.07;
        let collidePoint = (ball.y + ball.size / 2) - (player.y + player.height / 2);
        ball.dy = collidePoint * 0.22;
        playAudio(audioPaddle);
        visualCollision('player');
    }

    // Paddle collision (AI)
    if (collision(ai, ball)) {
        ball.x = ai.x - ball.size;
        ball.dx = -ball.dx * 1.07;
        let collidePoint = (ball.y + ball.size / 2) - (ai.y + ai.height / 2);
        ball.dy = collidePoint * 0.22;
        playAudio(audioPaddle);
        visualCollision('ai');
    }

    // Score (Player missed)
    if (ball.x < 0) {
        aiScore++;
        playAudio(audioScore);
        shakeScreen();
        if (aiScore >= WIN_SCORE) {
            winner = 'ai';
            showEndGame('Thua cuộc!', 'AI đã thắng! Độ khó được giảm xuống.');
            playAudio(audioLose);
        } else {
            showFlash('AI ghi điểm!');
            resetBall();
        }
    }

    // Score (AI missed)
    if (ball.x + ball.size > canvas.width) {
        playerScore++;
        playAudio(audioScore);
        shakeScreen();
        if (playerScore >= WIN_SCORE) {
            winner = 'player';
            DIFFICULTY++;
            showEndGame('Bạn thắng!', `Độ khó tăng lên ${DIFFICULTY}.`);
            playAudio(audioWin);
        } else {
            showFlash('Bạn ghi điểm!');
            resetBall();
        }
    }
}

// Hiệu ứng rung màn hình
function shakeScreen() {
    canvas.classList.add('shake');
    setTimeout(() => canvas.classList.remove('shake'), 380);
}

// Hiệu ứng màu khi chạm paddle, tường
function visualCollision(type) {
    collisionEffect = 12;
    if (type === 'player') {
        ball.color = collisionBallColor;
        player.color = collisionPlayerColor;
        setTimeout(() => {
            ball.color = baseBallColor;
            player.color = basePlayerColor;
        }, 170);
    } else if (type === 'ai') {
        ball.color = collisionBallColor;
        ai.color = collisionAiColor;
        setTimeout(() => {
            ball.color = baseBallColor;
            ai.color = baseAiColor;
        }, 170);
    } else {
        ball.color = "#fff";
        setTimeout(() => ball.color = baseBallColor, 130);
    }
}

// Main game loop
function gameLoop() {
    // Responsive: nếu canvas thay đổi size, reset lại paddle/ball
    if (canvas.width !== context.canvas.width || canvas.height !== context.canvas.height) {
        resetObjects();
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawNet();
    drawScores();
    drawVS();
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(ai.x, ai.y, ai.width, ai.height, ai.color);
    drawBall(ball.x, ball.y, ball.size, ball.color);
    if (collisionEffect > 0) collisionEffect--;

    if (isPlaying && !winner) {
        moveAI();
        moveBall();
    }
    requestAnimationFrame(gameLoop);
}

// Flash overlay khi ghi bàn
function showFlash(message) {
    overlay.style.display = 'flex';
    overlay.innerHTML = `<div style="color:#fff;font-size:2em;font-weight:600;text-shadow:0 2px 12px #222; padding:30px;">${message}</div>`;
    setTimeout(() => {
        if (isPlaying && !winner) {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }
    }, 950);
}

// Thông báo thắng/thua
function showEndGame(title, subtitle) {
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div style="color:#fff;font-size:2.1em;font-weight:600;text-shadow:0 2px 12px #222; margin-bottom:8px;">${title}</div>
      <div style="color:#16e2f5; font-size:1.25em; margin-bottom:24px;">${subtitle}</div>
      <button id="nextBtn">Chơi tiếp</button>
    `;
    document.getElementById('nextBtn').onclick = function() {
        overlay.style.display = 'none';
        overlay.innerHTML = '';
        if (winner === 'player') {
            // Tăng độ khó, reset game
            difficultyEl.textContent = DIFFICULTY;
        } else if (winner === 'ai' && DIFFICULTY > 1) {
            DIFFICULTY--;
            difficultyEl.textContent = DIFFICULTY;
        }
        startNewGame();
    };
}

// Audio helper
function playAudio(audioEl) {
    try {
        audioEl.currentTime = 0;
        audioEl.play();
    } catch(e){}
}

// Start/reset handlers
startBtn.onclick = function() {
    overlay.style.display = 'none';
    isPlaying = true;
    winner = null;
    overlay.innerHTML = '';
    resetObjects();
    playerScore = 0;
    aiScore = 0;
    difficultyEl.textContent = DIFFICULTY;
};
restartBtn.onclick = function() {
    playerScore = 0;
    aiScore = 0;
    winner = null;
    isPlaying = false;
    overlay.style.display = 'flex';
    overlay.innerHTML = '';
    overlay.appendChild(guide);
    difficultyEl.textContent = DIFFICULTY;
    resetObjects();
};

function startNewGame() {
    playerScore = 0;
    aiScore = 0;
    winner = null;
    resetObjects();
    difficultyEl.textContent = DIFFICULTY;
    isPlaying = true;
}

document.addEventListener("keydown", function(e){
    if (overlay.style.display !== "none" && (e.code === "Enter" || e.key === " ")) {
        if (guide && overlay.contains(guide)) {
            startBtn.onclick();
        }
        let nextBtn = document.getElementById('nextBtn');
        if (nextBtn) nextBtn.click();
    }
});

// Responsive: khi resize thì reset paddle, ball
window.addEventListener('resize', () => {
    resetObjects();
});

resetObjects();
gameLoop();