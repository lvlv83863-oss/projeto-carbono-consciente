const jwt = require("jsonwebtoken");
const ErroApi = require("../utilitarios/erroApi");
const env = require("../config/env");

// Protege rotas que exigem login: espera "Authorization: Bearer <token>".
function autenticar(req, _res, next) {
  const cabecalho = req.headers.authorization || "";
  const [tipo, token] = cabecalho.split(" ");

  if (tipo !== "Bearer" || !token) {
    return next(new ErroApi(401, "Faça login para acessar este recurso."));
  }

  try {
    const payload = jwt.verify(token, env.jwtSegredo);
    req.usuarioId = payload.id;
    next();
  } catch {
    next(new ErroApi(401, "Sessão inválida ou expirada."));
  }
}

module.exports = autenticar;
