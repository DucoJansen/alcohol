import type { Drink, Profile } from "../domain/types";
import { format, clock } from "../domain/formatting";
import { makeCurve, HOUR, MAX_CHART_SPAN } from "../domain/bac";

interface BACMetricProps {
  drinks: Drink[];
  profile: Profile;
  wallTime: number;
}

export default function BACMetric({ drinks, profile, wallTime }: BACMetricProps) {
  const log = [...drinks].sort((a, b) => a.time - b.time);
  const firstDrink = log[0];
  const started = firstDrink != null && firstDrink.time <= wallTime;
  const start = (started ? firstDrink.time : wallTime) - HOUR;
  const now = Math.min(wallTime, start + MAX_CHART_SPAN);
  const filteredDrinks = log.filter(d => d.time <= now);
  const futureCount = log.filter(d => d.time > wallTime).length;

  const curve = makeCurve(filteredDrinks, profile);
  const available = filteredDrinks.length > 0 && curve !== null;

  const currentBac = available ? format(curve.at(now), 2) : "—";

  let contextText = "";
  if (futureCount > 0) {
    contextText = `${futureCount} log(s) liggen na de huidige kloktijd en tellen nog niet mee. Controleer je apparaatklok en logboek.`;
  } else if (!filteredDrinks.length) {
    contextText = "Log je eerste drankje om het verloop te zien.";
  } else if (!curve) {
    contextText = "Kies je lichaamswatermodel om een schatting te zien.";
  } else if (curve.at(now) < profile.limit) {
    contextText = "Proost! Geniet ervan.";
  } else {
    contextText = "Houd je autosleutels maar in je zak.";
  }

  return (
    <>
      <div className="metric" id="current-bac">
        {currentBac}
        <span>{"\u2030"}</span>
      </div>
      <div className="metric-label">
        Op dit moment · <span id="current-time">{clock(now)}</span>
      </div>
      <p className="metric-context" id="bac-context">
        {contextText}
      </p>
    </>
  );
}
