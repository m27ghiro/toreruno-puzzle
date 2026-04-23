const GRID_SIZE = 10;
const gridContainer = document.getElementById('grid-container');
const pieceTray = document.getElementById('piece-tray');
const scoreElement = document.getElementById('score');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreVal = document.getElementById('final-score-val');
const restartBtn = document.getElementById('restart-btn');

let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
let score = 0;
let activePiece = null;
let dragStartX, dragStartY;
let originalPieceX, originalPieceY;

// Piece Definitions (shapes)
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

function initGame() {
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    updateScore();
    renderGrid();
    generatePieces();
    gameOverOverlay.classList.add('hidden');
}

function renderGrid() {
    gridContainer.innerHTML = '';
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            if (grid[y][x]) cell.classList.add('filled');
            cell.dataset.x = x;
            cell.dataset.y = y;
            gridContainer.appendChild(cell);
        }
    }
}

function updateScore() {
    scoreElement.textContent = score;
}

function generatePieces() {
    pieceTray.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const pieceData = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        createPieceElement(pieceData);
    }
}

function createPieceElement(pieceData) {
    const pieceWrapper = document.createElement('div');
    pieceWrapper.className = 'draggable-piece';
    
    const pieceGrid = document.createElement('div');
    pieceGrid.className = 'piece-grid';
    pieceGrid.style.gridTemplateColumns = `repeat(${pieceData.shape[0].length}, 1fr)`;
    
    // Find the center of the piece to place the logo
    const height = pieceData.shape.length;
    const width = pieceData.shape[0].length;
    const centerY = Math.floor(height / 2);
    const centerX = Math.floor(width / 2);

    pieceData.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            const block = document.createElement('div');
            block.className = 'piece-block';
            if (value) {
                block.style.background = pieceData.color;
                // If it's the middle block, add the logo
                if (y === centerY && x === centerX) {
                    const logo = document.createElement('img');
                    logo.src = 'logo.png';
                    logo.className = 'block-logo';
                    block.appendChild(logo);
                }
            } else {
                block.style.visibility = 'hidden';
            }
            pieceGrid.appendChild(block);
        });
    });

    pieceWrapper.appendChild(pieceGrid);
    pieceTray.appendChild(pieceWrapper);

    // Event Listeners for Dragging
    pieceWrapper.addEventListener('mousedown', startDrag);
    pieceWrapper.addEventListener('touchstart', startDrag, { passive: false });
}

function startDrag(e) {
    if (activePiece) return;
    
    activePiece = e.currentTarget;
    const rect = activePiece.getBoundingClientRect();
    
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    dragStartX = clientX - rect.left;
    dragStartY = clientY - rect.top;

    activePiece.style.position = 'fixed';
    activePiece.style.width = rect.width + 'px';
    activePiece.style.zIndex = '1000';
    activePiece.style.transform = 'scale(1.2)';
    activePiece.style.pointerEvents = 'none'; // Crucial for elementFromPoint to work
    
    updateDragPosition(clientX, clientY);

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
}

function onDrag(e) {
    if (!activePiece) return;
    if (e.type === 'touchmove') e.preventDefault(); // Prevent scrolling while dragging

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    updateDragPosition(clientX, clientY);
}

function updateDragPosition(x, y) {
    // Offset the piece so it's visible above the finger/cursor
    activePiece.style.left = (x - dragStartX) + 'px';
    activePiece.style.top = (y - dragStartY - 60) + 'px'; 
}

function endDrag(e) {
    if (!activePiece) return;

    const rect = activePiece.getBoundingClientRect();
    // Use the visual center of the piece for placement
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const cellBelow = document.elementFromPoint(centerX, centerY);
    const gridCell = cellBelow ? cellBelow.closest('.grid-cell') : null;

    if (gridCell) {
        const targetX = parseInt(gridCell.dataset.x);
        const targetY = parseInt(gridCell.dataset.y);
        
        if (tryPlacePiece(activePiece, targetX, targetY)) {
            activePiece.remove();
            checkLines();
            if (pieceTray.children.length === 0) {
                generatePieces();
            }
            if (checkGameOver()) {
                showGameOver();
            }
        } else {
            resetPiecePosition();
        }
    } else {
        resetPiecePosition();
    }

    if (activePiece) {
        activePiece.style.pointerEvents = 'auto';
        activePiece.style.transform = 'scale(1)';
    }
    activePiece = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
}

function resetPiecePosition() {
    activePiece.style.position = 'static';
    activePiece.style.width = 'auto';
    activePiece.style.zIndex = '1';
}

function tryPlacePiece(pieceEl, startX, startY) {
    const pieceGrid = pieceEl.querySelector('.piece-grid');
    const cols = parseInt(pieceGrid.style.gridTemplateColumns.match(/\d+/)[0]);
    const blocks = Array.from(pieceGrid.children);
    const shape = [];
    
    // Reconstruct shape from elements
    for (let i = 0; i < blocks.length; i += cols) {
        const row = blocks.slice(i, i + cols).map(b => b.style.visibility !== 'hidden' ? 1 : 0);
        shape.push(row);
    }

    // Offset placement so the center of the piece is where the finger is
    const offsetX = Math.floor(shape[0].length / 2);
    const offsetY = Math.floor(shape.length / 2);
    const finalX = startX - offsetX;
    const finalY = startY - offsetY;

    // Validate bounds and collisions
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const gx = finalX + x;
                const gy = finalY + y;
                if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE || grid[gy][gx]) {
                    return false;
                }
            }
        }
    }

    // Place it
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                grid[finalY + y][finalX + x] = 1;
            }
        }
    }

    renderGrid();
    return true;
}

function checkLines() {
    let linesCleared = 0;
    const rowsToClear = [];
    const colsToClear = [];

    // Check rows
    for (let y = 0; y < GRID_SIZE; y++) {
        if (grid[y].every(cell => cell === 1)) {
            rowsToClear.push(y);
        }
    }

    // Check columns
    for (let x = 0; x < GRID_SIZE; x++) {
        let colFull = true;
        for (let y = 0; y < GRID_SIZE; y++) {
            if (grid[y][x] === 0) {
                colFull = false;
                break;
            }
        }
        if (colFull) colsToClear.push(x);
    }

    // Clear and score
    rowsToClear.forEach(y => {
        grid[y] = Array(GRID_SIZE).fill(0);
        linesCleared++;
    });

    colsToClear.forEach(x => {
        for (let y = 0; y < GRID_SIZE; y++) {
            grid[y][x] = 0;
        }
        linesCleared++;
    });

    if (linesCleared > 0) {
        score += linesCleared * 100 * linesCleared; // Bonus for combo
        updateScore();
        renderGrid();
        // Add a "clear" effect (optional)
    }
}

function checkGameOver() {
    const pieces = Array.from(pieceTray.children);
    if (pieces.length === 0) return false;

    for (let pieceEl of pieces) {
        const pieceGrid = pieceEl.querySelector('.piece-grid');
        const cols = parseInt(pieceGrid.style.gridTemplateColumns.match(/\d+/)[0]);
        const blocks = Array.from(pieceGrid.children);
        const shape = [];
        for (let i = 0; i < blocks.length; i += cols) {
            const row = blocks.slice(i, i + cols).map(b => b.style.visibility !== 'hidden' ? 1 : 0);
            shape.push(row);
        }

        // Try every position on grid
        for (let gy = 0; gy <= GRID_SIZE - shape.length; gy++) {
            for (let gx = 0; gx <= GRID_SIZE - shape[0].length; gx++) {
                let canPlace = true;
                for (let py = 0; py < shape.length; py++) {
                    for (let px = 0; px < shape[py].length; px++) {
                        if (shape[py][px] && grid[gy + py][gx + px]) {
                            canPlace = false;
                            break;
                        }
                    }
                    if (!canPlace) break;
                }
                if (canPlace) return false;
            }
        }
    }
    return true;
}

function showGameOver() {
    gameOverOverlay.classList.remove('hidden');
    finalScoreVal.textContent = score;
}

restartBtn.addEventListener('click', initGame);

// Start the game
initGame();
