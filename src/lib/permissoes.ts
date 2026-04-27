import { getUsuarioInfo } from "./usuarios";

export type PapelUsuario = "admin" | "head" | "gestor_trafego" | "gestor_projetos" | "comercial" | "infra";

export function ehAdmin(email: string | undefined | null): boolean {
  const info = getUsuarioInfo(email);
  return info?.papel === "admin";
}

export function podeEditarTudoCliente(email: string | undefined | null): boolean {
  return ehAdmin(email);
}

export function podeEditarStatusCliente(email: string | undefined | null): boolean {
  const info = getUsuarioInfo(email);
  return !!info;
}

export function podeCriarCliente(email: string | undefined | null): boolean {
  const info = getUsuarioInfo(email);
  if (!info) return false;
  return info.papel === "admin" || info.papel === "comercial";
}

export function podeExcluirCliente(email: string | undefined | null): boolean {
  return ehAdmin(email);
}

export function podeEditarFinanceiro(email: string | undefined | null): boolean {
  return ehAdmin(email);
}

export function podeFazerEdicaoEmMassa(email: string | undefined | null): boolean {
  return ehAdmin(email);
}

/** Retorna label formatado do papel */
export function labelPapel(email: string | undefined | null): string {
  const info = getUsuarioInfo(email);
  if (!info) return "";
  const labels: Record<string, string> = {
    admin: "Admin",
    head: "Head",
    gestor_trafego: "Gestor de Tráfego",
    gestor_projetos: "Gestor de Projetos",
    comercial: "Comercial",
    infra: "Infra",
  };
  return labels[info.papel] || info.papel;
}
