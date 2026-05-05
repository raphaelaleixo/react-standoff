const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

type Translator = (key: string, vars?: Record<string, unknown>) => string;

export function navyHoursLabel(round: number, t?: Translator): string {
  if (round >= 8) {
    return t ? t("shell.sailsLabel") : "— sails on the horizon —";
  }
  const hours = 9 - round;
  return t ? t("shell.navyHoursLabel", { hours }) : `— navy ~${hours} hours out —`;
}

export function toRoman(n: number): string {
  return ROMAN[n] ?? String(n);
}
