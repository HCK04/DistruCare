import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { makeFonts, Fonts } from '../theme';
import { getLargeText, setLargeText as persistLargeText } from '../db/queries';

interface UICtx {
  /** Mode « confort visuel » : agrandit toute la typographie de l'application. */
  largeText: boolean;
  /** Tailles de police déjà mises à l'échelle selon largeText. */
  fonts: Fonts;
  toggleLargeText: () => void;
  setLargeText: (value: boolean) => void;
}

const UISettingsContext = createContext<UICtx | null>(null);

export function UISettingsProvider({ children }: { children: React.ReactNode }) {
  const [largeText, setLT] = useState(false);

  // Charge la préférence persistée au démarrage.
  useEffect(() => {
    getLargeText().then(setLT).catch(() => {});
  }, []);

  const setLargeText = useCallback((value: boolean) => {
    setLT(value);
    persistLargeText(value).catch(() => {});
  }, []);

  const toggleLargeText = useCallback(() => {
    setLT((prev) => {
      const next = !prev;
      persistLargeText(next).catch(() => {});
      return next;
    });
  }, []);

  const fonts = useMemo(() => makeFonts(largeText), [largeText]);

  const value = useMemo(
    () => ({ largeText, fonts, toggleLargeText, setLargeText }),
    [largeText, fonts, toggleLargeText, setLargeText]
  );

  return <UISettingsContext.Provider value={value}>{children}</UISettingsContext.Provider>;
}

export function useUI(): UICtx {
  const ctx = useContext(UISettingsContext);
  if (!ctx) throw new Error('useUI doit être utilisé à l’intérieur de <UISettingsProvider>');
  return ctx;
}
