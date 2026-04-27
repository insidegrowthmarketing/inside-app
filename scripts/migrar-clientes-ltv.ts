/**
 * Script de migração de 76 clientes históricos (churned) para LTV.
 *
 * Uso:
 *   npx tsx scripts/migrar-clientes-ltv.ts --test      # importa só o 1o
 *   npx tsx scripts/migrar-clientes-ltv.ts --all        # importa todos
 *   npx tsx scripts/migrar-clientes-ltv.ts --rollback   # deleta importados
 */

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "readline";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("\n⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local.\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const MARCADOR = "[MIGRADO_VIA_SCRIPT_LTV]";
const HOJE = new Date().toISOString().split("T")[0];

// =============================================
// Mapeamentos
// =============================================

const MOTIVOS_VALIDOS = [
  "Alta demanda", "Apenas estruturação", "Baixa maturidade digital",
  "Baixa verba para investir", "Baixo engajamento", "Baixo retorno",
  "Cumpriu contrato e não renovou", "Fechou a empresa", "Inadimplente",
  "Primarizou", "Queda de venda comercial",
];

function mapearMotivo(original: string): { motivo: string; mapeado: boolean } {
  if (!original || original === "—" || original === "-") return { motivo: "Queda de venda comercial", mapeado: true };

  const mapa: Record<string, string> = {
    "Apenas estruturação": "Apenas estruturação",
    "Baixa maturidade digital": "Baixa maturidade digital",
    "Baixo retorno": "Baixo retorno",
    "Baixo engajamento": "Baixo engajamento",
    "Primarizou o serviço": "Primarizou",
    "Inadimplente": "Inadimplente",
    "Pagou 1 semana e sumiu": "Queda de venda comercial",
    "Pagou 1 mês e sumiu": "Queda de venda comercial",
    "Pagou e sumiu": "Queda de venda comercial",
  };

  if (mapa[original]) return { motivo: mapa[original], mapeado: mapa[original] !== original };
  if (MOTIVOS_VALIDOS.includes(original)) return { motivo: original, mapeado: false };
  return { motivo: "Queda de venda comercial", mapeado: true };
}

function mapearGP(gp: string): string | null {
  if (!gp || gp === "—" || gp === "-") return null;
  if (gp === "Maria") return "Maria Paula";
  if (gp === "Sérgio") return "Sergio";
  return gp;
}

function mapearGT(gt: string): string | null {
  if (!gt || gt === "—" || gt === "-") return null;
  if (gt === "Felipe") return "Luiz Felipe";
  return gt;
}

function mapearHead(gt: string | null): string | null {
  if (!gt) return null;
  if (["Rodrigo", "Gabriel", "Eliane", "Caio"].includes(gt)) return "Caio";
  if (["Ana Luiza", "Lucas", "Samara", "Jean"].includes(gt)) return "Jean";
  return null;
}

function parseData(raw: string): string | null {
  if (!raw || raw === "—" || raw === "-") return null;
  const partes = raw.trim().split("/");
  if (partes.length !== 3) return null;
  const [dd, mm, yy] = partes;
  const ano = Number(yy) < 100 ? 2000 + Number(yy) : Number(yy);
  return `${ano}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function limparNome(raw: string): string {
  return raw.replace(/^EUA\s*-\s*/i, "").replace(/^EUR\s*-\s*/i, "").trim();
}

function addDias(dataStr: string, dias: number): string {
  const d = new Date(dataStr + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}

// =============================================
// Dados dos 76 clientes
// =============================================

interface ClienteLTV {
  nome: string;
  fee: number;
  moeda: "BRL" | "USD";
  motivoOriginal: string;
  gp: string;
  gt: string;
  entrada: string;     // DD/MM/AA
  saida: string;       // DD/MM/AA ou "—"
  meses: number;
  tipo: "normal" | "semana" | "mes_sumiu";
}

const CLIENTES: ClienteLTV[] = [
  { nome: "DJ Mega paints LLC", fee: 800, moeda: "USD", motivoOriginal: "Pagou 1 semana e sumiu", gp: "—", gt: "—", entrada: "01/04/25", saida: "—", meses: 1, tipo: "semana" },
  { nome: "R1BR8", fee: 1500, moeda: "BRL", motivoOriginal: "Cliente sem tempo", gp: "Aline", gt: "Ana Luiza", entrada: "22/05/25", saida: "26/12/25", meses: 7, tipo: "normal" },
  { nome: "EUR - Xpray Solutions", fee: 400, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Sergio", gt: "Rodrigo", entrada: "17/10/25", saida: "26/12/25", meses: 2, tipo: "normal" },
  { nome: "Prestige Custom Tile", fee: 800, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Aline", gt: "Ana Luiza", entrada: "18/10/25", saida: "22/11/25", meses: 1, tipo: "normal" },
  { nome: "EUA - Shalon Construction", fee: 880, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Aline", gt: "Ana Luiza", entrada: "19/08/25", saida: "16/01/26", meses: 4, tipo: "normal" },
  { nome: "EUA - New Concept Park", fee: 800, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Bruna", gt: "Felipe", entrada: "10/09/25", saida: "16/01/26", meses: 4, tipo: "normal" },
  { nome: "EUA - MC Services", fee: 800, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Sergio", gt: "Rodrigo", entrada: "16/09/25", saida: "10/12/25", meses: 3, tipo: "normal" },
  { nome: "EUA - Carvalho PRO Services", fee: 880, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Sergio", gt: "Rodrigo", entrada: "18/09/25", saida: "16/01/26", meses: 4, tipo: "normal" },
  { nome: "EUA - SkinSense Aesthetic", fee: 720, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Gabriela", gt: "Lucas", entrada: "22/09/25", saida: "16/12/25", meses: 3, tipo: "normal" },
  { nome: "EUA - Greenlife Construction", fee: 640, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Bruna", gt: "Felipe", entrada: "05/11/25", saida: "16/12/25", meses: 1, tipo: "normal" },
  { nome: "EUA - Peniel Carpentry", fee: 640, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Sergio", gt: "Rodrigo", entrada: "12/11/25", saida: "16/12/25", meses: 1, tipo: "normal" },
  { nome: "EUA - Novera Institute Salon", fee: 600, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Gabriela", gt: "Lucas", entrada: "04/12/25", saida: "16/12/25", meses: 1, tipo: "normal" },
  { nome: "EUA - Lucianas Premier Cleaning", fee: 800, moeda: "USD", motivoOriginal: "Falta de engajamento no projeto", gp: "Bruna", gt: "Felipe", entrada: "13/11/25", saida: "16/12/25", meses: 1, tipo: "normal" },
  { nome: "EUA - Neves Construction", fee: 1100, moeda: "USD", motivoOriginal: "Falta de agenda para novos projetos", gp: "Gabriela", gt: "Lucas", entrada: "26/06/25", saida: "16/12/25", meses: 4, tipo: "normal" },
  { nome: "EUA - LDF Prime Solutions", fee: 720, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Sergio", gt: "Rodrigo", entrada: "09/12/25", saida: "08/01/26", meses: 1, tipo: "normal" },
  { nome: "JRT Premier Constructions", fee: 800, moeda: "USD", motivoOriginal: "—", gp: "Gabriela", gt: "Lucas", entrada: "15/01/26", saida: "—", meses: 1, tipo: "normal" },
  { nome: "EC Floor Covering", fee: 720, moeda: "USD", motivoOriginal: "—", gp: "Bruna", gt: "Felipe", entrada: "20/01/26", saida: "—", meses: 1, tipo: "normal" },
  { nome: "EUA - NR Painting", fee: 640, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Sergio", gt: "Rodrigo", entrada: "10/10/25", saida: "10/01/26", meses: 3, tipo: "normal" },
  { nome: "Duarte e Moura", fee: 2000, moeda: "BRL", motivoOriginal: "Primarizou o serviço", gp: "Maria", gt: "Caio", entrada: "02/05/21", saida: "27/04/26", meses: 54, tipo: "normal" },
  { nome: "EUA - Noliv Construction", fee: 800, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Bruna", gt: "Felipe", entrada: "06/11/25", saida: "29/01/26", meses: 3, tipo: "normal" },
  { nome: "EUA - Maria Moro Cleaning", fee: 800, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Sergio", gt: "Rodrigo", entrada: "23/10/25", saida: "29/01/26", meses: 3, tipo: "normal" },
  { nome: "EUA - Sunrise", fee: 660, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Aline", gt: "Ana Luiza", entrada: "22/05/25", saida: "29/01/26", meses: 8, tipo: "normal" },
  { nome: "EUA - Rezende Construction", fee: 500, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Aline", gt: "Ana Luiza", entrada: "26/06/25", saida: "10/02/26", meses: 8, tipo: "normal" },
  { nome: "EUA - Reform Floors", fee: 1120, moeda: "USD", motivoOriginal: "Focou no ecommerce", gp: "Gabriela", gt: "Lucas", entrada: "30/07/25", saida: "10/02/26", meses: 5, tipo: "normal" },
  { nome: "EUA - Relax Wax", fee: 640, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Bruna", gt: "Felipe", entrada: "11/11/25", saida: "10/02/26", meses: 3, tipo: "normal" },
  { nome: "EUA - Super cool", fee: 800, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Sergio", gt: "Rodrigo", entrada: "05/01/26", saida: "09/02/26", meses: 1, tipo: "normal" },
  { nome: "EUA - Rizzon Outdoor", fee: 640, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Sergio", gt: "Rodrigo", entrada: "28/10/25", saida: "02/12/25", meses: 3, tipo: "normal" },
  { nome: "EUA - Eula Skin Advanced", fee: 640, moeda: "USD", motivoOriginal: "—", gp: "Aline", gt: "Ana Luiza", entrada: "02/02/26", saida: "—", meses: 1, tipo: "normal" },
  { nome: "EUA - MKF", fee: 720, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Maria", gt: "Caio", entrada: "29/04/25", saida: "01/02/26", meses: 8, tipo: "normal" },
  { nome: "EUA - GA Visuals", fee: 800, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Bruna", gt: "Felipe", entrada: "24/11/25", saida: "10/02/26", meses: 2, tipo: "normal" },
  { nome: "MicroTech", fee: 1000, moeda: "USD", motivoOriginal: "—", gp: "Gabriela", gt: "Lucas", entrada: "26/01/26", saida: "—", meses: 1, tipo: "normal" },
  { nome: "EUA - Time 2 Shine Team", fee: 600, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Sergio", gt: "Rodrigo", entrada: "29/09/25", saida: "25/02/26", meses: 5, tipo: "normal" },
  { nome: "EUA - Quality screen FL", fee: 1000, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Aline", gt: "Ana Luiza", entrada: "08/10/25", saida: "20/02/26", meses: 4, tipo: "normal" },
  { nome: "EUA - Revival Home Remodeling", fee: 500, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Aline", gt: "Ana Luiza", entrada: "24/10/25", saida: "20/02/26", meses: 3, tipo: "normal" },
  { nome: "EUA - Blue Sparkling Service", fee: 640, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Bruna", gt: "Felipe", entrada: "27/11/25", saida: "27/12/25", meses: 1, tipo: "normal" },
  { nome: "Master Top Solutions", fee: 720, moeda: "USD", motivoOriginal: "—", gp: "Bruna", gt: "Felipe", entrada: "26/01/26", saida: "—", meses: 1, tipo: "normal" },
  { nome: "Fórmula Expressa", fee: 2000, moeda: "BRL", motivoOriginal: "Primarizou o serviço", gp: "Bruna", gt: "Felipe", entrada: "14/07/25", saida: "03/03/26", meses: 7, tipo: "normal" },
  { nome: "EUA - TSP Logistic General", fee: 1000, moeda: "USD", motivoOriginal: "Baixo engajamento", gp: "Gabriela", gt: "Lucas", entrada: "18/11/25", saida: "03/03/26", meses: 3, tipo: "normal" },
  { nome: "EUA - Mas General Services", fee: 800, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Maria", gt: "Caio", entrada: "05/12/25", saida: "03/03/26", meses: 1, tipo: "normal" },
  { nome: "EUA - KB Cleaning Services", fee: 800, moeda: "USD", motivoOriginal: "Problema de imigração", gp: "Sergio", gt: "Mirella", entrada: "14/01/26", saida: "03/03/26", meses: 1, tipo: "normal" },
  { nome: "EUA - Kalahari Construction", fee: 800, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Sergio", gt: "Mirella", entrada: "13/01/26", saida: "03/03/26", meses: 1, tipo: "normal" },
  { nome: "EUA - Paul Pro", fee: 640, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Sergio", gt: "Mirella", entrada: "26/01/26", saida: "01/03/26", meses: 1, tipo: "normal" },
  { nome: "EUA - NI HVAC Service", fee: 800, moeda: "USD", motivoOriginal: "Falta de licenças e sumiu", gp: "Aline", gt: "Ana Luiza", entrada: "21/10/25", saida: "01/03/26", meses: 3, tipo: "normal" },
  { nome: "EUA - LB Profissional Tile", fee: 640, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Gabriela", gt: "Lucas", entrada: "10/12/25", saida: "01/03/26", meses: 3, tipo: "normal" },
  { nome: "Casa Candle", fee: 1200, moeda: "BRL", motivoOriginal: "Encerrou a loja", gp: "Maria", gt: "Caio", entrada: "02/02/21", saida: "01/03/26", meses: 60, tipo: "normal" },
  { nome: "EUA - Rodrigues Cleaning", fee: 400, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Gabriela", gt: "Lucas", entrada: "28/01/26", saida: "01/03/26", meses: 1, tipo: "normal" },
  { nome: "EUA - Bea Company", fee: 600, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Sergio", gt: "Mirella", entrada: "02/02/26", saida: "01/03/26", meses: 1, tipo: "normal" },
  { nome: "EUA - Sany Cleaning", fee: 800, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Sergio", gt: "Rodrigo", entrada: "20/01/26", saida: "01/03/26", meses: 1, tipo: "normal" },
  { nome: "EUA - CSantos Painting", fee: 720, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Sergio", gt: "Rodrigo", entrada: "05/02/26", saida: "01/03/26", meses: 1, tipo: "normal" },
  { nome: "Chicken fritters", fee: 3120, moeda: "BRL", motivoOriginal: "Apenas estruturação", gp: "Sergio", gt: "Mirella", entrada: "11/02/26", saida: "01/03/26", meses: 1, tipo: "normal" },
  { nome: "EUA - Blue legacy studio", fee: 600, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Bruna", gt: "Felipe", entrada: "02/03/26", saida: "01/03/26", meses: 1, tipo: "normal" },
  { nome: "EUA - Dan Flooring", fee: 600, moeda: "USD", motivoOriginal: "Baixo engajamento", gp: "Aline", gt: "Ana Luiza", entrada: "08/04/25", saida: "30/03/26", meses: 9, tipo: "normal" },
  { nome: "EUA - Half Moon Doulas", fee: 800, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Gabriela", gt: "Lucas", entrada: "05/01/26", saida: "30/03/26", meses: 2, tipo: "normal" },
  { nome: "EUA - Costa Finish Carpent", fee: 680, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Sergio", gt: "Rodrigo", entrada: "19/02/26", saida: "30/03/26", meses: 1, tipo: "normal" },
  { nome: "EUA - Limas Painting INC", fee: 640, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Bruna", gt: "Felipe", entrada: "17/11/25", saida: "30/03/26", meses: 3, tipo: "normal" },
  { nome: "EUA - Elevate Countertops", fee: 583.20, moeda: "USD", motivoOriginal: "Baixa maturidade digital", gp: "Sergio", gt: "Caio", entrada: "29/04/25", saida: "01/04/26", meses: 11, tipo: "normal" },
  { nome: "EUA - MAS General - Pool builders", fee: 1260, moeda: "USD", motivoOriginal: "Baixo engajamento", gp: "Maria", gt: "Caio", entrada: "13/05/25", saida: "01/04/26", meses: 10, tipo: "normal" },
  { nome: "EUA - C&A Pro Solutions", fee: 500, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Gabriela", gt: "Lucas", entrada: "24/10/25", saida: "01/04/26", meses: 5, tipo: "normal" },
  { nome: "EUA - BRA Tech Systems", fee: 800, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Bruna", gt: "Felipe", entrada: "05/01/26", saida: "01/04/26", meses: 3, tipo: "normal" },
  { nome: "EUA - Boykin Brothers", fee: 1000, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Maria", gt: "Jean", entrada: "03/02/26", saida: "01/04/26", meses: 2, tipo: "normal" },
  { nome: "Gateway Carpentry", fee: 720, moeda: "USD", motivoOriginal: "Pagou 1 semana e sumiu", gp: "Sergio", gt: "Rodrigo", entrada: "19/03/26", saida: "—", meses: 1, tipo: "semana" },
  { nome: "M Vieira Services", fee: 1110, moeda: "USD", motivoOriginal: "Pagou 1 mês e sumiu", gp: "Gabriela", gt: "Lucas", entrada: "25/03/26", saida: "—", meses: 1, tipo: "mes_sumiu" },
  { nome: "Bostons Best Commercial cleaning", fee: 720, moeda: "USD", motivoOriginal: "Pagou 1 semana e sumiu", gp: "Sergio", gt: "Mirella", entrada: "20/03/26", saida: "—", meses: 1, tipo: "semana" },
  { nome: "EUA - DLJ Services Corp", fee: 500, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Bruna", gt: "Felipe", entrada: "17/10/25", saida: "09/04/26", meses: 5, tipo: "normal" },
  { nome: "EUA - Tee X Renovations", fee: 600, moeda: "USD", motivoOriginal: "Problemas no atendimento comercial", gp: "Bruna", gt: "Felipe", entrada: "05/11/25", saida: "09/04/26", meses: 4, tipo: "normal" },
  { nome: "Rejanes Cleaning Services", fee: 640, moeda: "USD", motivoOriginal: "Pagou 1 semana e sumiu", gp: "Sergio", gt: "Mirella", entrada: "30/03/26", saida: "—", meses: 1, tipo: "semana" },
  { nome: "RDS General Service", fee: 1000, moeda: "USD", motivoOriginal: "Pagou 1 semana e sumiu", gp: "Gerlaine", gt: "Caio", entrada: "31/03/26", saida: "—", meses: 1, tipo: "semana" },
  { nome: "EUA - Master Finish Plastering", fee: 600, moeda: "USD", motivoOriginal: "Baixo engajamento", gp: "Gabriela", gt: "Lucas", entrada: "24/11/25", saida: "20/04/26", meses: 5, tipo: "normal" },
  { nome: "EUA - Zacas Tile Installation", fee: 880, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Gabriela", gt: "Lucas", entrada: "12/11/25", saida: "20/04/26", meses: 5, tipo: "normal" },
  { nome: "G&D pro services usa corp", fee: 1120, moeda: "USD", motivoOriginal: "Baixo retorno", gp: "Gabriela", gt: "Lucas", entrada: "13/03/26", saida: "20/04/26", meses: 1, tipo: "normal" },
  { nome: "SM Hardwood Flooring", fee: 980, moeda: "USD", motivoOriginal: "Pagou 1 mês e sumiu", gp: "Aline", gt: "Ana Luiza", entrada: "16/03/26", saida: "20/04/26", meses: 1, tipo: "mes_sumiu" },
  { nome: "EUA - AWC Construction Services", fee: 800, moeda: "USD", motivoOriginal: "Baixo engajamento", gp: "Sergio", gt: "Rodrigo", entrada: "30/01/26", saida: "20/04/26", meses: 2, tipo: "normal" },
  { nome: "EUA - H&L General Contractor", fee: 680, moeda: "USD", motivoOriginal: "Apenas estruturação", gp: "Bruna", gt: "Felipe", entrada: "17/02/26", saida: "20/04/26", meses: 1, tipo: "normal" },
  { nome: "Vidente Diana", fee: 2200, moeda: "BRL", motivoOriginal: "Baixo engajamento", gp: "Bruna", gt: "Felipe", entrada: "27/02/26", saida: "20/04/26", meses: 1, tipo: "normal" },
  { nome: "Pai Sebastian", fee: 1800, moeda: "BRL", motivoOriginal: "Baixo engajamento", gp: "Bruna", gt: "Felipe", entrada: "17/03/26", saida: "20/04/26", meses: 1, tipo: "normal" },
  { nome: "Northeast cross landscape", fee: 1320, moeda: "USD", motivoOriginal: "Pagou 1 semana e sumiu", gp: "Gerlaine", gt: "Gabriel", entrada: "16/04/26", saida: "—", meses: 1, tipo: "semana" },
];

// =============================================
// Importação
// =============================================

async function importarCliente(c: ClienteLTV, index: number, total: number) {
  const nome = limparNome(c.nome);
  console.log(`\n[${index + 1}/${total}] Importando: ${nome}`);

  try {
    const entradaISO = parseData(c.entrada);
    if (!entradaISO) {
      console.log("  ✗ ERRO: data de entrada inválida:", c.entrada);
      return { sucesso: false, nome, erro: "data entrada inválida" };
    }

    // Calcular data_saida
    let dataSaida: string;
    const saidaRealISO = parseData(c.saida);

    if (c.tipo === "semana") {
      dataSaida = addDias(entradaISO, 7);
    } else if (c.tipo === "mes_sumiu") {
      dataSaida = addDias(entradaISO, 30);
    } else if (saidaRealISO) {
      // Usar data real de saída da planilha
      dataSaida = saidaRealISO;
    } else {
      // Sem data de saída e normal → calcular por meses pagos
      dataSaida = addDias(entradaISO, c.meses * 30);
    }

    const { motivo, mapeado } = mapearMotivo(c.motivoOriginal);
    const pacote = c.motivoOriginal === "Apenas estruturação" ? "start" : "pro";
    const gestorProjetos = mapearGP(c.gp);
    const gestorTrafego = mapearGT(c.gt);
    const head = mapearHead(gestorTrafego);

    // Observações
    const obsPartes = [`${MARCADOR} ${HOJE}`];
    if (saidaRealISO && saidaRealISO !== dataSaida) {
      obsPartes.push(`Data real de saída: ${saidaRealISO}`);
    }
    obsPartes.push(`Meses pagos: ${c.meses}${c.tipo === "semana" ? " (1 semana)" : c.tipo === "mes_sumiu" ? " (1 mês e sumiu)" : ""}`);
    if (mapeado) {
      obsPartes.push(`Motivo original: ${c.motivoOriginal}`);
    }

    const dados = {
      nome,
      fee_mensal: c.fee,
      moeda: c.moeda,
      status: "churn",
      pacote,
      motivo_churn: motivo,
      inicio_contrato: entradaISO,
      fim_contrato: null,
      data_saida: dataSaida,
      forma_pagamento: null,
      data_pagamento: null,
      dia_semana_pagamento: null,
      dias_pagamento_quinzenal: null,
      data_inicio_quinzenal: null,
      fuso_horario: null,
      gestor_projetos: gestorProjetos,
      gestor_trafego: gestorTrafego,
      head,
      contempla_ghl: false,
      responsavel_financeiro: null,
      contato_financeiro: null,
      observacoes: obsPartes.join("\n"),
    };

    const { error } = await supabase.from("clientes").insert(dados);

    if (error) {
      console.log(`  ✗ ERRO: ${error.message}`);
      return { sucesso: false, nome, erro: error.message };
    }

    console.log(`  ✓ Cliente criado (status: churn, pacote: ${pacote})`);
    console.log(`  Entrada: ${entradaISO} | Saída: ${dataSaida} | Meses: ${c.meses} | Motivo: ${motivo}`);
    return { sucesso: true, nome };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✗ ERRO: ${msg}`);
    return { sucesso: false, nome, erro: msg };
  }
}

// =============================================
// Rollback
// =============================================

async function rollback() {
  console.log("\n🔄 Buscando clientes LTV migrados via script...");
  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("id, nome")
    .like("observacoes", `%${MARCADOR}%`);

  if (error) { console.error("Erro:", error.message); process.exit(1); }
  if (!clientes || clientes.length === 0) { console.log("Nenhum encontrado."); process.exit(0); }

  console.log(`Encontrados ${clientes.length} clientes.`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const resp = await new Promise<string>((r) => rl.question(`Deletar ${clientes.length} clientes? (sim/não): `, r));
  rl.close();
  if (resp.toLowerCase() !== "sim") { console.log("Cancelado."); process.exit(0); }

  const ids = clientes.map((c) => c.id);
  await supabase.from("faturas").delete().in("cliente_id", ids);
  const { error: delErr } = await supabase.from("clientes").delete().in("id", ids);
  if (delErr) { console.error("Erro:", delErr.message); process.exit(1); }
  console.log(`✓ ${clientes.length} clientes deletados.`);
}

// =============================================
// Main
// =============================================

async function main() {
  const modo = process.argv[2];
  if (modo === "--rollback") { await rollback(); return; }
  if (modo !== "--test" && modo !== "--all") {
    console.error("Uso: npx tsx scripts/migrar-clientes-ltv.ts [--test | --all | --rollback]");
    process.exit(1);
  }

  const lista = modo === "--test" ? CLIENTES.slice(0, 1) : CLIENTES;
  const total = lista.length;
  console.log(`\n🚀 Migração LTV (${modo === "--test" ? "TESTE — 1 cliente" : `TODOS — ${total} clientes`})`);

  let sucessos = 0;
  let falhas = 0;
  const erros: { nome: string; erro: string }[] = [];

  for (let i = 0; i < lista.length; i++) {
    const res = await importarCliente(lista[i], i, total);
    if (res.sucesso) sucessos++;
    else { falhas++; erros.push({ nome: res.nome, erro: res.erro || "desconhecido" }); }
  }

  console.log("\n=== RESUMO ===");
  console.log(`Total: ${total} | Sucesso: ${sucessos} | Falhas: ${falhas}`);
  if (erros.length > 0) {
    console.log("\nFalhas:");
    for (const e of erros) console.log(`  - ${e.nome}: ${e.erro}`);
  }
  console.log();
}

main().catch(console.error);
