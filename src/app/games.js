// src/app/games.js
import Game2048 from "../games/2048";
import TetrisGame from "../games/tetris";

export default [
  {
    id: "2048",
    title: "2048",
    description: "같은 숫자를 합쳐 2048을 만들어보세요!",
    icon: "🎯",
    component: Game2048,
  },
  {
    id: "tetris",
    title: "테트리스",
    description: "떨어지는 블록을 쌓아보세요",
    icon: "🧱",
    component: TetrisGame,
  },
];

