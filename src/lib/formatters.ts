/** Formata um valor numérico como moeda */
export function formatarMoeda(valor: number | null | undefined, moeda: "BRL" | "USD" = "BRL"): string {
  const num = Number(valor);
  if (!Number.isFinite(num)) return "—";

  return new Intl.NumberFormat(moeda === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: moeda,
  }).format(num);
}

/** Formata o dia de pagamento de um cliente conforme a frequência */
export function formatarDiaPagamento(cliente: {
  forma_pagamento: string | null;
  data_pagamento: number | null;
  dia_semana_pagamento: number | null;
  dias_pagamento_quinzenal: number[] | null;
  data_inicio_quinzenal?: string | null;
}): string {
  const fp = (cliente.forma_pagamento || "").toLowerCase();

  // Stripe: não mostrar (virá da integração futura)
  if (fp.startsWith("stripe")) return "—";

  if (fp.includes("quinzenal")) {
    // Novo modelo
    if (cliente.data_inicio_quinzenal) {
      const d = new Date(cliente.data_inicio_quinzenal + "T00:00:00");
      if (!isNaN(d.getTime())) {
        return `A cada 15d (${d.toLocaleDateString("pt-BR")})`;
      }
    }
    // Modelo antigo
    const dias = cliente.dias_pagamento_quinzenal;
    if (dias && dias.length >= 2) return `Dias ${dias[0]} e ${dias[1]}`;
    return "—";
  }

  if (fp.includes("semanal")) {
    const d = cliente.dia_semana_pagamento;
    if (d === null || d === undefined) return "—";
    const nomes = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return nomes[d] ?? "—";
  }

  if (fp.includes("mensal")) {
    const d = cliente.data_pagamento;
    if (!d) return "—";
    return `Dia ${d}`;
  }

  return "—";
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
