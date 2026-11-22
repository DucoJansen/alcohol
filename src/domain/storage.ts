import type { AppData } from "./types";
import { validState, withDefaultModel } from "./validation";

export const STORAGE_KEY = "alcoholinzicht.avond.v1";
export const SCANNER_URL_KEY = "alcoholinzicht.scanner.url.v1";
export const SCANNER_TOKEN_KEY = "alcoholinzicht.scanner.token.v1";

export function defaults(): AppData {
  return {
    version: 1,
    profile: { height: 187, weight: 75, model: "male", limit: 0.5 },
    drinks: [],
  };
}

export function loadState(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as AppData;
      if (!validState(parsed)) throw new Error("Onbekend of ongeldig logboekformaat.");
      const migrated = withDefaultModel(parsed);
      if (migrated !== parsed) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults()));
    return defaults();
  } catch {
    return defaults();
  }
}

export function persistState(next: AppData): boolean {
  try {
    if (!validState(next)) throw new Error("Ongeldige gegevens; wijziging geweigerd.");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function loadScannerSettings(): { url: string; token: string } {
  try {
    const url = localStorage.getItem(SCANNER_URL_KEY) || "";
    const savedToken = localStorage.getItem(SCANNER_TOKEN_KEY);
    const sessionToken = savedToken === null ? sessionStorage.getItem(SCANNER_TOKEN_KEY) : null;
    const token = savedToken ?? sessionToken ?? "";

    if (url && sessionToken) {
      try {
        localStorage.setItem(SCANNER_TOKEN_KEY, sessionToken);
        sessionStorage.removeItem(SCANNER_TOKEN_KEY);
      } catch {
        // ignore
      }
    }

    return { url, token };
  } catch {
    return { url: "", token: "" };
  }
}

export function saveScannerSettings(url: string, token: string): boolean {
  try {
    localStorage.setItem(SCANNER_URL_KEY, url);
    localStorage.setItem(SCANNER_TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export function forgetScannerToken(): boolean {
  try {
    sessionStorage.removeItem(SCANNER_TOKEN_KEY);
    localStorage.removeItem(SCANNER_TOKEN_KEY);
    return true;
  } catch {
    return false;
  }
}
