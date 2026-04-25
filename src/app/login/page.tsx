"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

function traduzirErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email ou senha incorretos";
  if (msg.includes("Email not confirmed")) return "Confirme seu email antes de entrar (verifique sua caixa de entrada)";
  if (msg.includes("Invalid email")) return "Email inválido";
  return "Erro ao entrar. Tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro(traduzirErro(error.message));
      setCarregando(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      {/* Gradiente de fundo sutil */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 60%)",
        }}
      />

      <Card className="relative z-10 w-full max-w-sm border-zinc-800/60 bg-zinc-900/80 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/Logo_INSIDE-02.svg"
              alt="Inside"
              width={140}
              height={48}
              style={{ height: "48px", width: "auto" }}
              priority
            />
          </div>

          {/* Título */}
          <h1
            className="text-2xl font-bold text-center mb-1 bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #2D7CDB 0%, #7B3FC9 50%, #E550A5 100%)",
            }}
          >
            Entrar no Inside App
          </h1>
          <p className="text-sm text-zinc-400 text-center mb-8">
            Painel de gestão da agência
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-zinc-300">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-600"
              />
            </div>

            {erro && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                {erro}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={carregando}
            >
              {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/auth/recuperar-senha"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
