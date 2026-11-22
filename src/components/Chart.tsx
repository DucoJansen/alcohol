import { useRef, useEffect } from "react";
import type { Drink, Profile } from "../domain/types";
import { format, clock, dateLabel } from "../domain/formatting";
import { makeCurve, HOUR, MAX_CHART_SPAN } from "../domain/bac";

interface ChartProps {
  drinks: Drink[];
  profile: Profile;
  wallTime: number;
}

function svgNode(tag: string, attrs: Record<string, string>, text?: string): SVGElement {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== undefined) node.textContent = text;
  return node;
}

export default function Chart({ drinks, profile, wallTime }: ChartProps) {
  const chartGridRef = useRef<SVGGElement>(null);
  const chartDataRef = useRef<SVGGElement>(null);
  const chartLabelsRef = useRef<SVGGElement>(null);
  const chartDurationRef = useRef<HTMLSpanElement>(null);
  const chartNoteRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const log = [...drinks].sort((a, b) => a.time - b.time);
    const firstDrink = log[0];
    const started = firstDrink?.time <= wallTime;
    const start = (started ? firstDrink.time : wallTime) - HOUR;
    const now = Math.min(wallTime, start + MAX_CHART_SPAN);
    const forecastEnd = now + HOUR;
    const end = Math.max(forecastEnd, start + 4 * HOUR);
    const span = end - start;
    const filteredDrinks = log.filter(d => d.time <= now);
    const curve = makeCurve(filteredDrinks, profile);

    const times = new Set([start, now]);
    for (let i = 0; i <= 240; i++) {
      times.add(start + ((now - start) * i) / 240);
    }
    if (curve) {
      curve.events.filter(t => t >= start && t <= now).forEach(t => times.add(t));
    }
    const points: [number, number][] = [...times].sort((a, b) => a - b).map(t => [t, curve ? curve.at(t) : 0]);

    const forecastTimes = new Set([now, forecastEnd]);
    for (let i = 1; i < 60; i++) forecastTimes.add(now + (i * HOUR) / 60);
    if (curve) {
      curve.events.filter(t => t > now && t < forecastEnd).forEach(t => forecastTimes.add(t));
    }
    const forecastPoints: [number, number][] = [...forecastTimes].sort((a, b) => a - b).map(t => [t, curve ? curve.at(t) : 0]);

    const peak = curve && filteredDrinks.length ? Math.max(...points.map(p => p[1])) : 0;
    const forecastPeak = curve && filteredDrinks.length ? Math.max(...forecastPoints.map(p => p[1])) : 0;
    const top = Math.max(0.8, Math.ceil((Math.max(peak, forecastPeak, profile.limit) * 1.2) / 0.2) * 0.2);

    const left = 36;
    const right = 348;
    const upper = 18;
    const bottom = 216;
    const x = (t: number) => left + ((t - start) / span) * (right - left);
    const y = (value: number) => bottom - (value / top) * (bottom - upper);
    const timeMarker = (time: number, color: string) =>
      svgNode("line", {
        x1: String(x(time)),
        y1: String(upper),
        x2: String(x(time)),
        y2: String(bottom),
        stroke: color,
        "stroke-dasharray": "2 4",
      });

    const grid = chartGridRef.current;
    const data = chartDataRef.current;
    const labels = chartLabelsRef.current;
    if (!grid || !data || !labels) return;

    grid.replaceChildren();
    data.replaceChildren();
    labels.replaceChildren();

    // Grid lines and Y labels
    for (let i = 0; i <= 4; i++) {
      const value = (top * i) / 4;
      grid.append(svgNode("line", { x1: String(left), y1: String(y(value)), x2: String(right), y2: String(y(value)), stroke: "#e5ebf0" }));
      labels.append(
        svgNode(
          "text",
          { x: String(left - 10), y: String(y(value) + 4), "text-anchor": "end", fill: "#526777", "font-size": "12" },
          format(value, top > 4 ? 1 : 2),
        ),
      );
    }

    // X labels
    for (let i = 0; i <= 4; i++) {
      const time = start + (span * i) / 4;
      labels.append(
        svgNode(
          "text",
          {
            x: String(x(time)),
            y: "240",
            "text-anchor": i === 0 ? "start" : i === 4 ? "end" : "middle",
            fill: "#526777",
            "font-size": "12",
          },
          clock(time),
        ),
      );
    }

    // Drink time markers
    for (const drink of filteredDrinks) {
      grid.append(timeMarker(drink.time, "#9aabb8"));
    }

    // Limit line
    const limitY = y(profile.limit);
    data.append(
      svgNode("line", {
        x1: String(left),
        y1: String(limitY),
        x2: String(right),
        y2: String(limitY),
        stroke: "#b62032",
        "stroke-width": "1.6",
        "stroke-dasharray": "4 5",
      }),
    );
    labels.append(
      svgNode(
        "text",
        { x: String(right - 3), y: String(limitY - 7), "text-anchor": "end", fill: "#b62032", "font-size": "12" },
        `${format(profile.limit)}‰ referentie`,
      ),
    );

    if (curve && filteredDrinks.length) {
      const path = points
        .map(([t, v], i) => `${i ? "L" : "M"}${x(t).toFixed(2)},${y(v).toFixed(2)}`)
        .join(" ");
      data.append(
        svgNode("path", { d: `${path} L${x(now)},${bottom} L${left},${bottom} Z`, fill: "url(#area-fill)" }),
      );
      data.append(
        svgNode("path", {
          d: path,
          fill: "none",
          stroke: "#154273",
          "stroke-width": "2.8",
          "stroke-linejoin": "round",
        }),
      );

      const forecastPath = forecastPoints
        .map(([t, v], i) => `${i ? "L" : "M"}${x(t).toFixed(2)},${y(v).toFixed(2)}`)
        .join(" ");
      data.append(
        svgNode("path", {
          d: forecastPath,
          fill: "none",
          stroke: "#8ca6c0",
          "stroke-width": "2.8",
          "stroke-dasharray": "5 4",
          "stroke-linejoin": "round",
        }),
      );

      const currentY = y(curve.at(now));
      data.append(
        svgNode("circle", {
          cx: String(x(now)),
          cy: String(currentY),
          r: "4.5",
          fill: "#154273",
          stroke: "white",
          "stroke-width": "2",
        }),
      );
    } else {
      labels.append(
        svgNode(
          "text",
          {
            x: String((left + right) / 2 + 30),
            y: "148",
            "text-anchor": "middle",
            fill: "#526777",
            "font-size": "11",
          },
          filteredDrinks.length
            ? "Kies eerst je lichaamswatermodel"
            : "Je eerste drankje begint het overzicht",
        ),
      );
    }

    // Now marker
    data.append(timeMarker(now, "#7b93a5"));
    labels.append(
      svgNode(
        "text",
        {
          x: String(Math.min(right - 12, Math.max(left + 12, x(now)))),
          y: "10",
          "text-anchor": "middle",
          fill: "#526777",
          "font-size": "11",
        },
        "NU",
      ),
    );

    if (chartDurationRef.current) {
      chartDurationRef.current.textContent = `${format(span / HOUR, 1)} uur in beeld`;
    }
    if (chartNoteRef.current) {
      chartNoteRef.current.textContent = `${dateLabel(start)} – ${dateLabel(end)}. Vóór het eerste drankje wordt 0‰ aangenomen. De lichte stippellijn tot ${clock(forecastEnd)} is een voorspelling en houdt geen rekening met toekomstige drankjes.`;
    }
  }, [drinks, profile, wallTime]);

  return (
    <>
      <div className="chart-top">
        <span>Promillage (‰)</span>
        <span id="chart-duration" ref={chartDurationRef}>
          Minimaal 4 uur in beeld
        </span>
      </div>
      <svg
        id="chart"
        viewBox="0 0 360 260"
        role="img"
        aria-labelledby="chart-title chart-desc"
      >
        <title id="chart-title">Geschat promillage over tijd</title>
        <desc id="chart-desc">Er zijn nog geen drankjes gelogd.</desc>
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#154273" stopOpacity=".19" />
            <stop offset="1" stopColor="#154273" stopOpacity=".015" />
          </linearGradient>
        </defs>
        <g ref={chartGridRef} />
        <g ref={chartDataRef} />
        <g ref={chartLabelsRef} />
      </svg>
      <div className="legend">
        <span>
          <i></i>Geschat verloop
        </span>
        <span>
          <i className="forecast"></i>Indicatie komend uur (voorspelling)
        </span>
        <span>
          <i className="dotted"></i>Wettelijke referentie
        </span>
      </div>
      <p className="caption" id="chart-note" ref={chartNoteRef}>
        De grafiek begint 1 uur voor je eerste drankje. De lichte stippellijn toont een voorspelling tot 1 uur na NU, zonder nieuwe drankjes.
      </p>
    </>
  );
}
