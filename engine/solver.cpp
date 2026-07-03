// engine/solver_cli.cpp
#include <iostream>
#include <vector>
#include <random>
#include <algorithm>
#include <chrono>
#include <cstring>
#include <sstream>

using namespace std;

class SudokuEngine {
private:
    static const int SIZE = 9;
    static const int BOX_SIZE = 3;
    static const int EMPTY = 0;
    
    mt19937 rng;
    int steps = 0;
    int backtracks = 0;

public:
    SudokuEngine() {
        rng.seed(chrono::steady_clock::now().time_since_epoch().count());
    }

    bool solve(int board[9][9]) {
        steps = 0;
        backtracks = 0;
        return backtrack(board);
    }

    void generatePuzzle(int board[9][9], int difficulty) {
        for (int i = 0; i < SIZE; i++)
            for (int j = 0; j < SIZE; j++)
                board[i][j] = EMPTY;
        
        fillDiagonalBoxes(board);
        backtrack(board);
        
        int toRemove;
        switch(difficulty) {
            case 0: toRemove = 40; break;
            case 1: toRemove = 50; break;
            case 2: toRemove = 55; break;
            case 3: toRemove = 60; break;
            default: toRemove = 45;
        }
        removeNumbers(board, toRemove);
    }

    bool isValidMove(int board[9][9], int row, int col, int value) {
        for (int c = 0; c < SIZE; c++)
            if (c != col && board[row][c] == value) return false;
        
        for (int r = 0; r < SIZE; r++)
            if (r != row && board[r][col] == value) return false;
        
        int boxRow = (row / BOX_SIZE) * BOX_SIZE;
        int boxCol = (col / BOX_SIZE) * BOX_SIZE;
        for (int r = boxRow; r < boxRow + BOX_SIZE; r++)
            for (int c = boxCol; c < boxCol + BOX_SIZE; c++)
                if (board[r][c] == value) return false;
        
        return true;
    }

    void getHint(int board[9][9], int &hintRow, int &hintCol, int &hintValue) {
        int solved[9][9];
        memcpy(solved, board, sizeof(int) * 81);
        backtrack(solved);
        
        for (int i = 0; i < SIZE; i++) {
            for (int j = 0; j < SIZE; j++) {
                if (board[i][j] == EMPTY) {
                    hintRow = i;
                    hintCol = j;
                    hintValue = solved[i][j];
                    return;
                }
            }
        }
        hintRow = -1;
        hintCol = -1;
        hintValue = -1;
    }

    int getSteps() { return steps; }
    int getBacktracks() { return backtracks; }

private:
    bool backtrack(int board[9][9]) {
        int row, col;
        if (!findEmpty(board, row, col)) return true;
        
        steps++;
        
        for (int num = 1; num <= 9; num++) {
            if (isValidMove(board, row, col, num)) {
                board[row][col] = num;
                if (backtrack(board)) return true;
                board[row][col] = EMPTY;
                backtracks++;
            }
        }
        return false;
    }

    bool findEmpty(int board[9][9], int &row, int &col) {
        for (row = 0; row < SIZE; row++)
            for (col = 0; col < SIZE; col++)
                if (board[row][col] == EMPTY) return true;
        return false;
    }

    void fillDiagonalBoxes(int board[9][9]) {
        for (int box = 0; box < SIZE; box += BOX_SIZE) {
            vector<int> nums = {1,2,3,4,5,6,7,8,9};
            shuffle(nums.begin(), nums.end(), rng);
            int idx = 0;
            for (int i = 0; i < BOX_SIZE; i++)
                for (int j = 0; j < BOX_SIZE; j++)
                    board[box + i][box + j] = nums[idx++];
        }
    }

    void removeNumbers(int board[9][9], int count) {
        vector<pair<int,int>> positions;
        for (int i = 0; i < SIZE; i++)
            for (int j = 0; j < SIZE; j++)
                positions.push_back({i, j});
        shuffle(positions.begin(), positions.end(), rng);
        
        int removed = 0;
        for (auto &pos : positions) {
            if (removed >= count) break;
            int backup = board[pos.first][pos.second];
            board[pos.first][pos.second] = EMPTY;
            if (hasUniqueSolution(board)) removed++;
            else board[pos.first][pos.second] = backup;
        }
    }

    bool hasUniqueSolution(int board[9][9]) {
        int copy[9][9];
        memcpy(copy, board, sizeof(int) * 81);
        return countSolutions(copy, 2) == 1;
    }

    int countSolutions(int board[9][9], int limit) {
        int row, col;
        if (!findEmpty(board, row, col)) return 1;
        
        int count = 0;
        for (int num = 1; num <= 9; num++) {
            if (isValidMove(board, row, col, num)) {
                board[row][col] = num;
                count += countSolutions(board, limit - count);
                board[row][col] = EMPTY;
                if (count >= limit) break;
            }
        }
        return count;
    }
};

void printBoard(int board[9][9]) {
    cout << "[";
    for (int i = 0; i < 9; i++) {
        cout << "[";
        for (int j = 0; j < 9; j++) {
            cout << board[i][j];
            if (j < 8) cout << ",";
        }
        cout << "]";
        if (i < 8) cout << ",";
    }
    cout << "]";
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        cerr << "Usage: engine.exe [generate|solve|validate|hint] [args...]" << endl;
        return 1;
    }
    
    string command = argv[1];
    SudokuEngine engine;
    
    if (command == "generate") {
        int difficulty = argc > 2 ? atoi(argv[2]) : 1;
        int board[9][9];
        engine.generatePuzzle(board, difficulty);
        printBoard(board);
        cout << endl;
    }
    else if (command == "solve") {
        int board[9][9];
        for (int i = 0; i < 9; i++)
            for (int j = 0; j < 9; j++)
                cin >> board[i][j];
        
        auto start = chrono::high_resolution_clock::now();
        bool solved = engine.solve(board);
        auto end = chrono::high_resolution_clock::now();
        double timeMs = chrono::duration<double, milli>(end - start).count();
        
        cout << "{\"solved\":" << (solved ? "true" : "false");
        if (solved) {
            cout << ",\"board\":";
            printBoard(board);
            cout << ",\"stats\":{\"steps\":" << engine.getSteps() 
                 << ",\"backtracks\":" << engine.getBacktracks() 
                 << ",\"timeMs\":" << timeMs << "}";
        }
        cout << "}" << endl;
    }
    else if (command == "validate") {
        int board[9][9];
        for (int i = 0; i < 9; i++)
            for (int j = 0; j < 9; j++)
                cin >> board[i][j];
        
        int row, col, value;
        cin >> row >> col >> value;
        
        cout << "{\"valid\":" << (engine.isValidMove(board, row, col, value) ? "true" : "false") << "}" << endl;
    }
    else if (command == "hint") {
        int board[9][9];
        for (int i = 0; i < 9; i++)
            for (int j = 0; j < 9; j++)
                cin >> board[i][j];
        
        int hr, hc, hv;
        engine.getHint(board, hr, hc, hv);
        
        cout << "{\"row\":" << hr << ",\"col\":" << hc << ",\"value\":" << hv << "}" << endl;
    }
    
    return 0;
}