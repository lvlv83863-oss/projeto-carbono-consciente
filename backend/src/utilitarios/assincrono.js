// O Express 4 não captura sozinho uma Promise rejeitada dentro de uma rota
// assíncrona — esse wrapper garante que qualquer erro (inclusive ErroApi
// lançado dentro de um `async function`) chegue no tratadorErros central.
function assincrono(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = assincrono;
