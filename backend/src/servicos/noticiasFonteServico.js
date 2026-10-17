const crypto = require("crypto");

// Busca notícias reais e recentes via RSS do Google Notícias (gratuito, sem
// chave de API) filtradas por termos ambientais. Resultado cacheado em
// memória por TTL_MS para não bater no Google a cada requisição.
//
// O <description> desse feed não traz um resumo de verdade (só repete o
// título), então o que mostramos é título + fonte + data reais, com link
// pra matéria original — não fabricamos um resumo que a fonte não deu.
//
// MULTI-IDIOMA: o Google Notícias só tem edição própria (mesmo idioma) pra
// um subconjunto dos idiomas do site — os outros caem, pelo próprio
// redirecionamento do Google, num desses idiomas "de verdade" (quase sempre
// preservando o país quando possível). `noticiasIdiomas.json` guarda o par
// {hl, gl} final e já verificado pra cada um dos 96 idiomas do site;
// `noticiasCategorias.json` guarda a query de busca e os termos de
// categorização só pros idiomas-base (os que têm edição própria — o
// idioma-base de qualquer par é sempre a parte antes do hífen do seu `hl`,
// ex. "pt-BR" -> "pt", "ca-ES" -> "ca"), já que todo idioma sem edição
// própria cai num desses mesmos idiomas-base, nunca num idioma novo.

const idiomasRss = require("../dados/noticiasIdiomas.json");
const categoriasPorIdiomaBase = require("../dados/noticiasCategorias.json");

const TTL_MS = 30 * 60 * 1000; // 30 minutos
const MAXIMO_ITENS = 12;
const IDIOMA_PADRAO = "pt";

// Visual (ícone/cor) é fixo e não depende de idioma — combinado por índice
// com o rótulo/termos linguísticos de noticiasCategorias.json, na mesma
// ordem (clima, energia, reciclagem, sustentabilidade-padrão).
const VISUAL_CATEGORIAS = [
  { icone: "globo", corClasse: "bg-clima" },
  { icone: "energia", corClasse: "bg-energia" },
  { icone: "reciclagem", corClasse: "bg-reciclagem-n" },
  { icone: "broto", corClasse: "bg-sustentabilidade" },
];

// cache: Map<"hl:gl", { itens, buscadoEm }> — no máximo ~49 entradas (um par
// por combinação hl/gl distinta entre os 96 idiomas), cada uma com seu
// próprio TTL. Não precisa de LRU/limpeza: o teto de memória é previsível e
// pequeno (até 49 listas de até 12 itens pequenos).
const cache = new Map();

function decodificarEntidades(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function resolverParOrigem(idioma) {
  return idiomasRss[idioma] || idiomasRss[IDIOMA_PADRAO];
}

function resolverConfigIdiomaBase(hl) {
  const idiomaBase = hl.split("-")[0];
  return categoriasPorIdiomaBase[idiomaBase] || categoriasPorIdiomaBase[IDIOMA_PADRAO];
}

function resolverCategorias(hl) {
  const config = resolverConfigIdiomaBase(hl);
  return config.categorias.map((c, i) => ({ ...c, ...VISUAL_CATEGORIAS[i] }));
}

function categorizar(titulo, categorias) {
  const alvo = titulo.toLowerCase();
  for (const c of categorias) {
    if (c.termos.some((t) => alvo.includes(t))) return c;
  }
  return categorias[categorias.length - 1];
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

function montarUrlRss({ hl, gl }, query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:14d")}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl}`;
}

async function buscarNoRss(url) {
  const controlador = new AbortController();
  const tempoLimite = setTimeout(() => controlador.abort(), 8000);
  try {
    const resposta = await fetch(url, { signal: controlador.signal });
    if (!resposta.ok) throw new Error(`RSS respondeu ${resposta.status}`);
    const xml = await resposta.text();
    return extrairItens(xml);
  } finally {
    clearTimeout(tempoLimite);
  }
}

async function buscarNoticiasReais(idioma = IDIOMA_PADRAO) {
  const par = resolverParOrigem(idioma);
  const chaveCache = `${par.hl}:${par.gl}`;
  const agora = Date.now();

  const emCache = cache.get(chaveCache);
  if (emCache && agora - emCache.buscadoEm < TTL_MS) return emCache.itens;

  const config = resolverConfigIdiomaBase(par.hl);
  const categorias = resolverCategorias(par.hl);
  const url = montarUrlRss(par, config.query);

  const brutos = await buscarNoRss(url);
  const vistos = new Set();
  const itens = [];

  for (const item of brutos) {
    if (!item.titulo || !item.link) continue;
    const id = idDoLink(item.link);
    if (vistos.has(id)) continue;
    vistos.add(id);

    const cat = categorizar(item.titulo, categorias);
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
  cache.set(chaveCache, { itens, buscadoEm: agora });
  return itens;
}

module.exports = { buscarNoticiasReais };
