const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Igual a autenticar.js, mas nunca bloqueia a requisição: se vier um token
// válido, popula req.usuarioId; se não vier (ou vier inválido), a rota
// segue normalmente sem usuário — usado em rotas que têm uma versão
// personalizada para quem está logado e uma versão genérica pra quem não.
function autenticarOpcional(req, _res, next) {
  const cabecalho = req.headers.authorization || "";
  const [tipo, token] = cabecalho.split(" ");

  if (tipo === "Bearer" && token) {
    try {
      const payload = jwt.verify(token, env.jwtSegredo);
      req.usuarioId = payload.id;
    } catch {
      // token inválido/expirado — segue como visitante não logado
    }
  }

  next();
}

module.exports = autenticarOpcional;
