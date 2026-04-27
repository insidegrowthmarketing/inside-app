import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Callback do Supabase Auth — troca o code por sessão e redireciona */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Convite ou recuperação de senha → definir/redefinir senha
      if (type === "invite" || type === "recovery" || type === "signup") {
        return NextResponse.redirect(`${origin}/auth/definir-senha`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
