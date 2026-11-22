import { useState, useCallback, useRef } from "react";
import { format, localDateTime } from "../domain/formatting";
import type { Drink } from "../domain/types";
import { validScanResult } from "../domain/validation";
import { suggestedScanVolume } from "../domain/bac";
import { useScanner } from "../hooks/useScanner";

interface PhotoScannerProps {
  onAddDrink: (drink: Drink) => void;
  onNotify: (text: string, error?: boolean) => void;
  storageReady: boolean;
}

export default function PhotoScanner({ onAddDrink, onNotify, storageReady }: PhotoScannerProps) {
  const { url, token, scanStatus, scanBusy, rawResponse, setScanStatus, scanPhoto, saveSettings, forgetToken } =
    useScanner();

  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [photoCanvas, setPhotoCanvas] = useState<HTMLCanvasElement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showOcrDetails, setShowOcrDetails] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [photoVolume, setPhotoVolume] = useState("");
  const [photoAbv, setPhotoAbv] = useState("");
  const [photoTime, setPhotoTime] = useState(localDateTime);
  const [scannerUrl, setScannerUrl] = useState(url);
  const [scannerToken, setScannerToken] = useState(token);
  const [editedTime, setEditedTime] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoFormRef = useRef<HTMLFormElement>(null);

  const clearPhoto = useCallback(() => {
    if (previewURL) URL.revokeObjectURL(previewURL);
    setPreviewURL(null);
    setPhotoCanvas(null);
    setShowForm(false);
    setShowOcrDetails(false);
    setPhotoName("");
    setPhotoVolume("");
    setPhotoAbv("");
    setEditedTime(false);
    setPhotoTime(localDateTime());
    setScanStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [previewURL, setScanStatus]);

  const preparePhoto = useCallback(() => {
    const file = fileInputRef.current?.files?.[0];
    clearPhoto();
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      onNotify("Deze foto is groter dan 25 MB. Kies een kleinere foto of log handmatig.", true);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (image.src !== previewUrl) return;
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        onNotify("Deze browser kan de foto niet verwerken. Log het drankje handmatig.", true);
        clearPhoto();
        return;
      }
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setPhotoCanvas(canvas);
      setPreviewURL(previewUrl);
      setScanStatus("Foto klaar. Tik op Scan etiket om de foto naar de Cloudflare-scanner te sturen.");
    };
    image.onerror = () => {
      if (image.src !== previewUrl) return;
      clearPhoto();
      onNotify(
        "Foto kon niet worden geopend. Kies een JPEG/PNG-foto of maak een nieuwe foto. Sommige HEIC-bestanden worden niet ondersteund.",
        true,
      );
    };
    image.src = previewUrl;
  }, [clearPhoto, onNotify, setScanStatus]);

  const handleScan = useCallback(async () => {
    if (!photoCanvas || scanBusy) return;
    if (!url || !token) {
      onNotify(
        "Stel eerst je gratis Cloudflare-scanner en toegangscode in. Handmatig loggen blijft beschikbaar.",
        true,
      );
      return;
    }

    setShowForm(false);
    setPhotoVolume("");
    setPhotoAbv("");
    setPhotoName("");
    setShowOcrDetails(false);

    try {
      // Convert canvas to data URL
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        photoCanvas!.toBlob(
          blob => {
            if (!blob) {
              reject(new Error("De foto kon niet worden omgezet naar JPEG."));
              return;
            }
            if (blob.size > 1000000) {
              reject(
                new Error(
                  "Deze foto is na verkleinen nog groter dan 1 MB. Kies een eenvoudiger of kleinere foto.",
                ),
              );
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("De foto kon niet worden gelezen."));
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.82,
        );
      });

      const result = (await scanPhoto(imageDataUrl)) as unknown;
      if (!validScanResult(result)) {
        throw new Error("De scanner gaf ongeldige gegevens terug. Er is niets gelogd.");
      }

      setShowOcrDetails(true);
      setPhotoName(result.type || "");
      const volume = suggestedScanVolume(result.type, result.volume_ml);
      setPhotoVolume(volume === null ? "" : String(volume));
      setPhotoAbv(result.abv_percent === null ? "" : String(result.abv_percent));
      if (!editedTime) setPhotoTime(localDateTime());
      setShowForm(true);

      const msg =
        volume !== null && result.abv_percent !== null
          ? "AI-suggesties gevonden. Controleer naam, automatisch ingevulde hoeveelheid en percentage."
          : "Niet alles is leesbaar. Controleer de AI-suggesties en vul de ontbrekende waarden zelf in.";
      setScanStatus(msg);
      if (storageReady) {
        onNotify("Scan afgerond. Controleer en bevestig de waarden; er is nog niets gelogd.");
      }
    } catch (error: unknown) {
      const err = error as Error;
      setScanStatus("Scannen mislukt. Probeer opnieuw of vul de waarden hieronder zelf in.");
      setShowForm(false);
      if (!editedTime) setPhotoTime(localDateTime());
      onNotify(`Etiketherkenning mislukt: ${err.message} Je kunt altijd handmatig loggen.`, true);
    }
  }, [
    photoCanvas,
    scanBusy,
    url,
    token,
    scanPhoto,
    editedTime,
    storageReady,
    onNotify,
    setScanStatus,
  ]);

  const adjustPhotoValue = useCallback(
    (field: "volume" | "abv", delta: number) => {
      const current = field === "volume" ? photoVolume : photoAbv;
      const num = current === "" ? 0 : Number(current);
      if (Number.isNaN(num)) {
        onNotify("Vul eerst een geldig getal in.", true);
        return;
      }
      const newVal = Number((num + delta).toFixed(10));
      if (field === "volume") {
        setPhotoVolume(String(Math.min(5000, Math.max(1, newVal))));
      } else {
        setPhotoAbv(String(Math.min(100, Math.max(0, newVal))));
      }
    },
    [photoVolume, photoAbv, onNotify],
  );

  const handlePhotoSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!photoFormRef.current?.checkValidity()) {
        photoFormRef.current?.reportValidity();
        return;
      }

      const vol = Number(photoVolume);
      const abvVal = Number(photoAbv);
      const timeVal = new Date(photoTime).getTime();

      if (!Number.isFinite(timeVal) || timeVal < 0 || timeVal > Date.now()) {
        onNotify("Kies een geldige starttijd die niet in de toekomst ligt.", true);
        return;
      }

      const drink: Drink = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: photoName.trim() || "Drankje van foto",
        volume: vol,
        abv: abvVal,
        time: timeVal,
        source: "photo",
      };

      onAddDrink(drink);
      clearPhoto();
      onNotify(`${drink.name} opgeslagen: ${format(vol, 0)} ml, ${format(abvVal)}%.`);
    },
    [photoVolume, photoAbv, photoTime, photoName, onAddDrink, onNotify, clearPhoto],
  );

  const handleScannerSettingsSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const ok = saveSettings(scannerUrl, scannerToken);
      if (ok) {
        onNotify(
          "Scanner ingesteld en toegangscode bewaard in deze browser. Alleen na toestemming wordt een foto geüpload.",
        );
      } else {
        onNotify("Scannerinstellingen konden niet worden bewaard. Controleer of browseropslag is toegestaan.", true);
      }
    },
    [scannerUrl, scannerToken, saveSettings, onNotify],
  );

  const handleForgetScanner = useCallback(() => {
    const ok = forgetToken();
    if (ok) {
      setScannerToken("");
      onNotify("Scannercode uit de browseropslag verwijderd. Je logboek is behouden.");
    } else {
      onNotify("Scannercode kon niet worden verwijderd. Controleer of browseropslag is toegestaan.", true);
    }
  }, [forgetToken, onNotify]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, field: "volume" | "abv") => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const step = field === "volume" ? 10 : 0.1;
        e.preventDefault();
        adjustPhotoValue(field, e.key === "ArrowUp" ? step : -step);
      }
    },
    [adjustPhotoValue],
  );

  return (
    <section className="card card-pad">
      <div className="section-label">
        <h2>Etiket scannen</h2>
        <span className="tag">FOTO STAAND</span>
      </div>
      <div className="photo-zone">
        <svg
          className="camera-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M3 7h4l2-3h6l2 3h4v13H3z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <label htmlFor="photo-input">Maak een foto van het etiket</label>
        <p className="hint">Fotografeer het percentage en de inhoud op het etiket.</p>
        <input
          id="photo-input"
          type="file"
          accept="image/*"
          capture="environment"
          className="spaced"
          aria-describedby="photo-privacy"
          ref={fileInputRef}
          onChange={preparePhoto}
          disabled={scanBusy}
        />
        {previewURL && (
          <img id="preview" src={previewURL} alt="Gekozen etiket voor analyse na toestemming" />
        )}
      </div>
      <p id="photo-privacy" className="hint">
        Alleen de foto wordt verstuurd, niet je profiel of logboek. Internet nodig; gratis daglimiet.
      </p>
      <details id="scanner-settings">
        <summary>Scanner instellen</summary>
        <p className="hint">
          Doe dit eenmalig op je computer. Blijf op <strong>Free</strong>; activeer geen betaald abonnement of
          AI-tegoed.
        </p>
        <ol className="setup-steps">
          <li>
            <a
              href="https://dash.cloudflare.com/sign-up"
              target="_blank"
              rel="noopener noreferrer"
            >
              Maak een gratis Cloudflare-account
            </a>
            , of{" "}
            <a href="https://dash.cloudflare.com/login" target="_blank" rel="noopener noreferrer">
              log in
            </a>
            .
          </li>
          <li>
            Open{" "}
            <a
              href="https://dash.cloudflare.com/?to=/:account/workers-and-pages"
              target="_blank"
              rel="noopener noreferrer"
            >
              Workers &amp; Pages
            </a>{" "}
            → <strong>Create application</strong>; maak een Worker met de naam{" "}
            <code>alcohol-label-scan</code>. Vervang bij <strong>Edit code</strong> de voorbeeldcode door{" "}
            <a href="./cloudflare/worker.mjs" target="_blank" rel="noopener noreferrer">
              deze scannercode
            </a>{" "}
            → <strong>Deploy</strong>.
          </li>
          <li>
            Open bij die Worker <strong>Bindings → Add binding → Workers AI</strong>; geef de binding de naam{" "}
            <code>AI</code>.
          </li>
          <li>
            Voeg bij <strong>Settings → Variables and Secrets</strong> toe:
            <ul className="setup-values">
              <li>
                <strong>Text</strong> <code>ALLOWED_ORIGIN</code>:";
              </li>
              <li>
                <strong>Secret</strong> <code>SCAN_TOKEN</code>: een eigen willekeurige code van 20–128
                letters/cijfers.
              </li>
            </ul>
          </li>
          <li>
            Sla op en klik <strong>Deploy</strong>. Vul hieronder je{" "}
            <code>https://alcohol-label-scan.[naam].workers.dev</code>-link met <code>/api/scan</code> erachter in,
            plus dezelfde toegangscode.
          </li>
        </ol>
        <p className="hint">
          Door op <strong>Scan etiket</strong> te drukken, geef je toestemming om deze foto naar de
          Cloudflare-scanner te sturen.
        </p>
        <p className="hint field">
          <a href="./cloudflare/SETUP.txt" target="_blank" rel="noopener noreferrer">
            Uitgebreide hulp en foutmeldingen
          </a>{" "}
          ·{" "}
          <a
            href="https://developers.cloudflare.com/workers/get-started/dashboard/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cloudflare-handleiding
          </a>
        </p>
        <form id="scanner-settings-form" onSubmit={handleScannerSettingsSubmit}>
          <div className="field">
            <label htmlFor="scanner-url">Scannerlink (eindigt op /api/scan)</label>
            <input
              id="scanner-url"
              type="url"
              inputMode="url"
              placeholder="https://alcohol-label-scan.jouw-naam.workers.dev/api/scan"
              autoComplete="off"
              spellCheck={false}
              required
              value={scannerUrl}
              onChange={e => setScannerUrl(e.target.value)}
              disabled={scanBusy}
            />
          </div>
          <div className="field">
            <label htmlFor="scanner-token">Toegangscode (zelf gedefinieerd in stap 4)</label>
            <input
              id="scanner-token"
              name="scanner-token"
              type="password"
              minLength={20}
              maxLength={128}
              pattern="[!-~]{20,128}"
              title="Gebruik 20 tot 128 letters, cijfers of ASCII-symbolen, zonder spaties."
              autoComplete="current-password"
              required
              value={scannerToken}
              onChange={e => setScannerToken(e.target.value)}
              disabled={scanBusy}
            />
          </div>
          <button type="submit" className="secondary full" disabled={scanBusy}>
            Sla op
          </button>
          <button type="button" className="plain full" id="forget-scanner" onClick={handleForgetScanner}>
            Opgeslagen code verwijderen
          </button>
        </form>
        <p className="hint">
          Met <strong>Sla op</strong> blijven de link en code in deze browser bewaard, ook na opnieuw openen. Sla de
          code alleen op in een browser die je vertrouwt.
        </p>
      </details>
      <p id="ocr-status" role="status" aria-live="polite">
        {scanStatus}
      </p>
      <button
        type="button"
        id="scan-button"
        className="secondary full"
        disabled={!photoCanvas || scanBusy}
        onClick={handleScan}
      >
        Scan etiket
      </button>
      {showOcrDetails && (
        <details id="ocr-details" className="spaced">
          <summary>Details van de AI-suggestie</summary>
          <pre id="ocr-text">{rawResponse}</pre>
        </details>
      )}
      {showForm && (
        <form id="photo-form" className="spaced" ref={photoFormRef} onSubmit={handlePhotoSubmit}>
          <h3>We hebben wat gevonden. Klopt dit?</h3>
          <p className="hint field">
            De hoeveelheid wordt ingevuld op basis van het herkende type: volledige verpakking voor bier of mixdrank, een
            standaardglas wijn of een shot sterke drank. Bij een onbekend type wordt de etiketinhoud gebruikt.
            Controleer en pas zo nodig aan.
          </p>
          <div className="field">
            <label htmlFor="photo-name">
              Naam drankje <span className="caption">(optioneel)</span>
            </label>
            <input
              id="photo-name"
              maxLength={80}
              placeholder="Drankje van foto"
              value={photoName}
              onChange={e => setPhotoName(e.target.value)}
            />
          </div>
          <div className="fields">
            <div className="field">
              <label htmlFor="photo-volume">Hoeveelheid (ml)</label>
              <input
                id="photo-volume"
                type="number"
                inputMode="decimal"
                min={1}
                max={5000}
                step="any"
                required
                value={photoVolume}
                onChange={e => setPhotoVolume(e.target.value)}
                onKeyDown={e => handleKeyDown(e, "volume")}
              />
              <div className="adjust-controls" role="group" aria-label="Portie aanpassen">
                <button type="button" className="secondary" onClick={() => adjustPhotoValue("volume", -100)}>
                  −100 ml
                </button>
                <button type="button" className="secondary" onClick={() => adjustPhotoValue("volume", 100)}>
                  +100 ml
                </button>
                <button type="button" className="secondary" onClick={() => adjustPhotoValue("volume", -10)}>
                  −10 ml
                </button>
                <button type="button" className="secondary" onClick={() => adjustPhotoValue("volume", 10)}>
                  +10 ml
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="photo-abv">Alcohol (%)</label>
              <input
                id="photo-abv"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="any"
                required
                value={photoAbv}
                onChange={e => setPhotoAbv(e.target.value)}
                onKeyDown={e => handleKeyDown(e, "abv")}
              />
              <div className="adjust-controls" role="group" aria-label="Gescand alcoholpercentage aanpassen">
                <button type="button" className="secondary" onClick={() => adjustPhotoValue("abv", -1)}>
                  −1
                </button>
                <button type="button" className="secondary" onClick={() => adjustPhotoValue("abv", 1)}>
                  +1
                </button>
                <button type="button" className="secondary" onClick={() => adjustPhotoValue("abv", -0.1)}>
                  −0,1
                </button>
                <button type="button" className="secondary" onClick={() => adjustPhotoValue("abv", 0.1)}>
                  +0,1
                </button>
              </div>
            </div>
          </div>
          <div className="field">
            <label htmlFor="photo-time">Gedronken op</label>
            <input
              id="photo-time"
              type="datetime-local"
              required
              value={photoTime}
              onChange={e => {
                setPhotoTime(e.target.value);
                setEditedTime(true);
              }}
            />
          </div>
          <button type="submit" className="full" disabled={!storageReady}>
            Waarden bevestigen &amp; loggen
          </button>
        </form>
      )}
    </section>
  );
}
