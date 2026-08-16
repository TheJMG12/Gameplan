import { z } from "zod";

export const FixtureStatusSchema = z.enum([
  "scheduled",
  "live",
  "finished",
  "postponed",
  "cancelled",
  "unknown",
]);

export const TeamRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().optional(),
  // Logos from APIs are usually URLs, but tolerate empty/missing/non-URL values.
  crestUrl: z.string().optional().default(""),
});

export const FixtureSchema = z.object({
  id: z.string(),
  leagueCode: z.string(),
  season: z.number().int(),
  utcDate: z.string(),
  status: FixtureStatusSchema,
  matchday: z.number().int().nullable().optional(),
  home: TeamRefSchema,
  away: TeamRefSchema,
  score: z
    .object({
      home: z.number().int().nullable(),
      away: z.number().int().nullable(),
    })
    .optional(),
  source: z.enum(["api-football", "football-data", "mock"]),
});

export const StandingRowSchema = z.object({
  position: z.number().int(),
  team: TeamRefSchema,
  played: z.number().int(),
  won: z.number().int(),
  draw: z.number().int(),
  lost: z.number().int(),
  goalsFor: z.number().int(),
  goalsAgainst: z.number().int(),
  goalDifference: z.number().int(),
  points: z.number().int(),
  form: z.string().optional(),
});

export const StandingsSchema = z.object({
  leagueCode: z.string(),
  season: z.number().int(),
  updatedAt: z.string(),
  table: z.array(StandingRowSchema),
  source: z.enum(["api-football", "football-data", "mock"]),
});

export type Fixture = z.infer<typeof FixtureSchema>;
export type StandingRow = z.infer<typeof StandingRowSchema>;
export type Standings = z.infer<typeof StandingsSchema>;
export type TeamRef = z.infer<typeof TeamRefSchema>;
