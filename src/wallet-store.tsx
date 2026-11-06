import React, { createContext, useContext, useMemo, useState } from 'react';
import { brand } from './brand';

const c = brand.colors;

export type Contact = { id: string; name: string; handle: string; color: string };
export type Txn = { id: string; name: string; cat: string; amt: number; color: string; when: string; pending?: boolean; fresh?: boolean };
export type Settings = { biometric: boolean; twoFactor: boolean; notifications: boolean; hideBalance: boolean };
export type Profile = { name: string; email: string };

export const CONTACTS: Contact[] = [
  { id: 'amara', name: 'Amara Okafor', handle: '@amara', color: c.coral },
  { id: 'daniel', name: 'Daniel Mensah', handle: '@danmensah', color: c.accent },
  { id: 'zainab', name: 'Zainab Bello', handle: '@zainab', color: c.success },
  { id: 'kwame', name: 'Kwame Asante', handle: '@kwame.a', color: '#8F98FF' },
  { id: 'fatima', name: 'Fatima Yusuf', handle: '@fatimay', color: '#FF8A4C' },
  { id: 'tunde', name: 'Tunde Adeyemi', handle: '@tunde', color: '#4FD1FF' },
  { id: 'chioma', name: 'Chioma Eze', handle: '@chioma', color: '#C74BFF' },
  { id: 'sam', name: 'Sam Carter', handle: '@samc', color: '#1DB954' },
];

const INITIAL_TXNS: Txn[] = [
  { id: 't1', name: 'Northwind Payroll', cat: 'Salary', amt: 4200, color: c.success, when: 'Today' },
  { id: 't2', name: 'Spotify', cat: 'Subscriptions', amt: -11.99, color: '#1DB954', when: 'Today' },
  { id: 't3', name: 'Amara O.', cat: 'Received', amt: 250, color: c.coral, when: 'Yesterday' },
  { id: 't4', name: 'Uber', cat: 'Transport', amt: -18.4, color: '#8E94B8', when: 'Yesterday' },
  { id: 't5', name: 'Whole Foods', cat: 'Groceries', amt: -64.2, color: c.accent, when: 'Mon' },
];

type Ctx = {
  balance: number;
  txns: Txn[];
  contacts: Contact[];
  profile: Profile;
  settings: Settings;
  setProfile: (p: Profile) => void;
  setSetting: (key: keyof Settings, value: boolean) => void;
  send: (contact: Contact, amount: number) => void;
  request: (contact: Contact, amount: number) => void;
};

const WalletContext = createContext<Ctx | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(24862.4);
  const [txns, setTxns] = useState<Txn[]>(INITIAL_TXNS);
  const [profile, setProfile] = useState<Profile>({ name: '', email: '' });
  const [settings, setSettings] = useState<Settings>({ biometric: true, twoFactor: true, notifications: true, hideBalance: false });

  const value = useMemo<Ctx>(
    () => ({
      balance,
      txns,
      contacts: CONTACTS,
      profile,
      settings,
      setProfile,
      setSetting: (key, v) => setSettings((s) => ({ ...s, [key]: v })),
      send: (contact, amount) => {
        setBalance((b) => Math.round((b - amount) * 100) / 100);
        setTxns((t) => [
          { id: `t${Date.now()}`, name: contact.name, cat: 'Sent', amt: -amount, color: contact.color, when: 'Just now', fresh: true },
          ...t.map((x) => ({ ...x, fresh: false })),
        ]);
      },
      request: (contact, amount) => {
        setTxns((t) => [
          { id: `t${Date.now()}`, name: contact.name, cat: 'Requested', amt: amount, color: contact.color, when: 'Just now', pending: true, fresh: true },
          ...t.map((x) => ({ ...x, fresh: false })),
        ]);
      },
    }),
    [balance, txns, profile, settings],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
