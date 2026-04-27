/**
 * Script de convite em massa de usuários via Supabase Auth Admin API.
 *
 * Uso:
 *   npx tsx scripts/convidar-usuarios.ts --test   # convida só o 1o email
 *   npx tsx scripts/convidar-usuarios.ts --all    # convida todos os 19
 */

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("\n⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local.\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const REDIRECT_URL = "https://inside-app-git-main-inside-growth-marketing.vercel.app/auth/confirm";

const EMAILS_PARA_CONVIDAR = [
  "lkgoulart@hotmail.com",
  "rodrigobentolimma@gmail.com",
  "gsoaris215@gmail.com",
  "samaralimadomkt@gmail.com",
  "Suport.jlstore@gmail.com",
  "a.luiza.inside@gmail.com",
  "gabriela.gpinside@gmail.com",
  "contatosergiogaldino@gmail.com",
  "brunanunes.inside@gmail.com",
  "alineharo.inside@gmail.com",
  "barbara.mg.nunes@gmail.com",
  "caua.inside@gmail.com",
  "stephanieester.inside@gmail.com",
  "cassio.inside@gmail.com",
  "alyciainside@gmail.com",
  "taisborges388@gmail.com",
  "Comercial@insidetrafegopago.com",
  "lucasabreu.inside@gmail.com",
  "gustavo.menezes@insidetrafegopago.com",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function convidarEmail(email: string, index: number, total: number): Promise<"enviado" | "existe" | "erro"> {
  console.log(`\n[${index + 1}/${total}] Convidando: ${email}`);

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: REDIRECT_URL,
    });

    if (!error) {
      console.log("  ✓ Convite enviado");
      return "enviado";
    }

    // Usuário já existe
    if (error.message.includes("already been registered") || error.message.includes("already exists")) {
      console.log("  ⚠ [JÁ EXISTE] usuário pulado");
      return "existe";
    }

    // Rate limit — esperar e retentar
    if (error.message.includes("rate") || error.status === 429) {
      console.log(`  ⏳ Rate limit, aguardando 2s (tentativa ${tentativa + 1}/3)...`);
      await sleep(2000);
      continue;
    }

    // Outro erro
    console.log(`  ✗ ERRO: ${error.message}`);
    return "erro";
  }

  console.log("  ✗ ERRO: rate limit persistente após 3 tentativas");
  return "erro";
}

async function main() {
  const modo = process.argv[2];

  if (modo !== "--test" && modo !== "--all") {
    console.error("Uso: npx tsx scripts/convidar-usuarios.ts [--test | --all]");
    process.exit(1);
  }

  const lista = modo === "--test" ? EMAILS_PARA_CONVIDAR.slice(0, 1) : EMAILS_PARA_CONVIDAR;
  const total = lista.length;

  console.log(`\n🚀 Convidando usuários (${modo === "--test" ? "TESTE — 1 email" : `TODOS — ${total} emails`})`);
  console.log(`   Redirect: ${REDIRECT_URL}\n`);

  let enviados = 0;
  let existentes = 0;
  let falhas = 0;

  for (let i = 0; i < lista.length; i++) {
    const resultado = await convidarEmail(lista[i], i, total);
    if (resultado === "enviado") enviados++;
    else if (resultado === "existe") existentes++;
    else falhas++;

    // Delay entre chamadas
    if (i < lista.length - 1) await sleep(300);
  }

  console.log("\n=== RESUMO ===");
  console.log(`Total: ${total}`);
  console.log(`Convites enviados: ${enviados}`);
  console.log(`Já existentes (pulados): ${existentes}`);
  console.log(`Falhas: ${falhas}`);
  console.log();
}

main().catch(console.error);
