import { useCallback, useEffect, useRef, useState } from "react";

export default function useBrickBreaker() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const animationRef = useRef(null);
  const cleanupRef = useRef(null);
  const paddleX = useRef(0);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const paddleHeight = 10;
    const paddleWidth = 75;
    paddleX.current = (canvas.width - paddleWidth) / 2;

    const ballRadius = 7;
    let x = canvas.width / 2;
    let y = canvas.height - 30;
    let dx = 2;
    let dy = -2;

    const brickRowCount = 3;
    const brickColumnCount = 5;
    const brickWidth = 75;
    const brickHeight = 20;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 30;
    let remaining = brickRowCount * brickColumnCount;

    const bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
      }
    }

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

    function drawBall() {
      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.closePath();
    }

    function drawPaddle() {
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

    function collisionDetection() {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r];
          if (b.status === 1) {
            if (
              x > b.x &&
              x < b.x + brickWidth &&
              y > b.y &&
              y < b.y + brickHeight
            ) {
              dy = -dy;
              b.status = 0;
              remaining--;
              setScore((s) => s + 1);
              if (remaining === 0) {
                setGameOver(true);
                cancelAnimationFrame(animationRef.current);
                return true;
              }
            }
          }
        }
      }
      return false;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBricks();
      drawBall();
      drawPaddle();
      if (collisionDetection()) return;

      if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
      }
      if (y + dy < ballRadius) {
        dy = -dy;
      } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX.current && x < paddleX.current + paddleWidth) {
          dy = -dy;
        } else {
          setGameOver(true);
          cancelAnimationFrame(animationRef.current);
          return;
        }
      }

      x += dx;
      y += dy;

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
  }, []);

  const reset = useCallback(() => {
    setScore(0);
    setGameOver(false);
    if (cleanupRef.current) cleanupRef.current();
    cleanupRef.current = start();
  }, [start]);

  useEffect(() => {
    reset();
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [reset]);

  const movePaddle = useCallback((dir) => {
    const canvas = canvasRef.current;
    const paddleWidth = 75;
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
  }, []);

  return { canvasRef, score, gameOver, reset, movePaddle };
}
