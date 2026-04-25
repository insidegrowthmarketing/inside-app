import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioInfo } from "@/lib/usuarios";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const info = getUsuarioInfo(user?.email);
  const nomeUsuario = info?.nome ?? user?.email?.split("@")[0] ?? "Usuário";
  const emailUsuario = user?.email ?? "";

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar nomeUsuario={nomeUsuario} emailUsuario={emailUsuario} />
      <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
    </div>
  );
}
