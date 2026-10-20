const { pool } = require("../config/bancoDados");

// Tabela "usuarios" de backend/sql/schema.sql. O banco usa snake_case
// (id_usuario, senha_hash, criado_em); aqui convertemos para o formato que
// o restante do backend já usa (id, senhaHash, criadoEm).
// "provedor" e "googleId" não existem no schema — o login com Google ainda
// não está implementado, então todo usuário é "local".

function paraUsuario(linha) {
  if (!linha) return null;
  return {
    id: linha.id_usuario,
    nome: linha.nome,
    email: linha.email,
    senhaHash: linha.senha_hash,
    pais: linha.pais,
    provedor: "local",
    googleId: null,
    criadoEm: linha.criado_em,
  };
}

async function buscarPorEmail(email) {
  const { rows: linhas } = await pool.query("SELECT * FROM usuarios WHERE email = $1 LIMIT 1", [email]);
  return paraUsuario(linhas[0]);
}

async function buscarPorId(id) {
  const { rows: linhas } = await pool.query("SELECT * FROM usuarios WHERE id_usuario = $1 LIMIT 1", [id]);
  return paraUsuario(linhas[0]);
}

// Devolve o usuário criado, já com o id gerado pelo banco (IDENTITY + RETURNING).
// "pais" guarda o código ISO_A3 (ex.: "BRA"), não o nome por extenso —
// é o mesmo código usado em front end/data/emissoes.json, o que permite
// validar contra essa lista e re-derivar o nome localizado do país via
// Intl.DisplayNames no frontend.
async function criar({ nome, email, senhaHash, pais }) {
  const { rows } = await pool.query(
    "INSERT INTO usuarios (nome, email, senha_hash, pais) VALUES ($1, $2, $3, $4) RETURNING *",
    [nome, email, senhaHash, pais || null]
  );
  return paraUsuario(rows[0]);
}

module.exports = { buscarPorEmail, buscarPorId, criar };