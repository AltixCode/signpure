/**
 * Loose validation for a manually-typed date field.
 *
 * The placed date field previously only ever held `new Date().toISOString()`
 * — there was no manual-entry path at all, so a signer stuck with today's
 * date could not backdate a form or correct a typo. This is not a parser: it
 * exists only to tell the editing UI whether to render the field as valid or
 * flag it, so it accepts the handful of date shapes people actually type
 * (`2026-09-29`, `09/29/2026`, `29.09.2026`, ...) and rejects both free text
 * and calendar-impossible values (`2026-13-40`) without being a full i18n
 * date parser — the field stores whatever text the user typed either way, so
 * a false negative here costs a red border, not a blocked signature.
 */

const DATE_PATTERNS: RegExp[] = [
  // 2026-09-29 (ISO-ish: YYYY-MM-DD)
  /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  // 09/29/2026 or 29/09/2026, and the dash/dot-separated equivalents
  // (MM/DD/YYYY or DD/MM/YYYY — both are accepted since which is which
  // depends on locale, and this check only needs *a* valid calendar date).
  /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/,
];

const daysInMonth = (year: number, month: number): number =>
  // `month` is 1-indexed here; new Date(year, month, 0) rolls back to the
  // last day of the *previous* index, i.e. the last day of `month`.
  new Date(year, month, 0).getDate();

const isPlausibleYmd = (year: number, month: number, day: number): boolean => {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return true;
};

export const isLikelyValidDate = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const isoMatch = trimmed.match(DATE_PATTERNS[0]);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return isPlausibleYmd(Number(y), Number(m), Number(d));
  }

  const slashMatch = trimmed.match(DATE_PATTERNS[1]);
  if (slashMatch) {
    const [, a, b, year] = slashMatch;
    const first = Number(a);
    const second = Number(b);
    // Accept whichever reading (MM/DD or DD/MM) is a real date, since the
    // field does not know the signer's locale convention.
    return (
      isPlausibleYmd(Number(year), first, second) ||
      isPlausibleYmd(Number(year), second, first)
    );
  }

  return false;
};

export default isLikelyValidDate;
