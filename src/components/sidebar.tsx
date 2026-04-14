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
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Itens do menu lateral */
const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, ativo: true },
  { href: "/clientes", label: "Clientes", icon: Users, ativo: true },
  { href: "#", label: "Financeiro", icon: DollarSign, ativo: false },
  { href: "#", label: "Comercial", icon: TrendingUp, ativo: false },
  { href: "#", label: "Operacional", icon: Briefcase, ativo: false },
  { href: "#", label: "Equipe", icon: UserCog, ativo: false },
];

export function Sidebar() {
  const pathname = usePathname();

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
          {menuItems.map((item) => {
            const isAtivo =
              item.ativo &&
              (item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href));

            const itemContent = (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  item.ativo
                    ? isAtivo
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    : "cursor-not-allowed text-zinc-600"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {!item.ativo && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-600">
                    Em breve
                  </span>
                )}
              </div>
            );

            if (!item.ativo) {
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger render={<div />}>
                    {itemContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Em breve</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link key={item.label} href={item.href}>
                {itemContent}
              </Link>
            );
          })}
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
