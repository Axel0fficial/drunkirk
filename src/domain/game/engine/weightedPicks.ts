export function weightedPick<T>(items: T[], weights: number[]): T {
  if (items.length === 0) throw new Error("weightedPick: empty items");
  if (weights.length !== items.length)
    throw new Error("weightedPick: size mismatch");

  let total = 0;
  for (const w of weights) total += Math.max(0, w);

  // Fallback to uniform if all weights are 0 or invalid
  if (total <= 0) {
    const i = Math.floor(Math.random() * items.length);
    return items[i];
  }

  const r = Math.random() * total;
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += Math.max(0, weights[i]);
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}
