/** Perfil visible en web FixtureGo (nombre editable local + Auth). */
const KEY = "fg_display_name_v1";
const THEME_KEY = "fg_theme_v1";

export function getStoredName() {
  try {
    return (localStorage.getItem(KEY) || "").trim();
  } catch (_) {
    return "";
  }
}

export function setStoredName(name) {
  const n = String(name || "").trim().slice(0, 79);
  try {
    if (n) localStorage.setItem(KEY, n);
    else localStorage.removeItem(KEY);
  } catch (_) {}
  return n;
}

export function niceName(u) {
  const stored = getStoredName();
  if (stored) return stored;
  const dn = ((u && u.displayName) || "").trim();
  if (dn) return dn;
  const local = ((u && u.email) || "").split("@")[0];
  return local || "Jugador";
}

export function greetName(u) {
  const full = niceName(u);
  return full.trim().split(/\s+/)[0] || "jugador";
}

export function initial(u) {
  return greetName(u).charAt(0).toUpperCase() || "F";
}

export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch (_) {
    return "dark";
  }
}

export function setTheme(theme) {
  const t = theme === "light" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch (_) {}
  document.documentElement.setAttribute("data-theme", t);
  return t;
}

export function applySavedTheme() {
  return setTheme(getTheme());
}
