import { supabase } from "../hooks/useSupabase";
import { getDeviceId } from "./device";

const CAPS = {
  2048: 200000,
  tetris: 999999,
  brickbreaker: 9999,
  pinball: 999999,
};

export async function saveScore({ game, score, username, country }) {
  if (!["2048", "tetris", "brickbreaker", "pinball"].includes(game))
    return { error: "bad game" };
  const n = Number(score);
  if (!Number.isFinite(n) || n < 0 || (CAPS[game] && n > CAPS[game]))
    return { error: "invalid score" };
  const device_id = getDeviceId();
  return await supabase
    .from("scores")
    .insert({ game, score: n, username, country, device_id });
}

export async function getTop({ game, limit = 50 }) {
  return await supabase
    .from("scores")
    .select("username, score, created_at, country")
    .eq("game", game)
    .order("score", { ascending: false })
    .limit(limit);
}
