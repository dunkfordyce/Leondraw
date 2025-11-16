const canvas = document.getElementById('workspace');
const ctx = canvas.getContext('2d');
const photoInput = document.getElementById('photoInput');
const clearImageBtn = document.getElementById('clearImageBtn');
const toolSelect = document.getElementById('toolSelect');
const colorPicker = document.getElementById('colorPicker');
const lineWidthInput = document.getElementById('lineWidth');
const gridDensityInput = document.getElementById('gridDensity');
const depthCountInput = document.getElementById('depthCount');
const instructionText = document.getElementById('instructionText');
const undoBtn = document.getElementById('undoBtn');
const clearGuidesBtn = document.getElementById('clearGuidesBtn');

const state = {
  image: null,
  guides: [],
  lineStart: null,
  currentTool: toolSelect.value,
};

const toolMessages = {
  line: 'Tap once to set the start of a guide line, then tap again to set the end.',
  grid: 'Tap where you want the vanishing point. A grid will radiate from that spot.',
  eraser: 'Tap a guide to remove it. Undo works too.',
};

function resizeCanvasToImage(image) {
  const maxWidth = Math.min(window.innerWidth - 32, 900);
  const scale = Math.min(maxWidth / image.width, 1);
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.image) {
    ctx.drawImage(state.image, 0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#111225');
    gradient.addColorStop(1, '#050507');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'center';
    ctx.font = '600 18px "Space Grotesk", sans-serif';
    ctx.fillText('Upload or shoot a reference image', canvas.width / 2, canvas.height / 2);
  }

  ctx.lineCap = 'round';

  state.guides.forEach((guide) => {
    ctx.strokeStyle = guide.color;
    ctx.lineWidth = guide.width;

    if (guide.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(guide.start.x, guide.start.y);
      ctx.lineTo(guide.end.x, guide.end.y);
      ctx.stroke();
    }

    if (guide.type === 'grid') {
      drawGridGuide(guide);
    }
  });

  if (state.lineStart) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(state.lineStart.x, state.lineStart.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawGridGuide(guide) {
  const { point, density, depth, color } = guide;
  const boundaryY = point.y < canvas.height / 2 ? canvas.height : 0;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = guide.width;
  ctx.setLineDash([4, 8]);

  for (let i = 0; i <= density; i += 1) {
    const t = i / density;
    const targetX = canvas.width * t;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(targetX, boundaryY);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  for (let i = 1; i <= depth; i += 1) {
    const progress = i / (depth + 1);
    const y = point.y + (boundaryY - point.y) * progress;
    const fade = 0.3 + 0.7 * (1 - progress);
    ctx.strokeStyle = hexToRgba(color, fade);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function hexToRgba(hex, alpha = 1) {
  const parsed = hex.replace('#', '');
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCanvasPoint(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((evt.clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

function handlePointerDown(evt) {
  const point = getCanvasPoint(evt);

  if (state.currentTool === 'line') {
    if (!state.lineStart) {
      state.lineStart = point;
    } else {
      state.guides.push({
        type: 'line',
        start: state.lineStart,
        end: point,
        color: colorPicker.value,
        width: Number(lineWidthInput.value),
      });
      state.lineStart = null;
    }
  }

  if (state.currentTool === 'grid') {
    state.guides.push({
      type: 'grid',
      point,
      density: Number(gridDensityInput.value),
      depth: Number(depthCountInput.value),
      color: colorPicker.value,
      width: 1.5,
    });
  }

  if (state.currentTool === 'eraser') {
    removeGuideAtPoint(point);
  }

  draw();
}

function removeGuideAtPoint(point) {
  const radius = 20;
  for (let i = state.guides.length - 1; i >= 0; i -= 1) {
    const guide = state.guides[i];
    if (guide.type === 'line') {
      if (distanceToSegment(point, guide.start, guide.end) < radius) {
        state.guides.splice(i, 1);
        break;
      }
    }
    if (guide.type === 'grid') {
      const dx = guide.point.x - point.x;
      const dy = guide.point.y - point.y;
      if (Math.hypot(dx, dy) < radius * 1.5) {
        state.guides.splice(i, 1);
        break;
      }
    }
  }
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const projX = start.x + clamped * dx;
  const projY = start.y + clamped * dy;
  return Math.hypot(point.x - projX, point.y - projY);
}

function handleImage(file) {
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    state.image = img;
    resizeCanvasToImage(img);
    draw();
  };
  img.src = URL.createObjectURL(file);
}

photoInput.addEventListener('change', (evt) => {
  const [file] = evt.target.files;
  handleImage(file);
});

clearImageBtn.addEventListener('click', () => {
  state.image = null;
  state.guides = [];
  state.lineStart = null;
  photoInput.value = '';
  draw();
});

undoBtn.addEventListener('click', () => {
  if (state.lineStart) {
    state.lineStart = null;
  } else {
    state.guides.pop();
  }
  draw();
});

clearGuidesBtn.addEventListener('click', () => {
  state.guides = [];
  state.lineStart = null;
  draw();
});

toolSelect.addEventListener('change', (evt) => {
  state.currentTool = evt.target.value;
  state.lineStart = null;
  updateToolUI();
  draw();
});

function updateToolUI() {
  instructionText.textContent = toolMessages[state.currentTool];
  document.querySelectorAll('[data-tool]').forEach((el) => {
    el.style.display = el.dataset.tool === state.currentTool ? 'flex' : 'none';
  });
}

canvas.addEventListener('pointerdown', (evt) => {
  evt.preventDefault();
  canvas.setPointerCapture(evt.pointerId);
  handlePointerDown(evt);
});

window.addEventListener('resize', () => {
  if (!state.image) return;
  resizeCanvasToImage(state.image);
  draw();
});

// initial paint
resizeCanvasToImage({ width: canvas.width, height: canvas.height });
updateToolUI();
draw();
