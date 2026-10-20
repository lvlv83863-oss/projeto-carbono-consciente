const { Pool, types } = require("pg");
const env = require("./env");

// O driver "pg" devolve alguns tipos de um jeito diferente do mysql2.
// Estes parsers deixam o resto do backend funcionando como antes:
//  - DATE (oid 1082): volta como texto "2026-09-16", e não como objeto Date.
//    Evita problemas de fuso horário nas comparações de datas
//    (habitosServico compara as datas como texto).
//  - NUMERIC/DECIMAL (oid 1700): volta como número, e não como texto "12.50".
//  - BIGINT (oid 20): volta como número (ex.: resultado de COUNT).
types.setTypeParser(1082, (valor) => valor);
types.setTypeParser(1700, (valor) => parseFloat(valor));
types.setTypeParser(20, (valor) => parseInt(valor, 10));

// Pool de conexões com o PostgreSQL. Todos os repositórios usam este mesmo pool.
// Em produção usa DATABASE_URL (Supabase, "Session pooler"). Não coloque
// "?sslmode=..." na URL: o SSL é configurado aqui embaixo.
const configuracao = env.banco.url
  ? { connectionString: env.banco.url }
  : {
      host: env.banco.host,
      port: env.banco.porta,
      user: env.banco.usuario,
      password: env.banco.senha,
      database: env.banco.nome,
    };

const pool = new Pool({
  ...configuracao,
  ssl: env.banco.ssl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Sem este handler, um erro numa conexão ociosa (ex.: o banco reiniciou)
// derrubaria o servidor inteiro.
pool.on("error", (erro) => {
  console.error("Erro numa conexão ociosa com o banco:", erro.code || "", erro.message);
});

// Usado na inicialização do servidor só para avisar, no terminal, se o banco
// está acessível. Não derruba o servidor: a API sobe mesmo assim e as rotas
// que dependem do banco respondem 503 com uma mensagem explicando o motivo.
async function testarConexao() {
  await pool.query("SELECT 1");
}

module.exports = { pool, testarConexao };