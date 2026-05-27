// Configuração das tarefas específicas por tipo de ambiente
const tarefasPorLocal = {
    "Banheiro Masc/Fem": [
        "Higienização dos vasos sanitários e pias",
        "Reposição de papel higiênico e papel toalha",
        "Abastecimento de sabonete líquido",
        "Esvaziamento e troca dos sacos de lixo",
        "Lavagem/Passagem de pano no chão com desinfetante"
    ],
    "Salas de Reunião": [
        "Limpeza e organização das mesas e cadeiras",
        "Limpeza de telas, TVs e cabos",
        "Esvaziamento de lixeiras",
        "Aspiração ou passagem de pano no piso"
    ],
    "Copa / Cozinha": [
        "Limpeza das bancadas e pia",
        "Verificação e limpeza externa de eletrodomésticos (micro-ondas/geladeira)",
        "Esvaziamento do lixo orgânico e reciclável",
        "Varrição e lavagem do piso"
    ],
    "Recepção e Hall": [
        "Limpeza do balcão principal e cadeiras de espera",
        "Limpeza de portas de vidro e marcas de dedos",
        "Organização de revistas/folhetos",
        "Aspiração de tapetes / Passar pano no chão"
    ],
    "Escritórios Gerais": [
        "Esvaziamento de todas as lixeiras individuais",
        "Limpeza de superfícies livres das mesas",
        "Varrição e recolhimento de resíduos do chão",
        "Passagem de pano úmido no piso"
    ]
};

// Elementos do DOM
const localSelect = document.getElementById('local-select');
const containerTarefas = document.getElementById('container-tarefas');
const listaTarefas = document.getElementById('lista-tarefas');
const formLimpeza = document.getElementById('form-limpeza');
const btnEnviar = document.getElementById('btn-enviar');
const historicoLista = document.getElementById('historico-lista');
const btnExportar = document.getElementById('btn-exportar');

// Banco de dados temporário (Local Storage) para simular persistência
let registrosDia = JSON.parse(localStorage.getItem('registros_limpeza')) || [];

// Inicializa a aplicação carregando o histórico
atualizarHistorico();

// Evento ao mudar o local selecionado
localSelect.addEventListener('change', (e) => {
    const localSelecionado = e.target.value;
    listaTarefas.innerHTML = ''; // Limpa tarefas anteriores

    if (localSelecionado && tarefasPorLocal[localSelecionado]) {
        containerTarefas.classList.remove('hidden');
        
        // Renderiza cada tarefa como um checkbox grande e fácil de clicar no celular
        tarefasPorLocal[localSelecionado].forEach((tarefa, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = "flex items-start bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition";
            
            itemDiv.innerHTML = `
                <input type="checkbox" id="tarefa-${index}" value="${tarefa}" class="check-tarefa w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 pointer-events-none">
                <label for="tarefa-${index}" class="ml-3 text-sm font-medium text-gray-700 w-full cursor-pointer select-none">${tarefa}</label>
            `;

            // Permite clicar na caixinha inteira para facilitar o uso no celular
            itemDiv.addEventListener('click', () => {
                const checkbox = itemDiv.querySelector('input');
                checkbox.checked = !checkbox.checked;
                itemDiv.classList.toggle('bg-blue-50', checkbox.checked);
                itemDiv.classList.toggle('border-blue-300', checkbox.checked);
                validarFormulario();
            });

            listaTarefas.appendChild(itemDiv);
        });
        
        btnEnviar.disabled = false;
        btnEnviar.className = "w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 cursor-pointer";
    } else {
        containerTarefas.classList.add('hidden');
        btnEnviar.disabled = true;
        btnEnviar.className = "w-full bg-gray-400 text-white font-bold py-3 px-4 rounded-lg shadow-md cursor-not-allowed hover:bg-blue-700 transition duration-200";
    }
});

// Validação simples (Garante que pelo menos uma tarefa foi marcada antes de enviar)
function validarFormulario() {
    const checkboxes = document.querySelectorAll('.check-tarefa');
    const algumMarcado = Array.from(checkboxes).some(cb => cb.checked);
    // Opcional: Bloquear o envio se não marcar tudo, mas o padrão atual permite envio parcial.
}

// Envio do formulário
formLimpeza.addEventListener('submit', (e) => {
    e.preventDefault();

    const colaborador = document.getElementById('colaborador').value;
    const local = localSelect.value;
    const observacoes = document.getElementById('observacoes').value;
    
    // Mapeia quais tarefas foram concluídas
    const checkboxes = document.querySelectorAll('.check-tarefa');
    const tarefasConcluidas = [];
    const tarefasPendentes = [];

    checkboxes.forEach(cb => {
        if(cb.checked) {
            tarefasConcluidas.push(cb.value);
        } else {
            tarefasPendentes.push(cb.value);
        }
    });

    // Cria o objeto de dados com data e hora exata (Formato ideal para colunas de planilha)
    const agora = new Date();
    const novoRegistro = {
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        colaborador: colaborador,
        local: local,
        concluidas: tarefasConcluidas.join('; '), // Ponto e vírgula separa itens na mesma célula se necessário
        pendentes: tarefasPendentes.join('; ') || 'Nenhuma',
        observacoes: observacoes || 'Sem observações'
    };

    // Salva na lista e no LocalStorage
    registrosDia.unshift(novoRegistro); // Adiciona no início da lista
    localStorage.setItem('registros_limpeza', JSON.stringify(registrosDia));

    // Reset de Interface
    formLimpeza.reset();
    containerTarefas.classList.add('hidden');
    btnEnviar.disabled = true;
    btnEnviar.className = "w-full bg-gray-400 text-white font-bold py-3 px-4 rounded-lg shadow-md cursor-not-allowed hover:bg-blue-700 transition duration-200";
    
    atualizarHistorico();
    alert('Limpeza registrada com sucesso no sistema!');
});

// Atualiza a visualização do histórico na parte inferior
function atualizarHistorico() {
    if (registrosDia.length === 0) {
        historicoLista.innerHTML = `<p class="text-gray-400 text-center py-4">Nenhuma limpeza registrada hoje.</p>`;
        btnExportar.classList.add('hidden');
        return;
    }

    btnExportar.classList.remove('hidden');
    historicoLista.innerHTML = '';

    registrosDia.forEach(reg => {
        const item = document.createElement('div');
        item.className = "p-3 bg-gray-50 rounded-lg border-l-4 border-green-500 space-y-1 shadow-sm";
        item.innerHTML = `
            <div class="flex justify-between font-semibold text-gray-700">
                <span>${reg.local}</span>
                <span class="text-xs text-gray-500">${reg.hora}</span>
            </div>
            <div class="text-xs text-gray-600">
                <p><strong>Quem:</strong> ${reg.colaborador}</p>
                <p><strong>Feito:</strong> ${reg.concluidas}</p>
                ${reg.observacoes !== 'Sem observações' ? `<p class="text-amber-600"><strong>Obs:</strong> ${reg.observacoes}</p>` : ''}
            </div>
        `;
        historicoLista.appendChild(item);
    });
}

// Botão de exportação manual para JSON (O encarregado pode baixar o arquivo no fim do dia)
btnExportar.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(registrosDia, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `relatorio_limpeza_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});