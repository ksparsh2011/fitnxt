export function computeTodayDayNumber(): number {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

export function getWeekMonday(from: Date = new Date()): Date {
  const dayOfWeek = from.getDay() || 7;
  const monday = new Date(from);
  monday.setDate(from.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
