// js/main.js

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
let currentWorld = 1; // 1 = grass, 2 = ice

// 플레이어 위치
let playerX = 180;
let playerY = 520;
let playerSpeed = 5;

// 키 입력 상태
let leftPressed = false;
let rightPressed = false;
let upPressed = false;
let downPressed = false;

// 적, 아이템
let enemies = [];
let items = [];

// 스폰 타이밍
let enemySpawnInterval = 800;
let lastEnemySpawn = 0;

let itemSpawnInterval = 2500; // 2.5초마다 한 번 정도
let lastItemSpawn = 0;

// 난이도 보정
let globalSpeedBonus = 0;

// 점수, 시간, 하트, 코인
let score = 0;
let coins = 0;
const maxLives = 3;
let lives = maxLives;

let startTime = 0;
let lastTimeStamp = 0;
let isGameOver = false;

// 키보드 이벤트
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") leftPressed = true;
    if (e.key === "ArrowRight") rightPressed = true;
    if (e.key === "ArrowUp") upPressed = true;
    if (e.key === "ArrowDown") downPressed = true;
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") leftPressed = false;
    if (e.key === "ArrowRight") rightPressed = false;
    if (e.key === "ArrowUp") upPressed = false;
    if (e.key === "ArrowDown") downPressed = false;
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
    const maxX = gameWidth - enemyWidth;
    const randomX = Math.floor(Math.random() * (maxX + 1));

    enemy.style.left = randomX + "px";
    enemy.style.top = "-40px";
    gameArea.appendChild(enemy);

    enemies.push({
        el: enemy,
        x: randomX,
        y: -40,
        speed: 3 + Math.random() * 2 + globalSpeedBonus,
    });
}

// 아이템 생성 (코인, 하트 랜덤)
function spawnItem() {
    const item = document.createElement("div");
    item.classList.add("item");

    const type = Math.random() < 0.7 ? "coin" : "heart"; // 70% 코인, 30% 하트
    if (type === "coin") {
        item.classList.add("item-coin");
    } else {
        item.classList.add("item-heart");
    }

    const itemWidth = 32;
    const maxX = gameWidth - itemWidth;
    const randomX = Math.floor(Math.random() * (maxX + 1));

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

// 사각형 충돌 체크
function isColliding(a, b) {
    return !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
    );
}

// 월드 전환 체크 (월드1 -> 월드2)
function checkWorldChange() {
    // 예시: 점수 20 이상이면 얼음 월드로 변경
    if (currentWorld === 1 && score >= 20) {
        currentWorld = 2;
        gameArea.classList.remove("world1");
        gameArea.classList.add("world2");
        statusSpan.textContent = "월드 2 ❄ 얼음 스테이지";
    }
}

// 게임 초기화
function resetGame() {
    enemies.forEach((e) => e.el.remove());
    items.forEach((i) => i.el.remove());
    enemies = [];
    items = [];

    playerX = 180;
    playerY = 520;
    score = 0;
    coins = 0;
    lives = maxLives;
    enemySpawnInterval = 800;
    lastEnemySpawn = 0;
    lastItemSpawn = 0;
    globalSpeedBonus = 0;
    isGameOver = false;
    startTime = 0;
    lastTimeStamp = 0;

    // 월드1으로 초기화
    currentWorld = 1;
    gameArea.classList.remove("world2");
    gameArea.classList.add("world1");

    player.style.left = playerX + "px";
    player.style.top = playerY + "px";
    statusSpan.textContent = "게임 중";
    statusSpan.style.color = "#0066cc";

    updateHUD();
    requestAnimationFrame(gameLoop);
}

// 메인 루프
function gameLoop(timestamp) {
    if (isGameOver) return;

    if (!startTime) startTime = timestamp;
    const delta = timestamp - lastTimeStamp;
    lastTimeStamp = timestamp;

    const elapsed = (timestamp - startTime) / 1000;
    timeSpan.textContent = elapsed.toFixed(1);

    // 난이도: 시간이 지날수록 빠르게
    enemySpawnInterval = 800 - Math.min(500, elapsed * 20);
    globalSpeedBonus = Math.min(3, elapsed / 10);

    // 플레이어 이동
    if (leftPressed) playerX -= playerSpeed;
    if (rightPressed) playerX += playerSpeed;
    if (upPressed) playerY -= playerSpeed;
    if (downPressed) playerY += playerSpeed;

    const playerWidth = player.clientWidth;
    const playerHeight = player.clientHeight;
    if (playerX < 0) playerX = 0;
    if (playerX > gameWidth - playerWidth) playerX = gameWidth - playerWidth;
    if (playerY < 0) playerY = 0;
    if (playerY > gameHeight - playerHeight) {
        playerY = gameHeight - playerHeight;
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

    // 적 이동 및 충돌
    const nextEnemies = [];
    enemies.forEach((enemyObj) => {
        enemyObj.y += enemyObj.speed;
        enemyObj.el.style.top = enemyObj.y + "px";

        if (enemyObj.y > gameHeight) {
            enemyObj.el.remove();
            score += 1; // 화면 밖으로 나가면 점수
            updateHUD();
            return;
        }

        const enemyRect = enemyObj.el.getBoundingClientRect();
        const enemyBox = {
            left: enemyRect.left - gameRect.left,
            right: enemyRect.right - gameRect.left,
            top: enemyRect.top - gameRect.top,
            bottom: enemyRect.bottom - gameRect.top,
        };

        if (isColliding(playerBox, enemyBox)) {
            enemyObj.el.remove();
            lives -= 1;
            if (lives < 0) lives = 0;
            updateHUD();

            if (lives === 0) {
                gameOver();
                return;
            }
            return;
        }

        nextEnemies.push(enemyObj);
    });
    enemies = nextEnemies;

    // 아이템 이동 및 충돌
    const nextItems = [];
    items.forEach((itemObj) => {
        itemObj.y += itemObj.speed;
        itemObj.el.style.top = itemObj.y + "px";

        if (itemObj.y > gameHeight) {
            itemObj.el.remove();
            return;
        }

        const itemRect = itemObj.el.getBoundingClientRect();
        const itemBox = {
            left: itemRect.left - gameRect.left,
            right: itemRect.right - gameRect.left,
            top: itemRect.top - gameRect.top,
            bottom: itemRect.bottom - gameRect.top,
        };

        if (isColliding(playerBox, itemBox)) {
            if (itemObj.type === "coin") {
                coins += 1;
            } else if (itemObj.type === "heart") {
                if (lives < maxLives) {
                    lives += 1;
                }
            }
            itemObj.el.remove();
            updateHUD();
            return;
        }

        nextItems.push(itemObj);
    });
    items = nextItems;

    // 점수에 따라 월드 전환
    checkWorldChange();

    if (!isGameOver) requestAnimationFrame(gameLoop);
}

function gameOver() {
    isGameOver = true;
    statusSpan.textContent = "게임 오버";
    statusSpan.style.color = "#e74c3c";
}

restartBtn.addEventListener("click", () => {
    resetGame();
});

// 게임 시작
resetGame();
