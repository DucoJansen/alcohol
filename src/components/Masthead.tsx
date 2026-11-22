export default function Masthead() {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 3h14M8 3v7l-4 9a4 4 0 0 0 4 6h8a4 4 0 0 0 4-6l-4-9V3M7 17h10" />
            <path d="M10 21h4" />
          </svg>
        </div>
        <div className="brand-name">
          Nationaal Coördinator Alcohol
          <span>Geniet, maar drink met mate(n)</span>
        </div>
      </div>
    </header>
  );
}
