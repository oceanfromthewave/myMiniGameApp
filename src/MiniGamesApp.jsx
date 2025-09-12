import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Pause, Play } from 'lucide-react';

// 2048 Game Component
const Game2048 = ({ onBack }) => {
  const [board, setBoard] = useState(() => {
    const newBoard = Array(4).fill(null).map(() => Array(4).fill(0));
    addRandomTile(newBoard);
    addRandomTile(newBoard);
    return newBoard;
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  function addRandomTile(board) {
    const emptyCells = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      board[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  const move = useCallback((direction) => {
    if (gameOver) return;
    
    const newBoard = board.map(row => [...row]);
    let moved = false;
    let newScore = score;

    const moveLeft = (board) => {
      for (let i = 0; i < 4; i++) {
        const row = board[i].filter(val => val !== 0);
        for (let j = 0; j < row.length - 1; j++) {
          if (row[j] === row[j + 1]) {
            row[j] *= 2;
            newScore += row[j];
            row[j + 1] = 0;
          }
        }
        const newRow = row.filter(val => val !== 0);
        while (newRow.length < 4) newRow.push(0);
        
        for (let j = 0; j < 4; j++) {
          if (board[i][j] !== newRow[j]) moved = true;
          board[i][j] = newRow[j];
        }
      }
    };

    const rotateBoard = (board) => {
      const n = board.length;
      for (let i = 0; i < n / 2; i++) {
        for (let j = i; j < n - i - 1; j++) {
          const temp = board[i][j];
          board[i][j] = board[n - 1 - j][i];
          board[n - 1 - j][i] = board[n - 1 - i][n - 1 - j];
          board[n - 1 - i][n - 1 - j] = board[j][n - 1 - i];
          board[j][n - 1 - i] = temp;
        }
      }
    };

    if (direction === 'left') {
      moveLeft(newBoard);
    } else if (direction === 'right') {
      rotateBoard(newBoard);
      rotateBoard(newBoard);
      moveLeft(newBoard);
      rotateBoard(newBoard);
      rotateBoard(newBoard);
    } else if (direction === 'up') {
      rotateBoard(newBoard);
      rotateBoard(newBoard);
      rotateBoard(newBoard);
      moveLeft(newBoard);
      rotateBoard(newBoard);
    } else if (direction === 'down') {
      rotateBoard(newBoard);
      moveLeft(newBoard);
      rotateBoard(newBoard);
      rotateBoard(newBoard);
      rotateBoard(newBoard);
    }

    if (moved) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(newScore);
    }
  }, [board, score, gameOver]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          move('right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          move('down');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [move]);

  const resetGame = () => {
    const newBoard = Array(4).fill(null).map(() => Array(4).fill(0));
    addRandomTile(newBoard);
    addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
  };

  const getTileClass = (value) => {
    if (value === 0) return '';
    const known = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    return known.includes(value) ? `tile--v${value}` : 'tile--vHuge';
  };

  return (
        <div className="screen">
      <div className="container">
        {/* Header */}
        <div className="bar mb-6">
          <button
            onClick={onBack}
            className="btn"
          >
            <ChevronLeft size={20} />
            <span>뒤로</span>
          </button>
          <h1 className="title-l">2048</h1>
          <button
            onClick={resetGame}
            className="btn btn--primary"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Score */}
        <div className="text-center mb-6">
          <div className="card">
            <p className="muted">점수</p>
            <p className="title-2xl accent">{score}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="panel">
          <div className="grid-4">
            {board.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`tile ${getTileClass(cell)}`}
                >
                  {cell !== 0 && cell}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="vstack-4">
          <div className="text-center muted mb-4">
            방향키 또는 버튼을 사용하여 플레이하세요
          </div>
          <div className="grid-3">
            <div></div>
            <button
              onClick={() => move('up')}
              className="btn btn--square"
            >
              ↑
            </button>
            <div></div>
            <button
              onClick={() => move('left')}
              className="btn btn--square"
            >
              ←
            </button>
            <div></div>
            <button
              onClick={() => move('right')}
              className="btn btn--square"
            >
              →
            </button>
            <div></div>
            <button
              onClick={() => move('down')}
              className="btn btn--square"
            >
              ↓
            </button>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Tetris Game Component
const TetrisGame = ({ onBack }) => {
  // Game state
  const [board, setBoard] = useState(() => 
    Array(20).fill(null).map(() => Array(10).fill(0))
  );
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Tetris pieces
  const pieces = [
    { shape: [[1,1,1,1]], color: 1 }, // I
    { shape: [[1,1],[1,1]], color: 2 }, // O
    { shape: [[0,1,0],[1,1,1]], color: 3 }, // T
    { shape: [[0,1,1],[1,1,0]], color: 4 }, // S
    { shape: [[1,1,0],[0,1,1]], color: 5 }, // Z
    { shape: [[1,0,0],[1,1,1]], color: 6 }, // L
    { shape: [[0,0,1],[1,1,1]], color: 7 }, // J
  ];

  // Create new piece
  const createPiece = () => {
    const piece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
      shape: piece.shape,
      color: piece.color,
      x: Math.floor((10 - piece.shape[0].length) / 2),
      y: 0
    };
  };

  // Initialize first piece
  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(createPiece());
    }
  }, [currentPiece, gameOver]);

  // Game loop - piece drops automatically
  useEffect(() => {
    if (gameOver || isPaused || !currentPiece) return;

    const dropInterval = Math.max(50, 500 - level * 50);
    const timer = setInterval(() => {
      setCurrentPiece(prev => {
        if (!prev) return prev;
        
        const newPiece = { ...prev, y: prev.y + 1 };
        
        // Check if piece can move down
        if (canPlacePiece(newPiece, board)) {
          return newPiece;
        } else {
          // Place piece on board
          const newBoard = placePieceOnBoard(prev, board);
          const clearedBoard = clearCompleteLines(newBoard);
          setBoard(clearedBoard.board);
          setLines(prevLines => prevLines + clearedBoard.linesCleared);
          setScore(prevScore => prevScore + clearedBoard.linesCleared * 100 * level);
          
          // Check game over
          if (prev.y <= 1) {
            setGameOver(true);
            return null;
          }
          
          // Return null to trigger new piece creation
          return null;
        }
      });
    }, dropInterval);

    return () => clearInterval(timer);
  }, [gameOver, isPaused, currentPiece, level, board]);

  // Check if piece can be placed at position
  const canPlacePiece = (piece, board) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          
          if (boardX < 0 || boardX >= 10 || boardY >= 20) {
            return false;
          }
          
          if (boardY >= 0 && board[boardY][boardX]) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Place piece on board
  const placePieceOnBoard = (piece, board) => {
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }
    
    return newBoard;
  };

  // Clear complete lines
  const clearCompleteLines = (board) => {
    const newBoard = [];
    let linesCleared = 0;
    
    for (let y = 0; y < 20; y++) {
      if (board[y].every(cell => cell !== 0)) {
        linesCleared++;
      } else {
        newBoard.push([...board[y]]);
      }
    }
    
    // Add empty lines at top
    while (newBoard.length < 20) {
      newBoard.unshift(Array(10).fill(0));
    }
    
    return { board: newBoard, linesCleared };
  };

  // Move piece
  const movePiece = (direction) => {
    if (!currentPiece || gameOver || isPaused) return;

    setCurrentPiece(prev => {
      if (!prev) return prev;
      
      let newPiece = { ...prev };
      
      switch (direction) {
        case 'left':
          newPiece.x -= 1;
          break;
        case 'right':
          newPiece.x += 1;
          break;
        case 'down':
          newPiece.y += 1;
          break;
        case 'rotate':
          // Simple rotation - rotate shape matrix
          const rotated = prev.shape[0].map((_, index) =>
            prev.shape.map(row => row[index]).reverse()
          );
          newPiece.shape = rotated;
          break;
        default:
          return prev;
      }
      
      return canPlacePiece(newPiece, board) ? newPiece : prev;
    });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver || isPaused || !currentPiece) return;

      e.preventDefault();
      
      switch (e.key) {
        case 'ArrowLeft':
          movePiece('left');
          break;
        case 'ArrowRight':
          movePiece('right');
          break;
        case 'ArrowDown':
          movePiece('down');
          break;
        case 'ArrowUp':
          movePiece('rotate');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, isPaused, currentPiece, board]);

  // Update level based on lines cleared
  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
    }
  }, [lines, level]);

  // Reset game
  const resetGame = () => {
    setBoard(Array(20).fill(null).map(() => Array(10).fill(0)));
    setCurrentPiece(null);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
  };

  // Get cell class (SASS)
  const getCellClass = (value) => {
    const cls = [
      'tcell-0',
      'tcell-1',
      'tcell-2',
      'tcell-3',
      'tcell-4',
      'tcell-5',
      'tcell-6',
      'tcell-7'
    ];
    return cls[value] || 'tcell-0';
  };

  // Render board with current piece
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Add current piece to display board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardX = currentPiece.x + x;
            const boardY = currentPiece.y + y;
            if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }
    
    return displayBoard;
  };

  return (
    <div className="screen">
      <div className="container">
        {/* Header */}
        <div className="bar">
          <button
            onClick={onBack}
            className="btn"
          >
            <ChevronLeft size={16} />
            <span>뒤로</span>
          </button>
          <h1 className="title-xl">?뚰듃由ъ뒪</h1>
          <button
            onClick={resetGame}
            className="btn btn--primary"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Game Stats */}
        <div className="hud-grid">
          <div className="hud-card">
            <p className="muted-light">점수</p>
            <p >{score}</p>
          </div>
          <div className="hud-card">
            <p className="muted-light">레벨</p>
            <p >{level}</p>
          </div>
          <div className="hud-card">
            <p className="muted-light">라인</p>
            <p >{lines}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="board-shell" style={{width: 'fit-content'}}>
          <div className="tetris-grid">
            {renderBoard().map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`tetris-cell ${getCellClass(cell)}`}
                />
              ))
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="mb-4">
          <div className="row-center mb-4">
            <button
              onClick={() => movePiece('rotate')}
              className="btn btn--blue btn--wide"
            >
              회전
            </button>
          </div>
          <div className="grid-3">
            <button
              onClick={() => movePiece('left')}
              className="btn btn--square"
            >
              ←
            </button>
            <button
              onClick={() => movePiece('down')}
              className="btn btn--danger btn--square"
            >
              ↓
            </button>
            <button
              onClick={() => movePiece('right')}
              className="btn btn--square"
            >
              →
            </button>
          </div>
        </div>

        {/* Pause/Resume Button */}
        <div className="row-center mb-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn btn--warning btn--lg"
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
            {isPaused ? '재생' : '일시정지'}
          </button>
        </div>

        {/* Game Status */}
        {gameOver && (
          <div className="text-center mb-4">
            <div className="notice notice--danger">
              <h2 className="title-xl mb-2">게임 오버!</h2>
              <p>최종 점수: {score}</p>
              <p>클리어한 라인: {lines}</p>
            </div>
          </div>
        )}

        {isPaused && !gameOver && (
          <div className="text-center mb-4">
            <div className="notice notice--warning">
              <h2 className="title-xl">일시정지</h2>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="info-box">
          <p className="font-bold mb-2">조작법:</p>
         <p>← → : 좌우 이동</p>
          <p>↓ : 빠른 낙하</p>
          <p>↑ : 회전</p>
          <p className="mt-2 muted-light">목표: 라인을 가득 채워서 없애세요!</p>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const MiniGamesApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');

 const games = [
    {
      id: '2048',
      title: '2048',
      description: '숫자를 합쳐서 2048을 만드세요!',
      color: 'from-blue-400 to-purple-600',
      icon: '🔢',
      component: Game2048
    },
    {
      id: 'tetris',
      title: '테트리스',
      description: '떨어지는 블록을 쌓아보세요!',
      color: 'from-purple-400 to-pink-600',
      icon: '🧱',
      component: TetrisGame
    }
  ];

  const renderCurrentScreen = () => {
    if (currentScreen === 'home') {
      return (
        <div className="home-screen">
          <div className="container">
            {/* Header */}
            <div className="home-header">
              <h1 className="home-title">미니게임</h1>
              <p className="home-sub">간단하고 재미있는 게임을 즐겨보세요</p>
            </div>

            {/* Games Grid */}
            <div className="game-cards">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setCurrentScreen(game.id)}
                  className={`game-card`}
                >
                  <div className="game-card__row">
                    <div className="game-card__emoji">{game.icon}</div>
                    <div className="game-card__meta">
                      <h3 className="title-xl">{game.title}</h3>
                      <p className="game-card__desc">{game.description}</p>
                    </div>
                    <div className="game-card__chev">
                      <ChevronLeft size={24} className="rot-180" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="home-footer mt-12">
              <p className="mb-2">더 많은 게임이 곧 추가됩니다!</p>
              <div className="dots">
                <div className="dot"></div>
                <div className="dot delay-100"></div>
                <div className="dot delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const game = games.find(g => g.id === currentScreen);
    if (game) {
      const GameComponent = game.component;
      return <GameComponent onBack={() => setCurrentScreen('home')} />;
    }

    return null;
  };

  return renderCurrentScreen();
};

export default MiniGamesApp;














