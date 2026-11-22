import type { Drink, Profile, BACCurve } from "./types";

export const HOUR = 3600000;
export const MAX_CHART_SPAN = 24 * HOUR;
export const ABSORPTION = 0.75;
export const ELIMINATION = 0.15;

export const grams = (d: Drink) => d.volume * d.abv / 100 * 0.789;

export function suggestedScanVolume(type: string | null, labelledVolume: number | null): number | null {
  if (labelledVolume === null) return null;
  const normalizedType = (type || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(wijn|wine)\b/.test(normalizedType)) return 100;
  if (
    /\b(sterke drank(?:en)?|gedistilleerde drank(?:en)?|gedistilleerd|distilled spirits?|spirits?|liquors?|liqueur|likeur|vodka|wodka|gin|rum|whisky|whiskey|bourbon|tequila|cognac|brandy|jenever|genever|brandewijn|absint|pastis|grappa|schnapps?)\b/.test(
      normalizedType,
    )
  )
    return 35;
  return labelledVolume;
}

export function bodyWater(profile: Profile): number | null {
  if (profile.model === "male") return 0.194786 * profile.height + 0.296785 * profile.weight - 14.012934;
  if (profile.model === "female") return 0.34454 * profile.height + 0.183809 * profile.weight - 35.270121;
  return null;
}

export function makeCurve(drinks: Drink[], profile: Profile): BACCurve | null {
  const water = bodyWater(profile);
  if (water === null) return null;

  const changes = new Map<number, number>();
  for (const drink of drinks) {
    const rate = (0.8 * grams(drink)) / water / ABSORPTION;
    changes.set(drink.time, (changes.get(drink.time) || 0) + rate);
    const end = drink.time + ABSORPTION * HOUR;
    changes.set(end, (changes.get(end) || 0) - rate);
  }

  const events = [...changes].sort((a, b) => a[0] - b[0]);
  const segments: Array<{ time: number; level: number; rate: number }> = [];
  let level = 0;
  let rate = 0;
  let previous = events.length ? events[0][0] : 0;

  for (const [time, delta] of events) {
    level = Math.max(0, level + (rate - ELIMINATION) * (time - previous) / HOUR);
    rate = Math.max(0, rate + delta);
    segments.push({ time, level, rate });
    previous = time;
  }

  return {
    events: events.map(e => e[0]),
    at(time: number): number {
      let lo = 0;
      let hi = segments.length - 1;
      let found = -1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (segments[mid]!.time <= time) {
          found = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      if (found < 0) return 0;
      const segment = segments[found]!;
      return Math.max(0, segment.level + (segment.rate - ELIMINATION) * (time - segment.time) / HOUR);
    },
  };
}
