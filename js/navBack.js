/**
 * Navegación “Atrás” fiable entre páginas FixtureGo (hub / ficha / liga / resultado).
 * Evita history.back() a WhatsApp u otras apps: usa ?ret= del mismo origen.
 *
 * Comportamiento:
 * - Un “Atrás” = una pantalla atrás (ej. Resultado → Liga → Eventos).
 * - Al enlazar más profundo se guarda la URL ACTUAL completa (con su propio ?ret=),
 *   para no perder la cadena y no caer en bucle Liga ↔ Resultado.
 */

const RET_PARAM = "ret";

function sameOriginUrl(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw, location.href);
    if (u.origin !== location.origin) return null;
    return u;
  } catch (_) {
    return null;
  }
}

function pathOf(uOrPath) {
  if (!uOrPath) return "";
  if (typeof uOrPath === "string") {
    try {
      return new URL(uOrPath, location.href).pathname.toLowerCase();
    } catch (_) {
      return uOrPath.toLowerCase();
    }
  }
  return (uOrPath.pathname || "").toLowerCase();
}

function isHubPath(path) {
  return pathOf(path).includes("/eventos");
}

/** Fichas de detalle (no hub). */
function isDetailPath(path) {
  const p = pathOf(path);
  return (
    p.includes("/l/") ||
    /\/l\/?$/.test(p) ||
    p.includes("/r/") ||
    /\/r\/?$/.test(p) ||
    p.includes("/e/") ||
    /\/e\/?$/.test(p)
  );
}

/** Identidad estable de una URL (sin comparar ?ret= anidados de más). */
function pageKey(href) {
  try {
    const u = new URL(href, location.href);
    // Solo path + id/hash relevantes, sin el param ret
    u.searchParams.delete(RET_PARAM);
    return u.pathname + u.search + u.hash;
  } catch (_) {
    return String(href || "");
  }
}

/** Quita ?ret= (uso puntual; no para armar la cadena de atrás). */
export function stripReturnParam(href) {
  try {
    const u = new URL(href, location.href);
    u.searchParams.delete(RET_PARAM);
    return u.pathname + u.search + u.hash;
  } catch (_) {
    return href;
  }
}

/**
 * URL actual COMPLETA (incluye ?ret= si lo hay).
 * Así al ir Liga→Resultado, Resultado vuelve a Liga y Liga sigue pudiendo volver a Eventos.
 */
export function currentReturnTarget() {
  return location.pathname + location.search + location.hash;
}

/**
 * Enlaza una URL interna añadiendo ?ret= a la página actual (cadena completa).
 * @param {string} url relativa o absoluta misma origen
 */
export function hrefWithReturn(url) {
  try {
    const u = new URL(url, location.href);
    u.searchParams.set(RET_PARAM, currentReturnTarget());
    return u.pathname + u.search + u.hash;
  } catch (_) {
    return url;
  }
}

function labelForUrl(u) {
  const path = (u.pathname || "").toLowerCase();
  const hash = (u.hash || "").toLowerCase();
  if (path.includes("/l/") || /\/l\/?$/.test(path)) return "Liga";
  if (path.includes("/r/") || /\/r\/?$/.test(path)) return "Resultado";
  if (path.includes("/e/") || /\/e\/?$/.test(path)) return "Evento";
  if (path.includes("/eventos")) {
    if (hash === "#ligas") return "Ligas";
    if (hash === "#jugados") return "Jugados";
    if (hash === "#inscritos" || hash === "#mine") return "Mis insc.";
    if (hash === "#datos") return "Mis datos";
    return "Eventos";
  }
  return "Volver";
}

function resolveReturn(fallbackHref) {
  const params = new URLSearchParams(location.search);
  const fromQuery = sameOriginUrl(params.get(RET_PARAM));
  if (fromQuery) {
    const here = pageKey(location.href);
    const there = pageKey(fromQuery.href);
    if (there !== here) {
      return { url: fromQuery, fromFallback: false };
    }
  }

  // Referrer solo si no es ficha↔ficha (eso armaba el bucle sin ?ret= bueno)
  if (document.referrer) {
    const ref = sameOriginUrl(document.referrer);
    if (ref) {
      const here = pageKey(location.href);
      const there = pageKey(ref.href);
      if (
        there !== here &&
        !(isDetailPath(location.pathname) && isDetailPath(ref.pathname))
      ) {
        return { url: ref, fromFallback: false };
      }
    }
  }

  return {
    url: new URL(fallbackHref, location.href),
    fromFallback: true,
  };
}

/**
 * Configura un <a class="back-btn"> con destino y etiqueta correctos.
 * @param {HTMLAnchorElement|null} el
 * @param {{ fallbackHref: string, fallbackLabel?: string }} opts
 */
export function applyBackButton(el, opts) {
  if (!el) return;
  const fallbackHref = (opts && opts.fallbackHref) || "../eventos/";
  const fallbackLabel = (opts && opts.fallbackLabel) || "Eventos";
  const { url, fromFallback } = resolveReturn(fallbackHref);
  el.href = url.pathname + url.search + url.hash;
  const label = fromFallback ? fallbackLabel : labelForUrl(url);
  el.innerHTML =
    '<span class="arrow" aria-hidden="true">←</span> ' + label;
  el.setAttribute("data-back-resolved", "1");
}
