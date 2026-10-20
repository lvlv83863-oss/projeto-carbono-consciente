// Aplica backend/sql/schema.sql no PostgreSQL configurado (DATABASE_URL ou DB_*).
//   uso:  npm run db:setup
// O PostgreSQL executa o arquivo inteiro de uma vez (inclusive as funções com
// $$ ... $$), então não precisa separar os comandos. Pode rodar mais de uma
// vez: o schema é idempotente (IF NOT EXISTS / ON CONFLICT / CREATE OR REPLACE).
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const env = require("../src/config/env");

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");

  const configuracao = env.banco.url
    ? { connectionString: env.banco.url }
    : {
        host: env.banco.host,
        port: env.banco.porta,
        user: env.banco.usuario,
        password: env.banco.senha,
        database: env.banco.nome,
      };

  const cliente = new Client({
    ...configuracao,
    ssl: env.banco.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15000,
  });

  console.log(`Aplicando schema em ${env.banco.descricao} ...`);
  await cliente.connect();
  try {
    await cliente.query(sql);
  } finally {
    await cliente.end();
  }
  console.log("Pronto: schema.sql aplicado (tabelas, triggers, view e meios de transporte).");
}

main().catch((erro) => {
  console.error("Falha ao aplicar o schema:", erro.code || "", erro.message);
  process.exit(1);
});