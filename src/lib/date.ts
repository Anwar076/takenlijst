export function parseDateParam(value?: string | null) {
  if (!value) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }
  parsed.setUTCHours(0, 0, 0, 0);
  return parsed;
}

export function formatDateParam(date: Date) {
  return date.toISOString().split("T")[0];
}

export function endOfDay(date: Date) {
  const clone = new Date(date);
  clone.setUTCHours(23, 59, 59, 999);
  return clone;
}
