"use client";

import { useEffect, useState } from "react";

/**
 * De tijd die in deze fase nog over is, aflopend.
 *
 * De speelmodi geven per fase een tijd, en die deadline stond al in het datamodel — maar werd
 * nergens gezet en nergens getoond. Een facilitator voelt uitloop meestal pas als het al een
 * kwartier is; een teller die van tevoren afloopt, is wat je nodig hebt om op tijd te zeggen
 * "nog vijf minuten, dan ronden we af".
 *
 * Bewust géén alarm en geen geluid: het is een instrument voor de begeleider, niet een spel dat
 * de deelnemers opjaagt. Onder de drie minuten kleurt hij aandacht, voorbij de tijd risico, en
 * dan telt hij gewoon door — zodat je ziet hoe ver je eroverheen bent.
 */
export function FaseTimer({
  deadline,
  groot = false,
}: {
  deadline: string | null;
  /** Voor de beamer: leesbaar van vier meter. */
  groot?: boolean;
}) {
  const [nu, setNu] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const id = window.setInterval(() => setNu(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;
  const rest = new Date(deadline).getTime() - nu;
  if (!Number.isFinite(rest)) return null;

  const over = rest < 0;
  const seconden = Math.floor(Math.abs(rest) / 1000);
  const mm = Math.floor(seconden / 60);
  const ss = String(seconden % 60).padStart(2, "0");

  const kleur = over
    ? "text-risico"
    : rest < 3 * 60_000
      ? "text-aandacht"
      : groot
        ? "text-inkt-zacht"
        : "text-inkt-licht";

  return (
    <div className={groot ? "text-right" : ""} aria-live="off">
      <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${kleur}`}>
        {over ? "over de tijd" : "nog"}
      </p>
      <p
        className={`cijfer tabular-nums ${groot ? "text-4xl" : "text-xl"} ${kleur}`}
        // Hoge schermlezerfrequentie zou storen; wie de tijd wil weten, leest hem.
        aria-label={`${over ? "over de tijd" : "nog"} ${mm} minuten ${ss} seconden`}
      >
        {over ? "+" : ""}
        {mm}:{ss}
      </p>
    </div>
  );
}
