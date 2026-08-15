export function getEnv() {
  return {
    apiFootballKey: process.env.API_FOOTBALL_KEY ?? "",
    footballDataToken: process.env.FOOTBALL_DATA_API_TOKEN ?? "",
    ingestSeasons: (process.env.INGEST_SEASONS ?? "2023,2024,2025")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value)),
    databaseUrl: process.env.DATABASE_URL ?? "",
    cronSecret: process.env.CRON_SECRET ?? "",
  };
}

export function hasApiFootballKey(): boolean {
  return Boolean(getEnv().apiFootballKey);
}

export function hasFootballDataToken(): boolean {
  return Boolean(getEnv().footballDataToken);
}
