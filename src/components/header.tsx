"use client";

import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  titulo: string;
  children?: React.ReactNode;
}

export function Header({ titulo, children }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <h1
        className="text-lg font-bold bg-clip-text text-transparent"
        style={{ backgroundImage: "var(--inside-gradient-horizontal)" }}
      >
        {titulo}
      </h1>

      <div className="flex items-center gap-2">
        {children}

        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
          <Bell className="h-4 w-4" />
        </Button>

        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300">
            JP
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
