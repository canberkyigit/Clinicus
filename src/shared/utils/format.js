export const HIDDEN_VALUE = '****';

export function formatCurrency(value, { hidden = false, compact = false } = {}) {
  if (hidden) return HIDDEN_VALUE;
  const amount = Number(value) || 0;
  if (compact) return `₺${formatCompact(amount)}`;
  return `₺${amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
}

// 12500 -> "12,5B", 1250000 -> "1,3Mn"
export function formatCompact(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const fmt = v => v.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  if (abs >= 1e6) return `${fmt(n / 1e6)}Mn`;
  if (abs >= 1e3) return `${fmt(n / 1e3)}B`;
  return fmt(n);
}

export function formatPercent(value, { signed = false } = {}) {
  const n = Number(value) || 0;
  const text = `%${Math.abs(n).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
  if (!signed || n === 0) return text;
  return `${n > 0 ? '+' : '-'}${text}`;
}

const TITLE_PREFIXES = new Set(['dr.', 'dr', 'doç.', 'prof.', 'uzm.', 'op.']);

export function initials(name = '') {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(p => p && !TITLE_PREFIXES.has(p.toLocaleLowerCase('tr-TR')));
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toLocaleUpperCase('tr-TR');
}

export function normalizeSearch(text = '') {
  return text.toLocaleLowerCase('tr-TR').trim();
}

export function matchesSearch(query, ...fields) {
  const q = normalizeSearch(query);
  return !q || fields.some(f => normalizeSearch(String(f || '')).includes(q));
}

export function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function phoneHref(phone = '') {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
