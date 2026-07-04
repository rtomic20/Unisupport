/**
 * Formatira ISO datum (YYYY-MM-DD) u DD.MM.YYYY.
 * Vraća "—" za null/undefined/prazan string.
 */
export function formatDateHR(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}.`;
}
