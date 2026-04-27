export function getLocalISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayLocalISODate(d: Date = new Date()): string {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - 1);
  return getLocalISODate(copy);
}

