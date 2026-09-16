const { ler, salvar } = require("./armazenamentoJson");

const ARQUIVO = "usuarios.json";

// ---------------------------------------------------------------------
// DESENHO DE TABELA (para quando entrar um banco de verdade):
//
//   CREATE TABLE usuarios (
//     id          UUID PRIMARY KEY,
//     nome        VARCHAR NOT NULL,
//     email       VARCHAR NOT NULL UNIQUE,
//     senha_hash  VARCHAR NOT NULL,
//     provedor    VARCHAR NOT NULL DEFAULT 'local',   -- 'local' | 'google'
//     google_id   VARCHAR NULL,
//     criado_em   TIMESTAMP NOT NULL
//   );
//
// Cada função abaixo já está nomeada e assinada do jeito que uma consulta
// SQL/ORM equivalente ficaria — ao trocar por um banco real, só o corpo de
// cada função muda (ex.: "listar" vira "SELECT * FROM usuarios"), a
// assinatura e quem chama continuam iguais.
// ---------------------------------------------------------------------

function listar() {
  return ler(ARQUIVO);
}

// SELECT * FROM usuarios WHERE email = ? LIMIT 1
function buscarPorEmail(email) {
  return listar().find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// SELECT * FROM usuarios WHERE id = ? LIMIT 1
function buscarPorId(id) {
  return listar().find((u) => u.id === id) || null;
}

// INSERT INTO usuarios (...) VALUES (...)
function criar(usuario) {
  const usuarios = listar();
  usuarios.push(usuario);
  salvar(ARQUIVO, usuarios);
  return usuario;
}

module.exports = { listar, buscarPorEmail, buscarPorId, criar };
