import { useState, useCallback, useRef } from "react";
import type { AppData, Drink, Profile } from "../domain/types";
import { loadState, persistState, STORAGE_KEY } from "../domain/storage";

export function useAppData() {
  const [state, setState] = useState<AppData>(loadState);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [storageReady, setStorageReady] = useState(true);

  const notify = useCallback((text: string, error = false) => {
    setMessage({ text, error });
  }, []);

  const dismissMessage = useCallback(() => {
    setMessage(null);
  }, []);

  const persist = useCallback(
    (next: AppData, force = false): boolean => {
      if (!storageReady && !force) {
        notify(
          "Deze wijziging is niet opgeslagen. Herstel eerst de lokale opslag via Nieuwe avond.",
          true,
        );
        return false;
      }
      const ok = persistState(next);
      if (ok) {
        setState(next);
        setStorageReady(true);
        return true;
      } else {
        setStorageReady(false);
        notify(
          "Opslaan is geblokkeerd: lokale opslag is niet beschikbaar of bevat onleesbare gegevens. Exporteer je gegevens via Drankjes. Gebruik daarna Nieuwe avond om expliciet opnieuw te beginnen, of open de app in een normale Safari-tab met websiteopslag toegestaan.",
          true,
        );
        return false;
      }
    },
    [storageReady, notify],
  );

  const updateProfile = useCallback(
    (profile: Profile) => {
      const next = { ...state, profile };
      return persist(next);
    },
    [state, persist],
  );

  const addDrink = useCallback(
    (drink: Drink) => {
      const next = { ...state, drinks: [...state.drinks, drink] };
      return persist(next);
    },
    [state, persist],
  );

  const removeDrink = useCallback(
    (id: string) => {
      const next = { ...state, drinks: state.drinks.filter(d => d.id !== id) };
      return persist(next);
    },
    [state, persist],
  );

  const resetEvening = useCallback(() => {
    const next: AppData = { version: 1, profile: state.profile, drinks: [] };
    return persist(next, true);
  }, [state.profile, persist]);

  // Cross-tab sync
  const handleStorage = useRef((event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try {
      const raw = event.newValue;
      const next = raw === null ? loadState() : JSON.parse(raw) as AppData;
      setState(next);
      notify("Het logboek is in een ander venster gewijzigd. Dit overzicht is bijgewerkt.");
    } catch {
      setStorageReady(false);
    }
  }).current;

  return {
    state,
    message,
    storageReady,
    notify,
    dismissMessage,
    persist,
    updateProfile,
    addDrink,
    removeDrink,
    resetEvening,
    handleStorage,
  };
}
