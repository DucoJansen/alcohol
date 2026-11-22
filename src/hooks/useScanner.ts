import { useState, useCallback } from "react";
import {
  loadScannerSettings,
  saveScannerSettings,
  forgetScannerToken,
  SCANNER_TOKEN_KEY,
} from "../domain/storage";
import { validScannerURL } from "../domain/validation";

export function useScanner() {
  const [{ url, token }, setSettings] = useState(() => loadScannerSettings());

  const [scanStatus, setScanStatus] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [rawResponse, setRawResponse] = useState("");

  const saveSettings = useCallback(
    (newUrl: string, newToken: string): boolean => {
      if (!validScannerURL(newUrl)) return false;
      const ok = saveScannerSettings(newUrl, newToken);
      if (ok) setSettings({ url: newUrl, token: newToken });
      return ok;
    },
    [],
  );

  const forgetToken = useCallback(() => {
    const ok = forgetScannerToken();
    if (ok) {
      sessionStorage.removeItem(SCANNER_TOKEN_KEY);
      setSettings(prev => ({ ...prev, token: "" }));
    }
    return ok;
  }, []);

  const scanPhoto = useCallback(
    async (imageDataUrl: string) => {
      if (!url || !token || scanBusy) return;
      setScanBusy(true);
      setScanStatus("Foto verkleinen en analyseren via Cloudflare…");
      setRawResponse("");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);

      try {
        const response = await fetch(url, {
          method: "POST",
          credentials: "omit",
          redirect: "error",
          referrerPolicy: "no-referrer",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ image: imageDataUrl }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const messages: Record<number, string> = {
            400: "De scanner kon de foto niet verwerken. Probeer een andere foto.",
            401: "De toegangscode is onjuist. Controleer de scannerinstellingen.",
            413: "De foto is te groot voor de scanner.",
            429: "De gratis scanlimiet is bereikt. Probeer later opnieuw of log handmatig.",
            503: "De scannerservice is nog niet correct ingesteld of tijdelijk niet beschikbaar.",
          };
          throw new Error(
            messages[response.status] ||
              `De scannerservice gaf fout ${response.status}. Probeer opnieuw of log handmatig.`,
          );
        }

        const values = await response.json();
        setRawResponse(JSON.stringify(values, null, 2));
        return values;
      } catch (error: unknown) {
        const err = error as Error & { name?: string };
        if (err.name === "AbortError") {
          throw new Error("De scan duurde langer dan 45 seconden.");
        }
        if (err instanceof TypeError) {
          throw new Error(
            "Geen verbinding met de scanner. Controleer internet, het scanneradres en de toegestane website in Cloudflare.",
          );
        }
        throw error;
      } finally {
        clearTimeout(timer);
        setScanBusy(false);
      }
    },
    [url, token, scanBusy],
  );

  return {
    url,
    token,
    scanStatus,
    scanBusy,
    rawResponse,
    setScanStatus,
    setRawResponse,
    saveSettings,
    forgetToken,
    scanPhoto,
  };
}
