/** Opt-in avisos resultado/liga (misma data que la app Android). */
export const SUB_EVENT = "event_result";
export const SUB_LEAGUE = "league";

/**
 * Off mientras no haya plan Blaze / Functions para enviar push.
 * Poner en true cuando se reactive el envío.
 */
export const PUSH_OPT_IN_UI = false;

function subDocId(type, targetId) {
  return type + "_" + targetId;
}

function targetKey(type, targetId) {
  return type + "_" + targetId;
}

export async function isSubEnabled(db, uid, type, targetId, { getDoc, doc }) {
  if (!db || !uid || !targetId) return false;
  try {
    const snap = await getDoc(
      doc(db, "user_profiles", uid, "subscriptions", subDocId(type, targetId)),
    );
    return !!(snap.exists() && snap.data() && snap.data().enabled === true);
  } catch (e) {
    console.warn("isSubEnabled", e);
    return false;
  }
}

export async function setSubEnabled(
  db,
  uid,
  type,
  targetId,
  enabled,
  label,
  { doc, writeBatch },
) {
  if (!db || !uid || !targetId) throw new Error("Sin sesión");
  const batch = writeBatch(db);
  const profileRef = doc(
    db,
    "user_profiles",
    uid,
    "subscriptions",
    subDocId(type, targetId),
  );
  const targetRef = doc(
    db,
    "push_targets",
    targetKey(type, targetId),
    "subscribers",
    uid,
  );
  batch.set(
    profileRef,
    {
      type,
      targetId,
      enabled: !!enabled,
      label: String(label || "").slice(0, 80),
      updatedAtEpochMs: Date.now(),
    },
    { merge: true },
  );
  if (enabled) {
    batch.set(
      targetRef,
      { enabled: true, updatedAtEpochMs: Date.now() },
      { merge: true },
    );
  } else {
    batch.delete(targetRef);
  }
  await batch.commit();
}
