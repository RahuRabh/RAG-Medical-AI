const durationUnits = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const;

export function durationToMs(duration: string) {
  const match = duration.trim().match(/^(\d+)([smhd])$/i);

  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const [, amount, unit] = match;

  return Number(amount) * durationUnits[unit.toLowerCase() as keyof typeof durationUnits];
}
