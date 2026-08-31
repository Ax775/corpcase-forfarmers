"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { opslag } from "@/lib/sessie/api";
import { bewaarIdentiteit } from "@/lib/sessie/identiteit";
import { organisatie, rollenVoorOrganisatie } from "@/lib/content";
import type { SessieRij } from "@/lib/supabase/types";
import { normaliseerCode } from "@/lib/sessie/codes";
import { Knop, Melding, Veld, invoerStijl } from "@/components/basis";
import { Cirkel } from "@/components/decoratie";

function Formulier() {
  const router = useRouter();
  const zoekparameters = useSearchParams();
  const [code, setCode] = useState(zoekparameters.get("code") ?? "");
  const [naam, setNaam] = useState("");
  const [rolId, setRolId] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  /**
   * De gevonden sessie wordt bewaard mét de code waarvoor hij gevonden is.
   *
   * Dat koppel is nodig: als de deelnemer zijn code aanpast, hoort de vorige sessie niet nog even
   * te blijven staan terwijl de nieuwe wordt opgehaald. Door beide samen op te slaan is een
   * verouderde uitkomst niet te onderscheiden van geen uitkomst, en hoeft het effect de state
   * niet synchroon leeg te maken.
   */
  const [gevonden, setGevonden] = useState<{ code: string; sessie: SessieRij | null } | null>(null);
  const genormaliseerd = normaliseerCode(code);
  const codeCompleet = genormaliseerd.length === 6;

  /**
   * Zoek de sessie op zodra de code compleet is.
   *
   * Dat moet: rollen zijn sectorgebonden, dus welke rollen er te kiezen zijn hangt af van de
   * organisatie waarvoor deze sessie draait. Het levert de deelnemer meteen bevestiging op dat
   * hij de goede code heeft, nog voordat hij op Meedoen drukt.
   */
  useEffect(() => {
    if (!codeCompleet) return;

    let actueel = true;
    void opslag
      .zoekSessie(genormaliseerd)
      .then((uitkomst) => {
        if (actueel) setGevonden({ code: genormaliseerd, sessie: uitkomst });
      })
      .catch(() => {
        if (actueel) setGevonden({ code: genormaliseerd, sessie: null });
      });

    return () => {
      actueel = false;
    };
  }, [genormaliseerd, codeCompleet]);

  const sessie = gevonden?.code === genormaliseerd ? gevonden.sessie : null;
  const org = sessie ? organisatie(sessie.organisatie_id) : null;
  const rollen = org ? rollenVoorOrganisatie(org.id) : null;
  // Afleiden in plaats van bijhouden: bij een andere code kan een eerder gekozen rol niet blijven staan.
  const gekozenRol =
    rollen && rolId && rollen.rollen.some((r) => r.id === rolId) ? rolId : rollen?.rollen[1]?.id ?? null;

  async function meedoen() {
    if (!codeCompleet) {
      setFout("Een sessiecode bestaat uit zes tekens.");
      return;
    }
    if (!naam.trim()) {
      setFout("Vul je naam in, dan weten de anderen wie er meedoet.");
      return;
    }
    if (!gekozenRol) {
      setFout("We konden geen sessie vinden met deze code. Controleer hem bij de facilitator.");
      return;
    }

    setBezig(true);
    setFout(null);
    try {
      const toegang = await opslag.neemDeel({ code, naam: naam.trim(), rolId: gekozenRol });
      bewaarIdentiteit(toegang.sessie.id, {
        ...toegang.identiteit,
        deelnemerId: toegang.deelnemer.id,
      });
      router.push(`/sessie/${toegang.sessie.id}`);
    } catch (probleem) {
      setFout(probleem instanceof Error ? probleem.message : "Deelnemen mislukte.");
      setBezig(false);
    }
  }

  return (
    <main className="relative mx-auto w-full max-w-md overflow-hidden px-5 py-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-center">
      <Cirkel
        hoek="rechtsboven"
        formaat={0.55}
        afbeelding={{ src: "/illustraties/meedoen.jpg" }}
      />
      <Link href="/" className="text-sm text-inkt-licht hover:text-accent-diep">
        ← Terug
      </Link>
      <h1 className="display mt-4 text-3xl text-inkt">Meedoen</h1>
      <p className="mt-2 text-sm leading-relaxed text-inkt-zacht">
        Vul de code in die de facilitator deelt.
      </p>

      <div className="mt-7 space-y-5">
        <Veld label="Sessiecode">
          <input
            className={`${invoerStijl} text-center font-mono text-2xl tracking-[0.3em] uppercase`}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={9}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
          />
        </Veld>

        <Veld label="Jouw naam">
          <input
            className={invoerStijl}
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Voor- en achternaam"
            autoComplete="name"
          />
        </Veld>

        {rollen && org ? (
          <Veld
            label="Jouw rol"
            hint={`Je doet mee aan een sessie voor ${org.naam}. Je rol bepaalt door welke bril je kijkt en welke privé-opdracht je krijgt.`}
          >
            <select
              className={invoerStijl}
              value={gekozenRol ?? ""}
              onChange={(e) => setRolId(e.target.value)}
            >
              {rollen.rollen.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.naam}
                </option>
              ))}
            </select>
          </Veld>
        ) : (
          <p className="text-xs leading-relaxed text-inkt-licht">
            Zodra de code klopt, verschijnt hier voor welke organisatie je meespeelt en welke rol
            je kunt kiezen.
          </p>
        )}

        {fout ? <Melding toon="risico">{fout}</Melding> : null}

        <Knop onClick={meedoen} disabled={bezig} className="w-full">
          {bezig ? "Bezig…" : "Meedoen"}
        </Knop>
      </div>
    </main>
  );
}

export default function DeelnemenPagina() {
  return (
    <Suspense fallback={<main className="p-8 text-sm text-inkt-licht">Laden…</main>}>
      <Formulier />
    </Suspense>
  );
}
