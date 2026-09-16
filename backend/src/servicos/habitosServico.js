const habitosRepositorio = require("../repositorios/habitosRepositorio");
const meiosTransporteRepositorio = require("../repositorios/meiosTransporteRepositorio");
const ErroApi = require("../utilitarios/erroApi");

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

/* ---------- helpers de data (strings "YYYY-MM-DD", comparáveis como texto) ---------- */

function paraIso(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function somarDias(data, dias) {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function inicioDaSemana(data) {
  const diaSemana = data.getDay(); // 0 = domingo ... 6 = sábado
  const deslocamento = diaSemana === 0 ? 6 : diaSemana - 1; // dias desde a última segunda-feira
  return somarDias(data, -deslocamento);
}

function combinarMeio(habito) {
  const meio = meiosTransporteRepositorio.buscarPorId(habito.idMeio);
  return { ...habito, meio: meio ? { id: meio.id, nome: meio.nome, icone: meio.icone } : null };
}

/* ---------- regras de negócio ---------- */

function criar(idUsuario, { idMeio, data, distanciaKm, observacao }) {
  if (!idMeio || !data || distanciaKm === undefined || distanciaKm === null || distanciaKm === "") {
    throw new ErroApi(400, "Preencha o meio de transporte, a data e a distância.");
  }
  if (!REGEX_DATA.test(data)) {
    throw new ErroApi(400, "Data inválida — use o formato AAAA-MM-DD.");
  }
  const distancia = Number(distanciaKm);
  if (Number.isNaN(distancia) || distancia < 0) {
    throw new ErroApi(400, "A distância precisa ser um número maior ou igual a zero.");
  }
  const meio = meiosTransporteRepositorio.buscarPorId(idMeio);
  if (!meio) {
    throw new ErroApi(404, "Meio de transporte não encontrado.");
  }

  // Mesma regra do trigger trg_habitos_calcula_co2 em backend/sql/schema.sql:
  // co2_emitido_kg = distancia_km * fator_emissao.
  const co2 = Math.round(distancia * meio.fatorEmissao * 1000) / 1000;

  const registro = habitosRepositorio.criar({
    idUsuario,
    idMeio: meio.id,
    data,
    distanciaKm: distancia,
    co2,
    observacao: observacao ? String(observacao).slice(0, 255) : null,
    criadoEm: new Date().toISOString(),
  });

  return combinarMeio(registro);
}

function listarPorUsuario(idUsuario) {
  return habitosRepositorio.listarPorUsuario(idUsuario).map(combinarMeio);
}

function remover(id, idUsuario) {
  const removido = habitosRepositorio.remover(id, idUsuario);
  if (!removido) throw new ErroApi(404, "Registro não encontrado.");
}

function somarNoIntervalo(registros, inicioIso, fimIso) {
  const total = registros
    .filter((h) => h.data >= inicioIso && h.data <= fimIso)
    .reduce((soma, h) => soma + h.co2, 0);
  return Math.round(total * 1000) / 1000;
}

// Mesmo espírito da view vw_emissoes_diarias em backend/sql/schema.sql,
// já agregado nos períodos usados pelos cards do painel.
function resumo(idUsuario) {
  const registros = habitosRepositorio.listarPorUsuario(idUsuario);
  const hoje = new Date();

  const isoHoje = paraIso(hoje);
  const isoOntem = paraIso(somarDias(hoje, -1));

  const inicioSemanaAtual = inicioDaSemana(hoje);
  const fimSemanaAnterior = somarDias(inicioSemanaAtual, -1);
  const inicioSemanaAnterior = somarDias(fimSemanaAnterior, -6);

  const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMesAnterior = somarDias(inicioMesAtual, -1);
  const inicioMesAnterior = new Date(fimMesAnterior.getFullYear(), fimMesAnterior.getMonth(), 1);

  return {
    hoje: { totalCo2: somarNoIntervalo(registros, isoHoje, isoHoje) },
    ontem: { totalCo2: somarNoIntervalo(registros, isoOntem, isoOntem) },
    semanaAtual: { totalCo2: somarNoIntervalo(registros, paraIso(inicioSemanaAtual), isoHoje) },
    semanaAnterior: { totalCo2: somarNoIntervalo(registros, paraIso(inicioSemanaAnterior), paraIso(fimSemanaAnterior)) },
    mesAtual: { totalCo2: somarNoIntervalo(registros, paraIso(inicioMesAtual), isoHoje) },
    mesAnterior: { totalCo2: somarNoIntervalo(registros, paraIso(inicioMesAnterior), paraIso(fimMesAnterior)) },
  };
}

module.exports = { criar, listarPorUsuario, remover, resumo };
