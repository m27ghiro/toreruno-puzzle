const PIECE_TYPES = [
    { shape: [[1]], color: '#2ecc71' },
    { shape: [[1, 1]], color: '#2ecc71' },
    { shape: [[1], [1]], color: '#2ecc71' },
    { shape: [[1, 1], [1, 1]], color: '#2ecc71' },
    { shape: [[1, 1, 1]], color: '#2ecc71' },
    { shape: [[1], [1], [1]], color: '#2ecc71' },
    { shape: [[1, 1, 1], [0, 1, 0]], color: '#2ecc71' },
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#2ecc71' },
    { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#2ecc71' },
    { shape: [[1, 0], [1, 0], [1, 1]], color: '#2ecc71' },
    { shape: [[1, 1], [0, 1], [0, 1]], color: '#2ecc71' },
];

let GRID_SIZE = 10;
let grid = [];
let score = 0;
let activePiece = null;
let dragStartX, dragStartY;
let lastState = null;
let currentPiecesData = []; // Store data of pieces currently in tray

let gridContainer, pieceTray, scoreElement, gameOverOverlay, finalScoreVal, restartBtn, mainMenu, undoBtn, homeBtn, flashLayer;

function init() {
    gridContainer = document.getElementById('grid-container');
    pieceTray = document.getElementById('piece-tray');
    scoreElement = document.getElementById('score');
    gameOverOverlay = document.getElementById('game-over-overlay');
    finalScoreVal = document.getElementById('final-score-val');
    restartBtn = document.getElementById('restart-btn');
    mainMenu = document.getElementById('main-menu');
    undoBtn = document.getElementById('undo-btn');
    homeBtn = document.getElementById('home-btn');
    flashLayer = document.getElementById('flash-layer');

    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => initGame(parseInt(btn.dataset.size)));
    });

    restartBtn.addEventListener('click', () => {
        gameOverOverlay.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    });

    homeBtn.addEventListener('click', () => mainMenu.classList.remove('hidden'));
    undoBtn.addEventListener('click', undo);
}

function initGame(size) {
    GRID_SIZE = size;
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    lastState = null;
    currentPiecesData = [];
    
    updateScore();
    renderGrid();
    generatePieces();
    
    mainMenu.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
}

function renderGrid() {
    gridContainer.innerHTML = '';
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            if (grid[y][x]) cell.classList.add('filled');
            gridContainer.appendChild(cell);
        }
    }
}

function updateScore() {
    scoreElement.textContent = score;
    undoBtn.disabled = !lastState;
    undoBtn.style.opacity = lastState ? "1" : "0.3";
}

function generatePieces() {
    pieceTray.innerHTML = '';
    currentPiecesData = [];
    for (let i = 0; i < 3; i++) {
        const piece = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        currentPiecesData.push(piece);
        createPieceElement(piece, i);
    }
}

function createPieceElement(piece, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'draggable-piece';
    wrapper.dataset.index = index;
    
    const gridEl = document.createElement('div');
    gridEl.className = 'piece-grid';
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;
    gridEl.style.gap = '2px';

    const centerY = Math.floor(piece.shape.length / 2);
    const centerX = Math.floor(piece.shape[0].length / 2);

    piece.shape.forEach((row, y) => {
        row.forEach((val, x) => {
            const block = document.createElement('div');
            block.className = 'piece-block';
            if (val) {
                block.style.background = piece.color;
                if (y === centerY && x === centerX) {
                    const img = document.createElement('img');
                    img.src = 'logo.png';
                    block.appendChild(img);
                }
            } else {
                block.style.visibility = 'hidden';
            }
            gridEl.appendChild(block);
        });
    });

    wrapper.appendChild(gridEl);
    pieceTray.appendChild(wrapper);

    wrapper.addEventListener('touchstart', startDrag, { passive: false });
    wrapper.addEventListener('mousedown', startDrag);
}

function startDrag(e) {
    if (activePiece) return;
    activePiece = e.currentTarget;
    const rect = activePiece.getBoundingClientRect();
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    dragStartX = clientX - rect.left;
    dragStartY = clientY - rect.top;

    activePiece.style.position = 'fixed';
    activePiece.style.zIndex = '2000';
    activePiece.style.transform = 'scale(1.1)';
    activePiece.style.pointerEvents = 'none';

    updateDragPosition(clientX, clientY);

    const moveHandler = (me) => {
        const mx = me.type.startsWith('touch') ? me.touches[0].clientX : me.clientX;
        const my = me.type.startsWith('touch') ? me.touches[0].clientY : me.clientY;
        updateDragPosition(mx, my);
    };

    const endHandler = (ee) => {
        const ex = ee.type.startsWith('touch') ? ee.changedTouches[0].clientX : ee.clientX;
        const ey = ee.type.startsWith('touch') ? ee.changedTouches[0].clientY : ee.clientY;
        
        handleDrop(ex, ey);
        
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('mouseup', endHandler);
        document.removeEventListener('touchend', endHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchend', endHandler);
}

function updateDragPosition(x, y) {
    activePiece.style.left = (x - dragStartX) + 'px';
    activePiece.style.top = (y - dragStartY - 70) + 'px'; // Finger offset
}

function handleDrop(x, y) {
    const rect = activePiece.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const gridRect = gridContainer.getBoundingClientRect();
    const cellSize = gridRect.width / GRID_SIZE;
    
    // Exact coordinate calculation
    const gx = Math.floor((cx - gridRect.left) / cellSize);
    const gy = Math.floor((cy - gridRect.top) / cellSize);

    if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
        const pieceIdx = parseInt(activePiece.dataset.index);
        const piece = currentPiecesData[pieceIdx];
        
        if (canPlace(piece, gx, gy)) {
            saveState();
            placePiece(piece, gx, gy);
            activePiece.remove();
            activePiece = null;
            
            checkLines();
            if (pieceTray.children.length === 0) generatePieces();
            if (isGameOver()) showGameOver();
            return;
        }
    }

    // Reset
    activePiece.style.position = 'static';
    activePiece.style.transform = 'scale(1)';
    activePiece.style.pointerEvents = 'auto';
    activePiece = null;
}

function canPlace(piece, centerX, centerY) {
    const shape = piece.shape;
    const offX = Math.floor(shape[0].length / 2);
    const offY = Math.floor(shape.length / 2);
    
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const targetX = centerX - offX + x;
                const targetY = centerY - offY + y;
                if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE || grid[targetY][targetX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece(piece, centerX, centerY) {
    const shape = piece.shape;
    const offX = Math.floor(shape[0].length / 2);
    const offY = Math.floor(shape.length / 2);
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                grid[centerY - offY + y][centerX - offX + x] = 1;
            }
        }
    }
    renderGrid();
}

function checkLines() {
    let r = [], c = [];
    for (let y = 0; y < GRID_SIZE; y++) if (grid[y].every(v => v)) r.push(y);
    for (let x = 0; x < GRID_SIZE; x++) {
        let full = true;
        for (let y = 0; y < GRID_SIZE; y++) if (!grid[y][x]) full = false;
        if (full) c.push(x);
    }
    if (r.length || c.length) {
        flashLayer.classList.add('flash-active');
        setTimeout(() => flashLayer.classList.remove('flash-active'), 300);
        r.forEach(y => grid[y] = Array(GRID_SIZE).fill(0));
        c.forEach(x => { for (let y = 0; y < GRID_SIZE; y++) grid[y][x] = 0; });
        score += (r.length + c.length) * 100;
        updateScore();
        setTimeout(renderGrid, 100);
    }
}

function saveState() {
    lastState = {
        grid: JSON.parse(JSON.stringify(grid)),
        score: score,
        pieces: [...currentPiecesData],
        trayIndices: Array.from(pieceTray.children).map(p => parseInt(p.dataset.index))
    };
    updateScore();
}

function undo() {
    if (!lastState) return;
    grid = lastState.grid;
    score = lastState.score;
    currentPiecesData = [...lastState.pieces];
    
    pieceTray.innerHTML = '';
    lastState.trayIndices.forEach(idx => {
        createPieceElement(currentPiecesData[idx], idx);
    });

    lastState = null;
    updateScore();
    renderGrid();
}

function isGameOver() {
    const trayPieces = Array.from(pieceTray.children).map(p => currentPiecesData[parseInt(p.dataset.index)]);
    for (const piece of trayPieces) {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (canPlace(piece, x, y)) return false;
            }
        }
    }
    return true;
}

function showGameOver() {
    gameOverOverlay.classList.remove('hidden');
    finalScoreVal.textContent = score;
}

init();
