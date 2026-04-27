"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClienteForm } from "@/components/cliente-form";
import { ClienteFinanceiro } from "./cliente-financeiro";
import type { Cliente } from "@/types/cliente";
import type { Fatura } from "@/types/fatura";

interface ClienteTabsProps {
  cliente: Cliente;
  faturas: Fatura[];
  isAdmin: boolean;
}

export function ClienteTabs({ cliente, faturas, isAdmin }: ClienteTabsProps) {
  return (
    <Tabs defaultValue="dados">
      <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
        <TabsTrigger value="dados" className="text-xs data-[state=active]:bg-zinc-800">
          Dados do cliente
        </TabsTrigger>
        <TabsTrigger value="financeiro" className="text-xs data-[state=active]:bg-zinc-800">
          Financeiro
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dados">
        <ClienteForm cliente={cliente} isAdmin={isAdmin} />
      </TabsContent>
      <TabsContent value="financeiro">
        <ClienteFinanceiro faturas={faturas} moeda={cliente.moeda || "BRL"} />
      </TabsContent>
    </Tabs>
  );
}
