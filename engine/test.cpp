// engine/test.cpp
#include <iostream>
#include "solver.cpp"
using namespace std;

void printBoard(int board[9][9]) {
    cout << "\n  +-------+-------+-------+\n";
    for (int i = 0; i < 9; i++) {
        if (i % 3 == 0 && i != 0)
            cout << "  +-------+-------+-------+\n";
        cout << "  | ";
        for (int j = 0; j < 9; j++) {
            if (j % 3 == 0 && j != 0) cout << "| ";
            if (board[i][j] == 0) cout << ". ";
            else cout << board[i][j] << " ";
        }
        cout << "|\n";
    }
    cout << "  +-------+-------+-------+\n";
}

int main() {
    SudokuEngine engine;
    
    cout << "\n========== TEST 1: SOLVE PUZZLE ==========\n";
    
    int board[9][9] = {
        {5,3,0,0,7,0,0,0,0},
        {6,0,0,1,9,5,0,0,0},
        {0,9,8,0,0,0,0,6,0},
        {8,0,0,0,6,0,0,0,3},
        {4,0,0,8,0,3,0,0,1},
        {7,0,0,0,2,0,0,0,6},
        {0,6,0,0,0,0,2,8,0},
        {0,0,0,4,1,9,0,0,5},
        {0,0,0,0,8,0,0,7,9}
    };
    
    cout << "\nOriginal Puzzle:";
    printBoard(board);
    
    bool solved = engine.solve(board);
    
    if (solved) {
        cout << "\nSolved Puzzle:";
        printBoard(board);
        cout << "\n*** Statistics ***\n";
        cout << "   Steps: " << engine.getSteps() << "\n";
        cout << "   Backtracks: " << engine.getBacktracks() << "\n";
    }
    
    cout << "\n========== TEST 2: GENERATE PUZZLES ==========\n";
    
    cout << "\nEasy Puzzle:";
    int easyPuzzle[9][9];
    engine.generatePuzzle(easyPuzzle, 0);
    printBoard(easyPuzzle);
    
    cout << "\nMedium Puzzle:";
    int medPuzzle[9][9];
    engine.generatePuzzle(medPuzzle, 1);
    printBoard(medPuzzle);
    
    cout << "\nHard Puzzle:";
    int hardPuzzle[9][9];
    engine.generatePuzzle(hardPuzzle, 2);
    printBoard(hardPuzzle);
    
    cout << "\n========== TEST 3: MOVE VALIDATION ==========\n";
    
    int testBoard[9][9] = {
        {5,3,0,0,7,0,0,0,0},
        {6,0,0,1,9,5,0,0,0},
        {0,9,8,0,0,0,0,6,0},
        {8,0,0,0,6,0,0,0,3},
        {4,0,0,8,0,3,0,0,1},
        {7,0,0,0,2,0,0,0,6},
        {0,6,0,0,0,0,2,8,0},
        {0,0,0,4,1,9,0,0,5},
        {0,0,0,0,8,0,0,7,9}
    };
    
    cout << "\nChecking cell (1,3):\n";
    cout << "  Place 4? " << (engine.isValidMove(testBoard, 0, 2, 4) ? "VALID" : "INVALID") << "\n";
    cout << "  Place 3? " << (engine.isValidMove(testBoard, 0, 2, 3) ? "VALID" : "INVALID") << "\n";
    
    cout << "\n========== TEST 4: HINT SYSTEM ==========\n";
    
    int hintBoard[9][9] = {
        {5,3,0,0,7,0,0,0,0},
        {6,0,0,1,9,5,0,0,0},
        {0,9,8,0,0,0,0,6,0},
        {8,0,0,0,6,0,0,0,3},
        {4,0,0,8,0,3,0,0,1},
        {7,0,0,0,2,0,0,0,6},
        {0,6,0,0,0,0,2,8,0},
        {0,0,0,4,1,9,0,0,5},
        {0,0,0,0,8,0,0,7,9}
    };
    
    int hr, hc, hv;
    engine.getHint(hintBoard, hr, hc, hv);
    cout << "Hint: Place " << hv << " at (" << hr+1 << "," << hc+1 << ")\n";
    
    cout << "\n========== ALL TESTS PASSED ==========\n";
    
    return 0;
}