/**
 * ARQUIVO DE SCRIPT DO FRONTEND (INTERFACE)
 * Responsável por dar "vida" à página HTML, capturar as ações do usuário
 * (cliques, preenchimento de formulários) e se comunicar com a API (Backend).
 */

// ============================================================================
// 1. CONFIGURAÇÕES INICIAIS
// ============================================================================
// Define o endereço base do nosso servidor Backend.
// Se um dia o servidor mudar de endereço, você só precisa alterar esta linha.
const API_URL = "http://localhost:3000";

// ============================================================================
// 2. NAVEGAÇÃO DA PÁGINA (SINGLE PAGE APPLICATION - SPA)
// ============================================================================
/**
 * Função para alternar entre as telas do sistema sem recarregar a página.
 * @param {string} id - O ID da tag <section> HTML que deve ser exibida.
 */
async function showSection(id) {
  // Busca todas as tags <section> dentro do <main> e as esconde (display = "none")
  document
    .querySelectorAll("main section")
    .forEach((s) => (s.style.display = "none"));

  // Pega a seção específica que o usuário clicou e a torna visível (display = "block")
  document.getElementById(id).style.display = "block";

  // Lógica de Inteligência de Tela:
  // Se o usuário abriu o Kanban, pede para o sistema buscar as tarefas no banco.
  if (id === "gerenciar") renderkanban();

  // Se o usuário abriu a tela de Nova Tarefa, busca a lista de usuários
  // para preencher a caixinha de seleção (dropdown).
  if (id === "cadastro-tarefa") updateUsersSelect();
}

// ============================================================================
// 3. EVENTOS DE FORMULÁRIO (CADASTROS)
// ============================================================================

/**
 * Evento acionado quando o usuário clica em "Salvar" no Cadastro de Usuário.
 */
document.getElementById("form-usuario").onsubmit = async (e) => {
  // e.preventDefault() impede que a página recarregue (comportamento padrão de formulários web).
  e.preventDefault();

  // Captura o que o usuário digitou nos campos de texto
  const nome = document.getElementById("user-nome").value;
  const email = document.getElementById("user-email").value;

  // Validação básica de segurança (Front-end)
  if (!email.includes("@")) return alert("Email inválido");

  // Faz uma requisição POST para a API enviar os dados para o Banco
  const response = await fetch(`${API_URL}/usuario`, {
    method: "POST", // Método para criar dados
    headers: { "Content-Type": "application/json" }, // Avisa a API que estamos mandando um arquivo JSON
    body: JSON.stringify({ nome, email }), // Transforma as variáveis JavaScript em texto JSON
  });

  // Se o Backend responder com OK (Status 200), deu certo!
  if (response.ok) {
    alert("Cadastro concluído com sucesso");
    e.target.reset(); // Limpa os campos do formulário automaticamente
  }
};

/**
 * Evento acionado quando o usuário clica em "Salvar" no Cadastro de Tarefa.
 */
document.getElementById("form-tarefa").onsubmit = async (e) => {
  e.preventDefault(); // Impede o recarregamento da página

  // Agrupa todos os dados do formulário em um único objeto (Dicionário)
  const taskdata = {
    id_usuario: document.getElementById("task-usuario").value,
    descricao: document.getElementById("task-descricao").value,
    setor: document.getElementById("task-setor").value,
    prioridade: document.getElementById("task-prioridade").value,
  };

  // Envia os dados para a API na rota de tarefas
  const response = await fetch(`${API_URL}/tarefas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskdata),
  });

  if (response.ok) {
    alert("Tarefa criada com sucesso");
    e.target.reset(); // Limpa o formulário
    showSection("gerenciar"); // Redireciona o usuário direto para a tela do Kanban!
  }
};

// ============================================================================
// 4. LÓGICA DO KANBAN (RENDERIZAÇÃO E MANIPULAÇÃO)
// ============================================================================

/**
 * Função principal do sistema. Busca as tarefas no banco de dados
 * e desenha os cartões virtuais nas colunas corretas.
 */
async function renderkanban() {
  // Faz uma requisição GET (padrão do fetch) para buscar todas as tarefas
  const response = await fetch(`${API_URL}/tarefas`);

  // Converte a resposta do Backend de volta para um Array de objetos JavaScript
  const tarefas = await response.json();

  // Dicionário de Tradução: Mapeia o status do Banco de Dados para a ID da coluna HTML
  // NOTA: "feito" é o status salvo no banco, "col-pronto" é a div onde ele vai aparecer.
  const cols = {
    "a fazer": "col-a-fazer",
    fazendo: "col-fazendo",
    feito: "col-pronto",
  };

  // Varre todas as 3 colunas HTML e apaga o conteúdo de dentro delas
  // (Isso evita que tarefas sejam duplicadas na tela ao atualizar)
  Object.values(cols).forEach(
    (id) => (document.querySelector(`#${id} .cards`).innerHTML = ""),
  );

  // Para cada tarefa vinda do banco (ForEach), cria um elemento HTML dinamicamente
  tarefas.forEach((t) => {
    // Cria a div principal do cartãozinho
    const card = document.createElement("div");
    card.className = "card";

    // Insere os textos e botões dentro do cartão (Usando Template Literals ``)
    card.innerHTML = `
            <p><Strong>Descrição:</Strong> ${t.descricao}</p>
            <p><Strong>Setor:</Strong> ${t.setor}</p>
            <p><Strong>Prioridade:</Strong> ${t.prioridade}</p>
            <p><Strong>Vinculado:</Strong> ${t.usuario_nome}</p>
            <div>
                <button onclick="deleteTask(${t.id_tarefa})">Excluir</button>
                
                <select onchange="updateStatus(${t.id_tarefa}, this.value)">
                    <option value="a fazer" ${t.status_tarefa === "a fazer" ? "selected" : ""}>A fazer</option>
                    <option value="fazendo" ${t.status_tarefa === "fazendo" ? "selected" : ""}>Fazendo</option>
                    <option value="feito" ${t.status_tarefa === "feito" ? "selected" : ""}>Pronto</option>
                </select>
            </div>
        `;

    // Descobre em qual coluna (A Fazer, Fazendo, Pronto) esse cartão pertence e o "cola" lá
    document
      .querySelector(`#${cols[t.status_tarefa]} .cards`)
      .appendChild(card);
  });
}

/**
 * Atualiza o status de uma tarefa no banco de dados quando o Select é alterado.
 * @param {number} id - O ID da tarefa
 * @param {string} newStatus - O novo status escolhido ('a fazer', 'fazendo' ou 'feito')
 */
async function updateStatus(id, newStatus) {
  // Faz uma requisição PUT informando qual tarefa deve mudar de coluna
  await fetch(`${API_URL}/tarefas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status_tarefa: newStatus }),
  });

  // Após o banco atualizar com sucesso, recarrega o Kanban visualmente
  renderkanban();
}

/**
 * Deleta uma tarefa após confirmação do usuário.
 * @param {number} id - O ID da tarefa a ser apagada
 */
async function deleteTask(id) {
  // Mostra um popup na tela perguntando se o usuário tem certeza
  if (confirm("Confirma a exclusão?")) {
    // Se sim, envia um método DELETE para a API
    await fetch(`${API_URL}/tarefas/${id}`, { method: "DELETE" });

    // Recarrega o Kanban para o cartão sumir da tela
    renderkanban();
  }
}

// ============================================================================
// 5. FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Busca a lista de usuários no banco e cria as opções do `<select>`
 * dentro do formulário "Cadastrar Nova Tarefa".
 */
async function updateUsersSelect() {
  const response = await fetch(`${API_URL}/usuario`);
  const usuarios = await response.json();
  const select = document.getElementById("task-usuario");

  // Transforma a lista de usuários em várias tags <option> e injeta no HTML
  select.innerHTML = usuarios
    .map((u) => `<option value="${u.id_usuario}">${u.nome}</option>`)
    .join("");
}

// ============================================================================
// 6. INICIALIZAÇÃO DA PÁGINA
// ============================================================================
// Assim que a página abre, força o sistema a ir para a tela do Kanban.
showSection("gerenciar");
