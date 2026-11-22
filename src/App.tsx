import { useState, useCallback, useEffect } from "react";
import type { Drink, Profile } from "./domain/types";
import { HOUR, MAX_CHART_SPAN } from "./domain/bac";
import { localDateTime } from "./domain/formatting";

import Masthead from "./components/Masthead";
import Hero from "./components/Hero";
import Message from "./components/Message";
import BACMetric from "./components/BACMetric";
import Tabs from "./components/Tabs";
import Chart from "./components/Chart";
import Overview from "./components/Overview";
import DrinkList from "./components/DrinkList";
import HowItWorks from "./components/HowItWorks";
import ProfileForm from "./components/ProfileForm";
import ManualForm from "./components/ManualForm";
import PhotoScanner from "./components/PhotoScanner";
import Footer from "./components/Footer";

import { useAppData } from "./hooks/useAppData";
import { useWakeLock } from "./hooks/useWakeLock";

import "./styles/index.css";

export default function App() {
  const {
    state,
    message,
    storageReady,
    notify,
    dismissMessage,
    updateProfile,
    addDrink,
    removeDrink,
    resetEvening,
    handleStorage,
  } = useAppData();

  const { toggle: toggleWake, isSupported: wakeSupported } = useWakeLock();
  const [wallTime, setWallTime] = useState(Date.now());

  // Tick every 15 seconds
  useEffect(() => {
    const id = setInterval(() => setWallTime(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // Re-render on visibility change
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") setWallTime(Date.now());
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Cross-tab sync
  useEffect(() => {
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [handleStorage]);

  // Wake lock toggle
  useEffect(() => {
    const handler = () => {
      if (!wakeSupported) {
        notify(
          "Deze browser ondersteunt geen Screen Wake Lock. Open via HTTPS in een recente Safari-versie. Op iOS kan vergrendelen nooit volledig worden voorkomen; je opgeslagen logboek wordt bij terugkeer hersteld.",
        );
        return;
      }
      toggleWake();
    };
    window.addEventListener("toggle-wake", handler);
    return () => window.removeEventListener("toggle-wake", handler);
  }, [wakeSupported, toggleWake, notify]);

  const handleProfileChange = useCallback(
    (profile: Profile) => {
      const ok = updateProfile(profile);
      if (!ok) {
        notify(
          "Profiel niet gewijzigd. Gebruik een lengte van 120–230 cm en een gewicht van 35–250 kg. De laatst opgeslagen waarden zijn teruggezet.",
          true,
        );
      }
    },
    [updateProfile, notify],
  );

  const handleAddDrink = useCallback(
    (drink: Drink) => {
      const ok = addDrink(drink);
      if (!ok) {
        notify("Drankje kon niet worden opgeslagen.", true);
      }
    },
    [addDrink, notify],
  );

  const handleRemoveDrink = useCallback(
    (id: string) => {
      const ok = removeDrink(id);
      if (ok) {
        notify("Drankje verwijderd. De schatting is opnieuw berekend.");
      }
    },
    [removeDrink, notify],
  );

  const handleExport = useCallback(() => {
    const content = JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `alcoholinzicht-${localDateTime().slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    notify("Export geopend. Bewaar het JSON-bestand via Downloads of Deel in Safari. Het bevat je profiel en logboek.");
  }, [state, notify]);

  const handleReset = useCallback(() => {
    if (
      !confirm(
        "Huidig logboek definitief wissen en een nieuwe avond beginnen? Exporteer eerst als je het wilt bewaren. Je profiel blijft behouden.",
      )
    )
      return;
    const ok = resetEvening();
    if (ok) {
      notify("Nieuwe avond gestart. Het vorige logboek is gewist.");
    }
  }, [resetEvening, notify]);

  const handleDismissMessage = useCallback(() => {
    dismissMessage();
  }, [dismissMessage]);

  const now = wallTime;
  const log = [...state.drinks].sort((a, b) => a.time - b.time);
  const firstDrink = log[0];
  const started = firstDrink != null && firstDrink.time <= now;
  const chartStart = (started ? firstDrink.time : now) - HOUR;
  const chartNow = Math.min(now, chartStart + MAX_CHART_SPAN);

  return (
    <>
      <a className="skip" href="#main">
        Naar het dashboard
      </a>
      <Masthead />
      <Hero now={chartNow} />
      <main id="main">
        <div className="status-row">
          <span id="save-status">
            <i className="status-dot"></i>
            {storageReady ? "Opgeslagen" : "Opslag niet beschikbaar"}
          </span>
          <span aria-hidden="true"></span>
          <span id="updated-at">
            {state.drinks.length === 0 ? "Nog geen drankjes" : `Bijgewerkt ${localDateTime(now)}`}
          </span>
        </div>
        <Message message={message} onDismiss={handleDismissMessage} />
        <div className="layout">
          <section className="visual" aria-label="Visualisatie van je avond">
            <div className="card">
              <div className="card-pad">
                <div className="section-label">
                  <h2>Geschat promillage</h2>
                  <span className="tag">BORRELPEIL</span>
                </div>
                <BACMetric drinks={state.drinks} profile={state.profile} wallTime={now} />
              </div>
              <Tabs>
                {/* Chart tab */}
                <>
                  <Chart drinks={state.drinks} profile={state.profile} wallTime={now} />
                  <div className="limit-setting">
                    <label htmlFor="limit">Wettelijk limiet</label>
                    <select
                      id="limit"
                      value={state.profile.limit}
                      disabled={!storageReady}
                      onChange={e =>
                        handleProfileChange({
                          ...state.profile,
                          limit: Number(e.target.value) as 0.2 | 0.5,
                        })
                      }
                    >
                      <option value="0.5">0,5‰ · ervaren bestuurder</option>
                      <option value="0.2">0,2‰ · beginnend bestuurder</option>
                    </select>
                  </div>
                </>
                {/* Overview tab */}
                <Overview drinks={state.drinks} profile={state.profile} wallTime={now} />
                {/* Drinks tab */}
                <DrinkList
                  drinks={state.drinks}
                  onRemove={handleRemoveDrink}
                  onExport={handleExport}
                  onReset={handleReset}
                  storageReady={storageReady}
                />
              </Tabs>
            </div>
            <HowItWorks />
          </section>
          <aside className="inputs" aria-label="Invoer">
            <ProfileForm
              profile={state.profile}
              onChange={handleProfileChange}
              onNotify={notify}
              storageReady={storageReady}
            />
            <ManualForm onAddDrink={handleAddDrink} onNotify={notify} storageReady={storageReady} />
            <PhotoScanner onAddDrink={handleAddDrink} onNotify={notify} storageReady={storageReady} />
          </aside>
        </div>
        <noscript>
          <div className="notice">
            JavaScript is nodig voor berekeningen, camera en lokale opslag. Schakel dit in om het dashboard te gebruiken.
          </div>
        </noscript>
      </main>
      <Footer />
    </>
  );
}
