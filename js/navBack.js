/**
 * Navegación “Atrás” fiable entre páginas FixtureGo (hub / ficha / liga / resultado).
 * Evita history.back() a WhatsApp u otras apps: usa ?ret= del mismo origen.
 *
 * Importante: no encadenar Liga ↔ Resultado como “atrás” (bucle).
 * Si ya venís del hub (/eventos), ese ret se propaga a las fichas hijas.
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

/** Fichas de detalle que no deben rebotar entre sí. */
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

/** Quita ?ret= anidados para no inflar la URL. */
export function stripReturnParam(href) {
  try {
    const u = new URL(href, location.href);
    u.searchParams.delete(RET_PARAM);
    return u.pathname + u.search + u.hash;
  } catch (_) {
    return href;
  }
}

/** URL actual limpia (sin ret) para usarla como destino de vuelta. */
export function currentReturnTarget() {
  return stripReturnParam(location.pathname + location.search + location.hash);
}

/**
 * Destino de “atrás” a propagar a enlaces hijos.
 * Preferimos el ret del hub (/eventos) si existe, para no crear Liga↔Resultado.
 */
function returnTargetForChildLinks() {
  const existing = sameOriginUrl(
    new URLSearchParams(location.search).get(RET_PARAM),
  );
  if (existing) {
    const cleaned = stripReturnParam(
      existing.pathname + existing.search + existing.hash,
    );
    // Si el ret ya apunta al hub, propagarlo
    if (isHubPath(cleaned)) return cleaned;
    // Si el ret es otra ficha de detalle, no usarlo (evita bucle)
    if (isDetailPath(cleaned)) {
      // caer al hub por defecto según sección
      if (pathOf(location.pathname).includes("/l/")) return "../eventos/#ligas";
      if (pathOf(location.pathname).includes("/r/")) return "../eventos/#jugados";
      return "../eventos/";
    }
    return cleaned;
  }
  // Estamos en el hub: la vuelta es esta página
  if (isHubPath(location.pathname)) return currentReturnTarget();
  // Estamos en detalle sin ret: no poner esta ficha como único “atrás”
  // (los hijos irán al fallback del hub vía applyBackButton)
  if (isDetailPath(location.pathname)) {
    if (pathOf(location.pathname).includes("/l/")) return "../eventos/#ligas";
    if (pathOf(location.pathname).includes("/r/")) return "../eventos/#jugados";
    return "../eventos/";
  }
  return currentReturnTarget();
}

/**
 * Enlaza una URL interna añadiendo ?ret= (preferentemente al hub).
 * @param {string} url relativa o absoluta misma origen
 */
export function hrefWithReturn(url) {
  try {
    const u = new URL(url, location.href);
    u.searchParams.set(RET_PARAM, returnTargetForChildLinks());
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
    fromQuery.searchParams.delete(RET_PARAM);
    const there = fromQuery.pathname + fromQuery.search + fromQuery.hash;
    // Ignorar ret que solo rebotaría entre Liga/Resultado/Evento
    if (!(isDetailPath(location.pathname) && isDetailPath(there))) {
      return { url: fromQuery, fromFallback: false };
    }
  }
  if (document.referrer) {
    const ref = sameOriginUrl(document.referrer);
    if (ref) {
      const here = stripReturnParam(
        location.pathname + location.search + location.hash,
      );
      const there = stripReturnParam(
        ref.pathname + ref.search + ref.hash,
      );
      // No usar referrer si es ficha↔ficha (el bucle típico)
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
