/**
 * Navegación “Atrás” fiable entre páginas FixtureGo (hub / ficha / liga / resultado).
 * Evita history.back() a WhatsApp u otras apps: usa ?ret= del mismo origen.
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
 * Enlaza una URL interna añadiendo ?ret= a la página actual.
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
    fromQuery.searchParams.delete(RET_PARAM);
    return { url: fromQuery, fromFallback: false };
  }
  if (document.referrer) {
    const ref = sameOriginUrl(document.referrer);
    if (ref) {
      const here = stripReturnParam(location.pathname + location.search + location.hash);
      const there = stripReturnParam(ref.pathname + ref.search + ref.hash);
      if (there !== here) return { url: ref, fromFallback: false };
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
