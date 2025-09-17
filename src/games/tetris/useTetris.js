import { useCallback, useEffect, useState } from "react";
import {
  getHighScore,
  getLastScore,
  bumpHighScore,
  setLastScore as setLastScoreStorage,
} from "../../utils/scores";

function emptyBoard() {
  return Array(20)
    .fill(null)
    .map(() => Array(10).fill(0));
}

const pieces = [
  { shape: [[1, 1, 1, 1]], color: 1 }, // I
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 2,
  }, // O
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: 3,
  }, // T
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: 4,
  }, // S
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: 5,
  }, // Z
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: 6,
  }, // L
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: 7,
  }, // J
];

function rotateMatrix(mat) {
  const n = mat.length;
  const m = mat[0].length;
  const res = Array(m)
    .fill(null)
    .map(() => Array(n).fill(0));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < m; x++) {
      res[x][n - 1 - y] = mat[y][x];
    }
  }
  return res;
}

export default function useTetris() {
  const [board, setBoard] = useState(() => emptyBoard());
  const [score, setScore] = useState(0);
  const [highScore, setHighScoreState] = useState(() => getHighScore("tetris"));
  const [lastScore, setLastScoreState] = useState(() => getLastScore("tetris"));
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearingRows, setClearingRows] = useState([]);
  const [clearBlink, setClearBlink] = useState(0);

  const createPiece = useCallback(() => {
    const p = pieces[Math.floor(Math.random() * pieces.length)];
    return {
      shape: p.shape.map((r) => [...r]),
      color: p.color,
      x: Math.floor((10 - p.shape[0].length) / 2),
      y: 0,
    };
  }, []);

  const canPlacePiece = useCallback((piece, b) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (!piece.shape[y][x]) continue;
        const bx = piece.x + x;
        const by = piece.y + y;
        if (bx < 0 || bx >= 10 || by >= 20) return false;
        if (by >= 0 && b[by][bx]) return false;
      }
    }
    return true;
  }, []);

  const placePieceOnBoard = useCallback((piece, b) => {
    const nb = b.map((r) => [...r]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const bx = piece.x + x;
          const by = piece.y + y;
          if (by >= 0) nb[by][bx] = piece.color;
        }
      }
    }
    return nb;
  }, []);

  const clearCompleteLines = useCallback((b) => {
    const nb = [];
    let linesCleared = 0;
    for (let y = 0; y < 20; y++) {
      if (b[y].every((cell) => cell !== 0)) linesCleared++;
      else nb.push([...b[y]]);
    }
    while (nb.length < 20) nb.unshift(Array(10).fill(0));
    return { board: nb, linesCleared };
  }, []);

  const renderBoard = useCallback(() => {
    const display = board.map((row) => [...row]);
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const bx = currentPiece.x + x;
            const by = currentPiece.y + y;
            if (by >= 0 && by < 20 && bx >= 0 && bx < 10) {
              display[by][bx] = currentPiece.color;
            }
          }
        }
      }
    }
    return display;
  }, [board, currentPiece]);

  const lockPiece = useCallback(
    (piece) => {
      const locked = placePieceOnBoard(piece, board);

      // 클리어 대상 행 검사
      const rows = [];
      for (let y = 0; y < 20; y++) {
        if (locked[y].every((c) => c !== 0)) rows.push(y);
      }

      // 클리어가 없으면 보드만 고정하고 종료
      if (rows.length === 0) {
        setBoard(locked);
        if (piece.y <= 0) setGameOver(true);
        setCurrentPiece(null);
        return;
      }

      // 점멸 애니메이션 단계
      setBoard(locked); // 고정된 모습 먼저 보여줌
      setClearingRows(rows);
      setIsClearing(true);
      setClearBlink(1);

      // 3회 점멸 = on/off 6토글, 80ms 간격(총 ~480ms)
      let ticks = 0;
      const iv = setInterval(() => {
        setClearBlink((v) => v ^ 1); // 0/1 토글
        ticks++;
        if (ticks >= 6) {
          clearInterval(iv);
          // 실제 제거 수행
          const { board: clearedBoard } = clearCompleteLines(locked);
          setBoard(clearedBoard);
          setLines((l) => l + rows.length);
          setScore((s) => s + rows.length * 100 * level);
          setClearingRows([]);
          setClearBlink(0);
          setIsClearing(false);
          setCurrentPiece(null);
        }
      }, 80);
    },
    [board, clearCompleteLines, placePieceOnBoard, level]
  );

  const movePiece = useCallback(
    (action) => {
      if (gameOver || isPaused || isClearing) return;

      setCurrentPiece((prev) => {
        if (!prev) return prev;

        if (action === "left" || action === "right") {
          const dx = action === "left" ? -1 : 1;
          const next = { ...prev, x: prev.x + dx };
          return canPlacePiece(next, board) ? next : prev;
        }

        if (action === "down") {
          const next = { ...prev, y: prev.y + 1 };
          if (canPlacePiece(next, board)) return next;
          lockPiece(prev);
          return null;
        }

        if (action === "rotate") {
          const rotated = rotateMatrix(prev.shape);
          const kicks = [0, -1, 1, -2, 2];
          for (const k of kicks) {
            const candidate = {
              ...prev,
              shape: rotated,
              x: prev.x + k,
            };
            if (canPlacePiece(candidate, board)) return candidate;
          }
        }

        return prev;
      });
    },
    [board, gameOver, isPaused, isClearing, canPlacePiece, lockPiece]
  );

  const togglePause = useCallback(() => setIsPaused((p) => !p), []);

  const reset = useCallback(() => {
    setBoard(emptyBoard());
    setCurrentPiece(null);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      const p = createPiece();
      if (!canPlacePiece(p, board)) {
        setGameOver(true);
      } else {
        setCurrentPiece(p);
      }
    }
  }, [currentPiece, gameOver, createPiece, canPlacePiece, board]);

  useEffect(() => {
    if (gameOver || isPaused || isClearing || !currentPiece) return;
    const interval = Math.max(80, 500 - level * 50);
    const timer = setInterval(() => {
      setCurrentPiece((prev) => {
        if (!prev) return prev;
        const next = { ...prev, y: prev.y + 1 };
        if (canPlacePiece(next, board)) return next;
        lockPiece(prev);
        return null;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [
    gameOver,
    isPaused,
    currentPiece,
    level,
    board,
    canPlacePiece,
    lockPiece,
  ]);

  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) setLevel(newLevel);
  }, [lines, level]);

  useEffect(() => {
    if (!gameOver) return;
    bumpHighScore("tetris", score);
    setLastScoreStorage("tetris", score);
    setHighScoreState(getHighScore("tetris"));
    setLastScoreState(score);
  }, [gameOver, score, highScore]);

  const getCellClass = useCallback((value) => {
    const map = [
      "tcell-0",
      "tcell-1",
      "tcell-2",
      "tcell-3",
      "tcell-4",
      "tcell-5",
      "tcell-6",
      "tcell-7",
    ];
    return map[value] || "tcell-0";
  }, []);

  return {
    board,
    score,
    highScore,
    lastScore,
    lines,
    level,
    isPaused,
    gameOver,
    movePiece,
    togglePause,
    reset,
    renderBoard,
    getCellClass,
    isClearing,
    clearingRows,
    clearBlink,
  };
}
