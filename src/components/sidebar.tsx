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
  ChevronRight,
  BookUser,
  History,
  BarChart3,
  Receipt,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
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

/** Itens futuros */
const menuFuturo = [
  { label: "Comercial", icon: TrendingUp },
  { label: "Operacional", icon: Briefcase },
  { label: "Equipe", icon: UserCog },
];

/** Subitens */
const subMenuDashboards = [
  { href: "/dashboards/clientes", label: "Clientes", icon: Users },
  { href: "/dashboards/ltv", label: "LTV", icon: History },
  { href: "/dashboards/financeiro", label: "Financeiro", icon: DollarSign },
];
const subMenuClientes = [
  { href: "/clientes", label: "Base de Clientes", icon: BookUser },
  { href: "/clientes/ltv", label: "LTV", icon: History },
];
const subMenuFinanceiro = [
  { href: "/financeiro/cobrancas", label: "Cobranças", icon: Receipt },
];

/** Classes do item ativo */
const ativoClasses =
  "bg-gradient-to-r from-[#E550A5]/10 via-zinc-900/50 to-transparent border-l-2 border-[#E550A5] text-white shadow-[inset_0_0_20px_rgba(229,80,165,0.08)]";
const inativoClasses =
  "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-white";

interface SidebarProps {
  nomeUsuario: string;
  emailUsuario: string;
}

export function Sidebar({ nomeUsuario, emailUsuario }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboardsAtivo = pathname.startsWith("/dashboards") || pathname === "/";
  const isClientesAtivo = pathname.startsWith("/clientes");
  const isFinanceiroAtivo = pathname.startsWith("/financeiro");
  const [dashboardsAberto, setDashboardsAberto] = useState(isDashboardsAtivo);
  const [clientesAberto, setClientesAberto] = useState(isClientesAtivo);
  const [financeiroAberto, setFinanceiroAberto] = useState(isFinanceiroAtivo);

  function isSubAtivo(
    href: string,
    basePath: string,
    allItems: { href: string }[]
  ) {
    if (href === basePath) {
      return (
        pathname === basePath ||
        (pathname.startsWith(basePath + "/") &&
          !allItems.some(
            (o) => o.href !== basePath && pathname.startsWith(o.href)
          ))
      );
    }
    return pathname.startsWith(href);
  }

  function renderSubItems(
    items: {
      href: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }[],
    basePath: string
  ) {
    return (
      <div className="mt-1 space-y-0.5 pl-5">
        {items.map((sub) => {
          const ativo = isSubAtivo(sub.href, basePath, items);
          return (
            <Link key={sub.href} href={sub.href}>
              <div
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer",
                  ativo ? ativoClasses : inativoClasses
                )}
              >
                <sub.icon
                  className={cn(
                    "h-3.5 w-3.5",
                    ativo ? "text-[#E550A5]" : "text-zinc-500"
                  )}
                />
                {sub.label}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#0A0A0F] border-r border-zinc-900/50">
      {/* Topo: Logo + marca */}
      <div className="px-5 pt-6 pb-5 border-b border-zinc-900/50">
        <Image
          src="/Logo_INSIDE-02.svg"
          alt="Inside"
          width={140}
          height={48}
          style={{ height: "48px", width: "auto" }}
          priority
        />
        <div className="mt-3">
          <p className="text-lg font-bold text-white leading-tight">Inside</p>
          <p
            className="text-xs font-medium bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #2D7CDB 0%, #7B3FC9 50%, #E550A5 100%)",
            }}
          >
            Sistema de Gestão
          </p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Menu
        </p>

        <div className="space-y-1">
          <TooltipProvider delay={0}>
            {/* Dashboards */}
            <Collapsible open={dashboardsAberto} onOpenChange={setDashboardsAberto}>
              <CollapsibleTrigger className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer", isDashboardsAtivo ? ativoClasses : inativoClasses)}>
                <LayoutDashboard className={cn("h-4 w-4", isDashboardsAtivo ? "text-[#E550A5]" : "text-zinc-500")} />
                Dashboards
                <ChevronRight className={cn("ml-auto h-3.5 w-3.5 transition-transform duration-200", dashboardsAberto && "rotate-90", isDashboardsAtivo ? "text-[#E550A5]" : "text-zinc-600")} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {renderSubItems(subMenuDashboards, "/dashboards")}
              </CollapsibleContent>
            </Collapsible>

            {/* Clientes */}
            <Collapsible open={clientesAberto} onOpenChange={setClientesAberto}>
              <CollapsibleTrigger className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer", isClientesAtivo ? ativoClasses : inativoClasses)}>
                <BookUser className={cn("h-4 w-4", isClientesAtivo ? "text-[#E550A5]" : "text-zinc-500")} />
                Clientes
                <ChevronRight className={cn("ml-auto h-3.5 w-3.5 transition-transform duration-200", clientesAberto && "rotate-90", isClientesAtivo ? "text-[#E550A5]" : "text-zinc-600")} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {renderSubItems(subMenuClientes, "/clientes")}
              </CollapsibleContent>
            </Collapsible>

            {/* Financeiro */}
            <Collapsible open={financeiroAberto} onOpenChange={setFinanceiroAberto}>
              <CollapsibleTrigger className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer", isFinanceiroAtivo ? ativoClasses : inativoClasses)}>
                <Receipt className={cn("h-4 w-4", isFinanceiroAtivo ? "text-[#E550A5]" : "text-zinc-500")} />
                Financeiro
                <ChevronRight className={cn("ml-auto h-3.5 w-3.5 transition-transform duration-200", financeiroAberto && "rotate-90", isFinanceiroAtivo ? "text-[#E550A5]" : "text-zinc-600")} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {renderSubItems(subMenuFinanceiro, "/financeiro")}
              </CollapsibleContent>
            </Collapsible>

            {/* Itens futuros */}
            {menuFuturo.map((item) => (
              <Tooltip key={item.label}>
                <TooltipTrigger render={<div />}>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-not-allowed text-zinc-700 border-l-2 border-transparent">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    <span className="ml-auto text-[9px] uppercase tracking-wider text-zinc-700 bg-zinc-900/50 px-1.5 py-0.5 rounded">
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
        </div>
      </nav>

      {/* Rodapé: usuário */}
      <div className="mt-auto border-t border-zinc-900/50 px-3 py-4 space-y-2">
        <div className="flex items-center gap-3 rounded-lg bg-zinc-900/30 px-3 py-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback
              className="text-sm font-bold text-white"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #2D7CDB 0%, #E550A5 100%)",
              }}
            >
              {nomeUsuario.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-white">{nomeUsuario}</span>
            <span className="text-[11px] text-zinc-500 truncate">
              {emailUsuario}
            </span>
          </div>
        </div>

        <button
          onClick={async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-white hover:bg-zinc-900/50 transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
