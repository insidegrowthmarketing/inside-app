/** Formata um valor numérico como moeda */
export function formatarMoeda(valor: number, moeda: "BRL" | "USD" = "BRL"): string {
  return new Intl.NumberFormat(moeda === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: moeda,
  }).format(valor);
}

/** Formata uma data ISO para o formato DD/MM/AAAA */
export function formatarData(dataISO: string | null): string {
  if (!dataISO) return "—";
  const data = new Date(dataISO + "T00:00:00");
  return new Intl.DateTimeFormat("pt-BR").format(data);
}
