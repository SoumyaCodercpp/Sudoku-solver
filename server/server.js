const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const ENGINE_PATH = path.join(__dirname, '..', 'engine', 'engine.exe');
const engineExists = fs.existsSync(ENGINE_PATH);

console.log(engineExists ? '✅ Using C++ Engine' : '⚠️ C++ Engine not found, using JavaScript fallback');

// ==========================================
// C++ ENGINE CALL
// ==========================================
function callCppEngine(command, stdinData = '') {
    if (!engineExists) return null;
    
    try {
        const result = execSync(`"${ENGINE_PATH}" ${command}`, {
            input: stdinData,
            encoding: 'utf8',
            timeout: 10000,
            windowsHide: true
        });
        return JSON.parse(result.trim());
    } catch (error) {
        return null;
    }
}

// ==========================================
// JAVASCRIPT FALLBACK SOLVER
// ==========================================
function solveJS(board) {
    const copy = board.map(row => [...row]);
    return backtrackJS(copy) ? copy : null;
}

function backtrackJS(board) {
    const empty = findEmptyJS(board);
    if (!empty) return true;
    
    const [row, col] = empty;
    for (let num = 1; num <= 9; num++) {
        if (isValidMoveJS(board, row, col, num)) {
            board[row][col] = num;
            if (backtrackJS(board)) return true;
            board[row][col] = 0;
        }
    }
    return false;
}

function findEmptyJS(board) {
    for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
            if (board[i][j] === 0) return [i, j];
    return null;
}

function isValidMoveJS(board, row, col, num) {
    for (let x = 0; x < 9; x++)
        if (board[row][x] === num) return false;
    
    for (let x = 0; x < 9; x++)
        if (board[x][col] === num) return false;
    
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (board[boxRow + i][boxCol + j] === num) return false;
    
    return true;
}

function generatePuzzleJS(difficulty) {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    
    for (let box = 0; box < 9; box += 3) {
        const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
        let idx = 0;
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++)
                board[box + i][box + j] = nums[idx++];
    }
    
    backtrackJS(board);
    
    const removeCount = { easy: 40, medium: 50, hard: 55, expert: 60 }[difficulty] || 50;
    const positions = [];
    for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
            positions.push([i, j]);
    positions.sort(() => Math.random() - 0.5);
    
    let removed = 0;
    for (const [row, col] of positions) {
        if (removed >= removeCount) break;
        board[row][col] = 0;
        removed++;
    }
    
    return board;
}

// ==========================================
// API ROUTES
// ==========================================

app.get('/api/puzzle', (req, res) => {
    try {
        const diffMap = { easy: 0, medium: 1, hard: 2, expert: 3 };
        const difficulty = diffMap[req.query.difficulty] || 1;
        const diffName = req.query.difficulty || 'medium';
        
        const puzzle = callCppEngine(`generate ${difficulty}`);
        
        if (puzzle) {
            res.json({ success: true, puzzle, difficulty: diffName });
        } else {
            const jsPuzzle = generatePuzzleJS(diffName);
            res.json({ success: true, puzzle: jsPuzzle, difficulty: diffName });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/solve', (req, res) => {
    try {
        const { board } = req.body;
        let input = '';
        for (let i = 0; i < 9; i++)
            input += board[i].join(' ') + '\n';
        
        const result = callCppEngine('solve', input);
        
        if (result && result.solved) {
            res.json({ success: true, solved: true, solution: result.board, stats: result.stats });
        } else {
            const jsSolved = solveJS(board.map(r => [...r]));
            res.json({ success: true, solved: jsSolved !== null, solution: jsSolved });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/validate', (req, res) => {
    try {
        const { board, row, col, value } = req.body;
        let input = '';
        for (let i = 0; i < 9; i++)
            input += board[i].join(' ') + '\n';
        input += `${row} ${col} ${value}`;
        
        const result = callCppEngine('validate', input);
        const valid = result ? result.valid : isValidMoveJS(board, row, col, value);
        
        res.json({ success: true, valid });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/hint', (req, res) => {
    try {
        const { board } = req.body;
        let input = '';
        for (let i = 0; i < 9; i++)
            input += board[i].join(' ') + '\n';
        
        const result = callCppEngine('hint', input);
        
        if (result && result.row !== -1) {
            res.json({ success: true, hint: result });
        } else {
            const solved = solveJS(board.map(r => [...r]));
            if (solved) {
                for (let i = 0; i < 9; i++)
                    for (let j = 0; j < 9; j++)
                        if (board[i][j] === 0)
                            return res.json({ success: true, hint: { row: i, col: j, value: solved[i][j] } });
            }
            res.json({ success: true, hint: null });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/check', (req, res) => {
    try {
        const { board } = req.body;
        let input = '';
        for (let i = 0; i < 9; i++)
            input += board[i].join(' ') + '\n';
        
        const result = callCppEngine('solve', input);
        const solved = result?.solved ? result.board : solveJS(board.map(r => [...r]));
        
        if (solved) {
            const errors = [];
            for (let i = 0; i < 9; i++)
                for (let j = 0; j < 9; j++)
                    if (board[i][j] !== 0 && board[i][j] !== solved[i][j])
                        errors.push({ row: i, col: j });
            
            const isComplete = board.every(row => row.every(cell => cell !== 0));
            res.json({ success: true, errors, isComplete, isValid: isComplete && errors.length === 0 });
        } else {
            res.json({ success: true, errors: [], isComplete: false, isValid: false });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});