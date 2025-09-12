import { useCallback, useState } from "react";

const SIZE = 4;
const BEST_KEY = "mgp:2048-best";

const emptyGrid = () =>
  Array(SIZE)
    .fill(null)
    .map(() => Array(SIZE).fill(0));
const emptyMarks = () =>
  Array(SIZE)
    .fill(null)
    .map(() => Array(SIZE).fill(false));

function rotateCW(mat) {
  const n = mat.length;
  const res = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) res[j][n - 1 - i] = mat[i][j];
  return res;
}
function rotateNTimes(mat, times) {
  let m = mat;
  for (let i = 0; i < ((times % 4) + 4) % 4; i++) m = rotateCW(m);
  return m;
}
function rotatePosCW([r, c], n = SIZE) {
  return [c, n - 1 - r];
}
function rotatePosNTimes(pos, times) {
  let p = pos;
  for (let i = 0; i < ((times % 4) + 4) % 4; i++) p = rotatePosCW(p);
  return p;
}

function addRandomTile(board) {
  const empty = [];
  for (let i = 0; i < SIZE; i++)
    for (let j = 0; j < SIZE; j++) if (board[i][j] === 0) empty.push([i, j]);
  if (!empty.length) return null;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
  return [r, c];
}

export default function use2048() {
  const [board, setBoard] = useState(() => {
    const b = emptyGrid();
    addRandomTile(b);
    addRandomTile(b);
    return b;
  });
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0;
    }
  });
  const [gameOver, setGameOver] = useState(false);
  // lazy initializer로 함수 전달 (React가 초기 렌더에서 호출)
  const [mergedGrid, setMergedGrid] = useState(emptyMarks);
  const [lastSpawn, setLastSpawn] = useState(null);

  // 콤보/보너스/배지 상태
  const [combo, setCombo] = useState(0);
  const [comboBonus, setComboBonus] = useState(0);
  const [comboFlash, setComboFlash] = useState(0);

  // Undo
  const [undoState, setUndoState] = useState(null);
  const [canUndo, setCanUndo] = useState(false);

  const getTileClass = useCallback((value) => {
    if (value === 0) return "";
    const known = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    return known.includes(value) ? `tile--v${value}` : "tile--vHuge";
  }, []);

  const canMove = useCallback((b) => {
    for (let i = 0; i < SIZE; i++)
      for (let j = 0; j < SIZE; j++) if (b[i][j] === 0) return true;
    for (let i = 0; i < SIZE; i++)
      for (let j = 0; j < SIZE; j++) {
        const v = b[i][j];
        if (
          (i + 1 < SIZE && b[i + 1][j] === v) ||
          (j + 1 < SIZE && b[i][j + 1] === v)
        )
          return true;
      }
    return false;
  }, []);

  const move = useCallback(
    (dir) => {
      if (gameOver) return;

      // 방향을 'left' 기준으로 회전 정규화
      const turns =
        dir === "left" ? 0 : dir === "down" ? 1 : dir === "right" ? 2 : 3;
      const rot = (m, t) => rotateNTimes(m, t);
      const inv = (m, t) => rotateNTimes(m, 4 - t);

      const work = rot(
        board.map((r) => [...r]),
        turns
      );

      let moved = false;
      let newScore = score;
      let mergeGain = 0; // 이번 턴 합체 점수 누적
      const marks = emptyMarks();

      // 왼쪽으로 이동/합체
      for (let i = 0; i < SIZE; i++) {
        const row = work[i];
        const vals = row.filter((v) => v !== 0);
        const merged = [];
        for (let j = 0; j < vals.length; j++) {
          if (j + 1 < vals.length && vals[j] === vals[j + 1]) {
            const v = vals[j] * 2;
            newScore += v;
            mergeGain += v;
            merged.push(v);
            marks[i][merged.length - 1] = true;
            j++; // 다음 하나 건너뛰기
          } else {
            merged.push(vals[j]);
          }
        }
        while (merged.length < SIZE) merged.push(0);

        for (let j = 0; j < SIZE; j++) {
          if (row[j] !== merged[j]) moved = true;
          work[i][j] = merged[j];
        }
      }

      if (!moved) return;

      // Undo 스냅샷 (스폰 전)
      setUndoState({
        board: board.map((r) => [...r]),
        score,
        gameOver,
        combo,
      });
      setCanUndo(true);

      // 스폰 (회전 상태에서 좌표 받고 복구)
      const spawnRot = addRandomTile(work);
      const back = inv(work, turns);
      const marksBack = inv(marks, turns);
      const spawnBack = spawnRot ? rotatePosNTimes(spawnRot, 4 - turns) : null;

      // 보드/표시 반영
      setBoard(back);
      setMergedGrid(marksBack);
      setLastSpawn(spawnBack);

      // 콤보 & 점수 계산
      if (mergeGain > 0) {
        const nextCombo = combo > 0 ? combo + 1 : 1;
        const bonus = Math.floor(mergeGain * 0.15 * Math.max(0, nextCombo - 1));
        const withBonus = newScore + bonus;

        setCombo(nextCombo);
        setComboBonus(bonus);
        setComboFlash(Date.now());
        setScore(withBonus);

        if (withBonus > bestScore) {
          setBestScore(withBonus);
          try {
            localStorage.setItem(BEST_KEY, String(withBonus));
          } catch {}
        }
      } else {
        setCombo(0);
        setComboBonus(0);
        setScore(newScore);

        if (newScore > bestScore) {
          setBestScore(newScore);
          try {
            localStorage.setItem(BEST_KEY, String(newScore));
          } catch {}
        }
      }

      // 게임오버 판정
      if (!canMove(back)) setGameOver(true);
    },
    [board, score, bestScore, gameOver, combo, canMove]
  );

  const reset = useCallback(() => {
    const b = emptyGrid();
    addRandomTile(b);
    addRandomTile(b);
    setBoard(b);
    setScore(0);
    setMergedGrid(emptyMarks());
    setLastSpawn(null);
    setGameOver(false);
    setCombo(0);
    setComboBonus(0);
    setCanUndo(false);
    setUndoState(null);
  }, []);

  // Undo 콜백
  const undo = useCallback(() => {
    if (!undoState) return;
    setBoard(undoState.board.map((r) => [...r]));
    setScore(undoState.score);
    setGameOver(undoState.gameOver);
    setMergedGrid(emptyMarks());
    setLastSpawn(null);
    // 규칙 단순화를 위해 콤보/보너스 초기화 (복원 원하면 아래 두 줄을 undoState.combo로 변경)
    setCombo(0);
    setComboBonus(0);
    setUndoState(null);
    setCanUndo(false);
  }, [undoState]);

  return {
    board,
    score,
    bestScore,
    gameOver,
    move,
    reset,
    undo,
    getTileClass,
    mergedGrid,
    lastSpawn,
    // 콤보/보너스/Undo 노출
    combo,
    comboBonus,
    comboFlash,
    canUndo,
    undoState,
  };
}
