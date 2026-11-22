import { clock } from "../domain/formatting";
import { useWakeLock } from "../hooks/useWakeLock";

interface StatusRowProps {
  now: number;
  drinksCount: number;
  onWakeClick: (supported: boolean) => void;
}

export default function StatusRow({ now, drinksCount, onWakeClick }: StatusRowProps) {
  const { wantWake, isActive, isSupported } = useWakeLock();

  const handleClick = () => {
    if (!isSupported) {
      onWakeClick(false);
      return;
    }
    // Toggle is handled by the hook internally via context
    // We use a custom event to communicate with the parent
    window.dispatchEvent(new CustomEvent("toggle-wake"));
  };

  const wakeText = isActive ? "Scherm blijft aan ✓" : wantWake ? "Scherm aan: gepauzeerd" : "Scherm wakkerhouden";

  return (
    <div className="status-row">
      <span id="save-status">
        <i className="status-dot"></i>
      </span>
      <span aria-hidden="true"></span>
      <span id="updated-at">
        {drinksCount === 0 ? "Nog geen drankjes" : `Bijgewerkt ${clock(now)}`}
      </span>
      <button
        type="button"
        className="secondary"
        id="wake-button"
        aria-pressed={wantWake ? "true" : "false"}
        onClick={handleClick}
      >
        {wakeText}
      </button>
    </div>
  );
}
