const mysql = require("mysql2/promise");
const env = require("./env");

// Pool de conexões com o MySQL. Todos os repositórios usam este mesmo pool.
// dateStrings: colunas DATE/DATETIME voltam como texto ("2026-09-16") em vez
// de objetos Date, o que evita problemas de fuso horário nas comparações.
const pool = mysql.createPool({
  host: env.banco.host,
  port: env.banco.porta,
  user: env.banco.usuario,
  password: env.banco.senha,
  database: env.banco.nome,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  charset: "utf8mb4",
});

// Usado na inicialização do servidor só para avisar, no terminal, se o banco
// está acessível. Não derruba o servidor: a API sobe mesmo assim e as rotas
// que dependem do banco respondem 503 com uma mensagem explicando o motivo.
async function testarConexao() {
  const conexao = await pool.getConnection();
  try {
    await conexao.query("SELECT 1");
  } finally {
    conexao.release();
  }
}

module.exports = { pool, testarConexao };
