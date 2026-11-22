import type { AppData, ScanResult } from "./types";

export const withDefaultModel = (value: AppData): AppData =>
  (value.profile.model as string) === ""
    ? { ...value, profile: { ...value.profile, model: "male" } }
    : value;

export function validState(value: unknown): value is AppData {
  if (
    !value ||
    typeof value !== "object" ||
    !("version" in value) ||
    value.version !== 1 ||
    !("profile" in value) ||
    !("drinks" in value) ||
    !Array.isArray((value as AppData).drinks)
  )
    return false;

  const obj = value as AppData;
  const p = obj.profile;
  if (
    !Number.isFinite(p.height) ||
    p.height < 120 ||
    p.height > 230 ||
    !Number.isFinite(p.weight) ||
    p.weight < 35 ||
    p.weight > 250 ||
    !["", "male", "female"].includes(p.model) ||
    ![0.2, 0.5].includes(p.limit)
  )
    return false;

  const ids = new Set<string>();
  return obj.drinks.every(d => {
    if (
      !d ||
      typeof d.id !== "string" ||
      ids.has(d.id) ||
      typeof d.name !== "string" ||
      d.name.length > 80 ||
      !Number.isFinite(d.volume) ||
      d.volume < 1 ||
      d.volume > 5000 ||
      !Number.isFinite(d.abv) ||
      d.abv < 0 ||
      d.abv > 100 ||
      !Number.isFinite(d.time) ||
      d.time < 0 ||
      d.time > 8640000000000000 ||
      !["manual", "photo"].includes(d.source)
    )
      return false;
    ids.add(d.id);
    return true;
  });
}

export function validScanResult(value: unknown): value is ScanResult {
  const nullableText = (text: unknown, max: number) =>
    text === null || (typeof text === "string" && text.length <= max);

  if (
    value === null ||
    typeof value !== "object"
  )
    return false;

  const obj = value as Record<string, unknown>;
  if (!nullableText(obj.name, 80) || !nullableText(obj.type, 80)) return false;

  if (obj.volume_ml !== null) {
    if (
      !Number.isFinite(obj.volume_ml) ||
      (obj.volume_ml as number) < 1 ||
      (obj.volume_ml as number) > 5000
    )
      return false;
  }

  if (obj.abv_percent !== null) {
    if (
      !Number.isFinite(obj.abv_percent) ||
      (obj.abv_percent as number) < 0 ||
      (obj.abv_percent as number) > 100
    )
      return false;
  }

  if (typeof obj.notes !== "string" || obj.notes.length > 400) return false;

  return true;
}

export function validScannerURL(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".workers.dev") &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname === "/api/scan" &&
      !url.search &&
      !url.hash
    );
  } catch (error) {
    if (error instanceof TypeError) return false;
    throw error;
  }
}
