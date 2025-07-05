const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let win_w = window.innerWidth;
let win_h = window.innerHeight;
canvas.width = win_w;
canvas.height = win_h;

const centerX = win_w / 2;
const centerY = win_h / 2;

const outerRadius = 400;
const innerRadius = 300;
let rotation = 0;
let isHologramVisible = false;
let logoFlipProgress = 0;
let isFlipping = false;
let showButton = false;
let flashAlpha = 0;

const aliens = [
  "Alien X",
  "Atomix",
  "Ball Weevile",
  "Big Chill",
  "Bloxx",
  "Brainstorm",
  "Canonbolt",
  "Chromastone",
  "Clockwork",
  "Diamondhead",
  "Echo Echo",
  "Fasttrack",
  "Feedback",
  "Fourarms",
  "Ghostfreak",
  "Heatblast",
  "Humungousaur",
  "Jetray",
  "NRG",
  "Rath",
  "Shocksquatch",
  "Spitter",
  "Stinkfly",
  "Swampfire Bloom",
  "Swampfire",
  "Terraspin",
  "Upgrade",
  "Waybig",
  "Wildmutt",
  "Wildvine",
  "XLR8",
];

const alienImages = {};
let isDragging = false;
let startAngle = 0;
let lastAngle = 0;
let velocity = 0;
let isUserInteracting = false;
let lastTimestamp = null;
const initSound = new Audio("init.mp3");
const pendingSound = new Audio("pending.mp3");
const transformSound = new Audio("transform.mp3");

function preloadImages(callback) {
  let loaded = 0;
  aliens.forEach((name) => {
    const img = new Image();
    const filename = name.replace(/ /g, "%20");
    img.src = `aliens/OV%20${filename}.png`;
    img.onload = () => {
      alienImages[name] = img;
      loaded++;
      if (loaded === aliens.length) callback();
    };
  });
}

function getSizeByPercent(widthPercent, heightPercent) {
  return {
    width: (win_w * widthPercent) / 100,
    height: (win_h * heightPercent) / 100,
  };
}

function fillRoundedRect(ctx, x, y, width, height, radius = 10) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

function drawRectinCenter(wPercent, hPercent, radius = 10) {
  const { width, height } = getSizeByPercent(wPercent, hPercent);
  const x = centerX - width / 2;
  const y = centerY - height / 2;
  fillRoundedRect(ctx, x, y, width, height, radius);
}

const logoImg = new Image();
logoImg.src = "logo.jpg";

function drawOmnitrix() {
  ctx.fillStyle = "#c5d4cb";
  drawRectinCenter(10, 90, 40);
  drawRectinCenter(13, 20, 12);

  const { width, height } = getSizeByPercent(10, 15);
  const x = centerX - width / 2;
  const y = centerY - height / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((logoFlipProgress * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  if (!showButton) ctx.drawImage(logoImg, x, y, width, height);
  else {
    ctx.fillStyle = "#00ff00";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawRing() {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
  ctx.fill("evenodd");
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawAlienImages() {
  ctx.save();
  ctx.translate(centerX, centerY);
  const count = aliens.length;
  for (let i = 0; i < count; i++) {
    const baseAngle = (i * (2 * Math.PI)) / count + rotation;
    const img = alienImages[aliens[i]];
    if (!img) continue;
    const radius = (outerRadius + innerRadius) / 2;
    const imgSize = 60;
    const x = Math.cos(baseAngle) * radius;
    const y = Math.sin(baseAngle) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-baseAngle - Math.PI / 2);
    ctx.drawImage(img, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
    ctx.restore();
  }
  ctx.restore();
}

function drawFlash() {
  if (flashAlpha > 0) {
    ctx.fillStyle = `rgba(0, 255, 0, ${flashAlpha})`;
    ctx.fillRect(0, 0, win_w, win_h);
    flashAlpha -= 0.02;
  }
}

function draw() {
  ctx.clearRect(0, 0, win_w, win_h);
  drawOmnitrix();
  if (isHologramVisible) {
    drawRing();
    drawAlienImages();
  }
  drawFlash();
}

function getAngleFromCenter(x, y) {
  return Math.atan2(y - centerY, x - centerX);
}

canvas.addEventListener("click", (e) => {
  const { width, height } = getSizeByPercent(10, 10);
  const x = centerX - width / 2;
  const y = centerY - height / 2;

  const inLogoArea =
    e.clientX >= x &&
    e.clientX <= x + width &&
    e.clientY >= y &&
    e.clientY <= y + height;

  if (inLogoArea) {
    if (showButton) {
      flashAlpha = 1;
      showButton = false;
      logoFlipProgress = 0;
      pendingSound.pause();
      pendingSound.dir;
      transformSound.play();
    } else {
      isHologramVisible = !isHologramVisible;

      if (isHologramVisible) {
        initSound.play();
      } else {
        pendingSound.play();
      }
    }
    draw();
  } else if (isHologramVisible) {
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= innerRadius && dist <= outerRadius) {
      isFlipping = true;
      isHologramVisible = false;
      pendingSound.play();
    }
  }
});

canvas.addEventListener("mousedown", (e) => {
  if (!isHologramVisible) return;
  isDragging = true;
  isUserInteracting = true;
  startAngle = getAngleFromCenter(e.clientX, e.clientY);
  lastAngle = startAngle;
  velocity = 0;
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDragging || !isHologramVisible) return;
  const angle = getAngleFromCenter(e.clientX, e.clientY);
  const delta = angle - lastAngle;
  rotation += delta * 0.25;
  velocity = delta;
  lastAngle = angle;
  draw();
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  isUserInteracting = false;
});

function animate(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  if (!isUserInteracting && isHologramVisible) {
    rotation += velocity;
    velocity *= 0.95;
    if (Math.abs(velocity) < 0.0001) velocity = 0;
  }
  if (isFlipping) {
    logoFlipProgress += 10;
    if (logoFlipProgress >= 90) {
      logoFlipProgress = 90;
      isFlipping = false;
      showButton = true;
    }
  }
  draw();
  requestAnimationFrame(animate);
}

preloadImages(() => {
  animate();
});
