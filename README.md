# 🎯 Sudoku Solver

A Sudoku application with a **C++ backtracking engine**, Node.js/Express REST API, and React frontend.


## ✨ Features

- 🧠 **C++ Solving Engine** - Backtracking algorithm with MRV heuristic
- 🎮 **4 Difficulty Levels** - Easy, Medium, Hard, Expert
- ✅ **Real-time Validation** - Instant error highlighting with shake animation
- 💡 **Smart Hints** - Get help when stuck
- 🚀 **Auto-Solve** - Complete puzzle in milliseconds
- ⏱ **Timer & Stats** - Track your solving time, hints used, and errors
- 📱 **Responsive Design** - Works on desktop and mobile



## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, CSS3 |
| Backend | Node.js, Express |
| Engine | C++ (backtracking with MRV) |
| API | RESTful JSON |


## 📦 Installation

```bash
# Clone repository
git clone https://github.com/SoumyaCodercpp/Sudoku-solver.git
cd Sudoku-solver

# Install dependencies
npm install
npm run install-all

# Build C++ engine
npm run build-engine

# Start everything (server + client)
npm run dev

```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/puzzle?difficulty=medium` | Generate new puzzle |
| `POST` | `/api/solve` | Solve puzzle |
| `POST` | `/api/validate` | Check single move |
| `POST` | `/api/hint` | Get next hint |
| `POST` | `/api/check` | Find all errors |

## 📊 Performance

| Difficulty | Empty Cells | Avg Solve Time |
|------------|-------------|----------------|
| Easy | 40 | < 1ms |
| Medium | 50 | < 2ms |
| Hard | 55 | < 5ms |
| Expert | 60 | < 10ms |
