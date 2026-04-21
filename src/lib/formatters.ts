/** Formata um valor numérico como moeda */
export function formatarMoeda(valor: number | null | undefined, moeda: "BRL" | "USD" = "BRL"): string {
  const num = Number(valor);
  if (!Number.isFinite(num)) return "—";

  return new Intl.NumberFormat(moeda === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: moeda,
  }).format(num);
}

/** Formata uma data ISO (date-only ou timestamp) para o formato DD/MM/AAAA */
export function formatarData(dataISO: string | null | undefined): string {
  if (!dataISO) return "—";

  // Se for date-only (YYYY-MM-DD), adiciona T00:00:00 para evitar fuso
  // Se já tiver "T" (timestamp), usa como está
  const raw = dataISO.includes("T") ? dataISO : dataISO + "T00:00:00";
  const data = new Date(raw);

  if (isNaN(data.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR").format(data);
}
