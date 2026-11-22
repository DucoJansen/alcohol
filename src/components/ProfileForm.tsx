import type { Profile } from "../domain/types";

interface ProfileFormProps {
  profile: Profile;
  onChange: (profile: Profile) => void;
  onNotify: (text: string, error?: boolean) => void;
  storageReady: boolean;
}

export default function ProfileForm({ profile, onChange, onNotify, storageReady }: ProfileFormProps) {
  const handleChange = (field: keyof Profile, value: string | number) => {
    const newProfile: Profile = { ...profile, [field]: value };

    // Validate
    if (
      !Number.isFinite(newProfile.height) ||
      newProfile.height < 120 ||
      newProfile.height > 230 ||
      !Number.isFinite(newProfile.weight) ||
      newProfile.weight < 35 ||
      newProfile.weight > 250
    ) {
      onNotify(
        "Profiel niet gewijzigd. Gebruik een lengte van 120–230 cm en een gewicht van 35–250 kg. De laatst opgeslagen waarden zijn teruggezet.",
        true,
      );
      return;
    }

    onChange(newProfile);
  };

  return (
    <section className="card card-pad">
      <div className="section-label">
        <h2>Jouw profiel</h2>
        <span className="tag">GEEN NATTEVINGERWERK</span>
      </div>
      <div className="fields">
        <div className="field">
          <label htmlFor="height">Lengte</label>
          <div className="unit-input">
            <input
              id="height"
              type="number"
              inputMode="decimal"
              min={120}
              max={230}
              step={0.1}
              value={profile.height}
              required
              disabled={!storageReady}
              onChange={e => handleChange("height", Number(e.target.value))}
            />
            <span>cm</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="weight">Gewicht</label>
          <div className="unit-input">
            <input
              id="weight"
              type="number"
              inputMode="decimal"
              min={35}
              max={250}
              step={0.1}
              value={profile.weight}
              required
              disabled={!storageReady}
              onChange={e => handleChange("weight", Number(e.target.value))}
            />
            <span>kg</span>
          </div>
        </div>
      </div>
      <label htmlFor="body-model">Fysiologisch lichaamswatermodel</label>
      <select
        id="body-model"
        value={profile.model}
        disabled={!storageReady}
        onChange={e => handleChange("model", e.target.value as "male" | "female")}
      >
        <option value="male">Mannelijke formule</option>
        <option value="female">Vrouwelijke formule</option>
      </select>
    </section>
  );
}
