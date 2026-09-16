const express = require("express");
const cors = require("cors");

const rotas = require("./rotas");
const tratadorErros = require("./intermediarios/tratadorErros");

const app = express();

// Liberado para qualquer origem — adequado para desenvolvimento local.
// Antes de um deploy real, restrinja para o domínio do front-end.
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ nome: "API Carbono Consciente", status: "ok" });
});

app.use("/api", rotas);

app.use((_req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

app.use(tratadorErros);

module.exports = app;
