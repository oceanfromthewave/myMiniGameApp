import Game2048 from "../games/2048";
import TetrisGame from "../games/tetris";
import BrickBreakerGame from "../games/brickbreaker";
import PinballGame from "../games/pinball";

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
  {
    id: "brickbreaker",
    title: "벽돌깨기",
    description: "공을 튕겨 벽돌을 모두 깨보세요!",
    icon: "🎾",
    component: BrickBreakerGame,
  },
  {
    id: "pinball",
    title: "핀볼",
    description: "플리퍼로 공을 튕겨 점수를 획득!",
    icon: "🕹️",
    component: PinballGame,
  },
];
