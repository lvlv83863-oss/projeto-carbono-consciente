const app = require("./src/app");
const env = require("./src/config/env");

app.listen(env.porta, () => {
  console.log(`API Carbono Consciente rodando em http://localhost:${env.porta}`);
});
