const key = (game, type) => `mgp:${game}:${type}`;

const loadNum = (k, def = 0) => {
  try {
    return Number(localStorage.getItem(k)) || def;
  } catch {
    return def;
  }
};
const saveNum = (k, v) => {
  try {
    localStorage.setItem(k, String(v));
  } catch {}
};

export const getHighScore = (game) => loadNum(key(game, "high"));
export const setHighScore = (game, v) => saveNum(key(game, "high"), v);
export const bumpHighScore = (game, v) =>
  setHighScore(game, Math.max(getHighScore(game), v));

export const getLastScore = (game) => loadNum(key(game, "last"));
export const setLastScore = (game, v) => saveNum(key(game, "last"), v);
