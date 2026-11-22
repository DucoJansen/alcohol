import { useState, useCallback, useRef } from "react";
import { format, localDateTime } from "../domain/formatting";
import type { Drink } from "../domain/types";

interface ManualFormProps {
  onAddDrink: (drink: Drink) => void;
  onNotify: (text: string, error?: boolean) => void;
  storageReady: boolean;
}

export default function ManualForm({ onAddDrink, onNotify, storageReady }: ManualFormProps) {
  const [name, setName] = useState("");
  const [volume, setVolume] = useState("");
  const [abv, setAbv] = useState("");
  const [time, setTime] = useState(localDateTime);
  const [editedTime, setEditedTime] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const applyPreset = useCallback(
    (presetName: string, presetVolume: string, presetAbv: string) => {
      setName(presetName);
      setVolume(presetVolume);
      setAbv(presetAbv);
      if (!editedTime) setTime(localDateTime());
    },
    [editedTime],
  );

  const adjustValue = useCallback(
    (field: "volume" | "abv", delta: number) => {
      const current = field === "volume" ? volume : abv;
      const num = current === "" ? 0 : Number(current);
      if (Number.isNaN(num)) {
        onNotify("Vul eerst een geldig getal in.", true);
        return;
      }
      const newVal = Number((num + delta).toFixed(10));
      if (field === "volume") {
        setVolume(String(Math.min(5000, Math.max(1, newVal))));
      } else {
        setAbv(String(Math.min(100, Math.max(0, newVal))));
      }
    },
    [volume, abv, onNotify],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formRef.current?.checkValidity()) {
        formRef.current?.reportValidity();
        return;
      }

      const vol = Number(volume);
      const abvVal = Number(abv);
      const timeVal = new Date(time).getTime();

      if (!Number.isFinite(timeVal) || timeVal < 0 || timeVal > Date.now()) {
        onNotify("Kies een geldige starttijd die niet in de toekomst ligt.", true);
        return;
      }

      const drink: Drink = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: name.trim() || "Drankje",
        volume: vol,
        abv: abvVal,
        time: timeVal,
        source: "manual",
      };

      onAddDrink(drink);
      setName("");
      setVolume("");
      setAbv("");
      setEditedTime(false);
      setTime(localDateTime());
      onNotify(`${drink.name} opgeslagen: ${format(vol, 0)} ml, ${format(abvVal)}%.`);
    },
    [name, volume, abv, time, onAddDrink, onNotify],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, field: "volume" | "abv") => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const step = field === "volume" ? 10 : 0.1;
        e.preventDefault();
        adjustValue(field, e.key === "ArrowUp" ? step : -step);
      }
    },
    [adjustValue],
  );

  return (
    <details className="card" id="manual-details">
      <summary>Handmatig loggen</summary>
      <form id="manual-form" className="details-body" ref={formRef} onSubmit={handleSubmit}>
        <div className="field">
          <div className="drink-presets" role="group" aria-labelledby="drink-presets-label">
            <button
              type="button"
              className="secondary"
              onClick={() => applyPreset("Pils", "250", "5")}
            >
              Pils
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => applyPreset("Wijn", "100", "12")}
            >
              Wijn
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => applyPreset("Shotje", "35", "35")}
            >
              Shotje
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="drink-name">
            Naam drankje <span className="caption">(optioneel)</span>
          </label>
          <input
            id="drink-name"
            maxLength={80}
            placeholder="Bijv. bier, wijn of mocktail"
            autoComplete="off"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="fields">
          <div className="field">
            <label htmlFor="drink-volume">Hoeveelheid</label>
            <div className="unit-input">
              <input
                id="drink-volume"
                type="number"
                inputMode="decimal"
                min={1}
                max={5000}
                step="any"
                required
                placeholder="250"
                value={volume}
                onChange={e => setVolume(e.target.value)}
                onKeyDown={e => handleKeyDown(e, "volume")}
              />
              <span>ml</span>
            </div>
            <div className="adjust-controls" role="group" aria-label="Hoeveelheid aanpassen">
              <button type="button" className="secondary" onClick={() => adjustValue("volume", -100)}>
                −100 ml
              </button>
              <button type="button" className="secondary" onClick={() => adjustValue("volume", 100)}>
                +100 ml
              </button>
              <button type="button" className="secondary" onClick={() => adjustValue("volume", -10)}>
                −10 ml
              </button>
              <button type="button" className="secondary" onClick={() => adjustValue("volume", 10)}>
                +10 ml
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="drink-abv">Alcohol</label>
            <div className="unit-input">
              <input
                id="drink-abv"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="any"
                required
                placeholder="5"
                value={abv}
                onChange={e => setAbv(e.target.value)}
                onKeyDown={e => handleKeyDown(e, "abv")}
              />
              <span>%</span>
            </div>
            <div className="adjust-controls" role="group" aria-label="Alcoholpercentage aanpassen">
              <button type="button" className="secondary" onClick={() => adjustValue("abv", -1)}>
                −1
              </button>
              <button type="button" className="secondary" onClick={() => adjustValue("abv", 1)}>
                +1
              </button>
              <button type="button" className="secondary" onClick={() => adjustValue("abv", -0.1)}>
                −0,1
              </button>
              <button type="button" className="secondary" onClick={() => adjustValue("abv", 0.1)}>
                +0,1
              </button>
            </div>
          </div>
        </div>
        <div className="field">
          <label htmlFor="drink-time">Gedronken op</label>
          <input
            id="drink-time"
            type="datetime-local"
            required
            value={time}
            onChange={e => {
              setTime(e.target.value);
              setEditedTime(true);
            }}
          />
        </div>
        <button type="submit" className="full" disabled={!storageReady}>
          + Drankje toevoegen
        </button>
        <p className="hint">
          Log alleen wat je daadwerkelijk drinkt. Gebruik voor een mix het percentage van de hele portie.
        </p>
      </form>
    </details>
  );
}
