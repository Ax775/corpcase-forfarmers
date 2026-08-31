/**
 * Waar de app zijn Supabase-project vindt.
 *
 * Bewust géén standaardwaarden in de code. Een hardgecodeerd project betekent dat een deploy die
 * vergeet zijn omgevingsvariabelen te zetten, stilzwijgend sessiedata naar het verkeerde project
 * schrijft — en dat merk je pas als je het daar aantreft. Zonder variabelen valt de app terug op
 * de offline modus, en dat is zichtbaar in de interface.
 *
 * De publiceerbare sleutel mág openbaar zijn. Hij zit sowieso in elke browser die de app opent,
 * en geeft op zichzelf nergens toegang toe: de RLS-policies in supabase/schema.sql weigeren alles
 * zonder een geldig deelnemertoken of een geldige beheercode. De geheime service-sleutel wordt
 * nergens in dit project gebruikt.
 */

export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function supabaseSleutel(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
}

/** Of er een bruikbaar project is. Zo niet, valt de app terug op de offline modus. */
export function heeftSupabase(): boolean {
  return Boolean(supabaseUrl() && supabaseSleutel());
}
