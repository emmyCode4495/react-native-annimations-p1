import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ThemeKey } from './cardThemes';

export type CardKind = 'virtual' | 'physical';

export type CardModel = {
  id: string;
  name: string;
  kind: CardKind;
  theme: ThemeKey;
  number: string; // demo number, not a real PAN
  last4: string;
  expiry: string;
  cvv: string;
  limit: number;
  spent: number;
  frozen: boolean;
  online: boolean;
  intl: boolean;
};

export type NewCardInput = {
  name: string;
  kind: CardKind;
  theme: ThemeKey;
  limit: number;
  online: boolean;
  intl: boolean;
};

type Ctx = {
  cards: CardModel[];
  // Set after a card is added so the Cards tab can scroll to it
  focusId: string | null;
  clearFocus: () => void;
  buildCard: (input: NewCardInput) => CardModel;
  addCard: (card: CardModel) => void;
  removeCard: (id: string) => void;
  toggleFreeze: (id: string) => void;
  setLimit: (id: string, limit: number) => void;
  setControl: (id: string, key: 'online' | 'intl', value: boolean) => void;
};

const INITIAL: CardModel[] = [
  {
    id: 'c1',
    name: 'Everyday',
    kind: 'physical',
    theme: 'brand',
    number: '9321 8890 1274 4821',
    last4: '4821',
    expiry: '09/29',
    cvv: '428',
    limit: 3000,
    spent: 1360,
    frozen: false,
    online: true,
    intl: false,
  },
];

function digits(n: number) {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

const CardsContext = createContext<Ctx | null>(null);

export function CardsProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<CardModel[]>(INITIAL);
  const [focusId, setFocusId] = useState<string | null>(null);

  const patch = useCallback((id: string, p: Partial<CardModel>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...p } : c)));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      cards,
      focusId,
      clearFocus: () => setFocusId(null),
      // Demo numbers start with 9, which no real card network uses
      buildCard: (input) => {
        const last4 = digits(4);
        return {
          ...input,
          id: `c${Date.now()}`,
          number: `9${digits(3)} ${digits(4)} ${digits(4)} ${last4}`,
          last4,
          expiry: '11/30',
          cvv: digits(3),
          spent: 0,
          frozen: false,
        };
      },
      addCard: (card) => {
        setCards((prev) => [...prev, card]);
        setFocusId(card.id);
      },
      removeCard: (id) => setCards((prev) => prev.filter((c) => c.id !== id)),
      toggleFreeze: (id) => setCards((prev) => prev.map((c) => (c.id === id ? { ...c, frozen: !c.frozen } : c))),
      setLimit: (id, limit) => patch(id, { limit }),
      setControl: (id, key, v) => patch(id, { [key]: v }),
    }),
    [cards, focusId, patch],
  );

  return <CardsContext.Provider value={value}>{children}</CardsContext.Provider>;
}

export function useCards() {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error('useCards must be used inside CardsProvider');
  return ctx;
}
