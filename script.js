const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const healthEl = document.getElementById("health");
const moneyEl = document.getElementById("money");
const arrowsEl = document.getElementById("arrows");
const levelEl = document.getElementById("level");
const bowStatusEl = document.getElementById("bowStatus");
const dogStatusEl = document.getElementById("dogStatus");

const bossHud = document.getElementById("bossHud");
const bossFill = document.getElementById("bossFill");
const bossHp = document.getElementById("bossHp");
const shopEl = document.getElementById("shop");
const startEl = document.getElementById("start");

document.getElementById("buyBow").onclick = () => {
  if (!player.hasBow && money >= 40) {
    money -= 40;
    player.hasBow = true;
    player.arrows += 10;
    updateHud();
  }
};

document.getElementById("buyArrows").onclick = () => {
  if (player.hasBow && money >= 20) {
    money -= 20;
    player.arrows += 5;
    updateHud();
  }
};

document.getElementById("closeShop").onclick = () => toggleShop(false);

let W = 0;
let H = 0;
let DPR = 1;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 4);
  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}
window.addEventListener("resize", resize);
resize();

const keys = {};
const pressed = {};

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  pressed[k] = true;

  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

let running = false;
let shopOpen = false;
let gameEnded = false;
let cameraX = 0;
let bgOffset = 0;

let level = 1;
let money = 0;
let worldWidth = 3600;

let swordCooldown = 0;
let arrowCooldown = 0;
let rollCooldown = 0;

const gravity = 0.62;

const player = {
  x: 100,
  y: 200,
  w: 48,
  h: 86,
  vx: 0,
  vy: 0,
  speed: 5.9,
  jump: -15.2,
  onGround: false,
  direction: 1,
  health: 100,
  hasBow: false,
  arrows: 0,
  jumpsLeft: 2,
  rolling: false,
  rollTimer: 0,
  invincibleTimer: 0,
  hasDog: false
};

const dog = {
  x: 60,
  y: 0,
  w: 70,
  h: 48,
  attackCooldown: 0
};

let zombies = [];
let coins = [];
let arrows = [];
let pits = [];
let spikes = [];
let platforms = [];

const boss = {
  active: false,
  dead: false,
  x: 3000,
  y: 330,
  w: 230,
  h: 155,
  health: 5000,
  maxHealth: 5000,
  frame: 0,
  timer: 0,
  phase: 0,
  cooldown: 0,
  fireballs: []
};

function startGame() {
  startEl.style.display = "none";
  running = true;
  resetLevel(1);
  requestAnimationFrame(loop);
}

function groundY() {
  return H * 0.80;
}

function resetLevel(num) {
  level = num;
  worldWidth = num < 3 ? 3100 : 4000;

  player.x = 100;
  player.y = groundY() - player.h;
  player.vx = 0;
  player.vy = 0;
  player.jumpsLeft = 2;
  player.rolling = false;
  player.rollTimer = 0;

  zombies = [];
  coins = [];
  arrows = [];
  pits = [];
  spikes = [];
  platforms = [];

  boss.active = false;
  boss.dead = false;
  boss.health = boss.maxHealth;
  boss.x = worldWidth - 680;
  boss.y = groundY() - 310;
  boss.fireballs = [];

  createLevel(num);
  updateHud();
}

function createLevel(num) {
  const gy = groundY();

  for (let i = 0; i < 7 + num * 3; i++) {
    zombies.push({
      x: 520 + i * 230,
      y: gy - 72,
      w: 50,
      h: 72,
      vx: i % 2 === 0 ? 1.05 : -1.05,
      health: 100 + num * 35,
      dead: false
    });
  }

  coins = [
    { x: 280, y: gy - 130, r: 13, taken: false },
    { x: 430, y: gy - 155, r: 13, taken: false },
    { x: 650, y: gy - 210, r: 13, taken: false },
    { x: 960, y: gy - 150, r: 13, taken: false },
    { x: 1250, y: gy - 220, r: 13, taken: false },
    { x: 1550, y: gy - 150, r: 13, taken: false },
    { x: 1820, y: gy - 220, r: 13, taken: false },
    { x: 2140, y: gy - 150, r: 13, taken: false },
    { x: 2480, y: gy - 205, r: 13, taken: false },
    { x: 2790, y: gy - 135, r: 13, taken: false }
  ];

  pits = [
    { x: 770, w: 135 },
    { x: 1460, w: 170 },
    { x: 2240, w: 150 }
  ];

  if (num >= 2) {
    pits.push({ x: 2660, w: 185 });
  }

  spikes = [
    { x: 1010, y: gy - 27, w: 120, h: 27 },
    { x: 1760, y: gy - 27, w: 150, h: 27 }
  ];

  if (num >= 2) {
    spikes.push({ x: 2380, y: gy - 27, w: 165, h: 27 });
  }

  platforms = [
    { x: 610, y: gy - 145, w: 180, h: 20 },
    { x: 1170, y: gy - 180, w: 210, h: 20 },
    { x: 1660, y: gy - 155, w: 190, h: 20 },
    { x: 2440, y: gy - 165, w: 220, h: 20 }
  ];

  if (num === 3) {
    boss.active = true;
    zombies.push(
      { x: worldWidth - 1160, y: gy - 72, w: 50, h: 72, vx: 1, health: 190, dead: false },
      { x: worldWidth - 980, y: gy - 72, w: 50, h: 72, vx: -1, health: 190, dead: false }
    );
  }
}

function rects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function once(k) {
  if (pressed[k]) {
    pressed[k] = false;
    return true;
  }
  return false;
}

function toggleShop(open) {
  shopOpen = open;
  shopEl.style.display = shopOpen ? "block" : "none";
}

function update() {
  if (!running || gameEnded) return;

  if (once("b") || once("ב")) toggleShop(!shopOpen);

  if (shopOpen) {
    updateHud();
    return;
  }

  bgOffset += 0.18;

  if (swordCooldown > 0) swordCooldown--;
  if (arrowCooldown > 0) arrowCooldown--;
  if (rollCooldown > 0) rollCooldown--;
  if (player.invincibleTimer > 0) player.invincibleTimer--;
  if (dog.attackCooldown > 0) dog.attackCooldown--;

  player.vx = 0;

  if (!player.rolling) {
    if (keys["arrowright"] || keys["d"]) {
      player.vx = player.speed;
      player.direction = 1;
    }

    if (keys["arrowleft"] || keys["a"]) {
      player.vx = -player.speed;
      player.direction = -1;
    }
  }

  if ((once(" ") || once("arrowup") || once("w")) && player.jumpsLeft > 0) {
    player.vy = player.jump;
    player.onGround = false;
    player.jumpsLeft--;
  }

  if ((once("r") || once("ר")) && rollCooldown <= 0) startRoll();

  if ((keys["x"] || keys["ס"]) && swordCooldown <= 0) swordAttack();

  if (
    (keys["v"] || keys["ה"]) &&
    arrowCooldown <= 0 &&
    player.hasBow &&
    player.arrows > 0
  ) {
    shootArrow();
  }

  updateRoll();

  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  const gy = groundY();
  player.onGround = false;

  if (player.y + player.h > gy) {
    player.y = gy - player.h;
    player.vy = 0;
    player.onGround = true;
    player.jumpsLeft = 2;
  }

  for (const p of platforms) {
    const falling = player.vy >= 0;
    const above = player.y + player.h <= p.y + player.vy + 8;

    if (falling && above && rects(player, p)) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.jumpsLeft = 2;
    }
  }

  player.x = Math.max(0, Math.min(player.x, worldWidth - player.w));

  checkPits();
  checkSpikes();
  updateZombies();
  updateArrows();
  updateCoins();

  if (player.hasDog) updateDog();

  if (boss.active && !boss.dead) updateBoss();

  cameraX = player.x - W * 0.38;
  cameraX = Math.max(0, Math.min(cameraX, worldWidth - W));

  if (player.x > worldWidth - 140 && level < 3) resetLevel(level + 1);

  if (player.health <= 0) endGame("הפסדת! הילד האחרון בעולם נפל בקרב 💀");

  updateHud();
}

function startRoll() {
  player.rolling = true;
  player.rollTimer = 18;
  player.invincibleTimer = 22;
  rollCooldown = 45;
  player.vx = player.direction * 11;
}

function updateRoll() {
  if (!player.rolling) return;

  player.rollTimer--;
  player.vx = player.direction * 11;

  if (player.rollTimer <= 0) player.rolling = false;
}

function checkPits() {
  const gy = groundY();

  for (const p of pits) {
    const overPit =
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.y + player.h >= gy - 4;

    if (overPit) {
      player.health = 0;
      endGame("נפלת לבור. המשחק נגמר 🕳️");
    }
  }
}

function checkSpikes() {
  if (player.invincibleTimer > 0) return;

  for (const s of spikes) {
    if (rects(player, s)) {
      player.health -= 20;
      player.invincibleTimer = 35;
      player.vx = -player.direction * 8;
      player.vy = -8;
    }
  }
}

function swordAttack() {
  swordCooldown = 18;

  const hit = {
    x: player.direction === 1 ? player.x + 34 : player.x - 72,
    y: player.y + 20,
    w: 82,
    h: 55
  };

  for (const z of zombies) {
    if (!z.dead && rects(hit, z)) {
      z.health -= 135;
      if (z.health <= 0) {
        z.dead = true;
        money += 15;
      }
    }
  }

  if (boss.active && !boss.dead && rects(hit, boss)) boss.health -= 100;
}

function shootArrow() {
  arrowCooldown = 18;
  player.arrows--;

  arrows.push({
    x: player.direction === 1 ? player.x + 48 : player.x - 20,
    y: player.y + 34,
    w: 46,
    h: 7,
    vx: player.direction * 13.5,
    remove: false
  });
}

function updateZombies() {
  for (const z of zombies) {
    if (z.dead) continue;

    z.x += z.vx;

    if (z.x < 350 || z.x > worldWidth - 400) z.vx *= -1;

    for (const p of pits) {
      if (z.x > p.x - 30 && z.x < p.x + p.w + 30) z.vx *= -1;
    }

    if (Math.random() < 0.01) z.vx *= -1;

    if (rects(player, z) && player.invincibleTimer <= 0) {
      player.health -= player.rolling ? 0 : 9;
      player.invincibleTimer = 35;
      player.x -= player.direction * 18;
      player.vy = -6;
    }
  }
}

function updateDog() {
  dog.x += (player.x - 85 - dog.x) * 0.08;
  dog.y += (player.y + 34 - dog.y) * 0.08;

  let target = null;

  for (const z of zombies) {
    if (!z.dead && Math.abs(z.x - dog.x) < 220) {
      target = z;
      break;
    }
  }

  if (!target && boss.active && !boss.dead && Math.abs(boss.x - dog.x) < 320) {
    target = boss;
  }

  if (target && dog.attackCooldown <= 0) {
    target.health -= target === boss ? 45 : 80;
    dog.attackCooldown = 35;

    if (target !== boss && target.health <= 0) {
      target.dead = true;
      money += 10;
    }
  }
}

function updateArrows() {
  for (const a of arrows) {
    a.x += a.vx;

    for (const z of zombies) {
      if (!z.dead && rects(a, z)) {
        z.health -= 90;
        a.remove = true;
        if (z.health <= 0) {
          z.dead = true;
          money += 10;
        }
      }
    }

    if (boss.active && !boss.dead && rects(a, boss)) {
      boss.health -= 80;
      a.remove = true;
    }
  }

  arrows = arrows.filter(a => !a.remove && a.x > -200 && a.x < worldWidth + 200);
}

function updateCoins() {
  for (const c of coins) {
    if (c.taken) continue;

    const box = {
      x: c.x - c.r,
      y: c.y - c.r,
      w: c.r * 2,
      h: c.r * 2
    };

    if (rects(player, box)) {
      c.taken = true;
      money += 5;
    }
  }
}

function updateBoss() {
  boss.frame++;
  boss.timer++;

  if (boss.cooldown > 0) boss.cooldown--;

  if (boss.timer > 170) {
    boss.timer = 0;
    boss.phase = (boss.phase + 1) % 4;
  }

  const wave = Math.sin(boss.timer * 0.035) * 1.1;

  if (boss.phase === 0) boss.x += 0.9;
  if (boss.phase === 1) boss.x -= 0.9;
  if (boss.phase === 2) boss.y -= 0.45;
  if (boss.phase === 3) boss.y += 0.45;

  boss.y += wave;

  boss.x = Math.max(worldWidth - 930, Math.min(boss.x, worldWidth - 260));
  boss.y = Math.max(groundY() - 360, Math.min(boss.y, groundY() - 220));

  if (boss.cooldown <= 0) {
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const len = Math.max(1, Math.hypot(dx, dy));

    boss.fireballs.push({
      x: boss.x + 45,
      y: boss.y + 84,
      w: 34,
      h: 34,
      vx: (dx / len) * 6.2,
      vy: (dy / len) * 6.2
    });

    boss.cooldown = 72;
  }

  for (const f of boss.fireballs) {
    f.x += f.vx;
    f.y += f.vy;

    if (rects(player, f) && player.invincibleTimer <= 0) {
      player.health -= 12;
      player.invincibleTimer = 25;
      f.x = -9999;
    }
  }

  boss.fireballs = boss.fireballs.filter(f => f.x > -1000 && f.x < worldWidth + 1000);

  if (boss.health <= 0) {
    boss.dead = true;
    player.hasDog = true;
    money += 300;
    bossHud.style.display = "none";
    endGame("ניצחת את הדרקון וקיבלת כלב רועה בלגי שיעזור לך 🐕🏆");
  }
}

function updateHud() {
  healthEl.textContent = Math.max(0, Math.floor(player.health));
  moneyEl.textContent = money;
  arrowsEl.textContent = player.arrows;
  levelEl.textContent = level;
  bowStatusEl.textContent = player.hasBow ? "יש" : "אין";
  dogStatusEl.textContent = player.hasDog ? "רועה בלגי" : "אין";

  if (boss.active && !boss.dead) {
    bossHud.style.display = "block";
    bossFill.style.width = Math.max(0, boss.health / boss.maxHealth * 100) + "%";
    bossHp.textContent = `${Math.max(0, Math.floor(boss.health))} / ${boss.maxHealth}`;
  } else {
    bossHud.style.display = "none";
  }
}

function endGame(text) {
  gameEnded = true;
  startEl.style.display = "grid";
  startEl.innerHTML = `
    <div>
      <h1>${text}</h1>
      <p>כסף סופי: ${money}</p>
      <button onclick="location.reload()">שחק שוב</button>
    </div>
  `;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();

  ctx.save();
  ctx.translate(-cameraX, 0);

  drawWorld();
  drawPits();
  drawPlatforms();
  drawSpikes();
  drawCoins();
  drawZombies();

  if (boss.active && !boss.dead) {
    drawBoss();
    drawFireballs();
  }

  drawArrows();

  if (player.hasDog) drawDog();

  drawPlayer();

  ctx.restore();

  if (shopOpen) drawDarkOverlay();
}

function drawBackground() {
  const gy = groundY();

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#0284c7");
  sky.addColorStop(0.45, "#7dd3fc");
  sky.addColorStop(0.8, "#e0f2fe");
  sky.addColorStop(1, "#f8fafc");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.86)";
  for (let i = 0; i < 9; i++) {
    const x = ((i * 270 - bgOffset) % (W + 320)) - 180;
    const y = 70 + (i % 3) * 58;
    cloud(x, y, 1);
  }

  ctx.save();
  ctx.translate(-cameraX * 0.15, 0);
  for (let i = 0; i < 16; i++) {
    const x = i * 330;
    ctx.fillStyle = i % 2 ? "#64748b" : "#475569";
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + 160, gy - 300);
    ctx.lineTo(x + 330, gy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#e0f2fe";
    ctx.beginPath();
    ctx.moveTo(x + 160, gy - 300);
    ctx.lineTo(x + 112, gy - 205);
    ctx.lineTo(x + 205, gy - 205);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function cloud(x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, 25 * s, 0, Math.PI * 2);
  ctx.arc(x + 30 * s, y - 12 * s, 34 * s, 0, Math.PI * 2);
  ctx.arc(x + 68 * s, y, 25 * s, 0, Math.PI * 2);
  ctx.arc(x + 35 * s, y + 12 * s, 28 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawWorld() {
  const gy = groundY();

  ctx.fillStyle = "#15803d";
  ctx.fillRect(0, gy, worldWidth, H - gy);

  ctx.fillStyle = "#22c55e";
  for (let i = 0; i < worldWidth; i += 42) {
    ctx.fillRect(i, gy + 12 + Math.sin(i) * 6, 22, 5);
  }

  ctx.fillStyle = "#92400e";
  ctx.fillRect(0, gy + 50, worldWidth, 90);

  ctx.fillStyle = "#fde68a";
  ctx.font = "bold 28px Arial";
  ctx.fillText("שער לשלב הבא ➜", worldWidth - 330, gy - 65);
}

function drawPits() {
  const gy = groundY();

  for (const p of pits) {
    ctx.fillStyle = "#020617";
    ctx.fillRect(p.x, gy - 5, p.w, H - gy + 20);

    const g = ctx.createLinearGradient(p.x, gy, p.x, H);
    g.addColorStop(0, "#0f172a");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.fillRect(p.x + 8, gy, p.w - 16, H - gy);
  }
}

function drawPlatforms() {
  for (const p of platforms) {
    ctx.fillStyle = "#854d0e";
    roundRect(p.x, p.y, p.w, p.h, 8);
    ctx.fill();

    ctx.fillStyle = "#22c55e";
    roundRect(p.x, p.y - 8, p.w, 10, 8);
    ctx.fill();
  }
}

function drawSpikes() {
  for (const s of spikes) {
    ctx.fillStyle = "#cbd5e1";
    const count = Math.floor(s.w / 22);

    for (let i = 0; i < count; i++) {
      const x = s.x + i * 22;
      ctx.beginPath();
      ctx.moveTo(x, s.y + s.h);
      ctx.lineTo(x + 11, s.y);
      ctx.lineTo(x + 22, s.y + s.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#475569";
      ctx.stroke();
    }
  }
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;
  const dir = player.direction;
  const walk = Math.sin(Date.now() / 90) * 4;

  ctx.save();

  if (player.invincibleTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
    ctx.globalAlpha = 0.55;
  }

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x + 24, y + player.h + 7, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (player.rolling) {
    ctx.translate(x + 24, y + 48);
    ctx.rotate(Date.now() / 60 * dir);
    drawRollingHero();
    ctx.restore();
    return;
  }

  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(x + 9, y + 55 + walk, 12, 30);
  ctx.fillRect(x + 27, y + 55 - walk, 12, 30);

  ctx.fillStyle = "#111827";
  ctx.fillRect(x + 6, y + 82 + walk, 18, 7);
  ctx.fillRect(x + 24, y + 82 - walk, 18, 7);

  ctx.fillStyle = "#2563eb";
  roundRect(x + 8, y + 28, 32, 34, 8);
  ctx.fill();

  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(x + (dir === 1 ? 35 : 3), y + 34, 12, 26);
  ctx.fillRect(x + (dir === 1 ? 1 : 34), y + 34, 12, 25);

  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(x + 24, y + 17, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1f2937";
  ctx.beginPath();
  ctx.arc(x + 24, y + 8, 18, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(x + 18 + dir * 3, y + 16, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 29 + dir * 3, y + 16, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 24 + dir * 2, y + 23, 7, 0, Math.PI);
  ctx.stroke();

  // sword always held
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 25, y + 42);
  ctx.lineTo(x + 25 + dir * 36, y + 55);
  ctx.stroke();

  ctx.fillStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(x + 25 + dir * 36, y + 55);
  ctx.lineTo(x + 25 + dir * 68, y + 45);
  ctx.lineTo(x + 25 + dir * 43, y + 65);
  ctx.closePath();
  ctx.fill();

  if (player.hasBow) {
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + 10, y + 36, 18, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  if (swordCooldown > 10) {
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x + 28, y + 34);
    ctx.lineTo(x + 28 + dir * 78, y + 12);
    ctx.stroke();
  }

  ctx.restore();
}

function drawRollingHero() {
  ctx.fillStyle = "#2563eb";
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#93c5fd";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, Math.PI * 1.5);
  ctx.stroke();

  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(5, -10, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawDog() {
  const x = dog.x;
  const y = dog.y + 30;
  const run = Math.sin(Date.now() / 85) * 4;

  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x + 35, y + 50, 42, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belgian Malinois colors
  ctx.fillStyle = "#b45309";
  ctx.beginPath();
  ctx.ellipse(x + 35, y + 25, 42, 23, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#92400e";
  ctx.beginPath();
  ctx.arc(x + 70, y + 12, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.ellipse(x + 79, y + 16, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.moveTo(x + 58, y - 2);
  ctx.lineTo(x + 52, y - 22);
  ctx.lineTo(x + 68, y - 2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 76, y - 2);
  ctx.lineTo(x + 87, y - 22);
  ctx.lineTo(x + 88, y + 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fef3c7";
  ctx.beginPath();
  ctx.arc(x + 75, y + 8, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#78350f";
  ctx.fillRect(x + 8, y + 38 + run, 9, 22);
  ctx.fillRect(x + 28, y + 38 - run, 9, 22);
  ctx.fillRect(x + 50, y + 38 + run, 9, 22);
  ctx.fillRect(x + 66, y + 38 - run, 9, 22);

  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 22);
  ctx.quadraticCurveTo(x - 22, y + 7, x - 27, y - 8);
  ctx.stroke();

  ctx.restore();
}

function drawZombies() {
  for (const z of zombies) {
    if (z.dead) continue;

    const x = z.x;
    const y = z.y;

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x + 24, y + z.h + 5, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#166534";
    roundRect(x, y + 16, z.w, z.h - 16, 10);
    ctx.fill();

    ctx.fillStyle = "#86efac";
    ctx.beginPath();
    ctx.arc(x + 24, y + 17, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111827";
    ctx.fillRect(x + 8, y - 2, 32, 9);

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + 15, y + 14, 6, 0, Math.PI * 2);
    ctx.arc(x + 33, y + 14, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(x + 15, y + 14, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 33, y + 14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 37);
    ctx.lineTo(x + 34, y + 37);
    ctx.stroke();
  }
}

function drawCoins() {
  for (const c of coins) {
    if (c.taken) continue;

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.arc(c.x - 4, c.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArrows() {
  for (const a of arrows) {
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(a.x, a.y, a.w, a.h);

    ctx.fillStyle = "#78350f";

    if (a.vx > 0) {
      ctx.beginPath();
      ctx.moveTo(a.x + a.w, a.y + 3);
      ctx.lineTo(a.x + a.w + 12, a.y - 5);
      ctx.lineTo(a.x + a.w + 12, a.y + 11);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + 3);
      ctx.lineTo(a.x - 12, a.y - 5);
      ctx.lineTo(a.x - 12, a.y + 11);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawBoss() {
  const x = boss.x;
  const y = boss.y;
  const flap = Math.sin(boss.frame * 0.11) * 16;

  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x + 115, y + 165, 100, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dc2626";
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(x + 70, y + 60);
  ctx.quadraticCurveTo(x - 80, y + 20 + flap, x - 45, y + 145);
  ctx.quadraticCurveTo(x + 5, y + 105, x + 70, y + 72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 160, y + 60);
  ctx.quadraticCurveTo(x + 310, y + 20 + flap, x + 275, y + 145);
  ctx.quadraticCurveTo(x + 225, y + 105, x + 160, y + 72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.ellipse(x + 108, y + 92, 95, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fb923c";
  ctx.beginPath();
  ctx.ellipse(x + 120, y + 105, 45, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.ellipse(x + 175, y + 70, 35, 42, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.arc(x + 205, y + 50, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#78350f";
  ctx.beginPath();
  ctx.moveTo(x + 188, y + 18);
  ctx.lineTo(x + 177, y - 25);
  ctx.lineTo(x + 202, y + 12);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 217, y + 17);
  ctx.lineTo(x + 233, y - 25);
  ctx.lineTo(x + 231, y + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(x + 220, y + 44, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(x + 222, y + 44, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + 214, y + 63, 18, 0, Math.PI);
  ctx.stroke();

  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(x + 35, y + 110);
  ctx.quadraticCurveTo(x - 95, y + 165, x - 110, y + 80);
  ctx.stroke();

  ctx.fillStyle = "#78350f";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 45 + i * 25, y + 45);
    ctx.lineTo(x + 58 + i * 25, y + 10);
    ctx.lineTo(x + 72 + i * 25, y + 47);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawFireballs() {
  for (const f of boss.fireballs) {
    const g = ctx.createRadialGradient(
      f.x + f.w / 2,
      f.y + f.h / 2,
      0,
      f.x + f.w / 2,
      f.y + f.h / 2,
      f.w
    );

    g.addColorStop(0, "#fef3c7");
    g.addColorStop(0.45, "#f59e0b");
    g.addColorStop(1, "#dc2626");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDarkOverlay() {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, W, H);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function loop() {
  update();
  draw();

  for (const k in pressed) pressed[k] = false;

  requestAnimationFrame(loop);
}
