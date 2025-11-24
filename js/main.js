const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const timeSpan = document.getElementById("time");
const scoreSpan = document.getElementById("score");
const coinSpan = document.getElementById("coinCount");
const livesSpan = document.getElementById("livesView");
const statusSpan = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");

let gameWidth = gameArea.clientWidth;
let gameHeight = gameArea.clientHeight;

// 발판 DOM 목록과 땅 높이 (CSS .ground height와 맞추기)
const platforms = Array.from(document.querySelectorAll(".platform"));
const GROUND_HEIGHT = 60; // style.css의 .ground height 값과 동일해야 합니다

// 플레이어 위치 및 이동 속도
let playerX = 180;
let playerY = 320;
let playerSpeed = 4;

// 중력·점프 관련 변수
let velY = 0;
const GRAVITY = 0.6;
const JUMP_POWER = -11;
let onGround = false;
let jumpPressed = false;

// 좌우 입력
let leftPressed = false;
let rightPressed = false;

// 적, 아이템
let enemies = [];
let items = [];

// 스폰 타이머
let enemySpawnInterval = 800;
let lastEnemySpawn = 0;

let itemSpawnInterval = 2500;
let lastItemSpawn = 0;

// 점수, 코인, 목숨
let score = 0;
let coins = 0;
const maxLives = 3;
let lives = maxLives;

// 시간
let startTime = 0;
let lastTimeStamp = 0;
let isGameOver = false;

// 키 입력 처리
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
        leftPressed = true;
    }
    if (e.key === "ArrowRight") {
        rightPressed = true;
    }

    // 점프: ↑ 또는 Space
    if ((e.key === "ArrowUp" || e.key === " ") && !jumpPressed) {
        jumpPressed = true;
        if (onGround) {
            velY = JUMP_POWER;
            onGround = false;
            player.classList.add("jump");
        }
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") {
        leftPressed = false;
    }
    if (e.key === "ArrowRight") {
        rightPressed = false;
    }
    if (e.key === "ArrowUp" || e.key === " ") {
        jumpPressed = false;
    }
});

// HUD 업데이트
function updateHUD() {
    scoreSpan.textContent = score.toString();
    coinSpan.textContent = coins.toString();
    livesSpan.textContent = "❤".repeat(lives) + " ".repeat(maxLives - lives);
}

// 적 생성
function spawnEnemy() {
    const enemy = document.createElement("div");
    enemy.classList.add("enemy");

    const enemyWidth = 40;
    const randomX = Math.floor(Math.random() * (gameWidth - enemyWidth));

    enemy.style.left = randomX + "px";
    enemy.style.top = "-40px";
    gameArea.appendChild(enemy);

    enemies.push({
        el: enemy,
        x: randomX,
        y: -40,
        speed: 3 + Math.random() * 2,
    });
}

// 아이템 생성
function spawnItem() {
    const item = document.createElement("div");
    item.classList.add("item");

    const type = Math.random() < 0.7 ? "coin" : "heart";
    item.classList.add(type === "coin" ? "item-coin" : "item-heart");

    const itemWidth = 32;
    const randomX = Math.floor(Math.random() * (gameWidth - itemWidth));

    item.style.left = randomX + "px";
    item.style.top = "-32px";
    gameArea.appendChild(item);

    items.push({
        el: item,
        x: randomX,
        y: -32,
        speed: 2 + Math.random() * 1.5,
        type: type,
    });
}

function isColliding(a, b) {
    return !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
    );
}

// 땅·발판 충돌 처리
function applyPlatformCollision() {
    const playerRect = player.getBoundingClientRect();
    const gameRect = gameArea.getBoundingClientRect();

    const playerBottom = playerRect.bottom - gameRect.top;
    const playerTop = playerRect.top - gameRect.top;
    const playerLeft = playerRect.left - gameRect.left;
    const playerRight = playerRect.right - gameRect.left;
    const playerHeight = playerRect.height;

    onGround = false;

    // ground 충돌
    const groundTop = gameHeight - GROUND_HEIGHT;
    if (velY >= 0 && playerBottom >= groundTop && playerTop < groundTop) {
        velY = 0;
        onGround = true;
        playerY = groundTop - playerHeight;
    }

    // 각 발판과 충돌
    platforms.forEach((pf) => {
        const r = pf.getBoundingClientRect();
        const gameR = gameRect;

        const platLeft = r.left - gameR.left;
        const platRight = r.right - gameR.left;
        const platTop = r.top - gameR.top;

        const isInXRange = playerRight > platLeft && playerLeft < platRight;

        if (
            isInXRange &&
            velY >= 0 &&
            playerBottom >= platTop &&
            playerTop < platTop
        ) {
            velY = 0;
            onGround = true;
            playerY = platTop - playerHeight;
        }
    });

    // 착지하면 jump 클래스 제거
    if (onGround) {
        player.classList.remove("jump");
    }
}

// 게임 초기화
function resetGame() {
    enemies.forEach((e) => e.el.remove());
    items.forEach((i) => i.el.remove());
    enemies = [];
    items = [];

    playerX = 180;
    playerY = 320;
    velY = 0;
    onGround = false;
    jumpPressed = false;

    score = 0;
    coins = 0;
    lives = maxLives;
    enemySpawnInterval = 800;
    lastEnemySpawn = 0;
    lastItemSpawn = 0;
    isGameOver = false;
    startTime = 0;
    lastTimeStamp = 0;

    player.style.left = playerX + "px";
    player.style.top = playerY + "px";
    player.classList.remove("walk-left", "walk-right", "jump");

    statusSpan.textContent = "게임 중";
    statusSpan.style.color = "#0066cc";

    updateHUD();
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (isGameOver) return;

    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;
    timeSpan.textContent = elapsed.toFixed(1);

    // 좌우 이동
    if (leftPressed) {
        playerX -= playerSpeed;
        player.classList.remove("walk-right");
        player.classList.add("walk-left");
    } else if (rightPressed) {
        playerX += playerSpeed;
        player.classList.remove("walk-left");
        player.classList.add("walk-right");
    } else {
        // 좌우 키를 떼면 방향 클래스 제거
        player.classList.remove("walk-left", "walk-right");
    }

    // 화면 밖 X축 제한
    const pw = player.clientWidth;
    const ph = player.clientHeight;

    if (playerX < 0) playerX = 0;
    if (playerX > gameWidth - pw) playerX = gameWidth - pw;

    // 중력 적용
    velY += GRAVITY;
    playerY += velY;

    // 땅·발판 충돌 적용
    applyPlatformCollision();

    // Y축 상단 제한
    if (playerY < 0) {
        playerY = 0;
        if (velY < 0) velY = 0;
    }
    // 혹시라도 바닥 아래로 떨어지는 것 방지
    if (playerY > gameHeight - ph) {
        playerY = gameHeight - ph;
        velY = 0;
        onGround = true;
    }

    player.style.left = playerX + "px";
    player.style.top = playerY + "px";

    // 적 스폰
    if (timestamp - lastEnemySpawn > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = timestamp;
    }

    // 아이템 스폰
    if (timestamp - lastItemSpawn > itemSpawnInterval) {
        spawnItem();
        lastItemSpawn = timestamp;
    }

    const gameRect = gameArea.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    const playerBox = {
        left: playerRect.left - gameRect.left,
        right: playerRect.right - gameRect.left,
        top: playerRect.top - gameRect.top,
        bottom: playerRect.bottom - gameRect.top,
    };

    // 적 이동 및 충돌 체크
    const nextEnemies = [];
    enemies.forEach((enemyObj) => {
        enemyObj.y += enemyObj.speed;
        enemyObj.el.style.top = enemyObj.y + "px";

        if (enemyObj.y > gameHeight) {
            enemyObj.el.remove();
            score += 1;
            updateHUD();
            return;
        }

        const rect = enemyObj.el.getBoundingClientRect();
        const box = {
            left: rect.left - gameRect.left,
            right: rect.right - gameRect.left,
            top: rect.top - gameRect.top,
            bottom: rect.bottom - gameRect.top,
        };

        if (isColliding(playerBox, box)) {
            enemyObj.el.remove();
            lives -= 1;
            updateHUD();

            if (lives <= 0) {
                gameOver();
                return;
            }
            return;
        }

        nextEnemies.push(enemyObj);
    });
    enemies = nextEnemies;

    // 아이템 이동 / 충돌
    const nextItems = [];
    items.forEach((itemObj) => {
        itemObj.y += itemObj.speed;
        itemObj.el.style.top = itemObj.y + "px";

        if (itemObj.y > gameHeight) {
            itemObj.el.remove();
            return;
        }

        const rect = itemObj.el.getBoundingClientRect();
        const box = {
            left: rect.left - gameRect.left,
            right: rect.right - gameRect.left,
            top: rect.top - gameRect.top,
            bottom: rect.bottom - gameRect.top,
        };

        if (isColliding(playerBox, box)) {
            if (itemObj.type === "coin") {
                coins++;
            } else if (itemObj.type === "heart" && lives < maxLives) {
                lives++;
            }

            itemObj.el.remove();
            updateHUD();
            return;
        }

        nextItems.push(itemObj);
    });
    items = nextItems;

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    isGameOver = true;
    statusSpan.textContent = "게임 오버";
    statusSpan.style.color = "#e74c3c";
}

restartBtn.addEventListener("click", resetGame);

resetGame();
