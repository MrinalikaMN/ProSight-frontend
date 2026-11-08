// Change CURRENCY here to switch every amount in the app (e.g. 'INR').
const CURRENCY = 'USD';
const LOCALE = 'en-US';

export const money = (n) =>
  new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(Number(n) || 0);

export const pct = (n) => `${Math.round(n)}%`;

// Deadlines arrive as "YYYY-MM-DD". Parse them as local dates, not UTC.
export function parseDate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysUntil(s) {
  const d = parseDate(s);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

export function shortDate(s) {
  const d = parseDate(s);
  return d ? d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' }) : '';
}

export function dueLabel(s) {
  const n = daysUntil(s);
  if (n === null) return null;
  if (n < -1) return `${-n} days overdue`;
  if (n === -1) return '1 day overdue';
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  if (n <= 7) return `Due in ${n} days`;
  return `Due ${shortDate(s)}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
