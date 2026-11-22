import { eveningDateLabel } from "../domain/formatting";

interface HeroProps {
  now: number;
}

export default function Hero({ now }: HeroProps) {
  return (
    <div className="hero">
      <div className="hero-inner">
        <p className="eyebrow">{eveningDateLabel(now)}</p>
        <h1>Genotsoverzicht</h1>
        <p>Log je drankje. Houd inzicht in je alcoholconsumptie.</p>
      </div>
    </div>
  );
}
