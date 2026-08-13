/**
 * SISTEMA DE CONTROLE DE LIMPEZA - NEUROPSICOCENTRO
 */

// --- BLOCOS PADRÃO DE TAREFAS ---
const checklistPadraoSala = [
    "Retirar lixo individual",
    "Limpar mesas e superfícies",
    "Varrer o chão",
    "Passar pano com desinfetante",
    "Limpar marcas de dedos em vidros/portas"
];

const checklistPadraoCopa = [
    "Limpar balcão e mesas",
    "Lavar pia e organizar louça",
    "Retirar lixo orgânico e reciclável",
    "Passar pano no chão com desinfetante",
    "Verificar limpeza externa do micro-ondas"
];

const checklistPadraoJardimAreaExterna = [
    "Varrer folhas e resíduos do chão",
    "Esvaziar lixeiras externas",
    "Verificar limpeza de bancos e superfícies",
    "Organizar brinquedos/equipamentos externos"
];

const checklistPadraoEstacionamento = [
    "Varrer área de circulação e vagas",
    "Retirar lixo e resíduos acumulados",
    "Verificar limpeza de portões e grades"
];

const checklistPadraoSalãoTerapeutico = [
    "Higienizar colchonetes, pufes e tatames",
    "Organizar brinquedos e materiais terapêuticos",
    "Varrer e passar pano com desinfetante no piso",
    "Retirar lixo local",
    "Limpar marcas de dedos em espelhos e vidros"
];

// --- BANCO DE DADOS CENTRAL DE TAREFAS POR AMBIENTE ---
const tarefasPorLocal = {
    // Banheiros
    "Banheiro Masculino": [
        "Higienização do vaso e mictório",
        "Limpeza da pia e espelho",
        "Reposição de papel/sabonete",
        "Troca de lixo",
        "Lavar o piso"
    ],
    "Banheiro Feminino": [
        "Higienização dos vasos sanitários",
        "Limpeza da pia e espelho",
        "Reposição de papel/sabonete/produtos",
        "Troca de lixos",
        "Lavar o piso"
    ],

    // Recepções e Áreas de Espera
    "Recepção Principal": [
        "Limpar balcão de atendimento",
        "Organizar poltronas/revistas",
        "Limpar vidros/portas de entrada",
        "Aspirar tapete / Passar pano"
    ],
    "Recepção Expansão 1": [
        "Limpeza de superfícies e mesas",
        "Organizar cadeiras",
        "Retirar lixo local",
        "Passar pano no piso"
    ],
    "Recepção Expansão 2": [
        "Limpeza de superfícies e mesas",
        "Organizar cadeiras",
        "Retirar lixo local",
        "Passar pano no piso"
    ],
    "Área espera expansão": [
        "Organizar poltronas/cadeiras",
        "Retirar lixos",
        "Passar pano no piso"
    ],

    // Áreas Comuns e Copas
    "Copa 1": checklistPadraoCopa,
    "Copa 2": checklistPadraoCopa,
    "Área Comum/Hall": [
        "Limpar corrimãos/maçanetas",
        "Organizar mobiliário comum",
        "Varrer e passar pano nas áreas de circulação"
    ],
    "Área de lavanderia": [
        "Limpar pias e tanques de lavagem",
        "Organizar produtos de limpeza",
        "Varrer e lavar o piso",
        "Retirar lixo acumulado"
    ],

    // Salas Administrativas e Técnicas
    "Sala de RH": checklistPadraoSala,
    "Sala do marketing": checklistPadraoSala,
    "Sala marketing": checklistPadraoSala,
    "Sala da ouvidoria": checklistPadraoSala,
    "Sala supervisão (Ouvidoria)": checklistPadraoSala,
    "Sala TI": checklistPadraoSala,
    "Sala cobrança": checklistPadraoSala,
    "Sala NAC": checklistPadraoSala,
    "Diretoria": checklistPadraoSala,
    "Casa do chefe": checklistPadraoSala,
    "Sala SAC": checklistPadraoSala,
    "Sala FINANCEIRO": checklistPadraoSala,
    "Sala da supervisão": checklistPadraoSala,

    // Salões e Áreas Terapêuticas
    "Salão TO": checklistPadraoSalãoTerapeutico,
    "Salão expansão 1": checklistPadraoSalãoTerapeutico,
    "Salão expansão": checklistPadraoSalãoTerapeutico,
    "Mini Salão": checklistPadraoSalãoTerapeutico,
    "Salão psicomotricidade": checklistPadraoSalãoTerapeutico,
    "Salão IS": checklistPadraoSalãoTerapeutico,
    "Salão Fisioterapia": checklistPadraoSalãoTerapeutico,
    "Salão 1": checklistPadraoSalãoTerapeutico,
    "Salão 2": checklistPadraoSalãoTerapeutico,

    // Áreas Externas, Jardins e Estacionamentos
    "Jardim expansão": checklistPadraoJardimAreaExterna,
    "Parquinho lanchonete": checklistPadraoJardimAreaExterna,
    "Jardim externo": checklistPadraoJardimAreaExterna,
    "Jardim vilinha": checklistPadraoJardimAreaExterna,
    "Área jardim parquinho": checklistPadraoJardimAreaExterna,
    "Área jardim interno (copa)": checklistPadraoJardimAreaExterna,
    "Área de estacionamento externo": checklistPadraoEstacionamento,
    "Estacionamentos": checklistPadraoEstacionamento
};

// Adiciona dinamicamente as salas numeradas (Sala 1 até Sala 50)
for (let i = 1; i <= 50; i++) {
    tarefasPorLocal[`Sala ${i}`] = checklistPadraoSala;
}

// --- AMBIENTES ORGANIZADOS POR UNIDADE ---
const ambientesPorUnidade = {
    "Unidade Matriz": [
        "Recepção Principal", "Recepção Expansão 1", "Recepção Expansão 2", "Área espera expansão", "Área Comum/Hall",
        "Banheiro Masculino", "Banheiro Feminino", "Copa 1", "Copa 2",
        "Sala de RH", "Sala do marketing", "Sala marketing", "Sala da ouvidoria", "Sala supervisão (Ouvidoria)", 
        "Sala TI", "Sala cobrança", "Sala NAC", "Diretoria",
        "Salão TO", "Salão expansão 1", "Salão expansão", "Mini Salão", "Salão psicomotricidade",
        "Jardim expansão", "Área de estacionamento externo", "Parquinho lanchonete",
        ...Array.from({ length: 50 }, (_, i) => `Sala ${i + 1}`)
    ],

    "Unidade Life": [
        "Recepção Principal", "Recepção Expansão 1", "Recepção Expansão 2", "Área Comum/Hall",
        "Banheiro Masculino", "Banheiro Feminino", "Copa 1", "Copa 2",
        "Sala de RH", "Sala do marketing", "Sala da ouvidoria", "Casa do chefe",
        "Salão IS", "Salão Fisioterapia", "Salão TO",
        "Jardim externo", "Jardim vilinha",
        ...Array.from({ length: 20 }, (_, i) => `Sala ${i + 1}`)
    ],

    "Unidade Sul": [
        "Recepção Principal", "Área Comum/Hall", "Área de lavanderia",
        "Banheiro Masculino", "Banheiro Feminino", "Copa 1",
        "Sala SAC", "Sala FINANCEIRO", "Sala da supervisão", "Sala TI",
        "Salão 1", "Salão 2", "Salão psicomotricidade",
        "Área jardim parquinho", "Área jardim interno (copa)", "Estacionamentos",
        ...Array.from({ length: 20 }, (_, i) => `Sala ${i + 1}`)
    ]
};

// --- ELEMENTOS DO DOM ---
const unidadeSelect = document.getElementById('unidade-select');
const localSelect = document.getElementById('local-select');
const containerTarefas = document.getElementById('container-tarefas');
const listaTarefas = document.getElementById('lista-tarefas');
const btnEnviar = document.getElementById('btn-enviar');
const form = document.getElementById('form-limpeza');
const loading = document.getElementById('loading');
const obsTextarea = document.getElementById('observacoes');
const obsChars = document.getElementById('obs-chars');

// --- FUNÇÕES AUXILIARES DE UI ---
function limparErroField(fieldId) {
    const field = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId}-error`);
    if (field) {
        field.classList.remove('border-red-500', 'ring-red-200');
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.classList.add('hidden');
        }
    }
}

function mostrarSucesso() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('hidden');
    document.getElementById('btn-close-success').onclick = () => {
        modal.classList.add('hidden');
    };
}

function mostrarErro(mensagem) {
    const modal = document.getElementById('error-modal');
    document.getElementById('error-message').textContent = mensagem;
    modal.classList.remove('hidden');
    document.getElementById('btn-close-error').onclick = () => {
        modal.classList.add('hidden');
    };
}

function atualizarContadorTarefas() {
    const total = document.querySelectorAll('#lista-tarefas input[type="checkbox"]').length;
    const concluidas = document.querySelectorAll('#lista-tarefas input[type="checkbox"]:checked').length;
    const contador = document.getElementById('tarefas-contador');
    if (contador && total > 0) {
        contador.textContent = `${concluidas} de ${total} tarefas realizadas`;
    }
}

// --- EVENTOS DE INTERAÇÃO ---
unidadeSelect.addEventListener('change', function(e) {
    const unidade = e.target.value;
    localSelect.innerHTML = '<option value="">Selecione o local...</option>';
    containerTarefas.classList.add('hidden');
    btnEnviar.disabled = true;

    if (unidade && ambientesPorUnidade[unidade]) {
        localSelect.disabled = false;
        // Remove as classes que exibem o cursor de bloqueio
        localSelect.classList.remove('cursor-not-allowed', 'disabled:opacity-60');
        localSelect.classList.add('cursor-pointer');
        
        ambientesPorUnidade[unidade].forEach(function(ambiente) {
            const opt = document.createElement('option');
            opt.value = ambiente;
            opt.textContent = ambiente;
            localSelect.appendChild(opt);
        });
    } else {
        localSelect.disabled = true;
        // Restaura a classe visual de bloqueio se nenhuma unidade estiver selecionada
        localSelect.classList.add('cursor-not-allowed');
        localSelect.classList.remove('cursor-pointer');
    }
});

localSelect.addEventListener('change', function(e) {
    const local = e.target.value;
    listaTarefas.innerHTML = '';

    if (local && tarefasPorLocal[local]) {
        containerTarefas.classList.remove('hidden');
        tarefasPorLocal[local].forEach(function(tarefa, index) {
            const div = document.createElement('div');
            div.className = "flex items-center p-4 bg-white border-2 border-gray-200 rounded-lg cursor-pointer transition";
            
            div.innerHTML = `
                <input type="checkbox" id="t-${index}" value="${tarefa}" class="w-5 h-5 accent-teal-600 cursor-pointer">
                <label for="t-${index}" class="ml-3 text-sm w-full cursor-pointer select-none">${tarefa}</label>
            `;

            const cb = div.querySelector('input');
            cb.addEventListener('change', function() {
                div.classList.toggle('card-checked', cb.checked);
                atualizarContadorTarefas();
            });

            listaTarefas.appendChild(div);
        });

        atualizarContadorTarefas();
        btnEnviar.disabled = false;
        btnEnviar.className = "w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg cursor-pointer transition";
    } else {
        containerTarefas.classList.add('hidden');
        btnEnviar.disabled = true;
        btnEnviar.className = "w-full bg-gray-300 text-white font-bold py-4 rounded-xl shadow-lg cursor-not-allowed opacity-50";
    }
});

obsTextarea.addEventListener('input', function(e) {
    obsChars.textContent = e.target.value.length;
});

// --- SUBMISSÃO DO FORMULÁRIO ---
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const colaborador = document.getElementById('colaborador').value.trim();
    const unidade = unidadeSelect.value;
    const local = localSelect.value;

    if (!colaborador || !unidade || !local) {
        mostrarErro('Preencha todos os campos obrigatórios');
        return;
    }

    loading.classList.remove('hidden');

    const tarefas = Array.from(document.querySelectorAll('#lista-tarefas input[type="checkbox"]:checked')).map(cb => cb.value);
    const pendentes = Array.from(document.querySelectorAll('#lista-tarefas input[type="checkbox"]:not(:checked)')).map(cb => cb.value);

    const payload = {
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        unidade: unidade,
        colaborador: colaborador,
        local: local,
        concluidas: tarefas.join(', ') || 'Nenhuma',
        pendentes: pendentes.join(', ') || 'Nenhuma',
        observacoes: obsTextarea.value || 'Sem observações'
    };

    try {
        await fetch('https://script.google.com/macros/s/AKfycbxisjHRYbyyMrzi0WAJIP9PwYEtqD7iHBHA8fxFl8DUv2GMIZLlJyX89dMHBVbPQm232g/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(payload)
        });

        mostrarSucesso();
        form.reset();
        containerTarefas.classList.add('hidden');
        localSelect.disabled = true;
        localSelect.classList.add('cursor-not-allowed');
        localSelect.classList.remove('cursor-pointer');
        btnEnviar.disabled = true;
        btnEnviar.className = "w-full bg-gray-300 text-white font-bold py-4 rounded-xl shadow-lg cursor-not-allowed opacity-50";
        obsChars.textContent = '0';

    } catch (error) {
        console.error(error);
        mostrarErro('Erro na transmissão. Verifique sua conexão.');
    } finally {
        loading.classList.add('hidden');
    }
});
