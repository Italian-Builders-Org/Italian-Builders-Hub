import { createContext, useContext, useEffect, useState } from "react";

type TechLabelsContextValue = {
  techLabels: boolean;
  setTechLabels: (value: boolean) => void;
};

const TechLabelsContext = createContext<TechLabelsContextValue>({
  techLabels: false,
  setTechLabels: () => {},
});

export function TechLabelProvider({ children }: { children: React.ReactNode }) {
  const [techLabels, setTechLabels] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.localStorage.getItem("italian-builders-label-mode") === "tech"
    );
  });

  useEffect(() => {
    window.localStorage.setItem(
      "italian-builders-label-mode",
      techLabels ? "tech" : "friendly",
    );
  }, [techLabels]);

  return (
    <TechLabelsContext.Provider value={{ techLabels, setTechLabels }}>
      {children}
    </TechLabelsContext.Provider>
  );
}

export function useTechLabels() {
  return useContext(TechLabelsContext);
}
