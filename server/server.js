const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const ENGINE_PATH = path.join(__dirname, '..', 'engine', 'engine.exe');

// Check engine exists on startup
if (!fs.existsSync(ENGINE_PATH)) {
    console.error('❌ C++ Engine not found! Run: npm run build-engine');
    process.exit(1);
}

console.log('✅ C++ Engine ready');

function callEngine(command, stdinData = '') {
    const result = execSync(`"${ENGINE_PATH}" ${command}`, {
        input: stdinData,
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true
    });
    return JSON.parse(result.trim());
}

// Generate puzzle
app.get('/api/puzzle', (req, res) => {
    const diffMap = { easy: 0, medium: 1, hard: 2, expert: 3 };
    const difficulty = diffMap[req.query.difficulty] || 1;
    
    const puzzle = callEngine(`generate ${difficulty}`);
    res.json({ success: true, puzzle, difficulty: req.query.difficulty || 'medium' });
});

// Solve puzzle
app.post('/api/solve', (req, res) => {
    const { board } = req.body;
    let input = '';
    for (let i = 0; i < 9; i++)
        input += board[i].join(' ') + '\n';
    
    const result = callEngine('solve', input);
    res.json({
        success: true,
        solved: result.solved,
        solution: result.solved ? result.board : null,
        stats: result.stats || null
    });
});

// Validate move
app.post('/api/validate', (req, res) => {
    const { board, row, col, value } = req.body;
    let input = '';
    for (let i = 0; i < 9; i++)
        input += board[i].join(' ') + '\n';
    input += `${row} ${col} ${value}`;
    
    const result = callEngine('validate', input);
    res.json({ success: true, valid: result.valid });
});

// Get hint
app.post('/api/hint', (req, res) => {
    const { board } = req.body;
    let input = '';
    for (let i = 0; i < 9; i++)
        input += board[i].join(' ') + '\n';
    
    const result = callEngine('hint', input);
    res.json({ success: true, hint: result.row !== -1 ? result : null });
});

// Check board
app.post('/api/check', (req, res) => {
    const { board } = req.body;
    let input = '';
    for (let i = 0; i < 9; i++)
        input += board[i].join(' ') + '\n';
    
    const result = callEngine('solve', input);
    
    const errors = [];
    if (result.solved) {
        for (let i = 0; i < 9; i++)
            for (let j = 0; j < 9; j++)
                if (board[i][j] !== 0 && board[i][j] !== result.board[i][j])
                    errors.push({ row: i, col: j });
    }
    
    const isComplete = board.every(row => row.every(cell => cell !== 0));
    res.json({
        success: true,
        errors,
        isComplete,
        isValid: isComplete && errors.length === 0
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});