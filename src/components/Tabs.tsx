import { useState, useCallback } from "react";

type TabId = "curve" | "overview" | "drinks";

interface TabsProps {
  children: [React.ReactNode, React.ReactNode, React.ReactNode];
}

export default function Tabs({ children }: TabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("curve");

  const tabs: { id: TabId; label: string }[] = [
    { id: "curve", label: "Promillage" },
    { id: "overview", label: "Overzicht" },
    { id: "drinks", label: "Drankjes" },
  ];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = tabs.findIndex(t => t.id === activeTab);
      let next = -1;
      if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
      if (e.key === "ArrowLeft") next = (idx + tabs.length - 1) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next >= 0) {
        e.preventDefault();
        const nextTab = tabs[next];
        if (nextTab != null) {
          setActiveTab(nextTab.id);
        }
      }
    },
    [activeTab, tabs],
  );

  const tabPanelIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Avondanalyses">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={tab.id === activeTab ? "true" : "false"}
            tabIndex={tab.id === activeTab ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={handleKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, idx) => (
        <section
          key={tab.id}
          className="panel"
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          tabIndex={0}
          hidden={idx !== tabPanelIndex}
        >
          {children[idx]}
        </section>
      ))}
    </>
  );
}
