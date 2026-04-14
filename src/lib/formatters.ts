/** Formata um valor numérico como moeda brasileira (R$) */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/** Formata uma data ISO para o formato DD/MM/AAAA */
export function formatarData(dataISO: string | null): string {
  if (!dataISO) return "—";
  const data = new Date(dataISO + "T00:00:00");
  return new Intl.DateTimeFormat("pt-BR").format(data);
}
