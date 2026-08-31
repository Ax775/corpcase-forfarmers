import { heeftSupabase } from "@/lib/supabase/config";
import { lokaleOpslag } from "./opslag-lokaal";
import { supabaseOpslag } from "./opslag-supabase";
import type { Opslag } from "./soorten";

export * from "./soorten";

/**
 * Kiest de opslag waarmee de applicatie werkt.
 *
 * Supabase is de normale modus: meerdere apparaten, en de sessie blijft bewaard. De offline modus
 * houdt de sessie in het geheugen van de Next.js-server; die is bedoeld om te testen en als
 * terugvaloptie voor een sessie op locatie waar het netwerk niet meewerkt.
 *
 * De keuze valt automatisch op offline als de Supabase-omgevingsvariabelen ontbreken, zodat de
 * app na `npm install && npm run dev` meteen speelbaar is. Met NEXT_PUBLIC_OPSLAG=lokaal forceer
 * je de offline modus expliciet.
 *
 * **Let op bij een gehoste omgeving.** De offline modus houdt de sessie in het geheugen van het
 * serverproces. Op een serverless host als Vercel deelt niet elke aanroep hetzelfde proces, dus
 * daar zou een sessie willekeurig verdwijnen — midden in een fase, met een bestuur aan tafel.
 * Een deploy hoort dus altijd Supabase-variabelen te hebben; `offlineModus()` is er zodat de
 * interface het kan tonen als dat niet zo is.
 */

export type OpslagSoort = "supabase" | "lokaal";

export function gekozenOpslagSoort(): OpslagSoort {
  if (process.env.NEXT_PUBLIC_OPSLAG === "lokaal") return "lokaal";
  if (process.env.NEXT_PUBLIC_OPSLAG === "supabase") return "supabase";

  return heeftSupabase() ? "supabase" : "lokaal";
}

export const opslag: Opslag =
  gekozenOpslagSoort() === "lokaal" ? lokaleOpslag : supabaseOpslag;

/** Of de app in de offline modus draait. De start- en beheerpagina waarschuwen erop. */
export function offlineModus(): boolean {
  return gekozenOpslagSoort() === "lokaal";
}
