const photoCanvas = document.getElementById('photoCanvas');
const gridCanvas = document.getElementById('gridCanvas');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const menuToggle = document.getElementById('menuToggle');
const menuPanel = document.getElementById('menuPanel');
const gridListEl = document.getElementById('gridList');
const addGridBtn = document.getElementById('addGridBtn');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsForm = document.getElementById('settingsForm');
const settingsTitle = document.getElementById('settingsTitle');
const nameInput = document.getElementById('gridNameInput');
const colorInput = document.getElementById('gridColorInput');
const densityInput = document.getElementById('gridDensityInput');
const spacingInput = document.getElementById('gridSpacingInput');
const thicknessInput = document.getElementById('gridThicknessInput');
const opacityInput = document.getElementById('gridOpacityInput');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cameraOverlay = document.getElementById('cameraOverlay');
const cameraPreview = document.getElementById('cameraPreview');
const captureBtn = document.getElementById('captureBtn');
const closeCameraBtn = document.getElementById('closeCameraBtn');

const photoCtx = photoCanvas.getContext('2d');
const gridCtx = gridCanvas.getContext('2d');

const MAX_GRIDS = 3;
const COLORS = ['#ff7b54', '#50c1ff', '#a6ff4d'];

const createId = () => (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2));

const state = {
  grids: [],
  activeHandle: null,
  editingGridId: null,
  photoBuffer: null,
  photoAspect: 1,
  cameraStream: null,
};

const handleTargets = [];

function sizeCanvas(canvas, ctx) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

function resizeAll() {
  sizeCanvas(photoCanvas, photoCtx);
  sizeCanvas(gridCanvas, gridCtx);
  drawPhoto();
  drawGrids();
}

function seedGrids() {
  if (state.grids.length) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const presets = [
    { name: 'Grid A', color: COLORS[0], enabled: true, point: { x: width * 0.2, y: height * 0.35 } },
    { name: 'Grid B', color: COLORS[1], enabled: false, point: { x: width * 0.8, y: height * 0.3 } },
    { name: 'Grid C', color: COLORS[2], enabled: false, point: { x: width * 0.5, y: height * 0.15 } },
  ];

  presets.forEach((preset) => addGrid(preset));
}

function addGrid(config = {}) {
  if (state.grids.length >= MAX_GRIDS) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const grid = {
    id: createId(),
    name: config.name || `Grid ${String.fromCharCode(65 + state.grids.length)}`,
    color: config.color || COLORS[state.grids.length % COLORS.length],
    enabled: config.enabled ?? true,
    vanishingPoint: config.point || { x: width / 2, y: height / 3 },
    density: config.density || 18,
    spacing: config.spacing || 80,
    thickness: config.thickness || 2,
    opacity: config.opacity || 0.85,
  };
  state.grids.push(grid);
  renderGridList();
  drawGrids();
}

function renderGridList() {
  gridListEl.innerHTML = '';
  state.grids.forEach((grid) => {
    const card = document.createElement('div');
    card.className = `grid-card ${grid.enabled ? 'enabled' : ''}`;
    const info = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = grid.name;
    const meta = document.createElement('span');
    meta.className = 'grid-meta';
    meta.textContent = `density ${grid.density} • spacing ${grid.spacing}px`;
    info.append(title, meta);

    const actions = document.createElement('div');
    actions.className = 'grid-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = grid.enabled ? 'Disable' : 'Enable';
    toggleBtn.classList.toggle('primary', !grid.enabled);
    toggleBtn.addEventListener('click', () => {
      grid.enabled = !grid.enabled;
      renderGridList();
      drawGrids();
    });

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Settings';
    editBtn.addEventListener('click', () => openSettings(grid.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => removeGrid(grid.id));

    actions.append(toggleBtn, editBtn, deleteBtn);
    card.append(info, actions);
    gridListEl.append(card);
  });

  addGridBtn.disabled = state.grids.length >= MAX_GRIDS;
  addGridBtn.textContent = addGridBtn.disabled ? 'Grid limit reached' : 'Add another grid';
}

function removeGrid(id) {
  const idx = state.grids.findIndex((grid) => grid.id === id);
  if (idx >= 0) {
    state.grids.splice(idx, 1);
    renderGridList();
    drawGrids();
  }
}

function drawPhoto() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  photoCtx.clearRect(0, 0, width, height);
  if (!state.photoBuffer) {
    const gradient = photoCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0b0d1b');
    gradient.addColorStop(1, '#020308');
    photoCtx.fillStyle = gradient;
    photoCtx.fillRect(0, 0, width, height);

    photoCtx.fillStyle = 'rgba(255,255,255,0.5)';
    photoCtx.font = '600 1.2rem "Space Grotesk", sans-serif';
    photoCtx.textAlign = 'center';
    photoCtx.fillText('Take a photo to fill the frame', width / 2, height / 2);
    return;
  }

  const { width: imgW, height: imgH } = state.photoBuffer;
  const scale = Math.max(width / imgW, height / imgH);
  const drawWidth = imgW * scale;
  const drawHeight = imgH * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  photoCtx.drawImage(state.photoBuffer, offsetX, offsetY, drawWidth, drawHeight);
}

function drawGrids() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  gridCtx.clearRect(0, 0, width, height);
  handleTargets.length = 0;

  state.grids.forEach((grid) => {
    if (!grid.enabled) return;
    drawPerspectiveGrid(grid);
    handleTargets.push({ gridId: grid.id, x: grid.vanishingPoint.x, y: grid.vanishingPoint.y });
    drawHandle(grid);
  });
}

function drawPerspectiveGrid(grid) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const { vanishingPoint: point, color, density, spacing, thickness, opacity } = grid;
  const baseY = height;

  gridCtx.save();
  gridCtx.globalAlpha = opacity;
  gridCtx.strokeStyle = color;
  gridCtx.lineWidth = thickness;

  const steps = Math.max(4, density);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const targetX = width * t;
    gridCtx.beginPath();
    gridCtx.moveTo(point.x, point.y);
    gridCtx.lineTo(targetX, baseY);
    gridCtx.stroke();
  }

  gridCtx.globalAlpha = opacity * 0.8;
  const depthLines = Math.floor((baseY - point.y) / spacing);
  for (let i = 1; i <= depthLines; i += 1) {
    const y = point.y + i * spacing;
    gridCtx.beginPath();
    gridCtx.moveTo(0, y);
    gridCtx.lineTo(width, y);
    gridCtx.stroke();
  }

  gridCtx.restore();
}

function drawHandle(grid) {
  const { x, y } = grid.vanishingPoint;
  gridCtx.save();
  gridCtx.fillStyle = grid.color;
  gridCtx.beginPath();
  gridCtx.arc(x, y, 10, 0, Math.PI * 2);
  gridCtx.fill();
  gridCtx.lineWidth = 2;
  gridCtx.strokeStyle = 'rgba(0,0,0,0.6)';
  gridCtx.stroke();
  gridCtx.restore();
}

function getCanvasPoint(evt) {
  const rect = gridCanvas.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * window.innerWidth;
  const y = ((evt.clientY - rect.top) / rect.height) * window.innerHeight;
  return { x, y };
}

function onPointerDown(evt) {
  const point = getCanvasPoint(evt);
  const handle = handleTargets.find((target) => Math.hypot(target.x - point.x, target.y - point.y) < 18);
  if (!handle) return;
  evt.preventDefault();
  state.activeHandle = { ...handle, pointerId: evt.pointerId };
  gridCanvas.setPointerCapture(evt.pointerId);
}

function onPointerMove(evt) {
  if (!state.activeHandle) return;
  const point = getCanvasPoint(evt);
  const grid = state.grids.find((g) => g.id === state.activeHandle.gridId);
  if (!grid) return;
  grid.vanishingPoint.x = Math.max(0, Math.min(window.innerWidth, point.x));
  grid.vanishingPoint.y = Math.max(0, Math.min(window.innerHeight - 20, point.y));
  drawGrids();
}

function onPointerUp(evt) {
  if (state.activeHandle && state.activeHandle.pointerId === evt.pointerId) {
    gridCanvas.releasePointerCapture(evt.pointerId);
    state.activeHandle = null;
  }
}

function toggleMenu() {
  const isOpen = menuPanel.hasAttribute('hidden') ? false : true;
  if (isOpen) {
    menuPanel.setAttribute('hidden', '');
    menuToggle.setAttribute('aria-expanded', 'false');
  } else {
    menuPanel.removeAttribute('hidden');
    menuToggle.setAttribute('aria-expanded', 'true');
  }
}

function openSettings(gridId) {
  const grid = state.grids.find((g) => g.id === gridId);
  if (!grid) return;
  state.editingGridId = gridId;
  settingsTitle.textContent = `${grid.name} settings`;
  nameInput.value = grid.name;
  colorInput.value = grid.color;
  densityInput.value = grid.density;
  spacingInput.value = grid.spacing;
  thicknessInput.value = grid.thickness;
  opacityInput.value = grid.opacity;
  settingsOverlay.removeAttribute('hidden');
}

function closeSettings() {
  state.editingGridId = null;
  settingsOverlay.setAttribute('hidden', '');
}

function applySettings(evt) {
  evt.preventDefault();
  const grid = state.grids.find((g) => g.id === state.editingGridId);
  if (!grid) return;
  grid.name = nameInput.value.trim() || grid.name;
  grid.color = colorInput.value;
  grid.density = Number(densityInput.value);
  grid.spacing = Number(spacingInput.value);
  grid.thickness = Number(thicknessInput.value);
  grid.opacity = Number(opacityInput.value);
  renderGridList();
  drawGrids();
  closeSettings();
}

async function openCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    state.cameraStream = stream;
    cameraPreview.srcObject = stream;
    cameraOverlay.removeAttribute('hidden');
  } catch (err) {
    alert('Unable to access camera. Please allow camera permissions.');
  }
}

function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach((track) => track.stop());
    state.cameraStream = null;
  }
  cameraOverlay.setAttribute('hidden', '');
}

function capturePhoto() {
  if (!state.cameraStream) return;
  const buffer = document.createElement('canvas');
  buffer.width = cameraPreview.videoWidth || 1080;
  buffer.height = cameraPreview.videoHeight || 1440;
  const bufferCtx = buffer.getContext('2d');
  bufferCtx.drawImage(cameraPreview, 0, 0, buffer.width, buffer.height);
  state.photoBuffer = buffer;
  drawPhoto();
  stopCamera();
}

function handleKeydown(evt) {
  if (evt.key === 'Escape') {
    if (!settingsOverlay.hasAttribute('hidden')) {
      closeSettings();
    }
    if (!cameraOverlay.hasAttribute('hidden')) {
      stopCamera();
    }
  }
}

window.addEventListener('resize', resizeAll);
gridCanvas.addEventListener('pointerdown', onPointerDown);
gridCanvas.addEventListener('pointermove', onPointerMove);
gridCanvas.addEventListener('pointerup', onPointerUp);
gridCanvas.addEventListener('pointercancel', onPointerUp);
takePhotoBtn.addEventListener('click', openCamera);
menuToggle.addEventListener('click', toggleMenu);
addGridBtn.addEventListener('click', () => addGrid({ enabled: true }));
settingsForm.addEventListener('submit', applySettings);
cancelSettingsBtn.addEventListener('click', closeSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
captureBtn.addEventListener('click', capturePhoto);
closeCameraBtn.addEventListener('click', stopCamera);
window.addEventListener('keydown', handleKeydown);

document.addEventListener('click', (evt) => {
  if (!menuPanel.contains(evt.target) && evt.target !== menuToggle) {
    menuPanel.setAttribute('hidden', '');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});

resizeAll();
seedGrids();
renderGridList();
drawGrids();
