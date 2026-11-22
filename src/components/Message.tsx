interface MessageProps {
  message: { text: string; error: boolean } | null;
  onDismiss: () => void;
}

export default function Message({ message, onDismiss }: MessageProps) {
  if (!message) return null;

  return (
    <div id="message" className={`notice${message.error ? " error" : ""}`}>
      <div id="message-text" role="status" aria-live="polite">
        {message.text}
      </div>
      <button
        type="button"
        className="plain"
        id="dismiss-message"
        aria-label="Melding sluiten"
        onClick={onDismiss}
      >
        <span aria-hidden="true">{"\u00d7"}</span>
      </button>
    </div>
  );
}
