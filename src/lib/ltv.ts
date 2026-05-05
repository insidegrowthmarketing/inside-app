/** Calcula meses ativos de um cliente (runtime) */
export function calcularMesesAtivos(cliente: {
  pacote: string | null;
  inicio_contrato: string | null;
  data_saida: string | null;
}): number {
  // Pacote Start sempre conta como 1 mês (estruturação fixa de 35 dias)
  if (cliente.pacote === "start") return 1;

  if (!cliente.inicio_contrato || !cliente.data_saida) return 0;

  const inicio = new Date(cliente.inicio_contrato + "T00:00:00");
  const fim = new Date(cliente.data_saida + "T00:00:00");
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return 0;

  const meses = Math.round((fim.getTime() - inicio.getTime()) / (30 * 86400000));
  return Math.max(1, meses);
}

/** Calcula LTV de um cliente (fee × meses) */
export function calcularLTV(cliente: {
  pacote: string | null;
  fee_mensal: number;
  inicio_contrato: string | null;
  data_saida: string | null;
}): number {
  return Number(cliente.fee_mensal) * calcularMesesAtivos(cliente);
}
