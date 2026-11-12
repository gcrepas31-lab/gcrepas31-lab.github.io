/** Perfil visible en web FixtureGo: nick por email + sync Firestore. */
const KEY_PREFIX = "fg_display_name_v1:";
const LEGACY_KEY = "fg_display_name_v1";
const THEME_KEY = "fg_theme_v1";

function emailKey(email) {
  return KEY_PREFIX + String(email || "").trim().toLowerCase();
}

/** Nick local de ESA cuenta (nunca el de otra). */
export function getStoredName(email) {
  try {
    if (email) {
      return (localStorage.getItem(emailKey(email)) || "").trim();
    }
    return (localStorage.getItem(LEGACY_KEY) || "").trim();
  } catch (_) {
    return "";
  }
}

export function setStoredName(name, email) {
  const n = String(name || "").trim().slice(0, 79);
  try {
    if (email) {
      const key = emailKey(email);
      if (n) localStorage.setItem(key, n);
      else localStorage.removeItem(key);
      // Evitar que el legacy “pegue” el nick entre cuentas
      localStorage.removeItem(LEGACY_KEY);
    } else if (n) {
      localStorage.setItem(LEGACY_KEY, n);
    } else {
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch (_) {}
  return n;
}

export function niceName(u) {
  const stored = getStoredName(u && u.email);
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

/**
 * Carga nick desde Firestore (user_profiles/{uid}) y lo guarda local por email.
 * @returns {Promise<string>} nick resuelto (remoto, local o Google)
 */
export async function loadRemoteProfile(db, u, { getDoc, doc } = {}) {
  if (!db || !u || !u.uid || !getDoc || !doc) {
    return niceName(u);
  }
  try {
    const snap = await getDoc(doc(db, "user_profiles", u.uid));
    if (snap.exists()) {
      const remote = String((snap.data() || {}).displayName || "").trim().slice(0, 79);
      if (remote) {
        setStoredName(remote, u.email);
        return remote;
      }
    }
  } catch (e) {
    console.warn("loadRemoteProfile", e);
  }
  return niceName(u);
}

/** Guarda nick en Firestore + localStorage por email. */
export async function saveRemoteProfile(db, u, name, { setDoc, doc } = {}) {
  const n = String(name || "").trim().slice(0, 79);
  if (!n) return "";
  setStoredName(n, u && u.email);
  if (!db || !u || !u.uid || !setDoc || !doc) return n;
  try {
    await setDoc(
      doc(db, "user_profiles", u.uid),
      {
        email: String(u.email || "").trim().toLowerCase(),
        displayName: n,
        updatedAtEpochMs: Date.now(),
      },
      { merge: true },
    );
  } catch (e) {
    console.warn("saveRemoteProfile", e);
    throw e;
  }
  return n;
}
