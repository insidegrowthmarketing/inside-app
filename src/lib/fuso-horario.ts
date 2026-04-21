import { FUSOS_HORARIOS } from "@/types/cliente";

/** Calcula a diferença em horas entre um timezone IANA e Brasília (America/Sao_Paulo) */
export function calcularDiferencaBrasilia(timezone: string): number {
  const agora = new Date();

  const formatoSP = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });

  const formatoTZ = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });

  const partesSP = formatoSP.formatToParts(agora);
  const partesTZ = formatoTZ.formatToParts(agora);

  const horaSP = Number(partesSP.find((p) => p.type === "hour")?.value ?? 0);
  const minSP = Number(partesSP.find((p) => p.type === "minute")?.value ?? 0);
  const horaTZ = Number(partesTZ.find((p) => p.type === "hour")?.value ?? 0);
  const minTZ = Number(partesTZ.find((p) => p.type === "minute")?.value ?? 0);

  let diff = (horaTZ * 60 + minTZ) - (horaSP * 60 + minSP);

  // Ajustar para cruzamento de meia-noite
  if (diff > 720) diff -= 1440;
  if (diff < -720) diff += 1440;

  return Math.round(diff / 60);
}

/** Retorna o label formatado de um fuso horário com a diferença dinâmica em relação a Brasília */
export function formatarFusoHorario(cityValue: string): string {
  const fuso = FUSOS_HORARIOS.find((f) => f.value === cityValue);
  if (!fuso) return cityValue || "—";

  const diff = calcularDiferencaBrasilia(fuso.timezone);
  const sinal = diff >= 0 ? "+" : "";
  return `${fuso.label} (${sinal}${diff}h)`;
}
