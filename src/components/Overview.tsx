import type { Drink } from "../domain/types";
import { format } from "../domain/formatting";
import { grams, makeCurve, HOUR, MAX_CHART_SPAN } from "../domain/bac";
import type { Profile } from "../domain/types";

interface OverviewProps {
  drinks: Drink[];
  profile: Profile;
  wallTime: number;
}

export default function Overview({ drinks, profile, wallTime }: OverviewProps) {
  const log = [...drinks].sort((a, b) => a.time - b.time);
  const firstDrink = log[0];
  const started = firstDrink?.time <= wallTime;
  const start = (started ? firstDrink.time : wallTime) - HOUR;
  const now = Math.min(wallTime, start + MAX_CHART_SPAN);
  const filteredDrinks = log.filter(d => d.time <= now);

  const curve = makeCurve(filteredDrinks, profile);
  const available = filteredDrinks.length > 0 && curve !== null;

  const total = filteredDrinks.reduce((sum, d) => sum + grams(d), 0);
  const totalVolume = filteredDrinks.reduce((sum, d) => sum + d.volume, 0);
  const peak = available && curve
    ? (() => {
        const times = new Set([start, now]);
        for (let j = 0; j <= 240; j++) {
          times.add(start + ((now - start) * j) / 240);
        }
        curve.events.filter(t => t >= start && t <= now).forEach(t => times.add(t));
        const points = [...times].sort((a, b) => a - b).map(t => curve.at(t));
        return Math.max(...points);
      })()
    : 0;

  const minutes = filteredDrinks.length && firstDrink ? Math.floor((now - firstDrink.time) / 60000) : 0;

  const max = Math.max(1, ...filteredDrinks.map(grams));

  return (
    <>
      <h3>De avond in cijfers</h3>
      <div className="stats">
        <div className="stat">
          <strong id="stat-count">{filteredDrinks.length}</strong>
          <span>gelogde drankjes</span>
        </div>
        <div className="stat">
          <strong id="stat-grams">{format(total)} g</strong>
          <span>pure alcohol</span>
        </div>
        <div className="stat">
          <strong id="stat-units">{format(total / 10)}</strong>
          <span>standaardglazen</span>
        </div>
        <div className="stat">
          <strong id="stat-volume">{format(totalVolume, 0)} ml</strong>
          <span>totaal drankvolume</span>
        </div>
        <div className="stat">
          <strong id="stat-peak">{available ? `${format(peak, 2)}‰` : "—"}</strong>
          <span>geschatte piek tot nu</span>
        </div>
        <div className="stat">
          <strong id="stat-elapsed">
            {filteredDrinks.length ? `${Math.floor(minutes / 60)}u ${minutes % 60}m` : "—"}
          </strong>
          <span>sinds eerste drankje</span>
        </div>
      </div>
      <h3 className="spaced">Alcohol per drankje</h3>
      <ul id="breakdown" className="breakdown">
        {!filteredDrinks.length ? (
          <li className="empty">Nog geen drankjes. Voeg hieronder je eerste drankje toe.</li>
        ) : (
          [...filteredDrinks].reverse().map(drink => {
            const g = grams(drink);
            return (
              <li key={drink.id}>
                <div className="bar-label">
                  <span>{drink.name}</span>
                  <strong>{format(g)} g</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(g / max) * 100}%` }} />
                </div>
              </li>
            );
          })
        )}
      </ul>
      <p className="caption">
        Een gelogd drankje is niet altijd één standaardglas. De piek betreft alleen het berekende verloop tot nu, niet wat nog kan komen.
      </p>
    </>
  );
}
