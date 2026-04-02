/**
 * ARQUIVO PRINCIPAL DO SERVIDOR (BACKEND)
 * Responsável por gerenciar a comunicação entre o Frontend (página web)
 * e o Banco de Dados (MySQL) através de uma API REST.
 */

// ============================================================================
// 1. IMPORTAÇÃO DE DEPENDÊNCIAS (BIBLIOTECAS)
// ============================================================================
const express = require("express"); // Framework principal para criar o servidor e gerenciar rotas
const mysql = require("mysql2"); // Driver para conectar e executar comandos no banco de dados MySQL
const cors = require("cors"); // Middleware de segurança que permite requisições de domínios diferentes (Frontend acessando Backend)

// Inicializa o aplicativo Express
const app = express();

// ============================================================================
// 2. CONFIGURAÇÕES GERAIS (MIDDLEWARES)
// ============================================================================
// Habilita o CORS para não dar erro de bloqueio de origem no navegador
app.use(cors());

// Configura o Express para entender o formato JSON nas requisições (req.body)
app.use(express.json());

// ============================================================================
// 3. CONFIGURAÇÃO DO BANCO DE DADOS
// ============================================================================
// Cria as credenciais e aponta para o banco de dados local
const db = mysql.createConnection({
  host: "localhost", // Endereço do servidor do banco de dados
  user: "root", // Usuário padrão do MySQL
  password: "User-12910", // Senha de acesso ao banco (mantenha segura!)
  database: "gerenciamento_tarefas", // Nome do banco de dados que será utilizado
});

// Tenta estabelecer a conexão com o banco
db.connect((err) => {
  if (err) {
    // Se houver erro, exibe no terminal e para a execução
    console.error("Erro ao conectar ao mysql:", err);
    return;
  }
  console.log("Conectado ao mysql com sucesso!");
});

// ============================================================================
// 4. ROTAS DA API REST (ENDPOINTS)
// ============================================================================

/**
 * ROTA: Listar Usuários
 * MÉTODO: GET
 * DESCRIÇÃO: Busca todos os usuários cadastrados no banco de dados.
 */
app.get("/usuario", (req, res) => {
  // Executa a query de busca
  db.query("SELECT * FROM usuario", (err, result) => {
    // Retorna status 500 (Internal Server Error) em caso de falha
    if (err) return res.status(500).send(err);

    // Retorna a lista de usuários em formato JSON com status 200 (OK)
    res.json(result);
  });
});

/**
 * ROTA: Cadastrar Usuário
 * MÉTODO: POST
 * DESCRIÇÃO: Recebe dados do frontend e insere um novo usuário no banco.
 */
app.post("/usuario", (req, res) => {
  // Extrai o nome e email do corpo da requisição enviada pelo Frontend
  const { nome, email } = req.body;

  // Comando SQL preparado. Os pontos de interrogação (?) são usados para evitar SQL Injection (Ataques)
  const sql = "INSERT INTO usuario (nome,email) VALUES (?,?)";

  // Substitui os '?' por nome e email reais na hora de salvar
  db.query(sql, [nome, email], (err) => {
    if (err) return res.status(500).send(err);

    // Retorna uma mensagem de sucesso
    res.json({ message: "Cadastro concluído com sucesso!" });
  });
});

/**
 * ROTA: Listar Tarefas
 * MÉTODO: GET
 * DESCRIÇÃO: Busca todas as tarefas. Usa 'JOIN' para trazer o nome do usuário vinculado em vez de apenas o ID.
 */
app.get("/tarefas", (req, res) => {
  // O JOIN cruza a tabela 'tarefas' (t) com a tabela 'usuario' (u) onde os IDs combinam
  const sql =
    "SELECT t.*, u.nome as usuario_nome FROM tarefas t JOIN usuario u ON t.id_usuario=u.id_usuario";

  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

/**
 * ROTA: Cadastrar Tarefa
 * MÉTODO: POST
 * DESCRIÇÃO: Cria uma nova tarefa. A data de cadastro é gerada automaticamente (NOW()) e o status inicial é sempre 'a fazer'.
 */
app.post("/tarefas", (req, res) => {
  // Extrai os campos preenchidos no formulário do Frontend
  const { id_usuario, descricao, setor, prioridade } = req.body;

  // Comando SQL para inserir dados.
  const sql =
    "INSERT INTO tarefas(id_usuario, descricao, setor, prioridade, data_cadastro, status_tarefa) VALUES (?, ?, ?, ?, NOW(), 'a fazer')";

  // Executa passando as variáveis na ordem correta
  db.query(sql, [id_usuario, descricao, setor, prioridade], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Tarefa criada com sucesso!" });
  });
});

/**
 * ROTA: Atualizar Status da Tarefa
 * MÉTODO: PUT
 * DESCRIÇÃO: Altera o status de uma tarefa específica (Ex: movendo de 'a fazer' para 'fazendo').
 */
app.put("/tarefas/:id", (req, res) => {
  // Pega o novo status que veio no corpo da requisição
  const { status_tarefa } = req.body;

  // Pega o ID da tarefa que veio na URL da requisição (ex: /tarefas/5)
  const id = req.params.id;

  // Atualiza apenas a coluna status_tarefa onde o ID for igual ao fornecido
  const sql = "UPDATE tarefas SET status_tarefa = ? WHERE id_tarefa = ?";
  db.query(sql, [status_tarefa, id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Status da tarefa atualizado com sucesso!" });
  });
});

/**
 * ROTA: Excluir Tarefa
 * MÉTODO: DELETE
 * DESCRIÇÃO: Remove uma tarefa do banco de dados usando o seu ID.
 */
app.delete("/tarefas/:id", (req, res) => {
  // Pega o ID da URL
  const id_tarefa = req.params.id;

  // Comando de deleção segura baseada no ID único
  db.query(
    "DELETE FROM tarefas WHERE id_tarefa = ?",
    [id_tarefa],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ message: "Tarefa excluída com sucesso!" });
    },
  );
});

// ============================================================================
// 5. INICIALIZAÇÃO DO SERVIDOR
// ============================================================================
// O servidor fica "escutando" as requisições na porta 3000
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
