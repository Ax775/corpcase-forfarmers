import { organisaties, speelmodi } from "@/lib/content";
import type { DeelnemerRij, Fase, SessieState } from "@/lib/supabase/types";

/**
 * Een minimale, geldige sessiestate om afgeleide logica op te toetsen.
 *
 * Gedeeld door de tests op de rolopdrachten en op de interventies: allebei gaan ze over wat de
 * app concludeert uit een stand, en die stand moet dan wel op één manier zijn opgebouwd.
 */
export function sessieState(over: Partial<SessieState> = {}): SessieState {
  const org = organisaties[0];
  return {
    sessie: {
      id: "test",
      titel: "Testsessie",
      organisatie_id: org.id,
      speelmodus: speelmodi.modi[0].id,
      fase: "lobby",
      join_code: "ABCDEF",
      beheer_code: null,
      budget_geld: org.budget_defaults.geld_eur,
      budget_capaciteit: org.budget_defaults.verandercapaciteit_mensmaanden,
      uitgangspunten: {},
      onzekerheid_pct: 30,
      fase_deadline: null,
      aangemaakt_op: "2026-01-01T00:00:00Z",
      bijgewerkt_op: "2026-01-01T00:00:00Z",
      afgerond_op: null,
      ...over.sessie,
    },
    deelnemers: over.deelnemers ?? [],
    selecties: over.selecties ?? [],
    usecases: over.usecases ?? [],
    usecaseSignalen: over.usecaseSignalen ?? [],
    waarderingen: over.waarderingen ?? [],
    bijdragen: over.bijdragen ?? [],
    allocaties: over.allocaties ?? [],
    besluiten: over.besluiten ?? [],
    roadmap: over.roadmap ?? [],
  };
}

/** Een deelnemer die zojuist nog actief was, tenzij je `laatst_gezien_op` overschrijft. */
export function deelnemer(naam: string, over: Partial<DeelnemerRij> = {}): DeelnemerRij {
  return {
    id: `d-${naam.toLowerCase()}`,
    sessie_id: "test",
    naam,
    rol_id: null,
    rolopdracht_id: null,
    token: `t-${naam}`,
    is_facilitator: false,
    laatst_gezien_op: new Date().toISOString(),
    aangemaakt_op: "2026-01-01T00:00:00Z",
    eigen_fase: null,
    ...over,
  };
}

export const FASE: Record<string, Fase> = {
  lobby: "lobby",
  verkennen: "verkennen",
  identificatie: "identificatie",
  waardebepaling: "waardebepaling",
  prioritering: "prioritering",
  roadmap: "roadmap",
  opbrengst: "opbrengst",
};
