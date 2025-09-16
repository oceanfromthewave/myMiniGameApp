export function getDeviceId() {
  const k = "mgp:device-id";
  let v = localStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID?.() || String(Math.random()).slice(2);
    localStorage.setItem(k, v);
  }
  return v;
}
export function getUsername() {
  return localStorage.getItem("mgp:username") || "익명";
}
export function setUsername(name) {
  localStorage.setItem("mgp:username", String(name || "").slice(0, 20));
}
