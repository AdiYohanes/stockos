// Chart geometry only: exact decimal money becomes bounded percentage of common scale.
export function moneyChartShare(value: string, scales: string[]): number {
  const fixed = (text: string) => {
    const [whole, fraction = ""] = text.split(".");
    return BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, "0"));
  };
  const denominator = scales.map(fixed).reduce((maximum, amount) => amount > maximum ? amount : maximum, BigInt(0));
  if (denominator <= BigInt(0)) return 0;
  const ratio = fixed(value) * BigInt(10_000) / denominator;
  return Number(ratio < BigInt(0) ? BigInt(0) : ratio > BigInt(10_000) ? BigInt(10_000) : ratio) / 100;
}
