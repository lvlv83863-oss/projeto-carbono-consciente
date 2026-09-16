const { ler, salvar } = require("./armazenamentoJson");

const ARQUIVO = "habitos.json";

// ---------------------------------------------------------------------
// Equivalente à tabela "habitos" de backend/sql/schema.sql (ainda não
// aplicado em banco nenhum — ver README). Campos em camelCase aqui
// mapeiam para id_habito/id_usuario/id_meio/data_registro/distancia_km/
// co2_emitido_kg/observacao/criado_em quando a migração acontecer.
// ---------------------------------------------------------------------

function listar() {
  return ler(ARQUIVO);
}

function proximoId(habitos) {
  return habitos.reduce((maior, h) => Math.max(maior, h.id), 0) + 1;
}

// SELECT * FROM habitos WHERE id_usuario = ? ORDER BY data_registro DESC, id_habito DESC
function listarPorUsuario(idUsuario) {
  return listar()
    .filter((h) => h.idUsuario === idUsuario)
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
}

// SELECT * FROM habitos WHERE id_habito = ? LIMIT 1
function buscarPorId(id) {
  return listar().find((h) => h.id === Number(id)) || null;
}

// INSERT INTO habitos (...) VALUES (...)
function criar(habito) {
  const habitos = listar();
  const registro = { id: proximoId(habitos), ...habito };
  habitos.push(registro);
  salvar(ARQUIVO, habitos);
  return registro;
}

// DELETE FROM habitos WHERE id_habito = ? AND id_usuario = ?
function remover(id, idUsuario) {
  const habitos = listar();
  const index = habitos.findIndex((h) => h.id === Number(id) && h.idUsuario === idUsuario);
  if (index === -1) return false;
  habitos.splice(index, 1);
  salvar(ARQUIVO, habitos);
  return true;
}

module.exports = { listar, listarPorUsuario, buscarPorId, criar, remover };
