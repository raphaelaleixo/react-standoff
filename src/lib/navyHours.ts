const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function navyHoursLabel(round: number): string {
  if (round >= 8) return "— sails on the horizon —";
  const hours = 9 - round;
  return `— navy ~${hours} hours out —`;
}

export function toRoman(n: number): string {
  return ROMAN[n] ?? String(n);
}
