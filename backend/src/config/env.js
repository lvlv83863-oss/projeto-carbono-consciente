require("dotenv").config();

// Valores de fallback só servem para desenvolvimento local — em qualquer
// ambiente real, defina essas variáveis num arquivo ".env" (veja .env.example)
// ou, no Render, na aba Environment.

const urlBanco = process.env.DATABASE_URL || null;

// Texto para logs (sem usuário/senha) dizendo onde o banco está.
function descreverBanco() {
  if (urlBanco) {
    try {
      const u = new URL(urlBanco);
      return `${u.hostname}:${u.port || 5432}${u.pathname}`;
    } catch {
      return "DATABASE_URL";
    }
  }
  const host = process.env.DB_HOST || "127.0.0.1";
  const porta = Number(process.env.DB_PORTA) || 5432;
  const nome = process.env.DB_NOME || "carbono_consciente";
  return `${host}:${porta}/${nome}`;
}

module.exports = {
  porta: process.env.PORT || process.env.PORTA || 4321,
  jwtSegredo: process.env.JWT_SEGREDO || "segredo-de-desenvolvimento-nao-use-em-producao",
  jwtExpiracao: process.env.JWT_EXPIRACAO || "7d",

  // Banco de dados PostgreSQL (Supabase em produção).
  // Em produção: só DATABASE_URL (string do "Session pooler" do Supabase).
  // Local (Postgres no Docker): DATABASE_URL OU as variáveis DB_* abaixo.
  banco: {
    url: urlBanco,
    host: process.env.DB_HOST || "127.0.0.1",
    porta: Number(process.env.DB_PORTA) || 5432,
    usuario: process.env.DB_USUARIO || "postgres",
    senha: process.env.DB_SENHA || "",
    nome: process.env.DB_NOME || "carbono_consciente",
    // SSL: ligado por padrão quando se usa DATABASE_URL (Supabase exige).
    // Para um Postgres local sem SSL, defina DB_SSL=false.
    ssl: process.env.DB_SSL ? process.env.DB_SSL === "true" : Boolean(urlBanco),
    descricao: descreverBanco(),
  },
};