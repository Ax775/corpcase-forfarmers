/**
 * Nederlands enkelvoud en meervoud bij een telwoord.
 *
 * Bestaat omdat het op vier plekken misging op precies dezelfde manier: "1 signalen",
 * "1 maanden", "2 use cases" naast "1 use cases". Het is geen taalkundige fijnslijperij — een
 * instrument dat aan een bestuurstafel ligt en "1 signalen" toont, oogt onaf, en dat straalt af
 * op de cijfers ernaast.
 *
 * Bewust geen automatische meervoudsvorming: het Nederlands is daar te grillig voor
 * ("signaal/signalen", "case/cases", "maand/maanden"). Beide vormen worden benoemd.
 */
export function telwoord(aantal: number, enkelvoud: string, meervoud: string): string {
  return `${aantal} ${aantal === 1 ? enkelvoud : meervoud}`;
}

/** Alleen het zelfstandig naamwoord, zonder het getal ervoor. */
export function meervoud(aantal: number, enkelvoud: string, meervoudsvorm: string): string {
  return aantal === 1 ? enkelvoud : meervoudsvorm;
}
