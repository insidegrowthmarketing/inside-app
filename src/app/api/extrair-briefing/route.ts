import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import PDFParser from "pdf2json";

/** Extrai texto bruto de um buffer PDF usando pdf2json */
async function extrairTextoDoPdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parser = new (PDFParser as any)(null, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser.on("pdfParser_dataError", (err: any) => reject(err.parserError));
    parser.on("pdfParser_dataReady", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = (parser as any).getRawTextContent();
      resolve(text);
    });
    parser.parseBuffer(buffer);
  });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY não configurada");
    return NextResponse.json(
      { error: "Configuração da API não encontrada" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const arquivo = formData.get("pdf") as File | null;

    if (!arquivo) {
      return NextResponse.json(
        { error: "Nenhum arquivo PDF enviado" },
        { status: 400 }
      );
    }

    // Extrair texto do PDF
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const textoPdf = await extrairTextoDoPdf(buffer);

    if (!textoPdf || textoPdf.trim().length === 0) {
      return NextResponse.json(
        { error: "Não foi possível extrair texto do PDF. O arquivo pode estar vazio ou ser uma imagem escaneada." },
        { status: 400 }
      );
    }

    // Chamar API da Anthropic
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Você é um assistente que extrai dados de briefings comerciais de uma agência de tráfego pago chamada Inside.

Leia o briefing abaixo e retorne APENAS um JSON válido (sem markdown, sem explicações) com os seguintes campos:

{
  "nome": "Nome da empresa (sem prefixos como 'EUA -')",
  "responsavel_financeiro": "Nome do responsável/CEO",
  "contato_financeiro": "Telefone/contato",
  "fuso_horario_value": "value interno: orlando_fl, boston_ma, massachusetts, etc. Baseie-se na cidade detectada. Se for Brasil: brasilia_df",
  "inicio_contrato": "Data de início no formato AAAA-MM-DD",
  "fee_mensal": número (só o valor mensal, sem $),
  "moeda": "USD" ou "BRL",
  "forma_pagamento": "uma das seguintes EXATAS: Stripe Brasil mensal, Stripe Brasil semanal, Stripe EUA mensal, Stripe EUA semanal, Transferência BOFA quinzenal, Zelle mensal, Zelle quinzenal, Zelle semanal, ASAAS",
  "gestor_projetos": "Nome do gestor de projetos ou 'Account'",
  "gestor_trafego": "Nome do gestor de tráfego",
  "head": "Caio ou Jean (se mencionado), ou null",
  "status": "onboarding",
  "pacote": "pro se tem tráfego/ads no escopo, start se não tem",
  "contempla_ghl": true ou false (se o briefing menciona CRM/GHL contemplado),
  "data_pagamento": número 1-31 se mensal, senão null,
  "dia_semana_pagamento": número 0-6 se semanal, senão null,
  "dias_pagamento_quinzenal": [num, num] se quinzenal, senão null,
  "observacoes": "Resumo breve do contexto, objetivos e pontos de atenção do cliente (máximo 500 caracteres). Inclua informações relevantes como setor, histórico, status operacional atual, desafios identificados. NÃO inclua dados que já estão em outros campos."
}

Regras importantes:
- REGRAS DE FORMA DE PAGAMENTO (Stripe):
  1. Procure no briefing menções literais: 'Stripe Brasil', 'Stripe BRA', 'Stripe BR' → começa com 'Stripe Brasil'. 'Stripe EUA', 'Stripe USA', 'Stripe US' → começa com 'Stripe EUA'.
  2. Se NÃO especificar Brasil/EUA: moeda BRL → 'Stripe Brasil', moeda USD → 'Stripe EUA'.
  3. Frequência: se menciona valor semanal ou 'semanal' → '... semanal', senão → '... mensal'.
- Se mencionar ZELLE → identifique mensal/semanal/quinzenal pelo contexto
- Se mencionar ASAAS → use "ASAAS"
- Se não conseguir identificar um campo com certeza, retorne null
- Pacote: "pro" se o escopo menciona "tráfego", "ads", "anúncios"; "start" caso contrário
- REGRA ESPECIAL: o campo status DEVE SEMPRE ser "onboarding" quando extraído de um briefing, porque representa um cliente novo começando a relação com a agência. Nunca retorne "ongoing" para esse campo.

REGRA CRÍTICA para fuso_horario_value:
1. Leia a cidade mencionada no briefing (campo 'País / Cidade / Fuso' ou similar).
2. Se a cidade EXATA estiver nesta lista, use o value correspondente:
   Atlanta, GA → atlanta_ga | Boca Raton, FL → boca_raton_fl | Boston, MA → boston_ma | Charlotte, NC → charlotte_nc | Clearwater, FL → clearwater_fl | Destin, FL → destin_fl | Draper, UT → draper_ut | Everett, WA → everett_wa | Fort Myers, FL → fort_myers_fl | Freeport, ME → freeport_me | Gloucester, MA → gloucester_ma | Jacksonville, FL → jacksonville_fl | Jacksonville, NC → jacksonville_nc | Manchester, NH → manchester_nh | Orlando, FL → orlando_fl | Pompano Beach, FL → pompano_beach_fl | San Francisco, CA → san_francisco_ca | Sarasota, FL → sarasota_fl | Seattle, WA → seattle_wa | Tampa, FL → tampa_fl
3. Se a cidade NÃO estiver na lista acima, use o ESTADO genérico:
   MA → massachusetts | NJ → new_jersey | CT → connecticut | FL → florida | CA → california | PA → pennsylvania | SC → south_carolina | NC → north_carolina | DE → delaware | MD → maryland | UT → utah | WA → washington | Brasil → brasilia_df
4. NUNCA substitua uma cidade por outra cidade próxima. Se "Gloucester, MA" está na lista, use gloucester_ma. Se NÃO estivesse, use massachusetts (genérico), NUNCA boston_ma.
5. Em caso de dúvida, prefira SEMPRE o genérico estadual.

BRIEFING:
${textoPdf}

---

IMPORTANTE: Retorne APENAS o JSON válido, SEM blocos de markdown (sem \`\`\`json e sem \`\`\`). Apenas o objeto JSON direto começando com { e terminando com }.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    // Extrair texto da resposta
    const respostaTexto =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Limpar markdown se o modelo envolveu em ```json ... ```
    const respostaLimpa = respostaTexto
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    // Parsear JSON com tratamento de erro
    try {
      const dados = JSON.parse(respostaLimpa);
      // Força status onboarding para cliente novo via briefing
      dados.status = "onboarding";
      return NextResponse.json({ dados });
    } catch (parseErr) {
      console.error("Erro ao parsear JSON da Anthropic:", parseErr);
      console.error("Resposta recebida:", respostaTexto);
      return NextResponse.json(
        { error: "Resposta da IA em formato inválido. Tente novamente." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Erro ao extrair briefing:", err);
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
