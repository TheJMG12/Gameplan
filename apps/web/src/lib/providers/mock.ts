import type { LeagueCode } from "@/lib/domain/leagues";
import type { Fixture, Standings } from "@/lib/domain/types";

const CRESTS: Record<string, string> = {};

function team(id: string, name: string, shortName: string) {
  return { id, name, shortName, crestUrl: CRESTS[id] ?? "" };
}

/** Deterministic placeholder data so the UI works before provider keys land. */
type ClubTriple = readonly [id: string, name: string, shortName: string];

const CLUBS_BY_LEAGUE: Record<LeagueCode, readonly ClubTriple[]> = {
  PL: [
    ["pl-1", "Arsenal", "ARS"],
    ["pl-2", "Manchester City", "MCI"],
    ["pl-3", "Liverpool", "LIV"],
    ["pl-4", "Chelsea", "CHE"],
    ["pl-5", "Tottenham Hotspur", "TOT"],
  ],
  PD: [
    ["pd-1", "Real Madrid", "RMA"],
    ["pd-2", "Barcelona", "BAR"],
    ["pd-3", "Atlético Madrid", "ATM"],
    ["pd-4", "Athletic Club", "ATH"],
    ["pd-5", "Real Sociedad", "RSO"],
  ],
  BL1: [
    ["bl-1", "Bayern Munich", "BAY"],
    ["bl-2", "Bayer Leverkusen", "B04"],
    ["bl-3", "Dortmund", "BVB"],
    ["bl-4", "RB Leipzig", "RBL"],
    ["bl-5", "Stuttgart", "VFB"],
  ],
  SA: [
    ["sa-1", "Inter", "INT"],
    ["sa-2", "Milan", "MIL"],
    ["sa-3", "Juventus", "JUV"],
    ["sa-4", "Napoli", "NAP"],
    ["sa-5", "Atalanta", "ATA"],
  ],
  FL1: [
    ["fl-1", "PSG", "PSG"],
    ["fl-2", "Monaco", "ASM"],
    ["fl-3", "Marseille", "OM"],
    ["fl-4", "Lille", "LIL"],
    ["fl-5", "Lyon", "OL"],
  ],
};

export function mockStandings(leagueCode: LeagueCode, season: number): Standings {
  const clubs = CLUBS_BY_LEAGUE[leagueCode];

  return {
    leagueCode,
    season,
    updatedAt: new Date().toISOString(),
    source: "mock",
    table: clubs.map(([id, name, shortName], index) => {
      const played = 10;
      const won = 9 - index;
      const draw = index % 2;
      const lost = played - won - draw;
      const goalsFor = 24 - index * 2;
      const goalsAgainst = 8 + index;
      return {
        position: index + 1,
        team: team(id, name, shortName),
        played,
        won,
        draw,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: won * 3 + draw,
        form: "WWDWL".slice(0, 5),
      };
    }),
  };
}

export function mockFixtures(leagueCode: LeagueCode, season: number): Fixture[] {
  const standings = mockStandings(leagueCode, season).table;
  const home = standings[0]?.team;
  const away = standings[1]?.team;
  const home2 = standings[2]?.team;
  const away2 = standings[3]?.team;

  if (!home || !away || !home2 || !away2) return [];

  const kickoff = new Date();
  kickoff.setUTCDate(kickoff.getUTCDate() + 2);
  kickoff.setUTCHours(19, 0, 0, 0);

  const played = new Date();
  played.setUTCDate(played.getUTCDate() - 3);
  played.setUTCHours(16, 30, 0, 0);

  return [
    {
      id: `${leagueCode}-upcoming-1`,
      leagueCode,
      season,
      utcDate: kickoff.toISOString(),
      status: "scheduled",
      matchday: 12,
      home,
      away,
      source: "mock",
    },
    {
      id: `${leagueCode}-finished-1`,
      leagueCode,
      season,
      utcDate: played.toISOString(),
      status: "finished",
      matchday: 11,
      home: home2,
      away: away2,
      score: { home: 2, away: 1 },
      source: "mock",
    },
  ];
}
