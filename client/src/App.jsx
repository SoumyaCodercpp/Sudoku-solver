import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [initialBoard, setInitialBoard] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameState, setGameState] = useState('idle');
  const [errors, setErrors] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timer, setTimer] = useState(0);
  const [message, setMessage] = useState('');

  // Timer
  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      
      // Number keys 1-9
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleNumberInput(parseInt(e.key));
      }
      // Delete/Backspace to erase
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleNumberInput(0);
      }
      // Arrow keys for navigation
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        if (!selectedCell) {
          setSelectedCell({ row: 0, col: 0 });
          return;
        }
        
        const { row, col } = selectedCell;
        
        if (e.key === 'ArrowUp' && row > 0) {
          setSelectedCell({ row: row - 1, col });
        } else if (e.key === 'ArrowDown' && row < 8) {
          setSelectedCell({ row: row + 1, col });
        } else if (e.key === 'ArrowLeft' && col > 0) {
          setSelectedCell({ row, col: col - 1 });
        } else if (e.key === 'ArrowRight' && col < 8) {
          setSelectedCell({ row, col: col + 1 });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedCell]);

  const newGame = useCallback(async (diff) => {
    try {
      const response = await fetch(`${API_URL}/puzzle?difficulty=${diff || difficulty}`);
      const data = await response.json();
      
      if (data.success) {
        setBoard(data.puzzle);
        setInitialBoard(data.puzzle.map(row => [...row]));
        setSelectedCell(null);
        setGameState('playing');
        setErrors([]);
        setHintsUsed(0);
        setTimer(0);
        setMessage('');
      }
    } catch (error) {
      setMessage('Failed to connect to server');
    }
  }, [difficulty]);

  const handleCellClick = (row, col) => {
    if (gameState === 'playing') {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberInput = async (number) => {
    if (!selectedCell || gameState !== 'playing') return;
    
    const { row, col } = selectedCell;
    
    if (initialBoard && initialBoard[row][col] !== 0) return;
    
    const newBoard = board.map(r => [...r]);
    
    if (number === 0) {
      newBoard[row][col] = 0;
      setBoard(newBoard);
      setErrors(errors.filter(e => e.row !== row || e.col !== col));
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: newBoard, row, col, value: number })
      });
      const data = await response.json();
      
      newBoard[row][col] = number;
      setBoard(newBoard);
      
      if (data.valid) {
        setErrors(errors.filter(e => e.row !== row || e.col !== col));
      } else {
        setErrors([...errors, { row, col }]);
      }
      
      if (newBoard.every(row => row.every(cell => cell !== 0))) {
        checkComplete(newBoard);
      }
    } catch (error) {
      setMessage('Validation failed');
    }
  };

  const checkComplete = async (currentBoard) => {
    try {
      const response = await fetch(`${API_URL}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: currentBoard })
      });
      const data = await response.json();
      
      if (data.isValid) {
        setGameState('solved');
        setMessage('Puzzle solved in ' + formatTime(timer) + '!');
      }
    } catch (error) {
      console.error('Check failed');
    }
  };

  const getHint = async () => {
    if (gameState !== 'playing') return;
    if (hintsUsed >= 3) {
      setMessage('No hints remaining!');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board })
      });
      const data = await response.json();
      
      if (data.success && data.hint) {
        const newBoard = board.map(r => [...r]);
        newBoard[data.hint.row][data.hint.col] = data.hint.value;
        setBoard(newBoard);
        setHintsUsed(h => h + 1);
        setSelectedCell({ row: data.hint.row, col: data.hint.col });
        
        if (hintsUsed + 1 >= 3) {
          setMessage('No more hints available');
        }
      }
    } catch (error) {
      setMessage('Hint failed');
    }
  };

  const solvePuzzle = async () => {
    if (gameState !== 'playing') return;
    
    try {
      const response = await fetch(`${API_URL}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board })
      });
      const data = await response.json();
      
      if (data.success && data.solved) {
        setBoard(data.solution);
        setGameState('solved');
        setMessage('Solved by algorithm');
      } else {
        setMessage('No solution exists');
      }
    } catch (error) {
      setMessage('Solve failed. Is the server running?');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
  };

  const isError = (row, col) => errors.some(e => e.row === row && e.col === col);
  const isSelected = (row, col) => selectedCell?.row === row && selectedCell?.col === col;
  const isInitial = (row, col) => initialBoard && initialBoard[row][col] !== 0;

  return (
    <div className="app">
      <div className="header">
        <h1>Sudoku Solver</h1>
        <p className="subtitle">Master the Grid</p>
      </div>
      
      <div className="difficulty-selector">
        {['easy', 'medium', 'hard', 'expert'].map(diff => (
          <button
            key={diff}
            className={`diff-btn ${difficulty === diff ? 'active' : ''}`}
            onClick={() => { setDifficulty(diff); newGame(diff); }}
          >
            {diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-icon">⏱</span>
          <span className="stat-value">{formatTime(timer)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">💡</span>
          <span className="stat-value">{hintsUsed}/3</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">❌</span>
          <span className="stat-value">{errors.length}</span>
        </div>
      </div>

      <div className="board-container">
        <div className="board">
          {board.map((row, r) => (
            <div key={r} className="board-row">
              {row.map((cell, c) => (
                <div
                  key={c}
                  className={`
                    cell
                    ${isSelected(r, c) ? 'selected' : ''}
                    ${isError(r, c) ? 'error' : ''}
                    ${isInitial(r, c) ? 'initial' : ''}
                    ${c % 3 === 2 && c !== 8 ? 'border-right' : ''}
                    ${r % 3 === 2 && r !== 8 ? 'border-bottom' : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell !== 0 ? cell : ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {gameState === 'playing' && (
        <div className="number-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="num-btn" onClick={() => handleNumberInput(num)}>
              {num}
            </button>
          ))}
          <button className="num-btn erase" onClick={() => handleNumberInput(0)}>⌫</button>
        </div>
      )}

      <div className="controls">
        <button className="ctrl-btn primary" onClick={() => newGame()}>🆕 New Game</button>
        <button className="ctrl-btn" onClick={getHint} disabled={gameState !== 'playing' || hintsUsed >= 3}>
          💡 Hint ({3 - hintsUsed})
        </button>
        <button className="ctrl-btn solve" onClick={solvePuzzle} disabled={gameState !== 'playing'}>
          🚀 Solve
        </button>
      </div>

      {message && <div className="message">{message}</div>}
    </div>
  );
}

export default App;