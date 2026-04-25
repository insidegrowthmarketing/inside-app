"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function DefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (senha.length < 8) {
      setErro("A senha deve ter no mínimo 8 caracteres");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem");
      return;
    }

    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setErro("Erro ao definir senha. Tente novamente.");
      setCarregando(false);
      return;
    }

    setSucesso(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
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
            Defina sua senha
          </h1>
          <p className="text-sm text-zinc-400 text-center mb-8">
            Crie uma senha para acessar o Inside App
          </p>

          {sucesso ? (
            <p className="text-center text-green-400 text-sm">
              Senha definida com sucesso! Redirecionando...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nova senha</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={8}
                  className="border-zinc-800 bg-zinc-950 text-zinc-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Confirmar senha</Label>
                <Input
                  type="password"
                  placeholder="Digite novamente"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  className="border-zinc-800 bg-zinc-950 text-zinc-200"
                />
              </div>

              {erro && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{erro}</p>
              )}

              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Definir senha
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
