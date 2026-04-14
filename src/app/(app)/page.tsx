import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, DollarSign } from "lucide-react";

/** Cards de métricas do dashboard */
const metricas = [
  {
    titulo: "Total de clientes",
    valor: "0",
    icon: Users,
  },
  {
    titulo: "Clientes ativos",
    valor: "0",
    descricao: "Status: Ongoing",
    icon: UserCheck,
  },
  {
    titulo: "Em onboarding",
    valor: "0",
    icon: UserPlus,
  },
  {
    titulo: "MRR total",
    valor: "R$ 0,00",
    descricao: "Soma dos fees (ongoing)",
    icon: DollarSign,
  },
];

export default function DashboardPage() {
  return (
    <>
      <Header titulo="Dashboard" />

      <div className="space-y-6 p-6">
        {/* Cards de métricas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricas.map((m) => (
            <Card key={m.titulo} className="border-zinc-800 bg-zinc-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {m.titulo}
                </CardTitle>
                <m.icon className="h-4 w-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{m.valor}</p>
                {m.descricao && (
                  <p className="mt-1 text-xs text-zinc-500">{m.descricao}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Card de clientes recentes */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Clientes recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="py-8 text-center text-sm text-zinc-500">
              Nenhum cliente cadastrado ainda.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
