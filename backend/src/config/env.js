require("dotenv").config();

// Valores de fallback só servem para desenvolvimento local — em qualquer
// ambiente real, defina essas variáveis num arquivo ".env" (veja .env.example).
module.exports = {
  porta: process.env.PORTA || 4321,
  jwtSegredo: process.env.JWT_SEGREDO || "segredo-de-desenvolvimento-nao-use-em-producao",
  jwtExpiracao: process.env.JWT_EXPIRACAO || "7d",

  // Banco de dados MySQL (container Docker mapeado na porta 3307 do PC).
  banco: {
    host: process.env.DB_HOST || "127.0.0.1",
    porta: Number(process.env.DB_PORTA) || 3307,
    usuario: process.env.DB_USUARIO || "root",
    senha: process.env.DB_SENHA || "",
    nome: process.env.DB_NOME || "carbono_consciente",
  },
};
