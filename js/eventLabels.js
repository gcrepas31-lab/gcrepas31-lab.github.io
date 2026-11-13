/**
 * Labels humanos para tipo/modalidad FixtureGo (web).
 * Alineado a chips de la app: online_modality_* / hub Inscripciones.
 *
 * Fuentes de wire:
 * - open_events.americanaModality: all_vs_all, pairs, …
 * - event_results.tipoFixture / Room: AMERICANA_TODOS_VS_TODOS, …
 */

const MODALITY_WIRE_LABEL = {
  all_vs_all: "Todos vs todos",
  pairs: "Por parejas",
  mixed_fixed: "Mixta fija",
  mixed_rotating: "Mixta rotativa",
  custom: "Personalizada",
  ladder: "Escalera",
};

/** TipoFixture.name y alias legacy que a veces llegan del publisher / series. */
const TIPO_FIXTURE_LABEL = {
  AMERICANA_TODOS_VS_TODOS: "Todos vs todos",
  AMERICANA_PAREJAS: "Por parejas",
  AMERICANA_MIXTA: "Mixta fija",
  AMERICANA_MIXTA_ROTATIVA: "Mixta rotativa",
  AMERICANA_PERSONALIZADA: "Personalizada",
  AMERICANA_ESCALERA: "Escalera",
  TORNEO: "Torneo",
  // Enum-ish / modality upper
  ALL_VS_ALL: "Todos vs todos",
  PAIRS: "Por parejas",
  MIXED_FIXED: "Mixta fija",
  MIXED_ROTATING: "Mixta rotativa",
  CUSTOM: "Personalizada",
  LADDER: "Escalera",
  // Alias históricos (TipoEventoRegistry / series viejas)
  AMERICA_TODOS_VS_TODOS: "Todos vs todos",
  AMERICANO: "Todos vs todos",
  NORMAL: "Todos vs todos",
  ROUND_ROBIN: "Todos vs todos",
};

function humanizeRaw(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  return s
    .replace(/^AMERICANA_/i, "")
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Wire modality (all_vs_all) o TipoFixture / alias → label corto de chip. */
export function modalityLabelFromKey(key) {
  if (key == null || key === "") return "";
  const k = String(key).trim();
  if (MODALITY_WIRE_LABEL[k]) return MODALITY_WIRE_LABEL[k];
  const lower = k.toLowerCase();
  if (MODALITY_WIRE_LABEL[lower]) return MODALITY_WIRE_LABEL[lower];
  const up = k.toUpperCase();
  if (TIPO_FIXTURE_LABEL[up]) return TIPO_FIXTURE_LABEL[up];
  return humanizeRaw(k);
}

/** event_results.tipoFixture (u otro enum técnico). */
export function tipoFixtureLabel(raw) {
  return modalityLabelFromKey(raw);
}

/**
 * Para cards de open_events / detalle inscripción.
 * Torneo → "Torneo"; americana → modality chip.
 */
export function modalityLabelForEvent(ev) {
  if (!ev) return "";
  if (ev.type === "torneo") return "Torneo";
  return modalityLabelFromKey(
    ev.americanaModality || ev.modality || ev.tipoFixture || "",
  );
}

export { MODALITY_WIRE_LABEL, TIPO_FIXTURE_LABEL };
