export function getEnv() {
  return {
    apiFootballKey: (process.env.API_FOOTBALL_KEY ?? "").trim(),
    footballDataToken: (process.env.FOOTBALL_DATA_API_TOKEN ?? "").trim(),
    ingestSeasons: (process.env.INGEST_SEASONS ?? "2023,2024,2025")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value)),
    databaseUrl: (process.env.DATABASE_URL ?? "").trim(),
    cronSecret: (process.env.CRON_SECRET ?? "").trim(),
  };
}

export function hasApiFootballKey(): boolean {
  return getEnv().apiFootballKey.length > 0;
}

export function hasFootballDataToken(): boolean {
  return getEnv().footballDataToken.length > 0;
}

export function providerStatus() {
  return {
    apiFootball: hasApiFootballKey(),
    footballData: hasFootballDataToken(),
  };
}
