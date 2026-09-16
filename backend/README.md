# Backend — Carbono Consciente

API para as funcionalidades do site que hoje dependiam de backend: login/cadastro, notícias e estatísticas.

## Como rodar

```bash
cd backend
npm install
cp .env.example .env   # opcional — sem isso, os valores padrão de dev já funcionam
npm start
```

O servidor sobe em `http://localhost:3000` (ou na porta definida em `PORTA` no `.env`). O front-end estático (`front end/`) aponta para essa URL através de `front end/js/config.js`.

## Persistência atual: arquivos JSON (não é um banco de dados)

Por decisão explícita deste momento do projeto, **não há banco de dados** — os "dados" moram em arquivos JSON dentro de `src/dados/` (`usuarios.json`, `noticias.json`, `estatisticas.json`), lidos e escritos por `src/repositorios/armazenamentoJson.js`.

Isso foi estruturado de propósito para que plugar um banco de verdade no futuro seja uma troca localizada, e não uma reescrita do backend:

```
rotas/  →  controladores/  →  servicos/  →  repositorios/  →  (hoje: JSON | futuro: banco real)
```

- `rotas/`, `controladores/` e `servicos/` **não sabem** que os dados estão em JSON — só chamam funções como `usuariosRepositorio.buscarPorEmail(email)` ou `noticiasRepositorio.listar()`.
- Cada arquivo em `src/repositorios/` (`usuariosRepositorio.js`, `noticiasRepositorio.js`, `estatisticasRepositorio.js`) é comentado com o **desenho de tabela equivalente** (`CREATE TABLE ...`) e, função por função, o **SQL equivalente** (`-- SELECT * FROM usuarios WHERE email = ?`). Isso existe justamente para uma pessoa (ou uma IA) que for integrar um banco de verdade não precisar re-inferir o modelo de dados — é só seguir o comentário.

### Passo a passo para migrar para um banco real

1. Escolher o banco/ORM (ex.: PostgreSQL + Prisma, SQLite, MongoDB — qualquer um serve, o desenho já está pronto para SQL relacional mas é adaptável).
2. Criar as tabelas/coleções usando o `CREATE TABLE` comentado no topo de cada arquivo em `src/repositorios/`.
3. Reescrever **só o corpo** das funções exportadas por cada repositório (`listar`, `buscarPorEmail`, `buscarPorId`, `criar`, etc.) para usar o banco em vez de `armazenamentoJson`. As assinaturas (nome da função, parâmetros, o que retornam) devem continuar iguais — é isso que mantém `servicos/`, `controladores/` e `rotas/` intocados.
4. Rodar um script de migração único para copiar o conteúdo atual de `src/dados/*.json` para as tabelas novas (os arquivos já estão no formato exato dos campos esperados).
5. Depois que tudo estiver validado, `src/repositorios/armazenamentoJson.js` e os arquivos em `src/dados/` podem ser removidos.

## Modelo de dados

### `usuarios`
| campo | tipo | observação |
|---|---|---|
| id | uuid | chave primária |
| nome | string | |
| email | string | único |
| senhaHash | string | bcrypt, nunca devolvido pela API |
| provedor | `"local"` \| `"google"` | hoje só "local" é usado de verdade |
| googleId | string \| null | reservado para o login com Google |
| criadoEm | timestamp ISO | |

### `noticias`
| campo | tipo | observação |
|---|---|---|
| id | string | |
| categoria | string | |
| emoji | string | |
| corClasse | string | classe CSS já existente no front (`bg-clima`, `bg-energia`, `bg-reciclagem-n`, `bg-sustentabilidade`) |
| texto | string | |
| data | data ISO | |
| linkExterno | string \| null | reservado para uma futura página de artigo completo |

Somente leitura por enquanto — não existe tela de administração no front para criar/editar notícias.

### `estatisticas`
| campo | tipo | observação |
|---|---|---|
| chave | string | identificador do indicador |
| valor | string | já formatado para exibição (ex.: `"2,4 t"`, `"−12%"`) |
| descricao | string | |

Somente leitura, semeado hoje com os mesmos 4 números que já estavam fixos no HTML.

## Rotas

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/api/auth/registrar` | não | cria conta (nome, email, senha, confirmar) |
| POST | `/api/auth/login` | não | autentica (email, senha), devolve `{ usuario, token }` |
| GET | `/api/auth/me` | sim (`Authorization: Bearer <token>`) | dados do usuário logado |
| POST | `/api/auth/google` | não | **não implementado** — responde 501. Exige credenciais OAuth (Client ID/Secret) que só o dono do projeto pode criar no Google Cloud Console. Ver comentário em `src/controladores/autenticacaoControlador.js`. |
| GET | `/api/noticias` | não | lista de notícias |
| GET | `/api/noticias/:id` | não | uma notícia — reservado para uma futura página de artigo completo |
| GET | `/api/estatisticas` | não | lista de estatísticas |

Erros sempre voltam como `{ "erro": "mensagem" }` com o status HTTP correspondente (400 dado inválido, 401 não autenticado, 404 não encontrado, 409 conflito, 501 não implementado, 500 erro inesperado).

## CORS

Liberado para qualquer origem (`cors()` sem restrição) — adequado para desenvolvimento local. Antes de qualquer publicação real, restrinja para o domínio do front-end em `src/app.js`.
