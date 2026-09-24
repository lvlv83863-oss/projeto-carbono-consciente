const estatisticasRepositorio = require("../repositorios/estatisticasRepositorio");
const habitosServico = require("./habitosServico");

function fmtKg(n) {
  return `${n.toFixed(2).replace(".", ",")} kg`;
}

function fmtTon(n) {
  return `${n.toFixed(2).replace(".", ",")} t`;
}

function paisesOrdenadosPorEmissao(paises) {
  return Object.values(paises).sort((a, b) => b.tonYear - a.tonYear);
}

// Sem login: só dados agregados dos países do globo (front end/data/emissoes.json,
// copiados para backend/src/dados/emissoesPaises.json).
function calcularGlobais() {
  const paises = estatisticasRepositorio.listarPaises();
  const lista = Object.values(paises);

  if (!lista.length) {
    // último fallback, se o arquivo de países não puder ser lido por algum motivo
    return estatisticasRepositorio.listar();
  }

  const mediaTon = lista.reduce((soma, p) => soma + p.tonYear, 0) / lista.length;
  const ordenados = paisesOrdenadosPorEmissao(paises);
  const maior = ordenados[0];
  const menor = ordenados[ordenados.length - 1];

  return [
    { chave: "media_mundial", valor: fmtTon(mediaTon), descricao: "CO₂ médio por pessoa, entre os países monitorados" },
    { chave: "maior_emissor", valor: fmtTon(maior.tonYear), descricao: `maior emissor per capita: ${maior.nome}` },
    { chave: "menor_emissor", valor: fmtTon(menor.tonYear), descricao: `menor emissor per capita: ${menor.nome}` },
    { chave: "paises_monitorados", valor: String(lista.length), descricao: "países monitorados no globo" },
  ];
}

// Logado: combina os hábitos do próprio usuário com os dados dos países.
function calcularPersonalizadas(idUsuario) {
  const paises = estatisticasRepositorio.listarPaises();
  const lista = Object.values(paises);
  const resumo = habitosServico.resumo(idUsuario);
  const seuCo2Semana = resumo.semanaAtual.totalCo2;

  const mediaSemanalPaises = lista.length ? lista.reduce((soma, p) => soma + p.kgWeek, 0) / lista.length : 0;

  let comparacao = "sem dados suficientes";
  // Saúde da planta (0-100): 50 = exatamente na média dos países, 100 = bem
  // abaixo da média (ótimo), 0 = bem acima (ruim). Mesma comparação usada
  // no card "vs_media_paises", só reaproveitada numa escala 0-100.
  let saudePlanta = 50;
  if (mediaSemanalPaises > 0) {
    const diferenca = ((seuCo2Semana - mediaSemanalPaises) / mediaSemanalPaises) * 100;
    const sinal = diferenca <= 0 ? "▼" : "▲";
    comparacao = `${sinal} ${Math.abs(diferenca).toFixed(0)}% vs. média dos países`;
    saudePlanta = Math.max(0, Math.min(100, Math.round(50 - diferenca * 0.5)));
  }

  // Projeta o total semanal pra uma taxa anual (mesma unidade do tonYear
  // dos países) só pra estimar uma posição comparável no ranking.
  const projecaoAnualTon = (seuCo2Semana * 52) / 1000;
  const ordenados = paisesOrdenadosPorEmissao(paises);
  let posicao = ordenados.findIndex((p) => projecaoAnualTon >= p.tonYear) + 1;
  if (posicao <= 0) posicao = ordenados.length;

  const itens = [
    { chave: "seu_co2_semana", valor: fmtKg(seuCo2Semana), descricao: "seu CO₂ nesta semana" },
    { chave: "vs_media_paises", valor: comparacao, descricao: "comparado à média semanal dos países" },
    { chave: "ranking_mundial", valor: `${posicao}º`, descricao: `posição estimada entre ${ordenados.length} países` },
    { chave: "paises_monitorados", valor: String(lista.length), descricao: "países monitorados no globo" },
  ];

  return { itens, saudePlanta };
}

function listar(idUsuario) {
  if (idUsuario) {
    const { itens, saudePlanta } = calcularPersonalizadas(idUsuario);
    return { logado: true, itens, saudePlanta };
  }
  return { logado: false, itens: calcularGlobais() };
}

module.exports = { listar };
