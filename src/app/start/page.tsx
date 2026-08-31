"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { opslag } from "@/lib/sessie/api";
import { bewaarIdentiteit } from "@/lib/sessie/identiteit";
import { organisatie, organisaties, rollenVoorOrganisatie, speelmodi } from "@/lib/content";
import { Knop, Melding, Veld, invoerStijl } from "@/components/basis";
import { Cirkel } from "@/components/decoratie";
import { Thema } from "@/components/thema";

const standaardTitel = (naam: string) => `Use-casesessie ${naam}`;

export default function StartPagina() {
  const router = useRouter();

  const [orgId, setOrgId] = useState(organisaties[0].id);
  const org = organisatie(orgId);
  const rollen = rollenVoorOrganisatie(orgId);

  const [titel, setTitel] = useState(standaardTitel(organisaties[0].naam));
  const [modusId, setModusId] = useState("halve-dag");
  const [naam, setNaam] = useState("");
  const [speeltMee, setSpeeltMee] = useState(true);
  const [rolId, setRolId] = useState(rollen.rollen[0].id);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const modus = speelmodi.modi.find((m) => m.id === modusId)!;

  /**
   * Elke sector heeft eigen rollen, dus een rol van de vorige organisatie kan hier niet blijven
   * staan. Afleiden in plaats van bijhouden: dan kan de keuze niet stilzwijgend ongeldig worden.
   */
  const gekozenRol = rollen.rollen.some((r) => r.id === rolId) ? rolId : rollen.rollen[0].id;

  function kiesOrganisatie(nieuwId: string) {
    const vorige = organisatie(orgId);
    setOrgId(nieuwId);
    // De titel volgt de organisatie, tenzij de facilitator hem zelf heeft aangepast.
    if (titel === standaardTitel(vorige.naam)) setTitel(standaardTitel(organisatie(nieuwId).naam));
  }

  async function starten() {
    if (!naam.trim()) {
      setFout("Vul je naam in, dan weten de anderen wie er aan tafel zit.");
      return;
    }
    setBezig(true);
    setFout(null);
    try {
      const toegang = await opslag.maakSessie({
        titel: titel.trim() || `Use-casesessie ${org.naam}`,
        organisatieId: orgId,
        speelmodusId: modusId,
        facilitatorNaam: naam.trim(),
        facilitatorRolId: speeltMee ? gekozenRol : null,
      });
      bewaarIdentiteit(toegang.sessie.id, {
        ...toegang.identiteit,
        deelnemerId: toegang.deelnemer.id,
      });
      router.push(`/sessie/${toegang.sessie.id}/beheer`);
    } catch (probleem) {
      setFout(probleem instanceof Error ? probleem.message : "Sessie starten mislukte.");
      setBezig(false);
    }
  }

  return (
    <Thema
      accent={org.thema.accent}
      accentSecundair={org.thema.accent_secundair}
      className="flex-1"
    >
      <main className="relative mx-auto w-full max-w-xl overflow-hidden px-5 py-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-center">
      <Cirkel hoek="rechtsboven" formaat={0.5} toon="zacht" />
      <Link href="/" className="text-sm text-inkt-licht hover:text-accent-diep">
        ← Terug
      </Link>
      <h1 className="display mt-4 text-3xl text-inkt">Sessie starten</h1>
      <p className="mt-2 text-sm leading-relaxed text-inkt-zacht">
        Jij opent en sluit de fases. Kies hieronder of je daarnaast ook zelf een rol speelt, of
        alleen begeleidt.
      </p>

      <div className="mt-7 space-y-5">
        <Veld label="Naam van de sessie">
          <input
            className={invoerStijl}
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="Use-casesessie"
          />
        </Veld>

        {/*
          Met één organisatie in de content is een keuzelijst van één optie alleen maar ruis. De
          keuze verschijnt vanzelf zodra er een tweede bij komt.
        */}
        {organisaties.length > 1 ? (
        <Veld
          groep
          label="Voor welke organisatie?"
          hint="Bepaalt het jaarverslag, de klanten, de domeinen en het waardemodel waarmee je speelt."
        >
          <div className="space-y-2">
            {organisaties.map((o) => (
              <label
                key={o.id}
                className={`keuze flex cursor-pointer items-start gap-3 rounded-kaart border p-3 transition-colors ${
                  orgId === o.id
                    ? "border-accent bg-accent-zacht"
                    : "border-rand bg-vlak hover:border-rand-sterk"
                }`}
              >
                <input
                  type="radio"
                  name="organisatie"
                  className="mt-1"
                  checked={orgId === o.id}
                  onChange={() => kiesOrganisatie(o.id)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-inkt">{o.naam}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-inkt-zacht">
                    {o.pitch}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Veld>
        ) : null}

        <Veld
          groep
          label="Hoeveel tijd heb je?"
          hint="Bepaalt het aantal kaarten, de timers en hoe diep je doorrekent."
        >
          <div className="space-y-2">
            {speelmodi.modi.map((m) => (
              <label
                key={m.id}
                className={`keuze flex cursor-pointer items-start gap-3 rounded-kaart border p-3 transition-colors ${
                  modusId === m.id
                    ? "border-accent bg-accent-zacht"
                    : "border-rand bg-vlak hover:border-rand-sterk"
                }`}
              >
                <input
                  type="radio"
                  name="modus"
                  className="mt-1"
                  checked={modusId === m.id}
                  onChange={() => setModusId(m.id)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-inkt">
                    {m.naam} · {Math.round(m.duur_minuten / 15) * 15} minuten
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-inkt-zacht">
                    {m.omschrijving}
                  </span>
                </span>
              </label>
            ))}
          </div>
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

        <Veld groep label="Doe je ook zelf mee?">
          <div className="space-y-2">
            {(
              [
                {
                  waarde: true,
                  titel: "Ik begeleid én speel mee",
                  omschrijving:
                    "Je kiest een rol, denkt inhoudelijk mee en krijgt een privé-opdracht — naast het openen en sluiten van de fases.",
                },
                {
                  waarde: false,
                  titel: "Ik begeleid alleen",
                  omschrijving:
                    "Geen rol en geen plek in het spelbord. Je stuurt de sessie aan en kijkt mee, zonder zelf mee te doen.",
                },
              ] as const
            ).map((optie) => (
              <label
                key={String(optie.waarde)}
                className={`keuze flex cursor-pointer items-start gap-3 rounded-kaart border p-3 transition-colors ${
                  speeltMee === optie.waarde
                    ? "border-accent bg-accent-zacht"
                    : "border-rand bg-vlak hover:border-rand-sterk"
                }`}
              >
                <input
                  type="radio"
                  name="speeltMee"
                  className="mt-1"
                  checked={speeltMee === optie.waarde}
                  onChange={() => setSpeeltMee(optie.waarde)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-inkt">{optie.titel}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-inkt-zacht">
                    {optie.omschrijving}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Veld>

        {speeltMee ? (
          <Veld
            label="Jouw rol"
            hint="Bepaalt door welke bril je kijkt en welke privé-opdracht je krijgt."
          >
            <select
              className={invoerStijl}
              value={gekozenRol}
              onChange={(e) => setRolId(e.target.value)}
            >
              {rollen.rollen.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.naam}
                </option>
              ))}
            </select>
          </Veld>
        ) : null}

        {fout ? <Melding toon="risico">{fout}</Melding> : null}

        <div className="flex items-center gap-3">
          <Knop onClick={starten} disabled={bezig}>
            {bezig ? "Bezig…" : "Sessie starten"}
          </Knop>
          <p className="text-xs text-inkt-licht">
            Maximaal {modus.max_usecases} use cases in deze modus.
          </p>
        </div>
      </div>
      </main>
    </Thema>
  );
}
