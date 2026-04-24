export const SQUADS = {
  high_impact: {
    id: "high_impact",
    nome: "High Impact",
    head: "Caio",
    cor: "#E550A5",
  },
  genesis: {
    id: "genesis",
    nome: "Genesis",
    head: "Jean",
    cor: "#2D7CDB",
  },
} as const;

export function getSquadFromHead(
  head: string | null
): keyof typeof SQUADS | "sem_squad" {
  if (head === "Caio") return "high_impact";
  if (head === "Jean") return "genesis";
  return "sem_squad";
}
