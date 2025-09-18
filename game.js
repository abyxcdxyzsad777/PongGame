const canvas = document.getElementById('pong');
const context = canvas.getContext('2d');

// Game settings
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 16;
const PADDLE_SPEED = 6;

// Player Paddle (left)
const player = {
    x: 10,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: "#4CAF50"
};

// AI Paddle (right)
const ai = {
    x: canvas.width - PADDLE_WIDTH - 10,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: "#E91E63"
};

// Ball
const ball = {
    x: canvas.width / 2 - BALL_SIZE / 2,
    y: canvas.height / 2 - BALL_SIZE / 2,
    size: BALL_SIZE,
    speed: 5,
    dx: 5,
    dy: 5,
    color: "#FFEB3B"
};

// Scores
let playerScore = 0;
let aiScore = 0;

// Utility function to draw rectangles
function drawRect(x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

// Utility function to draw a circle (for the ball)
function drawBall(x, y, size, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

// Draw the net
function drawNet() {
    context.fillStyle = "#fff";
    for (let i = 0; i < canvas.height; i += 30) {
        context.fillRect(canvas.width / 2 - 1, i, 2, 18);
    }
}

// Draw scores
function drawScores() {
    context.font = "32px Arial";
    context.fillStyle = "#fff";
    context.fillText(playerScore, canvas.width / 4, 50);
    context.fillText(aiScore, 3 * canvas.width / 4, 50);
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2 - BALL_SIZE / 2;
    ball.y = canvas.height / 2 - BALL_SIZE / 2;
    // Ball direction towards the last scorer
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = ((Math.random() * 2 - 1) * ball.speed) * 0.7;
}

// Collision detection
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
    let rect = canvas.getBoundingClientRect();
    let mouseY = evt.clientY - rect.top;
    player.y = mouseY - player.height / 2;
    // Clamp paddle within canvas
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
});

// AI movement
function moveAI() {
    let target = ball.y + ball.size / 2 - ai.height / 2;
    if (ai.y < target) {
        ai.y += PADDLE_SPEED;
    } else if (ai.y > target) {
        ai.y -= PADDLE_SPEED;
    }
    // Clamp paddle within canvas
    if (ai.y < 0) ai.y = 0;
    if (ai.y + ai.height > canvas.height) ai.y = canvas.height - ai.height;
}

// Ball movement and logic
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top/bottom wall collision
    if (ball.y < 0) {
        ball.y = 0;
        ball.dy = -ball.dy;
    }
    if (ball.y + ball.size > canvas.height) {
        ball.y = canvas.height - ball.size;
        ball.dy = -ball.dy;
    }

    // Paddle collision (Player)
    if (collision(player, ball)) {
        ball.x = player.x + player.width;
        ball.dx = -ball.dx;
        // Add some spin based on where the ball hit the paddle
        let collidePoint = (ball.y + ball.size / 2) - (player.y + player.height / 2);
        ball.dy = collidePoint * 0.25;
    }

    // Paddle collision (AI)
    if (collision(ai, ball)) {
        ball.x = ai.x - ball.size;
        ball.dx = -ball.dx;
        let collidePoint = (ball.y + ball.size / 2) - (ai.y + ai.height / 2);
        ball.dy = collidePoint * 0.25;
    }

    // Score (Player missed)
    if (ball.x < 0) {
        aiScore++;
        resetBall();
    }

    // Score (AI missed)
    if (ball.x + ball.size > canvas.width) {
        playerScore++;
        resetBall();
    }
}

// Main game loop
function gameLoop() {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    drawNet();
    drawScores();
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(ai.x, ai.y, ai.width, ai.height, ai.color);
    drawBall(ball.x, ball.y, ball.size, ball.color);

    // Update game objects
    moveAI();
    moveBall();

    requestAnimationFrame(gameLoop);
}

// Start game
resetBall();
gameLoop();