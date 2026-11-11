/**
 * Login Google para fixturego.com (GitHub Pages).
 * Evita signInWithRedirect: en iPhone el resultado se pierde entre
 * fixturego.com y *.firebaseapp.com (orígenes distintos).
 */
let gsiLoading = null;

function loadGsiScript() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) {
    return Promise.resolve();
  }
  if (gsiLoading) return gsiLoading;
  gsiLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar Google Sign-In"));
    document.head.appendChild(s);
  });
  return gsiLoading;
}

export function googleWebClientId() {
  const cfg = window.FIXTUREGO_FIREBASE || {};
  return (cfg.googleWebClientId || cfg.webClientId || "").trim();
}

/**
 * @param {import("firebase/auth").Auth} auth
 * @param {typeof import("firebase/auth").GoogleAuthProvider} GoogleAuthProvider
 * @param {typeof import("firebase/auth").signInWithCredential} signInWithCredential
 */
export async function signInWithGoogleId(auth, GoogleAuthProvider, signInWithCredential) {
  const clientId = googleWebClientId();
  if (!clientId) {
    throw new Error(
      "Falta googleWebClientId en firebase-config.js (Web client de Firebase Auth → Google).",
    );
  }
  await loadGsiScript();
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    throw new Error("Google Sign-In no está disponible en este navegador.");
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err, user) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(user);
    };

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        prompt: "select_account",
        callback: async (tokenResponse) => {
          if (!tokenResponse || tokenResponse.error) {
            finish(
              new Error(
                (tokenResponse &&
                  (tokenResponse.error_description || tokenResponse.error)) ||
                  "Login Google cancelado",
              ),
            );
            return;
          }
          try {
            const credential = GoogleAuthProvider.credential(
              null,
              tokenResponse.access_token,
            );
            const result = await signInWithCredential(auth, credential);
            finish(null, result.user);
          } catch (e) {
            finish(e);
          }
        },
        error_callback: (err) => {
          const msg =
            (err && (err.message || err.type)) || "No se pudo abrir Google";
          finish(new Error(String(msg)));
        },
      });
      client.requestAccessToken();
    } catch (e) {
      finish(e);
    }
  });
}
