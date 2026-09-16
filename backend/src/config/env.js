require("dotenv").config();

// Valores de fallback só servem para desenvolvimento local — em qualquer
// ambiente real, defina essas variáveis num arquivo ".env" (veja .env.example).
module.exports = {
  porta: process.env.PORTA || 3000,
  jwtSegredo: process.env.JWT_SEGREDO || "segredo-de-desenvolvimento-nao-use-em-producao",
  jwtExpiracao: process.env.JWT_EXPIRACAO || "7d",
};
