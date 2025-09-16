import { useCallback, useEffect, useRef, useState } from "react";

const GRAVITY = 0.22;
const FRICTION = 0.9985;
const BALL_RADIUS = 7;
const TABLE_W = 420; // increased size
const TABLE_H = 640; // increased size
const FLIPPER_LEN = 85; // slightly shorter to increase center gap
const FLIPPER_THICK = 9; // visual/collision thickness
const FLIPPER_ANGLE = Math.PI * (58 / 180);
const BASE_FLIP_ANG = Math.PI * (22 / 180);
const TIP_GAP = 40;
// added physics refinements
const MAX_SPEED = 18;
const SUBSTEPS = 2;
const RESTITUTION = 0.92;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export default function usePinball() {
  const canvasRef = useRef(null);
  const animRef = useRef(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const stateRef = useRef({
    x: TABLE_W - 28,
    y: TABLE_H - 40,
    vx: 0,
    vy: 0,
    leftFlip: 0,
    rightFlip: 0,
    leftKey: false,
    rightKey: false,
    ballHeld: true,
    plungerKey: false,
    plungerPower: 0, // 0..1
    // simple cooldown counters to avoid multi-hit per frame
    bumperCCd: 0,
    bumpLCd: 0,
    bumpRCd: 0,
    slingLCd: 0,
    slingRCd: 0,
    // visual pulses 0..1
    bumperPulse: 0,
    bumpLPulse: 0,
    bumpRPulse: 0,
    slingLPulse: 0,
    slingRPulse: 0,
    // drain saver & funnel cooldowns/pulses
    centerPostCd: 0,
    centerPostPulse: 0,
    funnelLCd: 0,
    funnelRCd: 0,
    // Space-Cadet-like systems
    multiplier: 1,
    rollovers: [false, false, false, false, false], // S P A C E
    kickback: 1, // left outlane kickback charges
    ballSaveFrames: 0, // frames of save after launch
    tiltCharge: 0,
    tiltLock: 0,
    nudgeX: 0,
    nudgeY: 0,
    // skill shot & dmd
    skillTarget: -1,
    skillFrames: 0,
    dmdText: "",
    dmdFrames: 0,
  });

  const pressLeft = useCallback(() => {
    stateRef.current.leftKey = true;
  }, []);
  const releaseLeft = useCallback(() => {
    stateRef.current.leftKey = false;
  }, []);
  const pressRight = useCallback(() => {
    stateRef.current.rightKey = true;
  }, []);
  const releaseRight = useCallback(() => {
    stateRef.current.rightKey = false;
  }, []);
  const pressPlunger = useCallback(() => {
    stateRef.current.plungerKey = true;
  }, []);
  const releasePlunger = useCallback(() => {
    stateRef.current.plungerKey = false;
  }, []);

  const addScore = useCallback((base) => {
    setScore((v) => v + Math.round(base * (stateRef.current.multiplier || 1)));
  }, []);

  const reServeBall = useCallback(() => {
    const s = stateRef.current;
    s.ballHeld = true;
    s.x = TABLE_W - 28;
    s.y = TABLE_H - 40;
    s.vx = 0;
    s.vy = 0;
    s.plungerPower = 0;
  }, []);

  const reset = useCallback(() => {
    stateRef.current = {
      x: TABLE_W - 28,
      y: TABLE_H - 40,
      vx: 0,
      vy: 0,
      leftFlip: 0,
      rightFlip: 0,
      leftKey: false,
      rightKey: false,
      ballHeld: true,
      plungerKey: false,
      plungerPower: 0,
      bumperCCd: 0,
      bumpLCd: 0,
      bumpRCd: 0,
      slingLCd: 0,
      slingRCd: 0,
      bumperPulse: 0,
      bumpLPulse: 0,
      bumpRPulse: 0,
      slingLPulse: 0,
      slingRPulse: 0,
      centerPostCd: 0,
      centerPostPulse: 0,
      funnelLCd: 0,
      funnelRCd: 0,
      multiplier: 1,
      rollovers: [false, false, false, false, false],
      kickback: 1,
      ballSaveFrames: 0,
      tiltCharge: 0,
      tiltLock: 0,
      nudgeX: 0,
      nudgeY: 0,
      skillTarget: -1,
      skillFrames: 0,
      dmdText: "",
      dmdFrames: 0,
    };
    setScore(0);
    setGameOver(false);
  }, []);

  const togglePause = useCallback(() => setIsPaused((p) => !p), []);

  const step = (ctx) => {
    const s = stateRef.current;

    // update flippers (lock during tilt)
    const flipSpeed = 0.18;
    const leftActive = s.tiltLock > 0 ? false : s.leftKey;
    const rightActive = s.tiltLock > 0 ? false : s.rightKey;
    s.leftFlip = clamp(
      s.leftFlip + (leftActive ? flipSpeed : -flipSpeed),
      0,
      1
    );
    s.rightFlip = clamp(
      s.rightFlip + (rightActive ? flipSpeed : -flipSpeed),
      0,
      1
    );

    // cooldowns tick down
    s.bumperCCd = Math.max(0, s.bumperCCd - 1);
    s.bumpLCd = Math.max(0, s.bumpLCd - 1);
    s.bumpRCd = Math.max(0, s.bumpRCd - 1);
    s.slingLCd = Math.max(0, s.slingLCd - 1);
    s.slingRCd = Math.max(0, s.slingRCd - 1);
    s.centerPostCd = Math.max(0, s.centerPostCd - 1);
    s.funnelLCd = Math.max(0, s.funnelLCd - 1);
    s.funnelRCd = Math.max(0, s.funnelRCd - 1);
    if (s.ballSaveFrames > 0 && !s.ballHeld) s.ballSaveFrames -= 1;
    s.tiltLock = Math.max(0, s.tiltLock - 1);
    s.tiltCharge = Math.max(0, s.tiltCharge - 0.01);
    // pulses decay
    s.bumperPulse = Math.max(0, s.bumperPulse - 0.04);
    s.bumpLPulse = Math.max(0, s.bumpLPulse - 0.05);
    s.bumpRPulse = Math.max(0, s.bumpRPulse - 0.05);
    s.slingLPulse = Math.max(0, s.slingLPulse - 0.06);
    s.slingRPulse = Math.max(0, s.slingRPulse - 0.06);
    s.centerPostPulse = Math.max(0, s.centerPostPulse - 0.06);
    if (s.skillFrames > 0) s.skillFrames -= 1;
    if (s.dmdFrames > 0) s.dmdFrames -= 1;

    // nudge impulse (consumed)
    if (Math.abs(s.nudgeX) > 0.001 || Math.abs(s.nudgeY) > 0.001) {
      s.x += s.nudgeX;
      s.y += s.nudgeY;
      s.vx += s.nudgeX * 0.5;
      s.vy += s.nudgeY * 0.5;
      s.nudgeX *= 0.5;
      s.nudgeY *= 0.5;
    }

    // plunger charge/launch
    const launchX = TABLE_W - 28;
    const launchYBase = TABLE_H - 40;
    if (s.ballHeld) {
      const chargeSpd = 0.02;
      s.plungerPower = clamp(
        s.plungerPower + (s.plungerKey ? chargeSpd : -chargeSpd * 1.5),
        0,
        1
      );
      s.x = launchX;
      s.y = launchYBase - s.plungerPower * 110; // deeper lane
      if (!s.plungerKey && s.plungerPower > 0 && !isPaused) {
        const speed = 7 + s.plungerPower * 12;
        s.vx = -1.2 - s.plungerPower * 1.2;
        s.vy = -speed;
        s.ballHeld = false;
        s.ballSaveFrames = 60 * 8; // 8s ball save after launch
        // skill shot setup (3s)
        s.skillTarget = Math.floor(Math.random() * 5);
        s.skillFrames = 60 * 3;
        s.dmdText = "SKILL SHOT";
        s.dmdFrames = 90;
      } else {
        render(ctx, s);
        return;
      }
    }

    const reflect = (nx, ny) => {
      const dot = s.vx * nx + s.vy * ny;
      s.vx -= 2 * dot * nx;
      s.vy -= 2 * dot * ny;
      s.vx *= RESTITUTION;
      s.vy *= RESTITUTION;
    };

    const clampSpeed = () => {
      const sp = Math.hypot(s.vx, s.vy);
      if (sp > MAX_SPEED) {
        const k = MAX_SPEED / (sp || 1);
        s.vx *= k;
        s.vy *= k;
      }
    };

    // line segment collision helper (slingshots)
    const collideLine = (
      ax,
      ay,
      bx,
      by,
      thickness,
      impulse,
      cdKey,
      pulseKey
    ) => {
      const abx = bx - ax,
        aby = by - ay;
      const ab2 = abx * abx + aby * aby || 1;
      let t = ((s.x - ax) * abx + (s.y - ay) * aby) / ab2;
      t = clamp(t, 0, 1);
      const cx = ax + abx * t;
      const cy = ay + aby * t;
      const dx = s.x - cx,
        dy = s.y - cy;
      const dist = Math.hypot(dx, dy);
      const rad = BALL_RADIUS + thickness;
      if (dist < rad && s[cdKey] === 0) {
        const nx = (dx || 0.0001) / (dist || 1);
        const ny = (dy || 0.0001) / (dist || 1);
        // push out
        const over = rad - dist;
        s.x += nx * over;
        s.y += ny * over;
        reflect(nx, ny);
        s.vx += nx * impulse * 0.4;
        s.vy += ny * impulse * 0.4;
        clampSpeed();
        s[cdKey] = 6;
        if (pulseKey) s[pulseKey] = 1;
        addScore(20);
      }
    };

    // substeps for stability
    const frPow = Math.pow(FRICTION, 1 / SUBSTEPS);
    for (let st = 0; st < SUBSTEPS; st++) {
      // physics
      s.vy += GRAVITY / SUBSTEPS;
      s.vx *= frPow;
      s.vy *= frPow;
      s.x += s.vx / SUBSTEPS;
      s.y += s.vy / SUBSTEPS;

      // walls
      if (s.x < BALL_RADIUS) {
        s.x = BALL_RADIUS;
        s.vx = Math.abs(s.vx);
      }
      if (s.x > TABLE_W - BALL_RADIUS) {
        s.x = TABLE_W - BALL_RADIUS;
        s.vx = -Math.abs(s.vx);
      }
      if (s.y < BALL_RADIUS) {
        s.y = BALL_RADIUS;
        s.vy = Math.abs(s.vy);
      }

      // center bumper
      const bx = TABLE_W / 2,
        by = TABLE_H / 2,
        br = 20;
      const bdx = s.x - bx,
        bdy = s.y - by;
      const bdist = Math.hypot(bdx, bdy);
      if (bdist < br + BALL_RADIUS && s.bumperCCd === 0) {
        const nx = bdx / (bdist || 1),
          ny = bdy / (bdist || 1);
        const over = br + BALL_RADIUS - bdist;
        s.x += nx * over;
        s.y += ny * over;
        reflect(nx, ny);
        // bumper kick
        s.vx += nx * 1.2;
        s.vy += ny * 1.2;
        clampSpeed();
        s.bumperCCd = 8;
        s.bumperPulse = 1;
        addScore(50);
      }

      // side bumpers
      const bumpHit = (cx, cy, r, add, cdKey, pulseKey) => {
        const ddx = s.x - cx,
          ddy = s.y - cy;
        const d = Math.hypot(ddx, ddy);
        if (d < r + BALL_RADIUS && s[cdKey] === 0) {
          const nx = ddx / (d || 1),
            ny = ddy / (d || 1);
          const over = r + BALL_RADIUS - d;
          s.x += nx * over;
          s.y += ny * over;
          reflect(nx, ny);
          clampSpeed();
          s[cdKey] = 6;
          if (pulseKey) s[pulseKey] = 1;
          addScore(add);
        }
      };
      // move side bumpers slightly lower to reduce empty space
      bumpHit(TABLE_W * 0.25, TABLE_H * 0.45, 10, 15, "bumpLCd", "bumpLPulse");
      bumpHit(TABLE_W * 0.75, TABLE_H * 0.45, 10, 15, "bumpRCd", "bumpRPulse");

      // slingshots as lines
      // lower slingshots closer to flippers
      collideLine(
        TABLE_W * 0.16,
        TABLE_H * 0.7,
        TABLE_W * 0.36,
        TABLE_H * 0.58,
        3,
        10,
        "slingLCd",
        "slingLPulse"
      );
      collideLine(
        TABLE_W * 0.84,
        TABLE_H * 0.7,
        TABLE_W * 0.64,
        TABLE_H * 0.58,
        3,
        10,
        "slingRCd",
        "slingRPulse"
      );

      // new: funnel rails to reduce center drains (V shape)
      const flY = TABLE_H - 56;
      collideLine(
        TABLE_W * 0.5,
        flY - 26,
        TABLE_W * 0.3 + 8,
        flY - 8,
        2,
        8,
        "funnelLCd"
      );
      collideLine(
        TABLE_W * 0.5,
        flY - 26,
        TABLE_W * 0.7 - 8,
        flY - 8,
        2,
        8,
        "funnelRCd"
      );

      // inlane/outlane rails near flippers (helps block side drains)
      // left inlane/outlane pair
      collideLine(
        TABLE_W * 0.06,
        flY - 4,
        TABLE_W * 0.18,
        flY - 30,
        2,
        6,
        "funnelLCd"
      );
      collideLine(
        TABLE_W * 0.22,
        flY - 4,
        TABLE_W * 0.18,
        flY - 30,
        2,
        6,
        "funnelLCd"
      );
      // right inlane/outlane pair
      collideLine(
        TABLE_W * 0.94,
        flY - 4,
        TABLE_W * 0.82,
        flY - 30,
        2,
        6,
        "funnelRCd"
      );
      collideLine(
        TABLE_W * 0.78,
        flY - 4,
        TABLE_W * 0.82,
        flY - 30,
        2,
        6,
        "funnelRCd"
      );

      // side posts near flippers
      bumpHit(TABLE_W * 0.18, flY - 12, 6, 10, "bumpLCd", "bumpLPulse");
      bumpHit(TABLE_W * 0.82, flY - 12, 6, 10, "bumpRCd", "bumpRPulse");

      // rollovers (SPACE) on top
      const rolls = [
        { x: TABLE_W * 0.2, y: 80, idx: 0 }, // S
        { x: TABLE_W * 0.36, y: 68, idx: 1 }, // P
        { x: TABLE_W * 0.5, y: 62, idx: 2 }, // A
        { x: TABLE_W * 0.64, y: 68, idx: 3 }, // C
        { x: TABLE_W * 0.8, y: 80, idx: 4 }, // E
      ];
      for (const R of rolls) {
        const dx = s.x - R.x,
          dy = s.y - R.y;
        if (Math.hypot(dx, dy) < BALL_RADIUS + 8 && !s.rollovers[R.idx]) {
          s.rollovers[R.idx] = true;
          // skill shot
          if (s.skillFrames > 0 && s.skillTarget === R.idx) {
            addScore(5000);
            s.multiplier = clamp((s.multiplier || 1) + 1, 1, 6);
            s.skillFrames = 0;
            s.dmdText = "+ SKILL 5000";
            s.dmdFrames = 90;
          } else {
            addScore(50);
          }
        }
      }
      if (s.rollovers.every(Boolean)) {
        s.rollovers = [false, false, false, false, false];
        s.multiplier = clamp((s.multiplier || 1) + 1, 1, 6);
        // also grant a kickback once when ranking up
        s.kickback = 1;
        s.dmdText = `MULT x${s.multiplier}`;
        s.dmdFrames = 90;
      }

      // flippers
      // move pivots a bit farther apart for clearer center gap
      const leftPivot = { x: TABLE_W * 0.26, y: flY };
      const rightPivot = { x: TABLE_W * 0.74, y: flY };
      // 기본자세: 아래를 향한 \ /
      // 왼쪽: -BASE에서 시작(아래방향), 눌리면 위로 스윙(+)
      // 오른쪽: π + BASE에서 시작(아래방향), 눌리면 위로 스윙(-)
      const leftAng = -BASE_FLIP_ANG + s.leftFlip * FLIPPER_ANGLE;
      const rightAng = Math.PI + BASE_FLIP_ANG - s.rightFlip * FLIPPER_ANGLE;

      const collideFlipper = (pivot, ang, sign, pressed) => {
        const ex = pivot.x + Math.cos(ang) * FLIPPER_LEN * sign;
        const ey = pivot.y - Math.sin(ang) * FLIPPER_LEN;
        const ax = pivot.x,
          ay = pivot.y;
        const abx = ex - ax,
          aby = ey - ay;
        const ab2 = abx * abx + aby * aby || 1;
        let t = ((s.x - ax) * abx + (s.y - ay) * aby) / ab2;
        t = clamp(t, 0, 1);
        const cx = ax + abx * t;
        const cy = ay + aby * t;
        const dx = s.x - cx,
          dy = s.y - cy;
        const dist = Math.hypot(dx, dy);
        const rad = BALL_RADIUS + FLIPPER_THICK * 0.5;
        if (dist < rad) {
          const nx = (dx || 0.0001) / (dist || 1);
          const ny = (dy || 0.0001) / (dist || 1);
          const over = rad - dist;
          s.x += nx * over;
          s.y += ny * over;
          reflect(nx, ny);
          // tangential impulse along flipper when pressed
          const tx = Math.cos(ang) * sign;
          const ty = -Math.sin(ang);
          const kick = pressed ? 6 : 3;
          s.vx += tx * kick * 0.8;
          s.vy += -ty * kick * 0.8;
          clampSpeed();
          addScore(10);
        }
      };
      collideFlipper(leftPivot, leftAng, 1, leftActive);
      collideFlipper(rightPivot, rightAng, 1, rightActive);

      // small center post between flippers
      const postR = 6;
      const postX = TABLE_W * 0.5;
      const postY = flY - 8;
      const pdx = s.x - postX,
        pdy = s.y - postY;
      const pd = Math.hypot(pdx, pdy);
      if (pd < postR + BALL_RADIUS && s.centerPostCd === 0) {
        const nx = pdx / (pd || 1),
          ny = pdy / (pd || 1);
        const over = postR + BALL_RADIUS - pd;
        s.x += nx * over;
        s.y += ny * over;
        const dot = s.vx * nx + s.vy * ny;
        s.vx -= 2 * dot * nx;
        s.vy -= 2 * dot * ny;
        s.vx *= RESTITUTION;
        s.vy *= RESTITUTION;
        s.centerPostCd = 8;
        s.centerPostPulse = 1;
      }

      // detect outlanes near bottom edges
      if (s.y > TABLE_H - BALL_RADIUS - 2) {
        const leftOut = s.x < TABLE_W * 0.18;
        const rightOut = s.x > TABLE_W * 0.82;
        if (leftOut && s.kickback > 0) {
          // kick the ball back into play
          s.kickback -= 1;
          s.y = flY - 20;
          s.x = TABLE_W * 0.24;
          s.vx = 4;
          s.vy = -9;
        }
      }
    }

    // drain handling with ball save
    if (s.y > TABLE_H - BALL_RADIUS) {
      if (s.ballSaveFrames > 0) {
        reServeBall();
        return render(ctx, s);
      }
      return setGameOver(true);
    }

    render(ctx, s);
  };

  const render = (ctx, s) => {
    ctx.clearRect(0, 0, TABLE_W, TABLE_H);
    // playfield background with vignette
    const bg = ctx.createLinearGradient(0, 0, 0, TABLE_H);
    bg.addColorStop(0, "#0b1220");
    bg.addColorStop(1, "#0e1628");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, TABLE_W, TABLE_H);
    const flY = TABLE_H - 56;

    // starfield
    const stT = Date.now() * 0.04;
    for (let i = 0; i < 26; i++) {
      const sx = (i * 97) % TABLE_W;
      const sy = (stT + i * 23) % TABLE_H;
      ctx.fillStyle = i % 3 === 0 ? "#cbd5e1" : "#94a3b8";
      ctx.fillRect(sx, sy, 1, 1);
    }

    // soft vignette
    const vign = ctx.createRadialGradient(
      TABLE_W / 2,
      TABLE_H / 2,
      Math.min(TABLE_W, TABLE_H) / 3,
      TABLE_W / 2,
      TABLE_H / 2,
      Math.max(TABLE_W, TABLE_H) / 1.2
    );
    vign.addColorStop(0, "rgba(0,0,0,0)");
    vign.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, TABLE_W, TABLE_H);

    // neon inner border
    ctx.save();
    ctx.strokeStyle = "rgba(167,139,250,.5)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(167,139,250,.5)";
    ctx.shadowBlur = 10;
    ctx.strokeRect(6, 6, TABLE_W - 12, TABLE_H - 12);
    ctx.restore();

    // plunger lane panel
    ctx.save();
    const laneGrad = ctx.createLinearGradient(0, TABLE_H - 150, 0, TABLE_H);
    laneGrad.addColorStop(0, "rgba(34,211,238,.1)");
    laneGrad.addColorStop(1, "rgba(34,211,238,.28)");
    ctx.fillStyle = laneGrad;
    ctx.fillRect(TABLE_W - 28, 20, 18, TABLE_H - 40);
    ctx.restore();

    // lamps (top row)
    const t = Date.now() * 0.002;
    const lamps = [
      { x: TABLE_W * 0.2, y: 56 },
      { x: TABLE_W * 0.4, y: 48 },
      { x: TABLE_W * 0.6, y: 48 },
      { x: TABLE_W * 0.8, y: 56 },
    ];
    lamps.forEach((L, i) => {
      const a = 0.35 + 0.35 * Math.abs(Math.sin(t + i));
      const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, 18);
      g.addColorStop(0, `rgba(34,211,238,${0.8 * a})`);
      g.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(L.x, L.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#22d3ee";
      ctx.arc(L.x, L.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // rollovers indicators S P A C E
    const drawLight = (x, y, on) => {
      const lg = ctx.createRadialGradient(x, y, 0, x, y, 12);
      lg.addColorStop(0, on ? "rgba(250,204,21,.9)" : "rgba(255,255,255,.15)");
      lg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    };
    const letters = [
      { x: TABLE_W * 0.2, y: 80, ch: "S", on: s.rollovers[0] },
      { x: TABLE_W * 0.36, y: 68, ch: "P", on: s.rollovers[1] },
      { x: TABLE_W * 0.5, y: 62, ch: "A", on: s.rollovers[2] },
      { x: TABLE_W * 0.64, y: 68, ch: "C", on: s.rollovers[3] },
      { x: TABLE_W * 0.8, y: 80, ch: "E", on: s.rollovers[4] },
    ];
    letters.forEach((L, idx) => {
      drawLight(L.x, L.y, L.on || (s.skillFrames > 0 && s.skillTarget === idx));
      ctx.fillStyle = L.on ? "#111827" : "#e5e7eb";
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(L.ch, L.x, L.y + 3);
    });

    // center bumper glow with pulse
    const pulse = s.bumperPulse;
    const glow = ctx.createRadialGradient(
      TABLE_W / 2,
      TABLE_H / 2,
      0,
      TABLE_W / 2,
      TABLE_H / 2,
      36 + pulse * 14
    );
    glow.addColorStop(0, `rgba(245,158,11,${0.45 + 0.4 * pulse})`);
    glow.addColorStop(1, "rgba(245,158,11,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(TABLE_W / 2, TABLE_H / 2, 36 + pulse * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "#f59e0b";
    ctx.arc(TABLE_W / 2, TABLE_H / 2, 20, 0, Math.PI * 2);
    ctx.fill();

    // slingshot guides (triangles) with pulse
    const drawSling = (x0, y0, x1, y1, x2, y2, p) => {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${0.08 + 0.12 * p})`;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawSling(
      TABLE_W * 0.16,
      TABLE_H * 0.62,
      TABLE_W * 0.36,
      TABLE_H * 0.5,
      TABLE_W * 0.36,
      TABLE_H * 0.62,
      s.slingLPulse
    );
    drawSling(
      TABLE_W * 0.84,
      TABLE_H * 0.62,
      TABLE_W * 0.64,
      TABLE_H * 0.5,
      TABLE_W * 0.64,
      TABLE_H * 0.62,
      s.slingRPulse
    );

    // side bumpers with pulse
    const drawBump = (x, y, r, p) => {
      const g2 = ctx.createRadialGradient(x, y, 0, x, y, r + 16);
      g2.addColorStop(0, `rgba(34,211,238,${0.5 * p})`);
      g2.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(x, y, r + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#22d3ee";
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    drawBump(TABLE_W * 0.25, TABLE_H * 0.35, 10, s.bumpLPulse);
    drawBump(TABLE_W * 0.75, TABLE_H * 0.35, 10, s.bumpRPulse);

    // draw center post
    const cpX = TABLE_W * 0.5,
      cpY = flY - 8;
    const cpG = ctx.createRadialGradient(cpX, cpY, 0, cpX, cpY, 18);
    cpG.addColorStop(
      0,
      `rgba(167,139,250,${0.5 * stateRef.current.centerPostPulse})`
    );
    cpG.addColorStop(1, "rgba(167,139,250,0)");
    ctx.fillStyle = cpG;
    ctx.beginPath();
    ctx.arc(cpX, cpY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "#a78bfa";
    ctx.arc(cpX, cpY, 6, 0, Math.PI * 2);
    ctx.fill();

    // visible inlane/outlane rails and side posts near flippers
    const drawRail = (ax, ay, bx, by) => {
      ctx.save();
      const g = ctx.createLinearGradient(ax, ay, bx, by);
      g.addColorStop(0, "rgba(148,163,184,.65)");
      g.addColorStop(1, "rgba(167,139,250,.75)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(167,139,250,.35)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
    };
    const drawPost = (x, y) => {
      ctx.save();
      const pg = ctx.createRadialGradient(x, y, 0, x, y, 10);
      pg.addColorStop(0, "rgba(167,139,250,.9)");
      pg.addColorStop(1, "rgba(167,139,250,0)");
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = "#a78bfa"; ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    // coordinates must match physics rails
    drawRail(TABLE_W * 0.06, flY - 4,  TABLE_W * 0.18, flY - 30);
    drawRail(TABLE_W * 0.22, flY - 4,  TABLE_W * 0.18, flY - 30);
    drawRail(TABLE_W * 0.94, flY - 4,  TABLE_W * 0.82, flY - 30);
    drawRail(TABLE_W * 0.78, flY - 4,  TABLE_W * 0.82, flY - 30);
    // posts
    drawPost(TABLE_W * 0.18, flY - 12);
    drawPost(TABLE_W * 0.82, flY - 12);

    // HUD: multipliers, kickback, save, tilt
    const hud = (label, x, y, on) => {
      ctx.save();
      ctx.globalAlpha = on ? 1 : 0.45;
      ctx.fillStyle = on ? "#22d3ee" : "#94a3b8";
      ctx.font = "bold 12px system-ui";
      ctx.fillText(label, x, y);
      ctx.restore();
    };
    hud(`MULT x${s.multiplier || 1}`, 12, 18, (s.multiplier || 1) > 1);
    hud("KICK", 12, 34, (s.kickback || 0) > 0);
    hud("SAVE", 12, 50, (s.ballSaveFrames || 0) > 0);
    hud("TILT", 12, 66, (s.tiltLock || 0) > 0);

    // DMD center message
    if (s.dmdFrames > 0 && s.dmdText) {
      ctx.save();
      const a = Math.min(1, s.dmdFrames / 20);
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(TABLE_W / 2 - 70, TABLE_H / 2 - 18, 140, 28);
      ctx.strokeStyle = "rgba(124,58,237,.6)";
      ctx.strokeRect(TABLE_W / 2 - 70, TABLE_H / 2 - 18, 140, 28);
      ctx.fillStyle = "#eab308";
      ctx.font = "bold 14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(s.dmdText, TABLE_W / 2, TABLE_H / 2 + 2);
      ctx.restore();
    }
    // flippers (filled capsule with rubber tip)
    const drawFlip = (pivot, ang, mirror, pressed) => {
      // 오른쪽/왼쪽 대칭을 위해 각도 자체를 미러링
      const a = mirror ? Math.PI - ang : ang;

      const x2 = pivot.x + Math.cos(a) * FLIPPER_LEN;
      const y2 = pivot.y - Math.sin(a) * FLIPPER_LEN;

      const grad = ctx.createLinearGradient(pivot.x, pivot.y, x2, y2);
      grad.addColorStop(0, pressed ? "#c4b5fd" : "#a78bfa");
      grad.addColorStop(1, pressed ? "#7c3aed" : "#6d28d9");
      ctx.strokeStyle = grad;
      ctx.lineWidth = FLIPPER_THICK;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // rubber tip
      ctx.beginPath();
      ctx.fillStyle = "#ef4444";
      ctx.arc(x2, y2, FLIPPER_THICK * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // pivot cap
      ctx.beginPath();
      ctx.fillStyle = "#94a3b8";
      ctx.arc(pivot.x, pivot.y, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    // 렌더 각도도 물리와 동일하게 사용하여 시각/충돌 정합 유지
    const aL = -BASE_FLIP_ANG + stateRef.current.leftFlip * FLIPPER_ANGLE;
    const aR =
      Math.PI + BASE_FLIP_ANG - stateRef.current.rightFlip * FLIPPER_ANGLE;
    drawFlip(
      { x: TABLE_W * 0.28, y: flY },
      aL,
      false,
      s.leftKey && s.tiltLock === 0
    );
    drawFlip(
      { x: TABLE_W * 0.72, y: flY },
      aR,
      false,
      s.rightKey && s.tiltLock === 0
    );

    // plunger power tube + gauge
    if (stateRef.current.ballHeld) {
      const p = stateRef.current.plungerPower;
      const tube = ctx.createLinearGradient(0, TABLE_H - 150, 0, TABLE_H);
      tube.addColorStop(0, "rgba(34,211,238,.2)");
      tube.addColorStop(1, "rgba(34,211,238,.45)");
      ctx.fillStyle = tube;
      ctx.fillRect(TABLE_W - 24, TABLE_H - 150, 10, 150);
      const gauge = ctx.createLinearGradient(
        0,
        TABLE_H - 40 - Math.max(4, p * 110),
        0,
        TABLE_H - 40
      );
      gauge.addColorStop(0, "#7dd3fc");
      gauge.addColorStop(1, "#22d3ee");
      ctx.fillStyle = gauge;
      ctx.fillRect(TABLE_W - 24, TABLE_H - 40, 10, -Math.max(4, p * 110));
    }

    // ball shadow
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.ellipse(
      s.x + 3,
      s.y + 6,
      BALL_RADIUS,
      BALL_RADIUS * 0.6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // ball (with specular)
    const ballG = ctx.createRadialGradient(
      s.x - 2,
      s.y - 2,
      0,
      s.x,
      s.y,
      BALL_RADIUS
    );
    ballG.addColorStop(0, "#ffffff");
    ballG.addColorStop(1, "#dbeafe");
    ctx.fillStyle = ballG;
    ctx.beginPath();
    ctx.arc(s.x, s.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // bottom apron (draw earlier so it doesn't overlap flippers) moved up in call order
    ctx.save();
    const apronH = 46; // slightly shorter to avoid covering flippers
    const apronGrad = ctx.createLinearGradient(0, TABLE_H - apronH, 0, TABLE_H);
    apronGrad.addColorStop(0, "rgba(2,6,23,.5)");
    // apronGrad.addColorStop(1, "rgba(2,6,23,.85)");
    ctx.fillStyle = apronGrad;
    ctx.fillRect(8, TABLE_H - apronH, TABLE_W - 16, apronH - 8);
    // move label a bit lower and reduce opacity

    ctx.restore();

    // glass overlay
    const glass = ctx.createLinearGradient(0, 0, 0, TABLE_H);
    glass.addColorStop(0, "rgba(255,255,255,.06)");
    glass.addColorStop(0.2, "rgba(255,255,255,.02)");
    glass.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glass;
    ctx.fillRect(0, 0, TABLE_W, TABLE_H);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const loop = () => {
      if (!isPaused && !gameOver) step(ctx);
      else render(ctx, stateRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    const down = (e) => {
      // prevent default so Space/Arrows don't scroll or click buttons
      if (
        e.code === "Space" ||
        e.key === " " ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowDown"
      ) {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" || e.key === "a")
        stateRef.current.leftKey = true;
      if (e.key === "ArrowRight" || e.key === "d")
        stateRef.current.rightKey = true;
      if (e.code === "Space" || e.key === " " || e.key === "ArrowDown")
        stateRef.current.plungerKey = true;
      // nudge: z/x/c
      if (e.key === "z") {
        stateRef.current.nudgeX -= 1.8;
        stateRef.current.tiltCharge += 0.35;
      }
      if (e.key === "x") {
        stateRef.current.nudgeX += 1.8;
        stateRef.current.tiltCharge += 0.35;
      }
      if (e.key === "c") {
        stateRef.current.nudgeY -= 2.0;
        stateRef.current.tiltCharge += 0.35;
      }
      if (
        stateRef.current.tiltCharge > 1.2 &&
        stateRef.current.tiltLock === 0
      ) {
        stateRef.current.tiltLock = 180; // 3s
        stateRef.current.leftKey = false;
        stateRef.current.rightKey = false;
      }
    };
    const up = (e) => {
      if (
        e.code === "Space" ||
        e.key === " " ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowDown"
      ) {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" || e.key === "a")
        stateRef.current.leftKey = false;
      if (e.key === "ArrowRight" || e.key === "d")
        stateRef.current.rightKey = false;
      if (e.code === "Space" || e.key === " " || e.key === "ArrowDown")
        stateRef.current.plungerKey = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [isPaused, gameOver, step]);

  return {
    canvasRef,
    score,
    isPaused,
    gameOver,
    reset,
    togglePause,
    pressLeft,
    releaseLeft,
    pressRight,
    releaseRight,
    pressPlunger,
    releasePlunger,
    width: TABLE_W,
    height: TABLE_H,
  };
}
