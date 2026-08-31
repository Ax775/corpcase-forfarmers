import Link from "next/link";
import { organisaties, sectorProfiel, sectoren } from "@/lib/content";
import { Cijfer } from "@/components/basis";
import { Cirkel, RasterCirkel } from "@/components/decoratie";
import { Thema } from "@/components/thema";

export default function Home() {
  const org = organisaties[0];

  // De bibliotheek is niet langer één set: tel over alle sectoren die in content/ staan.
  const profielen = sectoren.map((s) => sectorProfiel(s.id));
  const tel = (kies: (p: (typeof profielen)[number]) => number) =>
    profielen.reduce((som, p) => som + kies(p), 0);

  return (
    <Thema accent={org.thema.accent} className="flex-1">
      <main className="relative mx-auto w-full max-w-3xl overflow-hidden px-5 py-12 sm:py-20">
        <Cirkel hoek="rechtsboven" formaat={0.62} />

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-inkt-licht">
          Corpcase
        </p>

        <h1 className="display mt-4 max-w-xl text-4xl leading-[1.08] text-inkt sm:text-6xl">
          Van jaarverslag naar een gedragen roadmap
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-inkt-zacht">
          Een werksessie waarin bestuur en management door de ogen van het eigen jaarverslag, de
          eigen huurders en de eigen uitdagingen tot use cases komen — en die vervolgens waarderen,
          prioriteren en op een roadmap zetten.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/start"
            className="knop inline-flex items-center justify-center rounded-kaart bg-accent-sterk px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-diep"
          >
            Sessie starten
          </Link>
          <Link
            href="/deelnemen"
            className="knop inline-flex items-center justify-center rounded-kaart border border-rand-sterk bg-vlak px-5 py-3 text-sm font-medium text-inkt transition-colors hover:border-accent-sterk"
          >
            Deelnemen met een code
          </Link>
        </div>

        <p className="mt-4 text-xs text-inkt-licht">
          Sessie al gestart en op een ander apparaat verder?{" "}
          <Link href="/facilitator" className="font-medium text-accent-diep hover:underline">
            Facilitator inloggen
          </Link>
          .
        </p>

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {[
            { label: "Use cases", waarde: tel((p) => p.usecases.usecases.length) },
            { label: "Domeinen", waarde: tel((p) => p.domeinen.domeinen.length) },
            { label: "Rollen aan tafel", waarde: tel((p) => p.rollen.rollen.length) },
            { label: "Realiteitschecks", waarde: tel((p) => p.realiteitschecks.checks.length) },
          ].map((item) => (
            <Cijfer key={item.label} label={item.label} waarde={item.waarde} toon="accent" />
          ))}
        </div>

        <section className="mt-14 flex items-start gap-5 border-t border-rand pt-8">
          <RasterCirkel formaat={84} className="hidden shrink-0 sm:block" />
          <div>
            <h2 className="display text-xl text-inkt">Voorbeeldcorporatie: {org.naam}</h2>
            <p className="mt-2 text-sm leading-relaxed text-inkt-zacht">{org.pitch}</p>
            <p className="mt-3 text-xs leading-relaxed text-inkt-licht">
              De cijfers in deze demo komen uit publieke bronnen en zijn nog niet geverifieerd tegen
              het originele jaarverslag. Elk cijfer toont zijn bron; zie{" "}
              <code>content/BRONNEN.md</code>.
            </p>
          </div>
        </section>
      </main>
    </Thema>
  );
}
