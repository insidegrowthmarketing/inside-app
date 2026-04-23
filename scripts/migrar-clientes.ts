/**
 * Script de migração de clientes do CSV para o Supabase.
 *
 * Uso:
 *   npx tsx scripts/migrar-clientes.ts --test      # importa só o 1o cliente
 *   npx tsx scripts/migrar-clientes.ts --all        # importa todos os 74
 *   npx tsx scripts/migrar-clientes.ts --rollback   # deleta clientes migrados
 */

import { config } from "dotenv";
import path from "path";

// Carrega .env.local (padrão do Next.js) em vez do .env padrão
config({ path: path.resolve(process.cwd(), ".env.local") });

import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import { createInterface } from "readline";

// =============================================
// Configuração do Supabase (service_role bypassa RLS)
// =============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "\n⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local.\n" +
    "Adicione a chave service_role do Supabase:\n" +
    "  1. Acesse o Supabase Dashboard → Project Settings → API\n" +
    "  2. Copie a service_role key (NÃO a anon key)\n" +
    "  3. Adicione no .env.local:\n" +
    "     SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui\n"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// =============================================
// Marcador para identificar clientes migrados
// =============================================

const MARCADOR = "[MIGRADO_VIA_SCRIPT]";
const HOJE = new Date().toISOString().split("T")[0];

// =============================================
// Mapeamentos
// =============================================

const MAPA_FORMA_PAGAMENTO: Record<string, string> = {
  "stripe brasil semanal": "Stripe Brasil semanal",
  "stripe brasil mensal": "Stripe Brasil mensal",
  "stripe eua semanal": "Stripe EUA semanal",
  "stripe eua mensal": "Stripe EUA mensal",
  "zelle semanal": "Zelle semanal",
  "zelle mensal": "Zelle mensal",
  "zelle quinzenal": "Zelle quinzenal",
  "transferência bofa": "Transferência BOFA quinzenal",
};

const MAPA_REGIAO: Record<string, string> = {
  "são francisco": "san_francisco_ca",
  "san francisco": "san_francisco_ca",
  "califórnia": "california",
  "carolina do sul": "south_carolina",
  "fort myers": "fort_myers_fl",
  "washington": "washington",
  "new jersey": "new_jersey",
  "orlando": "orlando_fl",
  "seattle": "seattle_wa",
  "freeport": "freeport_me",
  "atlanta": "atlanta_ga",
  "sarasota": "sarasota_fl",
  "delaware": "delaware",
  "pensilvânia": "pennsylvania",
  "boca raton": "boca_raton_fl",
  "massachusetts": "massachusetts",
  "connecticut": "connecticut",
  "draper": "draper_ut",
  "everett": "everett_wa",
  "clearwater": "clearwater_fl",
  "utah": "utah",
  "maryland": "maryland",
  "jacksonville": "jacksonville_fl",
  "charlotte": "charlotte_nc",
  "destin": "destin_fl",
  "flórida": "florida",
  "boston": "boston_ma",
  "north caroline": "north_carolina",
  "tampa, fl": "tampa_fl",
  "manchester": "manchester_nh",
  "pompano beach": "pompano_beach_fl",
};

const MAPA_DIA_SEMANA: Record<string, number> = {
  "domingo": 0,
  "segunda": 1,
  "terça": 2,
  "terca": 2,
  "quarta": 3,
  "quinta": 4,
  "sexta": 5,
  "sábado": 6,
  "sabado": 6,
};

// =============================================
// Funções auxiliares
// =============================================

function limparNome(raw: string): string {
  return raw.replace(/^EUA\s*-\s*/i, "").trim();
}

function parseFee(raw: string, nome: string): number {
  if (nome.toLowerCase().includes("quick plumbing")) return 125;
  const limpo = raw.replace(/[$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const num = Number(limpo);
  return isNaN(num) ? 0 : num;
}

function parseData(raw: string): string | null {
  if (!raw || !raw.trim()) return null;
  const partes = raw.trim().split("/");
  if (partes.length !== 3) return null;
  const [dd, mm, yy] = partes;
  const ano = Number(yy) < 100 ? 2000 + Number(yy) : Number(yy);
  return `${ano}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function mapearFormaPagamento(raw: string): string | null {
  const chave = raw.trim().toLowerCase();
  return MAPA_FORMA_PAGAMENTO[chave] ?? null;
}

function mapearRegiao(raw: string): string {
  const chave = raw.trim().toLowerCase();
  const valor = MAPA_REGIAO[chave];
  if (!valor) {
    console.log(`  ⚠️  REGIÃO NÃO MAPEADA: "${raw}" → usando "florida" como fallback`);
    return "florida";
  }
  return valor;
}

function getFrequencia(forma: string | null): "mensal" | "semanal" | "quinzenal" | null {
  if (!forma) return null;
  const f = forma.toLowerCase();
  if (f.includes("quinzenal")) return "quinzenal";
  if (f.includes("semanal")) return "semanal";
  if (f.includes("mensal")) return "mensal";
  return null;
}

function extrairDiaMes(texto: string): number | null {
  const match = texto.match(/todo\s+dia\s+(\d{1,2})/i);
  return match ? Number(match[1]) : null;
}

function extrairDiaSemana(texto: string): number | null {
  const lower = texto.toLowerCase();
  for (const [nome, valor] of Object.entries(MAPA_DIA_SEMANA)) {
    if (lower.includes(nome)) return valor;
  }
  return null;
}

function extrairDiasQuinzenal(texto: string): number[] | null {
  const match = texto.match(/dia\s+(\d{1,2})\s+e\s+(\d{1,2})/i);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

function extrairStatusEDataSaida(
  nome: string,
  obs: string
): { status: string; dataSaida: string | null } {
  // Trust Cleaning → onboarding
  if (nome.toLowerCase().includes("trust cleaning")) {
    return { status: "onboarding", dataSaida: null };
  }

  // Aviso prévio
  const avisoMatch = obs.match(/aviso\s+pr[eé]vio\s+at[eé]\s+(\d{1,2})\/(\d{1,2})/i);
  if (avisoMatch) {
    const [, dd, mm] = avisoMatch;
    const dataSaida = `2026-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    return { status: "aviso_previo", dataSaida };
  }

  return { status: "ongoing", dataSaida: null };
}

function extrairPacote(obs: string): "start" | "pro" {
  if (obs.toUpperCase().includes("APENAS ESTRUTURAÇÃO")) return "start";
  return "pro";
}

// =============================================
// Geração de faturas
// =============================================

interface ClienteDB {
  id: string;
  fee_mensal: number;
  moeda: string;
  forma_pagamento: string | null;
  data_pagamento: number | null;
  dia_semana_pagamento: number | null;
  dias_pagamento_quinzenal: number[] | null;
  status: string;
  data_saida: string | null;
  inicio_contrato: string | null;
}

async function gerarFaturasDoCliente(cliente: ClienteDB): Promise<number> {
  // Não gerar para onboarding
  if (cliente.status === "onboarding") return 0;

  const frequencia = getFrequencia(cliente.forma_pagamento);
  if (!frequencia) return 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataInicio = new Date(hoje);

  // Fim: data_saida (aviso prévio) ou +2 meses
  let dataFim: Date;
  if (cliente.status === "aviso_previo" && cliente.data_saida) {
    dataFim = new Date(cliente.data_saida + "T00:00:00");
  } else {
    dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 3, 0);
  }

  // Calcular valor por fatura
  const fee = Number(cliente.fee_mensal);
  let valor: number;
  if (frequencia === "mensal") valor = Math.round(fee * 100) / 100;
  else if (frequencia === "semanal") valor = Math.round((fee / 4) * 100) / 100;
  else valor = Math.round((fee / 2) * 100) / 100;

  // Gerar datas de vencimento
  const datas: Date[] = [];

  if (frequencia === "mensal") {
    const dia = cliente.data_pagamento || 1;
    const cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dia);
    if (cursor < dataInicio) cursor.setMonth(cursor.getMonth() + 1);
    while (cursor <= dataFim) {
      datas.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  if (frequencia === "semanal") {
    const diaSemana = cliente.dia_semana_pagamento ?? 1;
    const cursor = new Date(dataInicio);
    while (cursor.getDay() !== diaSemana) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor > dataFim) break;
    }
    while (cursor <= dataFim) {
      datas.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
  }

  if (frequencia === "quinzenal") {
    const dias = cliente.dias_pagamento_quinzenal || [1, 15];
    const cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
    while (cursor <= dataFim) {
      for (const dia of dias) {
        const d = new Date(cursor.getFullYear(), cursor.getMonth(), dia);
        if (d >= dataInicio && d <= dataFim) datas.push(d);
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
    datas.sort((a, b) => a.getTime() - b.getTime());
  }

  // Inserir faturas sem duplicar
  let count = 0;
  for (const data of datas) {
    const vencStr = data.toISOString().split("T")[0];
    const refStr = new Date(data.getFullYear(), data.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const { data: existente } = await supabase
      .from("faturas")
      .select("id")
      .eq("cliente_id", cliente.id)
      .eq("data_vencimento", vencStr)
      .limit(1);

    if (existente && existente.length > 0) continue;

    const { error } = await supabase.from("faturas").insert({
      cliente_id: cliente.id,
      data_referencia: refStr,
      data_vencimento: vencStr,
      valor,
      moeda: cliente.moeda || "USD",
      forma_pagamento: cliente.forma_pagamento,
    });

    if (!error) count++;
  }

  return count;
}

// =============================================
// Importação de um cliente
// =============================================

interface CSVRow {
  Cliente: string;
  "Valor mensal": string;
  "Forma pagamento": string;
  "Região": string;
  GP: string;
  Gestor: string;
  "Inicio Contrato": string;
  "Fim Contrato": string;
  OBS: string;
  "Responsável Financeiro": string;
  "Contato Financeiro": string;
  "Data de pagamento": string;
  "CRM?": string;
}

async function importarCliente(row: CSVRow, index: number, total: number) {
  const nome = limparNome(row.Cliente);
  console.log(`\n[${index + 1}/${total}] Importando: ${nome}`);

  try {
    const fee = parseFee(row["Valor mensal"], nome);
    const formaPagamento = mapearFormaPagamento(row["Forma pagamento"]);
    const fusoHorario = mapearRegiao(row["Região"] || "");
    const inicioContrato = parseData(row["Inicio Contrato"]);
    const fimContrato = parseData(row["Fim Contrato"]);
    const frequencia = getFrequencia(formaPagamento);

    const { status, dataSaida } = extrairStatusEDataSaida(nome, row.OBS || "");
    const pacote = extrairPacote(row.OBS || "");

    // Gestores
    let gestorProjetos = (row.GP || "").trim();
    if (gestorProjetos === "Sérgio") gestorProjetos = "Sergio";

    const gestorTrafego = (row.Gestor || "").trim();

    // Contempla GHL
    const contemplaGhl = (row["CRM?"] || "").trim().toLowerCase() === "sim";

    // Campos de dia de pagamento
    let dataPagamento: number | null = null;
    let diaSemanaPagamento: number | null = null;
    let diasPagamentoQuinzenal: number[] | null = null;

    const dpTexto = row["Data de pagamento"] || "";

    if (frequencia === "mensal") {
      dataPagamento = extrairDiaMes(dpTexto);
      if (!dataPagamento && inicioContrato) {
        dataPagamento = new Date(inicioContrato + "T00:00:00").getDate();
      }
    } else if (frequencia === "semanal") {
      diaSemanaPagamento = extrairDiaSemana(dpTexto);
      if (diaSemanaPagamento === null && inicioContrato) {
        diaSemanaPagamento = new Date(inicioContrato + "T00:00:00").getDay();
      }
    } else if (frequencia === "quinzenal") {
      diasPagamentoQuinzenal = extrairDiasQuinzenal(dpTexto);
      if (!diasPagamentoQuinzenal) diasPagamentoQuinzenal = [1, 15];
    }

    // Observações
    const obsPartes = [`${MARCADOR} ${HOJE}`];
    const obsOriginal = (row.OBS || "").trim();
    // Não repetir "aviso prévio" pois já está no status
    if (obsOriginal && !obsOriginal.match(/^aviso\s+pr[eé]vio/i)) {
      obsPartes.push(`OBS original: ${obsOriginal}`);
    }
    if (row["Responsável Financeiro"]?.trim()) {
      obsPartes.push(`Responsável financeiro: ${row["Responsável Financeiro"].trim()}`);
    }
    if (row["Contato Financeiro"]?.trim()) {
      obsPartes.push(`Contato financeiro: ${row["Contato Financeiro"].trim()}`);
    }

    const dados = {
      nome,
      fee_mensal: fee,
      moeda: "USD" as const,
      forma_pagamento: formaPagamento,
      fuso_horario: fusoHorario,
      gestor_projetos: gestorProjetos || null,
      gestor_trafego: gestorTrafego || null,
      inicio_contrato: inicioContrato,
      fim_contrato: fimContrato,
      status,
      pacote,
      contempla_ghl: contemplaGhl,
      data_pagamento: dataPagamento,
      dia_semana_pagamento: diaSemanaPagamento,
      dias_pagamento_quinzenal: diasPagamentoQuinzenal,
      data_saida: dataSaida,
      motivo_churn: null,
      responsavel_financeiro: row["Responsável Financeiro"]?.trim() || null,
      contato_financeiro: row["Contato Financeiro"]?.trim() || null,
      observacoes: obsPartes.join("\n"),
    };

    const { data: inserted, error } = await supabase
      .from("clientes")
      .insert(dados)
      .select("id, fee_mensal, moeda, forma_pagamento, data_pagamento, dia_semana_pagamento, dias_pagamento_quinzenal, status, data_saida, inicio_contrato")
      .single();

    if (error || !inserted) {
      console.log(`  ✗ ERRO ao inserir: ${error?.message || "sem dados retornados"}`);
      return { sucesso: false, faturas: 0, nome, erro: error?.message || "insert falhou" };
    }

    const statusLabel = status === "aviso_previo" ? `aviso_previo até ${dataSaida}` : status;
    console.log(`  ✓ Cliente criado (status: ${statusLabel}, pacote: ${pacote})`);

    // Gerar faturas — pular Stripe (aguardando integração) e onboarding
    const ehStripe = formaPagamento?.toLowerCase().startsWith("stripe");

    if (ehStripe) {
      console.log(`  ⊘ Faturas não geradas (Stripe — aguardando integração)`);
      return { sucesso: true, faturas: 0, nome, semFatura: true };
    }

    if (status === "onboarding") {
      console.log(`  ⊘ Faturas não geradas (cliente em onboarding)`);
      return { sucesso: true, faturas: 0, nome, semFatura: true };
    }

    const numFaturas = await gerarFaturasDoCliente(inserted as ClienteDB);
    console.log(`  ✓ ${numFaturas} faturas geradas`);

    return { sucesso: true, faturas: numFaturas, nome, semFatura: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✗ ERRO: ${msg}`);
    return { sucesso: false, faturas: 0, nome, erro: msg, semFatura: false };
  }
}

// =============================================
// Rollback
// =============================================

async function rollback() {
  console.log("\n🔄 Buscando clientes migrados via script...");

  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("id, nome")
    .like("observacoes", `%${MARCADOR}%`);

  if (error) {
    console.error("Erro ao buscar:", error.message);
    process.exit(1);
  }

  if (!clientes || clientes.length === 0) {
    console.log("Nenhum cliente migrado encontrado.");
    process.exit(0);
  }

  console.log(`Encontrados ${clientes.length} clientes migrados.`);

  // Confirmação interativa
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const resposta = await new Promise<string>((resolve) => {
    rl.question(`Tem certeza que deseja deletar ${clientes.length} clientes? (sim/não): `, resolve);
  });
  rl.close();

  if (resposta.toLowerCase() !== "sim") {
    console.log("Rollback cancelado.");
    process.exit(0);
  }

  // Deletar faturas primeiro (cascade cuida, mas por segurança)
  for (const c of clientes) {
    await supabase.from("faturas").delete().eq("cliente_id", c.id);
  }

  const ids = clientes.map((c) => c.id);
  const { error: delError } = await supabase.from("clientes").delete().in("id", ids);

  if (delError) {
    console.error("Erro ao deletar:", delError.message);
    process.exit(1);
  }

  console.log(`✓ ${clientes.length} clientes deletados com sucesso.`);
}

// =============================================
// Main
// =============================================

async function main() {
  const args = process.argv.slice(2);
  const modo = args[0];

  if (modo === "--rollback") {
    await rollback();
    return;
  }

  if (modo !== "--test" && modo !== "--all") {
    console.error("Uso: npx tsx scripts/migrar-clientes.ts [--test | --all | --rollback]");
    process.exit(1);
  }

  // Ler CSV
  const csvContent = readFileSync("scripts/clientes.csv", "utf-8");
  const rows: CSVRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const linhas = modo === "--test" ? rows.slice(0, 1) : rows;
  const total = linhas.length;

  console.log(`\n🚀 Iniciando migração (${modo === "--test" ? "TESTE — 1 cliente" : `TODOS — ${total} clientes`})`);
  console.log(`   Marcador: ${MARCADOR} ${HOJE}\n`);

  let sucessos = 0;
  let falhas = 0;
  let totalFaturas = 0;
  let comFaturas = 0;
  let semFaturas = 0;
  const erros: { nome: string; erro: string }[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const resultado = await importarCliente(linhas[i], i, total);
    if (resultado.sucesso) {
      sucessos++;
      totalFaturas += resultado.faturas;
      if (resultado.semFatura) semFaturas++;
      else comFaturas++;
    } else {
      falhas++;
      erros.push({ nome: resultado.nome, erro: resultado.erro || "desconhecido" });
    }
  }

  // Resumo
  console.log("\n=== RESUMO DA MIGRAÇÃO ===");
  console.log(`Total processado: ${total}`);
  console.log(`Sucesso: ${sucessos}`);
  console.log(`  Com faturas geradas: ${comFaturas} (Zelle/BOFA)`);
  console.log(`  Sem faturas: ${semFaturas} (Stripe + onboarding)`);
  console.log(`Falhas: ${falhas}`);
  console.log(`Faturas geradas: ${totalFaturas}`);

  if (erros.length > 0) {
    console.log("\nClientes com falha:");
    for (const e of erros) {
      console.log(`  - ${e.nome}: ${e.erro}`);
    }
  }

  console.log();
}

main().catch(console.error);
