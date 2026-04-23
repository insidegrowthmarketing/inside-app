/**
 * Script de migração dos 4 clientes BRL (Brasil) para o Supabase.
 *
 * Uso:
 *   npx tsx scripts/migrar-clientes-brl.ts --test      # importa só o 1o
 *   npx tsx scripts/migrar-clientes-brl.ts --all        # importa todos os 4
 *   npx tsx scripts/migrar-clientes-brl.ts --rollback   # deleta os importados
 */

import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "readline";

// =============================================
// Configuração
// =============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "\n⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local.\n" +
    "Adicione a chave service_role do Supabase e rode novamente.\n"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const MARCADOR = "[MIGRADO_VIA_SCRIPT_BRL]";
const HOJE = new Date().toISOString().split("T")[0];

// =============================================
// Dados dos 4 clientes BRL
// =============================================

interface ClienteBRL {
  nome: string;
  fee_mensal: number;
  moeda: string;
  forma_pagamento: string;
  status: string;
  pacote: string;
  gestor_projetos: string;
  gestor_trafego: string;
  inicio_contrato: string;
  fim_contrato: string | null;
  data_saida?: string | null;
  motivo_churn?: string | null;
  data_pagamento: number | null;
  dia_semana_pagamento: number | null;
  dias_pagamento_quinzenal: number[] | null;
  fuso_horario: string;
  responsavel_financeiro: string | null;
  contato_financeiro: string | null;
  contempla_ghl: boolean;
  observacoes: string;
}

const CLIENTES_BRL: ClienteBRL[] = [
  {
    nome: "Lojão das Telhas",
    fee_mensal: 1340.00,
    moeda: "BRL",
    forma_pagamento: "ASAAS",
    status: "ongoing",
    pacote: "pro",
    gestor_projetos: "Bruna",
    gestor_trafego: "Samara",
    inicio_contrato: "2021-02-02",
    fim_contrato: null,
    data_pagamento: 24,
    dia_semana_pagamento: null,
    dias_pagamento_quinzenal: null,
    fuso_horario: "brasilia_df",
    responsavel_financeiro: "Leonardo",
    contato_financeiro: "85 9957-6353",
    contempla_ghl: false,
    observacoes: "[MIGRADO_VIA_SCRIPT_BRL] 2026-04-23",
  },
  {
    nome: "4OBRA",
    fee_mensal: 1500.00,
    moeda: "BRL",
    forma_pagamento: "ASAAS",
    status: "ongoing",
    pacote: "pro",
    gestor_projetos: "Sergio",
    gestor_trafego: "Caio",
    inicio_contrato: "2024-07-05",
    fim_contrato: null,
    data_pagamento: 5,
    dia_semana_pagamento: null,
    dias_pagamento_quinzenal: null,
    fuso_horario: "brasilia_df",
    responsavel_financeiro: "Amanda Chyoshi",
    contato_financeiro: "11 99302-5071",
    contempla_ghl: false,
    observacoes: "[MIGRADO_VIA_SCRIPT_BRL] 2026-04-23",
  },
  {
    nome: "Dra Ingrid Serafim",
    fee_mensal: 3000.00,
    moeda: "BRL",
    forma_pagamento: "ASAAS",
    status: "aviso_previo",
    pacote: "pro",
    gestor_projetos: "Aline",
    gestor_trafego: "Ana Luiza",
    inicio_contrato: "2024-07-26",
    fim_contrato: null,
    data_saida: "2026-04-30",
    motivo_churn: null,
    data_pagamento: 1,
    dia_semana_pagamento: null,
    dias_pagamento_quinzenal: null,
    fuso_horario: "brasilia_df",
    responsavel_financeiro: "Ingrid Serafim",
    contato_financeiro: "85 9651-5144",
    contempla_ghl: false,
    observacoes: "[MIGRADO_VIA_SCRIPT_BRL] 2026-04-23\nAviso prévio até 30/04/2026",
  },
  {
    nome: "Móveis ARCH Design",
    fee_mensal: 2000.00,
    moeda: "BRL",
    forma_pagamento: "ASAAS",
    status: "ongoing",
    pacote: "pro",
    gestor_projetos: "Aline",
    gestor_trafego: "Ana Luiza",
    inicio_contrato: "2025-03-26",
    fim_contrato: null,
    data_pagamento: 28,
    dia_semana_pagamento: null,
    dias_pagamento_quinzenal: null,
    fuso_horario: "brasilia_df",
    responsavel_financeiro: "Rafael",
    contato_financeiro: "11 99130-5335",
    contempla_ghl: false,
    observacoes: "[MIGRADO_VIA_SCRIPT_BRL] 2026-04-23",
  },
];

// =============================================
// Importação
// =============================================

async function importarCliente(cliente: ClienteBRL, index: number, total: number) {
  console.log(`\n[${index + 1}/${total}] Importando: ${cliente.nome}`);

  try {
    const dados = {
      nome: cliente.nome,
      fee_mensal: cliente.fee_mensal,
      moeda: cliente.moeda,
      forma_pagamento: cliente.forma_pagamento,
      fuso_horario: cliente.fuso_horario,
      gestor_projetos: cliente.gestor_projetos,
      gestor_trafego: cliente.gestor_trafego,
      inicio_contrato: cliente.inicio_contrato,
      fim_contrato: cliente.fim_contrato,
      status: cliente.status,
      pacote: cliente.pacote,
      contempla_ghl: cliente.contempla_ghl,
      data_pagamento: cliente.data_pagamento,
      dia_semana_pagamento: cliente.dia_semana_pagamento,
      dias_pagamento_quinzenal: cliente.dias_pagamento_quinzenal,
      data_saida: cliente.data_saida ?? null,
      motivo_churn: cliente.motivo_churn ?? null,
      responsavel_financeiro: cliente.responsavel_financeiro,
      contato_financeiro: cliente.contato_financeiro,
      observacoes: cliente.observacoes,
    };

    const { error } = await supabase.from("clientes").insert(dados);

    if (error) {
      console.log(`  ✗ ERRO: ${error.message}`);
      return { sucesso: false, nome: cliente.nome, erro: error.message };
    }

    console.log(`  ✓ Cliente criado (status: ${cliente.status}, pacote: ${cliente.pacote})`);
    console.log(`  ⊘ Faturas não geradas (ASAAS — aguardando integração)`);

    return { sucesso: true, nome: cliente.nome };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✗ ERRO: ${msg}`);
    return { sucesso: false, nome: cliente.nome, erro: msg };
  }
}

// =============================================
// Rollback
// =============================================

async function rollback() {
  console.log("\n🔄 Buscando clientes BRL migrados via script...");

  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("id, nome")
    .like("observacoes", `%${MARCADOR}%`);

  if (error) {
    console.error("Erro ao buscar:", error.message);
    process.exit(1);
  }

  if (!clientes || clientes.length === 0) {
    console.log("Nenhum cliente BRL migrado encontrado.");
    process.exit(0);
  }

  console.log(`Encontrados ${clientes.length} clientes.`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const resposta = await new Promise<string>((resolve) => {
    rl.question(`Deletar ${clientes.length} clientes? (sim/não): `, resolve);
  });
  rl.close();

  if (resposta.toLowerCase() !== "sim") {
    console.log("Rollback cancelado.");
    process.exit(0);
  }

  const ids = clientes.map((c) => c.id);
  await supabase.from("faturas").delete().in("cliente_id", ids);
  const { error: delError } = await supabase.from("clientes").delete().in("id", ids);

  if (delError) {
    console.error("Erro ao deletar:", delError.message);
    process.exit(1);
  }

  console.log(`✓ ${clientes.length} clientes deletados.`);
}

// =============================================
// Main
// =============================================

async function main() {
  const modo = process.argv[2];

  if (modo === "--rollback") {
    await rollback();
    return;
  }

  if (modo !== "--test" && modo !== "--all") {
    console.error("Uso: npx tsx scripts/migrar-clientes-brl.ts [--test | --all | --rollback]");
    process.exit(1);
  }

  const lista = modo === "--test" ? CLIENTES_BRL.slice(0, 1) : CLIENTES_BRL;
  const total = lista.length;

  console.log(`\n🚀 Migração BRL (${modo === "--test" ? "TESTE — 1 cliente" : `TODOS — ${total} clientes`})`);
  console.log(`   Marcador: ${MARCADOR} ${HOJE}\n`);

  let sucessos = 0;
  let falhas = 0;
  const erros: { nome: string; erro: string }[] = [];

  for (let i = 0; i < lista.length; i++) {
    const res = await importarCliente(lista[i], i, total);
    if (res.sucesso) {
      sucessos++;
    } else {
      falhas++;
      erros.push({ nome: res.nome, erro: res.erro || "desconhecido" });
    }
  }

  console.log("\n=== RESUMO ===");
  console.log(`Total: ${total}`);
  console.log(`Sucesso: ${sucessos}`);
  console.log(`Falhas: ${falhas}`);
  console.log(`Faturas: 0 (ASAAS — integração futura)`);

  if (erros.length > 0) {
    console.log("\nFalhas:");
    for (const e of erros) console.log(`  - ${e.nome}: ${e.erro}`);
  }

  console.log();
}

main().catch(console.error);
