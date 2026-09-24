const crypto = require("crypto");

// Busca notícias reais e recentes via RSS do Google Notícias (gratuito, sem
// chave de API) filtradas por termos ambientais. Resultado cacheado em
// memória por TTL_MS para não bater no Google a cada requisição.
//
// O <description> desse feed não traz um resumo de verdade (só repete o
// título), então o que mostramos é título + fonte + data reais, com link
// pra matéria original — não fabricamos um resumo que a fonte não deu.

const QUERY = "meio ambiente OR sustentabilidade OR mudança climática OR carbono OR reciclagem";
const URL_RSS = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY + " when:14d")}&hl=pt-BR&gl=BR&ceid=BR:pt-BR`;
const TTL_MS = 30 * 60 * 1000; // 30 minutos
const MAXIMO_ITENS = 12;

const CATEGORIAS = [
  { chave: "clima", categoria: "Mudanças Climáticas", icone: "globo", corClasse: "bg-clima", termos: ["clima", "aqueciment", "climátic", "climatic", "temperatura", "seca", "enchente", "chuva"] },
  { chave: "energia", categoria: "Energia Limpa", icone: "energia", corClasse: "bg-energia", termos: ["energia", "solar", "eólic", "eolic", "renovável", "renovavel", "hidrelétric"] },
  { chave: "reciclagem", categoria: "Reciclagem", icone: "reciclagem", corClasse: "bg-reciclagem-n", termos: ["recicl", "lixo", "resíduo", "residuo", "coleta seletiva"] },
  { chave: "sustentabilidade", categoria: "Sustentabilidade", icone: "broto", corClasse: "bg-sustentabilidade", termos: [] }, // padrão
];

let cache = { itens: null, buscadoEm: 0 };

function decodificarEntidades(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function categorizar(titulo) {
  const alvo = titulo.toLowerCase();
  for (const c of CATEGORIAS) {
    if (c.termos.some((t) => alvo.includes(t))) return c;
  }
  return CATEGORIAS[CATEGORIAS.length - 1];
}

function idDoLink(link) {
  return crypto.createHash("md5").update(link).digest("hex").slice(0, 12);
}

function extrairItens(xmlTexto) {
  const blocos = xmlTexto.match(/<item>[\s\S]*?<\/item>/g) || [];
  return blocos.map((bloco) => {
    const pegar = (tag) => {
      const m = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? decodificarEntidades(m[1].trim()) : "";
    };
    const fonteMatch = bloco.match(/<source[^>]*>([\s\S]*?)<\/source>/);
    const fonte = fonteMatch ? decodificarEntidades(fonteMatch[1].trim()) : "";
    let titulo = pegar("title");
    if (fonte && titulo.endsWith(` - ${fonte}`)) titulo = titulo.slice(0, -(fonte.length + 3));
    return { titulo, link: pegar("link"), pubDate: pegar("pubDate"), fonte };
  });
}

async function buscarNoRss() {
  const controlador = new AbortController();
  const tempoLimite = setTimeout(() => controlador.abort(), 8000);
  try {
    const resposta = await fetch(URL_RSS, { signal: controlador.signal });
    if (!resposta.ok) throw new Error(`RSS respondeu ${resposta.status}`);
    const xml = await resposta.text();
    return extrairItens(xml);
  } finally {
    clearTimeout(tempoLimite);
  }
}

async function buscarNoticiasReais() {
  const agora = Date.now();
  if (cache.itens && agora - cache.buscadoEm < TTL_MS) return cache.itens;

  const brutos = await buscarNoRss();
  const vistos = new Set();
  const itens = [];

  for (const item of brutos) {
    if (!item.titulo || !item.link) continue;
    const id = idDoLink(item.link);
    if (vistos.has(id)) continue;
    vistos.add(id);

    const cat = categorizar(item.titulo);
    const dataIso = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

    itens.push({
      id,
      categoria: cat.categoria,
      icone: cat.icone,
      corClasse: cat.corClasse,
      titulo: item.titulo,
      fonte: item.fonte,
      data: dataIso,
      linkExterno: item.link,
    });

    if (itens.length >= MAXIMO_ITENS) break;
  }

  itens.sort((a, b) => b.data.localeCompare(a.data));
  cache = { itens, buscadoEm: agora };
  return itens;
}

module.exports = { buscarNoticiasReais };
