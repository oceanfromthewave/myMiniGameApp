import { useCallback, useEffect, useRef, useState } from "react";
import {
  getHighScore,
  getLastScore,
  bumpHighScore,
  setLastScore as setLastScoreStorage,
} from "../../utils/scores";

function getPowerupIcon(type) {
  // public path (note: current assets folder is 'asssets')
  if (type === "expand") return "/asssets/powerups/expand.svg";
  if (type === "multiball") {
    // inline SVG to avoid missing-asset issues
    const svg = encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'><circle cx='8' cy='12' r='4' fill='#ffffff'/><circle cx='15' cy='9' r='3' fill='#a7f3d0'/><circle cx='16' cy='16' r='3' fill='#93c5fd'/></svg>"
    );
    return `data:image/svg+xml;utf8,${svg}`;
  }
  return "";
}

export default function useBrickBreaker() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const animationRef = useRef(null);
  const [highScore, setHighScoreState] = useState(() =>
    getHighScore("brickbreaker")
  );
  const [lastScore, setLastScoreState] = useState(() =>
    getLastScore("brickbreaker")
  );
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);
  const cleanupRef = useRef(null);
  const paddleX = useRef(0);
  const powerupsRef = useRef([]);
  const activePowerupsRef = useRef([]);
  const [activePowerups, setActivePowerups] = useState([]);
  const [fallingPowerups, setFallingPowerups] = useState([]);
  const shakeRef = useRef(0);
  const hitFxRef = useRef([]); // {x,y,t}
  const levelRef = useRef(1);

  const togglePause = useCallback(() => {
    setIsPaused((p) => {
      const np = !p;
      pausedRef.current = np;
      return np;
    });
  }, []);

  const getPaddleWidth = useCallback(
    () =>
      activePowerupsRef.current.some((p) => p.type === "expand") ? 120 : 75,
    []
  );

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    powerupsRef.current = [];
    activePowerupsRef.current = [];
    setActivePowerups([]);
    setFallingPowerups([]);
    hitFxRef.current = [];

    const paddleHeight = 10;
    const basePaddleWidth = 75;
    paddleX.current = (canvas.width - getPaddleWidth()) / 2;

    const ballRadius = 7;
    // support multiple balls
    let balls = [
      { x: canvas.width / 2, y: canvas.height - 30, dx: 2.4, dy: -2.4 },
    ];

    // bricks / round variables (mutable across rounds)
    let brickRowCount = 3;
    let brickColumnCount = 5;
    const brickWidth = 75;
    const brickHeight = 20;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 30;
    let remaining = 0;
    let bricks = [];

    const POWERUP_DROP_RATE = 0.7; // 70%

    function generatePattern(rows, cols) {
      const lvl = levelRef.current;
      const type = Math.floor(Math.random() * 4); // 0:full 1:checker 2:pyramid 3:random
      const grid = Array.from({ length: cols }, () => Array(rows).fill(0));
      const prob = Math.min(0.9, 0.6 + lvl * 0.03);
      const midC = (cols - 1) / 2;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          let on = true;
          if (type === 1) on = (r + c) % 2 === 0;
          else if (type === 2) on = r <= rows - 1 - Math.abs(c - midC);
          else if (type === 3) on = Math.random() < prob;
          grid[c][r] = on ? 1 : 0;
        }
      }
      let count = 0;
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < rows; r++) if (grid[c][r]) count++;
      if (count === 0) return generatePattern(rows, cols);
      return grid;
    }

    function buildBricks() {
      const lvl = levelRef.current;
      brickRowCount = Math.min(6, 2 + lvl);
      let pattern;
      if (lvl === 1) {
        // fixed full grid for the first round
        pattern = Array.from({ length: brickColumnCount }, () =>
          Array(brickRowCount).fill(1)
        );
      } else {
        pattern = generatePattern(brickRowCount, brickColumnCount);
      }
      bricks = [];
      remaining = 0;
      for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
          const status = pattern[c][r];
          bricks[c][r] = { x: 0, y: 0, status };
          if (status) remaining++;
        }
      }
      const speed = 2.4 + lvl * 0.25;
      balls = [
        {
          x: canvas.width / 2,
          y: canvas.height - 30,
          dx: speed * (Math.random() < 0.5 ? -1 : 1) * 0.8,
          dy: -speed,
        },
      ];
      const shrink = Math.max(0, lvl - 1) * 6;
      const targetWidth = Math.max(60, basePaddleWidth - shrink);
      const curCenter = paddleX.current + getPaddleWidth() / 2;
      paddleX.current = curCenter - targetWidth / 2;
    }

    buildBricks();

    let rightPressed = false;
    let leftPressed = false;

    function keyDownHandler(e) {
      if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
      } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
      }
    }

    function keyUpHandler(e) {
      if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
      } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
      }
    }

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    function drawBalls() {
      for (const b of balls) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.closePath();
      }
    }

    function drawPaddle() {
      const paddleWidth = getPaddleWidth();
      ctx.beginPath();
      ctx.rect(
        paddleX.current,
        canvas.height - paddleHeight,
        paddleWidth,
        paddleHeight
      );
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.closePath();
    }

    function drawBricks() {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          if (bricks[c][r].status === 1) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            ctx.beginPath();
            ctx.rect(brickX, brickY, brickWidth, brickHeight);
            ctx.fillStyle = "#f59e0b";
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    }

    function spawnHitFx(px, py) {
      hitFxRef.current.push({ x: px, y: py, t: 1 });
    }

    function drawHitFx() {
      for (let i = hitFxRef.current.length - 1; i >= 0; i--) {
        const fx = hitFxRef.current[i];
        fx.t -= 0.06;
        if (fx.t <= 0) {
          hitFxRef.current.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 12 * (1 - fx.t) + 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${fx.t})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    function collisionDetection() {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r];
          if (b.status !== 1) continue;
          const bx = b.x,
            by = b.y;
          const bw = brickWidth,
            bh = brickHeight;

          for (const ball of balls) {
            const x = ball.x,
              y = ball.y;
            if (
              x + ballRadius > bx &&
              x - ballRadius < bx + bw &&
              y + ballRadius > by &&
              y - ballRadius < by + bh
            ) {
              const overlapL = x + ballRadius - bx;
              const overlapR = bx + bw - (x - ballRadius);
              const overlapT = y + ballRadius - by;
              const overlapB = by + bh - (y - ballRadius);
              const minOverlap = Math.min(
                overlapL,
                overlapR,
                overlapT,
                overlapB
              );
              if (minOverlap === overlapT) ball.dy = -Math.abs(ball.dy);
              else if (minOverlap === overlapB) ball.dy = Math.abs(ball.dy);
              else if (minOverlap === overlapL) ball.dx = -Math.abs(ball.dx);
              else ball.dx = Math.abs(ball.dx);

              b.status = 0;
              remaining--;
              setScore((s) => s + 1);
              spawnHitFx(x, y);
              shakeRef.current = 6;
              if (Math.random() < POWERUP_DROP_RATE) {
                const type = Math.random() < 0.5 ? "expand" : "multiball";
                powerupsRef.current.push({
                  type,
                  x: b.x + brickWidth / 2,
                  y: b.y + brickHeight,
                  dy: 2,
                  icon: getPowerupIcon(type),
                });
              }
              if (remaining === 0) {
                levelRef.current += 1; // auto next round
                buildBricks();
                return false;
              }
            }
          }
        }
      }
      return false;
    }

    function drawPowerups() {
      for (let i = powerupsRef.current.length - 1; i >= 0; i--) {
        const p = powerupsRef.current[i];
        p.y += p.dy;

        const paddleWidth = getPaddleWidth();
        if (
          p.y + 8 > canvas.height - paddleHeight &&
          p.x > paddleX.current &&
          p.x < paddleX.current + paddleWidth
        ) {
          const expiresAt = Date.now() + 5000;
          activePowerupsRef.current.push({
            type: p.type,
            expiresAt,
            icon: p.icon,
          });
          setActivePowerups([...activePowerupsRef.current]);
          powerupsRef.current.splice(i, 1);
          // immediate effects
          if (p.type === "multiball" && balls.length < 6) {
            const newBalls = balls.map((b) => ({
              x: b.x,
              y: b.y,
              dx: b.dx * 0.9 + (Math.random() - 0.5) * 1.2,
              dy: -Math.abs(b.dy) * 0.9,
            }));
            balls.push(...newBalls);
          }
        } else if (p.y > canvas.height) {
          powerupsRef.current.splice(i, 1);
        }
      }
      setFallingPowerups([...powerupsRef.current]);
    }

    function draw() {
      let ox = 0,
        oy = 0;
      if (shakeRef.current > 0) {
        ox = (Math.random() - 0.5) * shakeRef.current * 0.6;
        oy = (Math.random() - 0.5) * shakeRef.current * 0.6;
        shakeRef.current *= 0.85;
      }

      ctx.save();
      ctx.translate(ox, oy);
      ctx.clearRect(-ox, -oy, canvas.width, canvas.height);
      drawBricks();
      drawBalls();
      drawPaddle();
      drawPowerups();
      drawHitFx();
      ctx.restore();

      if (pausedRef.current) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const paddleWidth = getPaddleWidth();
      collisionDetection();

      // update all balls
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (b.x + b.dx > canvas.width - ballRadius || b.x + b.dx < ballRadius) {
          b.dx = -b.dx;
        }
        if (b.y + b.dy < ballRadius) {
          b.dy = -b.dy;
        } else if (b.y + b.dy > canvas.height - ballRadius) {
          if (b.x > paddleX.current && b.x < paddleX.current + paddleWidth) {
            b.dy = -Math.abs(b.dy) * 1.03;
            const center = paddleX.current + paddleWidth / 2;
            b.dx += (b.x - center) * 0.02;
          } else {
            // remove this ball
            balls.splice(i, 1);
            continue;
          }
        }
        b.x += b.dx;
        b.y += b.dy;
      }
      // if all balls lost -> game over
      if (balls.length === 0) {
        setGameOver(true);
        cancelAnimationFrame(animationRef.current);
        powerupsRef.current = [];
        activePowerupsRef.current = [];
        setFallingPowerups([]);
        setActivePowerups([]);
        return;
      }

      const now = Date.now();
      if (activePowerupsRef.current.length > 0) {
        let changed = false;
        activePowerupsRef.current = activePowerupsRef.current.filter((p) => {
          if (p.expiresAt > now) return true;
          changed = true;
          return false;
        });
        if (changed) setActivePowerups([...activePowerupsRef.current]);
      }

      if (rightPressed && paddleX.current < canvas.width - paddleWidth) {
        paddleX.current += 5;
      } else if (leftPressed && paddleX.current > 0) {
        paddleX.current -= 5;
      }

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, [getPaddleWidth]);

  const reset = useCallback(() => {
    setScore(0);
    setGameOver(false);
    levelRef.current = 1;
    if (cleanupRef.current) cleanupRef.current();
    cleanupRef.current = start();
  }, [start]);

  useEffect(() => {
    if (!gameOver) return;
    bumpHighScore("brickbreaker", score);
    setLastScoreStorage("brickbreaker", score);
    setHighScoreState(getHighScore("brickbreaker"));
    setLastScoreState(score);
  }, [gameOver, score, highScore]);

  useEffect(() => {
    reset();
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [reset]);

  const movePaddle = useCallback(
    (dir) => {
      const canvas = canvasRef.current;
      const paddleWidth = getPaddleWidth();
      const step = 20;
      if (dir === "left") {
        paddleX.current = Math.max(paddleX.current - step, 0);
      }
      if (dir === "right") {
        paddleX.current = Math.min(
          paddleX.current + step,
          canvas.width - paddleWidth
        );
      }
    },
    [getPaddleWidth]
  );

  return {
    canvasRef,
    score,
    highScore,
    lastScore,
    gameOver,
    reset,
    movePaddle,
    activePowerups,
    fallingPowerups,
    isPaused,
    togglePause,
  };
}
