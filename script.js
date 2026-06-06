const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const cols = 30;
const rows = 7;
const cell = 24;
const gap = 8;
const offsetX = 18;
const offsetY = 22;

const keys = new Set();
const money = [];
const police = [];
let score = 0;
let fuel = 100;
let life = 100;
let nitro = 100;
let wanted = 1;
let particles = [];

const car = { x: 50, y: 130, w: 34, h: 20, speed: 2.3 };

function randCell() {
  return {
    x: offsetX + Math.floor(Math.random() * cols) * (cell + gap) + 6,
    y: offsetY + Math.floor(Math.random() * rows) * (cell + gap) + 6
  };
}

for (let i = 0; i < 18; i++) money.push(randCell());
for (let i = 0; i < 2; i++) police.push({ ...randCell(), w: 34, h: 20, speed: 1.2 + i * .25 });

addEventListener('keydown', e => keys.add(e.key.toLowerCase()));
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

function drawGraph() {
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = offsetX + c * (cell + gap);
      const y = offsetY + r * (cell + gap);
      const road = r === 2 || r === 5 || c === 5 || c === 11 || c === 18 || c === 24;
      ctx.fillStyle = road ? '#141b2b' : ['#0d1117', '#123023', '#155e38', '#17a85f'][Math.floor(Math.random()*4)];
      ctx.strokeStyle = road ? '#00f5ff55' : '#26344d';
      ctx.lineWidth = 1;
      roundedRect(x, y, cell, cell, 5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCar(obj, type='player') {
  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = type === 'player' ? '#ff2bd6' : '#00f5ff';
  ctx.fillStyle = type === 'player' ? '#ff123f' : '#f5f5f5';
  roundedRect(obj.x, obj.y, obj.w, obj.h, 6);
  ctx.fill();
  ctx.fillStyle = type === 'player' ? '#101d38' : '#111827';
  ctx.fillRect(obj.x + 10, obj.y + 4, 14, 8);
  if (type === 'police') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(obj.x + 14, obj.y + 10, 14, 7);
    ctx.fillStyle = '#00f5ff'; ctx.fillRect(obj.x + 12, obj.y - 4, 6, 4);
    ctx.fillStyle = '#ff2bd6'; ctx.fillRect(obj.x + 20, obj.y - 4, 6, 4);
  }
  ctx.restore();
}

function drawMoney() {
  ctx.save();
  ctx.font = 'bold 18px monospace';
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#39ff14';
  ctx.fillStyle = '#39ff14';
  money.forEach(m => ctx.fillText('$', m.x, m.y + 16));
  ctx.restore();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    p.x += p.vx; p.y += p.vy; p.life--;
  });
  ctx.globalAlpha = 1;
  particles = particles.filter(p => p.life > 0);
}

function boom(x, y, color = '#ff6b00') {
  for (let i = 0; i < 24; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - .5) * 5,
      vy: (Math.random() - .5) * 5,
      size: 2 + Math.random() * 4,
      life: 20 + Math.random() * 20,
      color
    });
  }
}

function collide(a, b) {
  return a.x < b.x + 22 && a.x + a.w > b.x && a.y < b.y + 22 && a.y + a.h > b.y;
}

function update() {
  let speed = car.speed;
  if ((keys.has(' ') || keys.has('shift')) && nitro > 0) {
    speed = 4.6;
    nitro -= .7;
  } else if (nitro < 100) nitro += .18;

  if (keys.has('w') || keys.has('arrowup')) car.y -= speed;
  if (keys.has('s') || keys.has('arrowdown')) car.y += speed;
  if (keys.has('a') || keys.has('arrowleft')) car.x -= speed;
  if (keys.has('d') || keys.has('arrowright')) car.x += speed;

  car.x = Math.max(0, Math.min(canvas.width - car.w, car.x));
  car.y = Math.max(0, Math.min(canvas.height - car.h, car.y));
  fuel = Math.max(0, fuel - .018);

  money.forEach((m, i) => {
    if (collide(car, m)) {
      score += 250;
      money[i] = randCell();
      boom(m.x, m.y, '#39ff14');
      wanted = Math.min(5, 1 + Math.floor(score / 1000));
      while (police.length < Math.min(wanted, 4)) police.push({ ...randCell(), w: 34, h: 20, speed: 1.1 + wanted * .18 });
    }
  });

  police.forEach(p => {
    const dx = car.x - p.x;
    const dy = car.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 180) {
      p.x += (dx / dist) * p.speed;
      p.y += (dy / dist) * p.speed;
    } else {
      p.x += Math.sin(Date.now() / 700 + p.y) * .6;
      p.y += Math.cos(Date.now() / 800 + p.x) * .6;
    }
    if (Math.abs(dx) < 28 && Math.abs(dy) < 22) {
      life = Math.max(0, life - .35);
      boom(car.x + 15, car.y + 10);
    }
  });

  document.getElementById('score').textContent = score;
  document.getElementById('fuel').textContent = Math.round(fuel);
  document.getElementById('life').textContent = Math.round(life);
  document.getElementById('nitro').textContent = nitro > 35 ? 'READY' : 'LOW';
  document.getElementById('wanted').textContent = '★ '.repeat(wanted) + '☆ '.repeat(5 - wanted);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGraph();
  drawMoney();
  drawParticles();
  police.forEach(p => drawCar(p, 'police'));
  drawCar(car);

  if (wanted >= 4) {
    ctx.save();
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#00f5ff';
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#00f5ff';
    roundedRect(800 + Math.sin(Date.now()/500)*40, 32, 82, 24, 12);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

loop();
