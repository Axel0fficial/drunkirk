export function formatTrackedText(targetName: string, action: string, rounds: number) {
  const r = rounds === 1 ? "round" : "rounds";
  return `${targetName} has to ${action} for ${rounds} ${r}.`;
}
