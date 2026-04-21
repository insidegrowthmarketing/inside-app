"use client";

import Link from "next/link";
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

/** Itens simples do menu */
const menuSimples = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, ativo: true },
];

/** Itens futuros do menu */
const menuFuturo = [
  { href: "#", label: "Financeiro", icon: DollarSign, ativo: false },
  { href: "#", label: "Comercial", icon: TrendingUp, ativo: false },
  { href: "#", label: "Operacional", icon: Briefcase, ativo: false },
  { href: "#", label: "Equipe", icon: UserCog, ativo: false },
];

/** Subitens de Clientes */
const subMenuClientes = [
  { href: "/clientes", label: "Base de Clientes", icon: BookUser },
  { href: "/clientes/ltv", label: "LTV", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const isClientesAtivo = pathname.startsWith("/clientes");

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-14 items-center px-5 border-b border-zinc-800">
        <span className="text-lg font-bold tracking-tight text-white">
          Inside
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <TooltipProvider delay={0}>
          {/* Dashboard */}
          {menuSimples.map((item) => {
            const isAtivo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.label} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isAtivo
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}

          {/* Clientes - menu expansível */}
          <Collapsible defaultOpen={isClientesAtivo}>
            <CollapsibleTrigger
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isClientesAtivo
                  ? "text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              <Users className="h-4 w-4" />
              Clientes
              <ChevronDown className="ml-auto h-3 w-3 transition-transform [[data-panel-open]_&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-4 mt-1 space-y-1 border-l border-zinc-800 pl-3">
                {subMenuClientes.map((sub) => {
                  const isSubAtivo =
                    sub.href === "/clientes"
                      ? pathname === "/clientes" || pathname.startsWith("/clientes/novo") || (pathname.startsWith("/clientes/") && !pathname.startsWith("/clientes/ltv"))
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

      {/* Rodapé com avatar do usuário */}
      <div className="border-t border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300">
              JP
            </AvatarFallback>
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
