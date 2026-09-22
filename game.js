/*
    CONSOLE DEFENDER
    GitHub Pages용 게임

    실제 운영체제 명령은 실행하지 않습니다.
    모든 명령어는 게임 내부 스킬로 처리됩니다.
*/

const $ = selector => document.querySelector(selector);

const arena = $("#arena");
const enemiesBox = $("#enemies");
const effectsBox = $("#effects");
const commandInput = $("#commandInput");
const terminal = $("#terminalOutput");

const state = {

    running: false,

    wave: 1,

    hp: 100,

    score: 0,

    kills: 0,

    spawned: 0,

    alive: 0,

    waveKills: 0,

    waveGoal: 8,

    spawnTimer: 0,

    lastTime: 0,

    commandHistory: [],

    historyIndex: 0,

    mouseX: 300,

    mouseY: 200,

    unlocked: new Set([
        "delete"
    ]),

    upgrades: {}

};


/* =====================================
   명령어 데이터
===================================== */

const COMMANDS = {

    delete: {
        damage: 38,
        cooldown: 420,
        area: 0,
        description: "마우스 위치에 삭제 공격"
    },

    del: {
        damage: 38,
        cooldown: 260,
        area: 0,
        description: "DELETE의 단축 명령"
    },

    copy: {
        damage: 22,
        cooldown: 700,
        area: 55,
        description: "데이터 복사 폭발"
    },

    move: {
        damage: 15,
        cooldown: 700,
        area: 65,
        description: "바이러스를 밀어냄"
    },

    rename: {
        damage: 32,
        cooldown: 550,
        area: 30,
        description: "프로세스 이름 변경 공격"
    },

    cls: {
        damage: 15,
        cooldown: 1400,
        area: 9999,
        description: "화면 전체 정리"
    },

    dir: {
        damage: 12,
        cooldown: 900,
        area: 90,
        description: "주변 바이러스 검색"
    },

    cd: {
        damage: 28,
        cooldown: 800,
        area: 65,
        description: "디렉터리 이동 충격파"
    },

    echo: {
        damage: 19,
        cooldown: 550,
        area: 75,
        description: "반향파 공격"
    },

    type: {
        damage: 30,
        cooldown: 600,
        area: 30,
        description: "파일 내용 소각"
    },

    ping: {
        damage: 25,
        cooldown: 450,
        area: 35,
        description: "추적 패킷 공격"
    },

    taskkill: {
        damage: 75,
        cooldown: 1150,
        area: 0,
        description: "프로세스 강제 종료"
    },

    shutdown: {
        damage: 110,
        cooldown: 2400,
        area: 130,
        description: "시스템 종료 폭발"
    },

    restart: {
        damage: 60,
        cooldown: 1600,
        area: 105,
        description: "재시작 충격파"
    },

    ipconfig: {
        damage: 23,
        cooldown: 500,
        area: 50,
        description: "네트워크 전기 공격"
    },

    netstat: {
        damage: 17,
        cooldown: 450,
        area: 35,
        description: "연결된 바이러스 연쇄 공격"
    },

    tracert: {
        damage: 34,
        cooldown: 700,
        area: 15,
        description: "경로 추적 관통탄"
    },

    format: {
        damage: 170,
        cooldown: 4200,
        area: 190,
        description: "대형 디스크 포맷 공격"
    },

    attrib: {
        damage: 48,
        cooldown: 900,
        area: 25,
        description: "바이러스 속성 제거"
    },

    whoami: {
        damage: 52,
        cooldown: 1000,
        area: 50,
        description: "관리자 권한 공격"
    }

};


/* =====================================
   별칭
===================================== */

const ALIASES = {

    del: "del",
    ren: "rename",
    kill: "taskkill",
    ip: "ipconfig",
    trace: "tracert"

};


/* =====================================
   로그
===================================== */

function log(message, type = "") {

    const line = document.createElement("div");

    line.className = type;

    line.innerHTML = message;

    terminal.appendChild(line);

    terminal.scrollTop =
        terminal.scrollHeight;

}


function commandLog(command) {

    log(
        `<span class="command-line">C:\\&gt; ${command}</span>`
    );

}


/* =====================================
   마우스
===================================== */

document.addEventListener(
    "mousemove",
    event => {

        const rect =
            arena.getBoundingClientRect();

        state.mouseX =
            event.clientX - rect.left;

        state.mouseY =
            event.clientY - rect.top;

    }
);


/* =====================================
   적 생성
===================================== */

function spawnEnemy() {

    if (!state.running)
        return;

    if (state.spawned >= state.waveGoal)
        return;

    const rect =
        arena.getBoundingClientRect();

    let x;
    let y;

    const side =
        Math.floor(Math.random() * 3);

    if (side === 0) {

        x = -40;
        y = Math.random() * rect.height;

    } else if (side === 1) {

        x = rect.width + 40;
        y = Math.random() * rect.height;

    } else {

        x = Math.random() * rect.width;
        y = -40;

    }

    const boss =
        state.wave % 5 === 0 &&
        state.spawned === 0;

    const element =
        document.createElement("div");

    element.className =
        boss
            ? "enemy boss"
            : "enemy";

    element.style.left =
        `${x}px`;

    element.style.top =
        `${y}px`;

    enemiesBox.appendChild(element);

    const hp =
        boss
            ? 400 + state.wave * 40
            : 60 + state.wave * 18;

    const enemy = {

        element,

        x,

        y,

        hp,

        maxHp: hp,

        speed:
            boss
                ? 13
                : 25 + state.wave * 2 + Math.random() * 12,

        dead: false

    };

    element.enemyData = enemy;

    state.spawned++;

    state.alive++;

}


/* =====================================
   적 목록
===================================== */

function getEnemies() {

    return [

        ...enemiesBox.children

    ]

    .map(element =>
        element.enemyData
    )

    .filter(Boolean);

}


/* =====================================
   적 피해
===================================== */

function damageEnemy(enemy, damage) {

    if (!enemy || enemy.dead)
        return;

    enemy.hp -= damage;

    enemy.element.classList.add("hit");

    setTimeout(
        () => enemy.element.classList.remove("hit"),
        80
    );

    if (enemy.hp <= 0) {

        enemy.dead = true;

        enemy.element.classList.add("dead");

        state.score +=
            100 + state.wave * 20;

        state.kills++;

        state.waveKills++;

        state.alive--;

        setTimeout(
            () => enemy.element.remove(),
            250
        );

    }

}


/* =====================================
   공격 이펙트
===================================== */

function createRing(x, y, size = 20) {

    const ring =
        document.createElement("div");

    ring.className =
        "attack-ring";

    ring.style.left =
        `${x}px`;

    ring.style.top =
        `${y}px`;

    ring.style.width =
        `${size}px`;

    ring.style.height =
        `${size}px`;

    effectsBox.appendChild(ring);

    setTimeout(
        () => ring.remove(),
        400
    );

}


/* =====================================
   명령어 공격
===================================== */

function executeAttack(name) {

    const command =
        COMMANDS[name];

    if (!command)
        return;

    let upgrade =
        state.upgrades[name] || {};

    const damage =
        command.damage *
        (upgrade.damageMultiplier || 1);

    let area =
        upgrade.area ??
        command.area;

    const x =
        state.mouseX;

    const y =
        state.mouseY;

    const enemies =
        getEnemies();

    const targets =
        enemies.filter(enemy => {

            if (enemy.dead)
                return false;

            const distance =
                Math.hypot(
                    enemy.x - x,
                    enemy.y - y
                );

            return distance <=
                Math.max(
                    area || 45,
                    45
                );

        });

    /* DELETE */

    if (name === "delete") {

        const target =
            targets.sort(
                (a, b) =>
                    Math.hypot(
                        a.x - x,
                        a.y - y
                    ) -
                    Math.hypot(
                        b.x - x,
                        b.y - y
                    )
            )[0];

        if (target)
            damageEnemy(target, damage);

    }

    /* DEL */

    else if (name === "del") {

        targets
            .slice(0, 2)
            .forEach(
                enemy =>
                    damageEnemy(enemy, damage)
            );

    }

    /* MOVE */

    else if (name === "move") {

        targets.forEach(enemy => {

            damageEnemy(
                enemy,
                damage
            );

            const dx =
                enemy.x - x;

            const dy =
                enemy.y - y;

            const distance =
                Math.max(
                    Math.hypot(dx, dy),
                    1
                );

            enemy.x +=
                dx / distance * 100;

            enemy.y +=
                dy / distance * 100;

        });

    }

    /* CLS */

    else if (name === "cls") {

        enemies.forEach(
            enemy =>
                damageEnemy(
                    enemy,
                    damage
                )
        );

    }

    /* 일반 범위 공격 */

    else {

        targets.forEach(
            enemy =>
                damageEnemy(
                    enemy,
                    damage
                )
        );

    }

    createRing(
        x,
        y,
        area > 200
            ? 40
            : Math.max(area, 25)
    );

}


/* =====================================
   명령 실행
===================================== */

function executeCommand(input) {

    const raw =
        input.trim();

    if (!raw)
        return;

    commandLog(raw);

    const parts =
        raw.toLowerCase()
            .split(/\s+/);

    let command =
        parts[0];


    /* HELP */

    if (command === "help") {

        log(
            "사용 가능한 명령어:",
            "good"
        );

        log(
            [...state.unlocked].join("   "),
            "good"
        );

        return;

    }


    /* STATUS */

    if (command === "status") {

        log(
            `WAVE ${state.wave} | CPU ${Math.ceil(state.hp)} | SCORE ${state.score} | KILLS ${state.kills}`,
            "good"
        );

        return;

    }


    /* VERSION */

    if (
        command === "ver" ||
        command === "version"
    ) {

        log(
            "CONSOLE DEFENDER v2.0 // GITHUB PAGES",
            "good"
        );

        return;

    }


    /* CLEAR */

    if (
        command === "clear" ||
        command === "clslog"
    ) {

        terminal.innerHTML = "";

        return;

    }


    /* 별칭 */

    if (ALIASES[command])
        command = ALIASES[command];


    /* 존재하지 않는 명령 */

    if (!COMMANDS[command]) {

        log(
            `'${parts[0]}'은(는) 내부 또는 외부 명령이 아닙니다.`,
            "error"
        );

        return;

    }


    /* 잠김 */

    if (!state.unlocked.has(command)) {

        log(
            `${command}: ACCESS DENIED`,
            "error"
        );

        log(
            "업그레이드에서 해당 명령을 해금하십시오.",
            "dim"
        );

        return;

    }


    /* 쿨다운 */

    const now =
        performance.now();

    const upgrade =
        state.upgrades[command] || {};

    const cooldown =
        upgrade.cooldown ??
        COMMANDS[command].cooldown;

    const last =
        upgrade.lastUsed || 0;

    if (
        now - last <
        cooldown
    ) {

        log(
            `${command}: PROCESS BUSY`,
            "dim"
        );

        return;

    }

    upgrade.lastUsed = now;

    state.upgrades[command] =
        upgrade;


    /* 공격 */

    executeAttack(command);

    log(
        `${command.toUpperCase()} → EXECUTED`,
        "good"
    );

}


/* =====================================
   입력
===================================== */

$("#commandForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const value =
                commandInput.value.trim();

            if (!value)
                return;

            state.commandHistory.push(
                value
            );

            state.historyIndex =
                state.commandHistory.length;

            executeCommand(value);

            commandInput.value = "";

        }
    );


commandInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "ArrowUp"
        ) {

            event.preventDefault();

            state.historyIndex =
                Math.max(
                    0,
                    state.historyIndex - 1
                );

            commandInput.value =
                state.commandHistory[
                    state.historyIndex
                ] || "";

        }


        if (
            event.key === "ArrowDown"
        ) {

            event.preventDefault();

            state.historyIndex =
                Math.min(
                    state.commandHistory.length,
                    state.historyIndex + 1
                );

            commandInput.value =
                state.commandHistory[
                    state.historyIndex
                ] || "";

        }

    }
);


/* =====================================
   업그레이드 카드
===================================== */

const upgradePool = [

    {
        type: "UNLOCK",
        title: "DEL",
        description:
            "DELETE를 DEL로 줄여 입력할 수 있습니다. 더 빠르게 공격합니다.",

        apply() {

            state.unlocked.add("del");

            state.upgrades.del = {

                cooldown: 260,

                damageMultiplier: 1

            };

        }

    },

    {
        type: "UNLOCK",
        title: "PING",
        description:
            "추적 패킷을 발사합니다. 빠르고 정확한 공격입니다.",

        apply() {

            state.unlocked.add("ping");

        }

    },

    {
        type: "UNLOCK",
        title: "COPY",
        description:
            "복사 데이터 폭발로 주변의 바이러스를 공격합니다.",

        apply() {

            state.unlocked.add("copy");

        }

    },

    {
        type: "UNLOCK",
        title: "TASKKILL",
        description:
            "프로세스를 강제로 종료시키는 강력한 단일 공격입니다.",

        apply() {

            state.unlocked.add("taskkill");

        }

    },

    {
        type: "UNLOCK",
        title: "SHUTDOWN",
        description:
            "매우 강력한 시스템 종료 폭발을 사용합니다.",

        apply() {

            state.unlocked.add("shutdown");

        }

    },

    {
        type: "UNLOCK",
        title: "FORMAT",
        description:
            "거대한 범위의 디스크 포맷 공격을 해금합니다.",

        apply() {

            state.unlocked.add("format");

        }

    },

    {
        type: "UPGRADE",
        title: "DELETE: AREA",
        description:
            "DELETE가 단일 적 대신 범위 공격을 합니다.",

        apply() {

            const upgrade =
                state.upgrades.delete || {};

            upgrade.area =
                Math.max(
                    upgrade.area || 0,
                    90
                );

            state.upgrades.delete =
                upgrade;

        }

    },

    {
        type: "UPGRADE",
        title: "DELETE: DAMAGE",
        description:
            "DELETE의 공격력이 40% 증가합니다.",

        apply() {

            const upgrade =
                state.upgrades.delete || {};

            upgrade.damageMultiplier =
                (upgrade.damageMultiplier || 1)
                * 1.4;

            state.upgrades.delete =
                upgrade;

        }

    },

    {
        type: "UPGRADE",
        title: "SYSTEM SPEED",
        description:
            "해금된 모든 명령어의 쿨다운을 20% 감소시킵니다.",

        apply() {

            state.unlocked.forEach(
                command => {

                    const upgrade =
                        state.upgrades[command]
                        || {};

                    upgrade.cooldown =
                        (
                            upgrade.cooldown
                            ??
                            COMMANDS[command].cooldown
                        ) * .8;

                    state.upgrades[command] =
                        upgrade;

                }
            );

        }

    },

    {
        type: "UPGRADE",
        title: "ADMIN MODE",
        description:
            "해금된 모든 명령어의 공격력이 증가합니다.",

        apply() {

            state.unlocked.forEach(
                command => {

                    const upgrade =
                        state.upgrades[command]
                        || {};

                    upgrade.damageMultiplier =
                        (
                            upgrade.damageMultiplier
                            || 1
                        ) * 1.2;

                    state.upgrades[command] =
                        upgrade;

                }
            );

        }

    }

];


/* =====================================
   업그레이드 화면
===================================== */

function showUpgradeScreen() {

    state.running = false;

    $("#upgradeScreen")
        .classList.remove("hidden");

    $("#upgradeInfo").textContent =
        `WAVE ${state.wave} CLEARED — 다음 웨이브를 준비하십시오.`;

    const container =
        $("#upgradeCards");

    container.innerHTML = "";

    const cards =
        [...upgradePool]
            .sort(
                () => Math.random() - .5
            )
            .slice(0, 3);

    cards.forEach(card => {

        const element =
            document.createElement("div");

        element.className =
            "upgrade-card";

        element.innerHTML = `

            <div class="card-type">
                ${card.type}
            </div>

            <h3>
                ${card.title}
            </h3>

            <p>
                ${card.description}
            </p>

        `;

        element.onclick = () => {

            card.apply();

            log(
                `UPGRADE INSTALLED: ${card.title}`,
                "good"
            );

            $("#upgradeScreen")
                .classList.add("hidden");

            nextWave();

        };

        container.appendChild(element);

    });

}


/* =====================================
   다음 웨이브
===================================== */

function nextWave() {

    state.wave++;

    state.spawned = 0;

    state.alive = 0;

    state.waveKills = 0;

    state.waveGoal =
        7 + state.wave * 2;

    state.spawnTimer = 0;

    state.running = true;

    $("#wave").textContent =
        `WAVE ${state.wave}`;

    log(
        `===== WAVE ${state.wave} START =====`,
        "good"
    );

}


/* =====================================
   게임 오버
===================================== */

function gameOver() {

    state.running = false;

    $("#finalScore").textContent =
        state.score;

    $("#gameOverScreen")
        .classList.remove("hidden");

}


/* =====================================
   게임 초기화
===================================== */

function restartGame() {

    location.reload();

}


/* =====================================
   시작
===================================== */

$("#startButton").onclick = () => {

    $("#startScreen")
        .classList.add("hidden");

    state.running = true;

    log(
        "===== SYSTEM ONLINE =====",
        "good"
    );

    log(
        "VIRUS INCOMING...",
        "error"
    );

    commandInput.focus();

};


/* =====================================
   재시작
===================================== */

$("#restartButton").onclick =
    restartGame;


/* =====================================
   로그 삭제
===================================== */

$("#clearLog").onclick = () => {

    terminal.innerHTML = "";

};


/* =====================================
   적 이동 + 게임 루프
===================================== */

function gameLoop(time) {

    const delta =
        Math.min(
            .04,
            (time - state.lastTime) / 1000 || 0
        );

    state.lastTime = time;


    if (state.running) {

        state.spawnTimer -= delta;


        /* 적 생성 */

        if (
            state.spawned <
            state.waveGoal &&
            state.spawnTimer <= 0
        ) {

            spawnEnemy();

            state.spawnTimer =
                Math.max(
                    .32,
                    1.05 -
                    state.wave * .04
                );

        }


        const rect =
            arena.getBoundingClientRect();


        /* 적 이동 */

        getEnemies().forEach(
            enemy => {

                if (enemy.dead)
                    return;


                const targetX =
                    rect.width - 130;

                const targetY =
                    rect.height / 2;


                const dx =
                    targetX - enemy.x;

                const dy =
                    targetY - enemy.y;

                const distance =
                    Math.max(
                        Math.hypot(dx, dy),
                        1
                    );


                enemy.x +=
                    dx / distance *
                    enemy.speed *
                    delta;

                enemy.y +=
                    dy / distance *
                    enemy.speed *
                    delta;


                enemy.element.style.left =
                    `${enemy.x}px`;

                enemy.element.style.top =
                    `${enemy.y}px`;


                /* 컴퓨터 도달 */

                if (distance < 38) {

                    enemy.dead = true;

                    enemy.element.remove();

                    state.alive--;

                    state.hp -=
                        enemy.maxHp > 200
                            ? 25
                            : 12 + state.wave * 1.5;

                }

            }
        );


        /* HUD */

        state.hp =
            Math.max(
                0,
                state.hp
            );

        $("#healthBar").style.width =
            `${state.hp}%`;

        $("#healthText").textContent =
            Math.ceil(state.hp);

        $("#score").textContent =
            state.score;

        $("#kills").textContent =
            state.kills;


        /* 게임 오버 */

        if (state.hp <= 0) {

            gameOver();

        }


        /* 웨이브 클리어 */

        if (
            state.spawned >= state.waveGoal &&
            state.alive <= 0
        ) {

            showUpgradeScreen();

        }

    }


    requestAnimationFrame(
        gameLoop
    );

}


requestAnimationFrame(
    gameLoop
);
