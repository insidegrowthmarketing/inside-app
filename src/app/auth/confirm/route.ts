import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Rota de confirmação do Supabase Auth.
 * Lida com links de email que usam token_hash (convites, recovery, signup).
 * URL exemplo: /auth/confirm?token_hash=XXX&type=invite
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "invite" | "recovery" | "signup" | "email" | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type === "invite" ? "invite" : type === "recovery" ? "recovery" : "email",
    });

    if (!error) {
      // Convite ou recuperação → definir/redefinir senha
      if (type === "invite" || type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/definir-senha`);
      }
      // Confirmação de email normal → login
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link_expirado`);
}
