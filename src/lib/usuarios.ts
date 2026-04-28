/** Mapeamento de emails cadastrados → dados do usuário */
export const MAPEAMENTO_USUARIOS: Record<string, { nome: string; papel: string; gestor_nome?: string }> = {
  "contato@insidetrafegopago.com": { nome: "Jéssica", papel: "admin" },
  "maria.inside25@gmail.com": { nome: "Maria Paula", papel: "admin", gestor_nome: "Maria Paula" },
  "Hcaio9659@gmail.com": { nome: "Caio", papel: "head", gestor_nome: "Caio" },
  "jeanlucasb94@gmail.com": { nome: "Jean", papel: "head", gestor_nome: "Jean" },
  "lkgoulart@hotmail.com": { nome: "Lucas", papel: "gestor_trafego", gestor_nome: "Lucas" },
  "rodrigobentolimma@gmail.com": { nome: "Rodrigo", papel: "gestor_trafego", gestor_nome: "Rodrigo" },
  "gsoaris215@gmail.com": { nome: "Gabriel", papel: "gestor_trafego", gestor_nome: "Gabriel" },
  "samaralimadomkt@gmail.com": { nome: "Samara", papel: "gestor_trafego", gestor_nome: "Samara" },
  "Suport.jlstore@gmail.com": { nome: "Eliane", papel: "gestor_trafego", gestor_nome: "Eliane" },
  "a.luiza.inside@gmail.com": { nome: "Ana Luiza", papel: "gestor_trafego", gestor_nome: "Ana Luiza" },
  "gabriela.gpinside@gmail.com": { nome: "Gabriela", papel: "gestor_projetos", gestor_nome: "Gabriela" },
  "contatosergiogaldino@gmail.com": { nome: "Sergio", papel: "gestor_projetos", gestor_nome: "Sergio" },
  "brunanunes.inside@gmail.com": { nome: "Bruna", papel: "gestor_projetos", gestor_nome: "Bruna" },
  "alineharo.inside@gmail.com": { nome: "Aline", papel: "gestor_projetos", gestor_nome: "Aline" },
  "barbara.mg.nunes@gmail.com": { nome: "Barbara", papel: "infra" },
  "caua.inside@gmail.com": { nome: "Cauã", papel: "infra" },
  "stephanieester.inside@gmail.com": { nome: "Stephanie", papel: "infra" },
  "cassio.inside@gmail.com": { nome: "Cassio", papel: "infra" },
  "alyciainside@gmail.com": { nome: "Alycia", papel: "infra" },
  "taisborges388@gmail.com": { nome: "Tais", papel: "comercial" },
  "Comercial@insidetrafegopago.com": { nome: "Comercial", papel: "comercial" },
  "lucasabreu.inside@gmail.com": { nome: "Lucas Abreu", papel: "comercial" },
  "gustavo.menezes@insidetrafegopago.com": { nome: "Gustavo", papel: "comercial" },
  "gerlainecabralinside@gmail.com": { nome: "Gerlaine", papel: "gestor_projetos", gestor_nome: "Gerlaine" },
"tainara.inside@gmail.com": { nome: "Tainara", papel: "gestor_trafego" },
};

/** Busca informações do usuário pelo email (case-insensitive) */
export function getUsuarioInfo(email: string | undefined | null) {
  if (!email) return null;
  const emailLower = email.toLowerCase();
  for (const [key, value] of Object.entries(MAPEAMENTO_USUARIOS)) {
    if (key.toLowerCase() === emailLower) return { email: key, ...value };
  }
  return null;
}
