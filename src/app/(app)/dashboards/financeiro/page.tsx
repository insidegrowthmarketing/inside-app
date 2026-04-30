export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarMoeda, formatarData } from "@/lib/formatters";
import { GerarFaturasButton } from "@/app/(app)/financeiro/gerar-faturas-button";
import { FinanceiroCharts } from "@/app/(app)/financeiro/financeiro-charts";
import { AutoCuraToast } from "@/app/(app)/financeiro/auto-cura-toast";
import { autoCurarFaturas } from "@/app/(app)/financeiro/actions";
import type { Fatura } from "@/types/fatura";
import { ehAdmin } from "@/lib/permissoes";

export default async function DashboardFinanceiroPage() {
  const autoCura = await autoCurarFaturas();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = ehAdmin(user?.email);
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split("T")[0];
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split("T")[0];
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data: pendentesDoMes } = await supabase.from("faturas").select("valor, moeda").eq("status", "pendente").gte("data_vencimento", inicioMes).lte("data_vencimento", fimMes);
  const { data: atrasadas } = await supabase.from("faturas").select("*, clientes(nome, id)").eq("status", "pendente").lt("data_vencimento", hojeStr).order("data_vencimento", { ascending: true });
  const { data: venceHojeData } = await supabase.from("faturas").select("valor, moeda").eq("status", "pendente").eq("data_vencimento", hojeStr);
  const { data: venceHojeLista } = await supabase.from("faturas").select("*, clientes(nome, id)").eq("status", "pendente").eq("data_vencimento", hojeStr).order("valor", { ascending: false });
  const { data: pagasDoMes } = await supabase.from("faturas").select("valor, moeda").eq("status", "paga").gte("data_pagamento_real", inicioMes).lte("data_pagamento_real", fimMes);

  const dadosMensais: { mes: string; brl: number; usd: number }[] = [];
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const inicio = d.toISOString().split("T")[0];
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
    const { data: pagasMes } = await supabase.from("faturas").select("valor, moeda").eq("status", "paga").gte("data_pagamento_real", inicio).lte("data_pagamento_real", fim);
    const brl = (pagasMes ?? []).filter((f) => f.moeda === "BRL").reduce((acc, f) => acc + Number(f.valor), 0);
    const usd = (pagasMes ?? []).filter((f) => f.moeda === "USD").reduce((acc, f) => acc + Number(f.valor), 0);
    dadosMensais.push({ mes: `${meses[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`, brl, usd });
  }

  const aReceberBRL = (pendentesDoMes ?? []).filter((f) => f.moeda === "BRL").reduce((a, f) => a + Number(f.valor), 0);
  const aReceberUSD = (pendentesDoMes ?? []).filter((f) => f.moeda === "USD").reduce((a, f) => a + Number(f.valor), 0);
  const atrasadoBRL = (atrasadas ?? []).filter((f) => f.moeda === "BRL").reduce((a, f) => a + Number(f.valor), 0);
  const atrasadoUSD = (atrasadas ?? []).filter((f) => f.moeda === "USD").reduce((a, f) => a + Number(f.valor), 0);
  const recebidoBRL = (pagasDoMes ?? []).filter((f) => f.moeda === "BRL").reduce((a, f) => a + Number(f.valor), 0);
  const recebidoUSD = (pagasDoMes ?? []).filter((f) => f.moeda === "USD").reduce((a, f) => a + Number(f.valor), 0);
  const vhCount = venceHojeData?.length ?? 0;
  const vhBRL = (venceHojeData ?? []).filter((f) => f.moeda === "BRL").reduce((a, f) => a + Number(f.valor), 0);
  const vhUSD = (venceHojeData ?? []).filter((f) => f.moeda === "USD").reduce((a, f) => a + Number(f.valor), 0);
  const listaAtrasadas = (atrasadas ?? []) as (Fatura & { clientes: { nome: string; id: string } | null })[];

  return (
    <div className="space-y-6">
      <PageHeader titulo="Financeiro" subtitulo="Controle de cobranças e recebimentos">
        {isAdmin && <GerarFaturasButton />}
      </PageHeader>
      <AutoCuraToast faturasGeradas={autoCura.count} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">A receber (R$)</CardTitle><Clock className="h-4 w-4 text-zinc-600" /></CardHeader><CardContent><p className="text-xl font-semibold text-white">{formatarMoeda(aReceberBRL, "BRL")}</p></CardContent></Card>
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">A receber (US$)</CardTitle><Clock className="h-4 w-4 text-zinc-600" /></CardHeader><CardContent><p className="text-xl font-semibold text-white">{formatarMoeda(aReceberUSD, "USD")}</p></CardContent></Card>
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-normal text-red-400 uppercase tracking-wider">Atrasado (R$)</CardTitle><AlertTriangle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><p className="text-xl font-semibold text-red-400">{formatarMoeda(atrasadoBRL, "BRL")}</p></CardContent></Card>
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-normal text-red-400 uppercase tracking-wider">Atrasado (US$)</CardTitle><AlertTriangle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><p className="text-xl font-semibold text-red-400">{formatarMoeda(atrasadoUSD, "USD")}</p></CardContent></Card>
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Recebido (R$)</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><p className="text-xl font-semibold text-white">{formatarMoeda(recebidoBRL, "BRL")}</p></CardContent></Card>
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Recebido (US$)</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><p className="text-xl font-semibold text-white">{formatarMoeda(recebidoUSD, "USD")}</p></CardContent></Card>
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl border-l-4 border-l-yellow-500"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-normal text-yellow-400 uppercase tracking-wider">Vence hoje</CardTitle><Clock className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><p className="text-xl font-semibold text-yellow-400">{vhCount}</p><p className="mt-1 text-xs text-zinc-600">{vhBRL > 0 ? formatarMoeda(vhBRL, "BRL") : ""}{vhBRL > 0 && vhUSD > 0 ? " + " : ""}{vhUSD > 0 ? formatarMoeda(vhUSD, "USD") : ""}{vhCount === 0 ? "Nenhuma" : ""}</p></CardContent></Card>
      </div>
      <FinanceiroCharts dadosMensais={dadosMensais} />
      <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-red-400">Faturas atrasadas</CardTitle><Link href="/financeiro/cobrancas?status=atrasada"><Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white">Ver todas</Button></Link></CardHeader>
        <CardContent>
          {listaAtrasadas.length === 0 ? (<p className="py-6 text-center text-sm text-zinc-500">Nenhuma fatura atrasada</p>) : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-zinc-800 hover:bg-transparent"><TableHead className="text-zinc-400 whitespace-nowrap">Cliente</TableHead><TableHead className="text-zinc-400 whitespace-nowrap">Vencimento</TableHead><TableHead className="text-zinc-400 whitespace-nowrap">Dias atraso</TableHead><TableHead className="text-zinc-400 whitespace-nowrap">Valor</TableHead><TableHead className="text-zinc-400 whitespace-nowrap">Últ. cobrança</TableHead></TableRow></TableHeader>
            <TableBody>{listaAtrasadas.slice(0, 10).map((f) => { const venc = new Date(f.data_vencimento + "T00:00:00"); const diasAtraso = Math.ceil((hoje.getTime() - venc.getTime()) / 86400000); return (<TableRow key={f.id} className="border-zinc-800 hover:bg-zinc-800/50"><TableCell className="text-zinc-200 whitespace-nowrap font-medium"><Link href={`/financeiro/cobrancas?busca=${encodeURIComponent(f.clientes?.nome || "")}`} className="hover:underline">{f.clientes?.nome || "—"}</Link></TableCell><TableCell className="text-zinc-400 whitespace-nowrap">{formatarData(f.data_vencimento)}</TableCell><TableCell className="text-red-400 font-medium whitespace-nowrap">{diasAtraso}d</TableCell><TableCell className="text-zinc-300 whitespace-nowrap">{formatarMoeda(Number(f.valor), f.moeda)}</TableCell><TableCell className="text-zinc-500 whitespace-nowrap">{formatarData(f.ultima_cobranca_em)}</TableCell></TableRow>); })}</TableBody></Table></div>
          )}
        </CardContent>
      </Card>

      {/* Vencem hoje */}
      <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-yellow-400">Vencem hoje</CardTitle>
          <Link href="/financeiro/cobrancas?status=vence_hoje">
            <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white">Ver todas</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {(!venceHojeLista || venceHojeLista.length === 0) ? (
            <p className="py-6 text-center text-sm text-zinc-500">Nenhuma fatura vence hoje</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 whitespace-nowrap">Cliente</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">Vencimento</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">Valor</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">Pagamento</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">Últ. cobrança</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(venceHojeLista as (Fatura & { clientes: { nome: string; id: string } | null })[]).slice(0, 10).map((f) => (
                    <TableRow key={f.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="text-zinc-200 whitespace-nowrap font-medium">
                        <Link href={`/financeiro/cobrancas?busca=${encodeURIComponent(f.clientes?.nome || "")}`} className="hover:underline">{f.clientes?.nome || "—"}</Link>
                      </TableCell>
                      <TableCell className="text-zinc-400 whitespace-nowrap">{formatarData(f.data_vencimento)}</TableCell>
                      <TableCell className="text-zinc-300 whitespace-nowrap">{formatarMoeda(Number(f.valor), f.moeda)}</TableCell>
                      <TableCell className="text-zinc-400 whitespace-nowrap text-xs">{f.forma_pagamento || "—"}</TableCell>
                      <TableCell className="text-zinc-500 whitespace-nowrap">{formatarData(f.ultima_cobranca_em)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
