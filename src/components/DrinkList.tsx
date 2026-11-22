import type { Drink } from "../domain/types";
import { clock, dateLabel, format } from "../domain/formatting";
import { grams } from "../domain/bac";

interface DrinkListProps {
  drinks: Drink[];
  onRemove: (id: string) => void;
  onExport: () => void;
  onReset: () => void;
  storageReady: boolean;
}

export default function DrinkList({ drinks, onRemove, onExport, onReset, storageReady }: DrinkListProps) {
  const log = [...drinks].sort((a, b) => a.time - b.time);

  const handleRemove = (drink: Drink) => {
    if (!confirm(`${drink.name} van ${dateLabel(drink.time)} verwijderen?`)) return;
    onRemove(drink.id);
  };

  return (
    <>
      <div className="section-label">
        <h3>Je logboek</h3>
        <span className="tag" id="log-count">
          {drinks.length} DRANKJE{drinks.length === 1 ? "" : "S"}
        </span>
      </div>
      <p className="hint">
        Controleer hoeveelheid, percentage en tijd. Verwijder een onjuiste invoer en voeg deze opnieuw toe.
      </p>
      <ul className="drink-list" id="drink-list">
        {!log.length ? (
          <li className="empty">Nog geen drankjes. Voeg hieronder je eerste drankje toe.</li>
        ) : (
          [...log].reverse().map(drink => (
            <li key={drink.id} className="drink-item">
              <time
                className="drink-time"
                dateTime={new Date(drink.time).toISOString()}
                title={dateLabel(drink.time)}
              >
                {clock(drink.time)}
              </time>
              <div className="drink-info">
                <strong>{drink.name}</strong>
                <span>
                  {dateLabel(drink.time)} · {format(drink.volume, 0)} ml · {format(drink.abv)}% · {format(grams(drink))} g ·{" "}
                  {drink.source === "photo" ? "foto bevestigd" : "handmatig"}
                </span>
              </div>
              <button
                type="button"
                className="plain delete-drink"
                aria-label={`Verwijder ${drink.name} van ${dateLabel(drink.time)}`}
                disabled={!storageReady}
                onClick={() => handleRemove(drink)}
              >
                {"\u00d7"}
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="footer-actions">
        <button type="button" className="secondary" id="export-button" onClick={onExport}>
          Exporteer logboek
        </button>
        <button type="button" className="danger" id="reset-button" onClick={onReset}>
          Nieuwe avond
        </button>
      </div>
      <p className="hint">
        Een nieuwe avond wist het huidige logboek, maar behoudt je profiel. Exporteer eerst als je het wilt bewaren.
      </p>
    </>
  );
}
