"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingUp,
  Briefcase,
  UserCog,
  ChevronDown,
  BookUser,
  History,
  BarChart3,
  Receipt,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/** Itens futuros do menu */
const menuFuturo = [
  { href: "#", label: "Comercial", icon: TrendingUp },
  { href: "#", label: "Operacional", icon: Briefcase },
  { href: "#", label: "Equipe", icon: UserCog },
];

/** Subitens de Clientes */
const subMenuClientes = [
  { href: "/clientes", label: "Base de Clientes", icon: BookUser },
  { href: "/clientes/ltv", label: "LTV", icon: History },
];

/** Subitens de Financeiro */
const subMenuFinanceiro = [
  { href: "/financeiro", label: "Dashboard", icon: BarChart3 },
  { href: "/financeiro/cobrancas", label: "Cobranças", icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();
  const isClientesAtivo = pathname.startsWith("/clientes");
  const isFinanceiroAtivo = pathname.startsWith("/financeiro");
  const [clientesAberto, setClientesAberto] = useState(isClientesAtivo);
  const [financeiroAberto, setFinanceiroAberto] = useState(isFinanceiroAtivo);

  function renderSubMenu(
    items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[],
    basePath: string
  ) {
    return (
      <div className="ml-4 mt-1 space-y-1 border-l border-zinc-800 pl-3">
        {items.map((sub) => {
          const isSubAtivo =
            sub.href === basePath
              ? pathname === basePath || (pathname.startsWith(basePath + "/") && !items.some((o) => o.href !== basePath && pathname.startsWith(o.href)))
              : pathname.startsWith(sub.href);
          return (
            <Link key={sub.href} href={sub.href}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  isSubAtivo
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                )}
              >
                <sub.icon className="h-3.5 w-3.5" />
                {sub.label}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex items-center justify-center border-b border-zinc-800 px-5 py-5">
        <Image
          src="/Logo_INSIDE-02.svg"
          alt="Inside"
          width={160}
          height={64}
          style={{ height: "64px", width: "auto" }}
          priority
        />
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <TooltipProvider delay={0}>
          {/* Dashboard */}
          <Link href="/">
            <div
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </div>
          </Link>

          {/* Clientes */}
          <Collapsible open={clientesAberto} onOpenChange={setClientesAberto}>
            <CollapsibleTrigger
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isClientesAtivo ? "text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              <Users className="h-4 w-4" />
              Clientes
              <ChevronDown className="ml-auto h-3 w-3 transition-transform [[data-panel-open]_&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {renderSubMenu(subMenuClientes, "/clientes")}
            </CollapsibleContent>
          </Collapsible>

          {/* Financeiro */}
          <Collapsible open={financeiroAberto} onOpenChange={setFinanceiroAberto}>
            <CollapsibleTrigger
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isFinanceiroAtivo ? "text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              <DollarSign className="h-4 w-4" />
              Financeiro
              <ChevronDown className="ml-auto h-3 w-3 transition-transform [[data-panel-open]_&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {renderSubMenu(subMenuFinanceiro, "/financeiro")}
            </CollapsibleContent>
          </Collapsible>

          {/* Itens futuros */}
          {menuFuturo.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger render={<div />}>
                <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-not-allowed text-zinc-600">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-600">
                    Em breve
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Em breve</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      {/* Rodapé */}
      <div className="border-t border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300">JP</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-200">Jéssica</span>
            <span className="text-xs text-zinc-500">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
