// Aplica backend/sql/schema.sql no MySQL configurado no .env (DB_*).
//   uso:  npm run db:setup
// Entende "DELIMITER", então o trigger do schema funciona sem depender de
// DBeaver/extensão. Pode rodar mais de uma vez: o schema é idempotente.
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const env = require("../src/config/env");

function separarComandos(texto) {
  const comandos = [];
  let delimitador = ";";
  let atual = "";

  for (const linha of texto.replace(/\r\n/g, "\n").split("\n")) {
    const limpa = linha.trim();
    if (!atual && (limpa === "" || limpa.startsWith("--"))) continue;

    const mudanca = limpa.match(/^DELIMITER\s+(\S+)$/i);
    if (mudanca) {
      delimitador = mudanca[1];
      continue;
    }

    atual += linha + "\n";
    if (limpa.endsWith(delimitador)) {
      comandos.push(atual.trim().slice(0, -delimitador.length).trim());
      atual = "";
    }
  }
  if (atual.trim()) comandos.push(atual.trim());
  return comandos;
}

async function main() {
  const texto = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  const comandos = separarComandos(texto);

  // Conecta SEM escolher banco: o próprio schema.sql faz CREATE DATABASE / USE.
  const conexao = await mysql.createConnection({
    host: env.banco.host,
    port: env.banco.porta,
    user: env.banco.usuario,
    password: env.banco.senha,
    charset: "utf8mb4",
  });

  console.log(`Aplicando schema em ${env.banco.host}:${env.banco.porta} ...`);
  for (const comando of comandos) {
    await conexao.query(comando);
  }
  await conexao.end();
  console.log(`Pronto: ${comandos.length} comandos executados. Banco "${env.banco.nome}" atualizado.`);
}

main().catch((erro) => {
  console.error("Falha ao aplicar o schema:", erro.code || "", erro.message);
  process.exit(1);
});
