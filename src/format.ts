// "$1,234.50", optionally signed ("+$20.00" / "-$20.00")
export function usd(n: number, opts?: { sign?: boolean; decimals?: number }) {
  const d = opts?.decimals ?? 2;
  const s = Math.abs(n).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = n < 0 ? '-' : opts?.sign && n > 0 ? '+' : '';
  return `${sign}$${s}`;
}

// Live-typed amount like "1234." or "0.5" -> "1,234." / "0.5"
export function formatTyped(s: string) {
  const [int, dec] = s.split('.');
  const head = (int || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec === undefined ? head : `${head}.${dec}`;
}

// Demo payment reference like "TLY-482913"
export function newReference() {
  return `TLY-${Math.floor(Math.random() * 900000) + 100000}`;
}
