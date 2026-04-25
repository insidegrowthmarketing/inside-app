"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/definir-senha`,
    });

    setEnviado(true);
    setCarregando(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 60%)",
        }}
      />

      <Card className="relative z-10 w-full max-w-sm border-zinc-800/60 bg-zinc-900/80 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-8">
          <div className="flex justify-center mb-8">
            <Image src="/Logo_INSIDE-02.svg" alt="Inside" width={140} height={48} style={{ height: "48px", width: "auto" }} priority />
          </div>

          <h1
            className="text-2xl font-bold text-center mb-1 bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, #2D7CDB 0%, #7B3FC9 50%, #E550A5 100%)" }}
          >
            Recuperar senha
          </h1>
          <p className="text-sm text-zinc-400 text-center mb-8">
            Digite seu email para receber o link de redefinição
          </p>

          {enviado ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300 text-center bg-zinc-800/50 rounded-lg px-4 py-3">
                Se o email existir no sistema, você receberá um link para redefinir sua senha.
              </p>
              <Link href="/login">
                <Button variant="ghost" className="w-full text-zinc-400 hover:text-white">
                  Voltar para o login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Email</Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-600"
                />
              </div>

              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar link
              </Button>

              <Link href="/login">
                <Button variant="ghost" className="w-full text-zinc-500 hover:text-white">
                  Voltar para o login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
