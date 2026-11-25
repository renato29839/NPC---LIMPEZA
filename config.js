/**
 * CONFIGURAÇÃO DO SISTEMA DE LIMPEZA - NEUROPSICOCENTRO
 *
 * Este é o ÚNICO arquivo que precisa ser editado para:
 *  - adicionar/remover ambientes de uma unidade
 *  - alterar as tarefas de um ambiente
 *  - cadastrar colaboradores (sugestões no campo de nome)
 *  - trocar o endereço do Apps Script
 *
 * ATENÇÃO: os nomes dos ambientes são gravados na planilha. Renomear um
 * ambiente faz com que os registros antigos e novos apareçam separados nos
 * relatórios. Prefira criar um novo ambiente a renomear um existente.
 */

// eslint-disable-next-line no-unused-vars
const CONFIG = {
    versaoApp: '2.1.0',

    envio: {
        // Endereço do Web App do Google Apps Script (o mesmo usado até hoje).
        url: 'https://script.google.com/macros/s/AKfycbxisjHRYbyyMrzi0WAJIP9PwYEtqD7iHBHA8fxFl8DUv2GMIZLlJyX89dMHBVbPQm232g/exec',

        // false = modo compatível: funciona com o Apps Script atual, mas o
        //         navegador não consegue confirmar se a planilha gravou.
        // true  = confirmação real: SÓ ative depois de publicar o arquivo
        //         apps-script/Code.gs (ver README, seção "Ativar confirmação").
        confirmarGravacao: false,

        // Tempo máximo de espera por envio (ms).
        timeoutMs: 20000
    },

    // Sugestões que aparecem ao digitar o nome. Deixe vazio para não sugerir.
    // Ex.: ['Maria Souza', 'João Silva']
    colaboradores: [],

    // Prefixo usado para gerar o código fixo de cada ambiente (ex.: MTZ-SALA-12).
    unidades: {
        'Unidade Matriz': { sigla: 'MTZ' },
        'Unidade Sul': { sigla: 'SUL' },
        'Unidade Life': { sigla: 'LIFE' },
        'Unidade Parquelandia': { sigla: 'PQL' }
    },

    // --- BLOCOS PADRÃO DE TAREFAS ---
    checklists: {
        sala: [
            'Retirar lixo individual',
            'Limpar mesas e superfícies',
            'Varrer o chão',
            'Passar pano com desinfetante',
            'Limpar marcas de dedos em vidros/portas'
        ],
        copa: [
            'Limpar balcão e mesas',
            'Lavar pia e organizar louça',
            'Retirar lixo orgânico e reciclável',
            'Passar pano no chão com desinfetante',
            'Verificar limpeza externa do micro-ondas'
        ],
        jardim: [
            'Varrer folhas e resíduos do chão',
            'Esvaziar lixeiras externas',
            'Verificar limpeza de bancos e superfícies',
            'Organizar brinquedos/equipamentos externos'
        ],
        estacionamento: [
            'Varrer área de circulação e vagas',
            'Retirar lixo e resíduos acumulados',
            'Verificar limpeza de portões e grades'
        ],
        salaoTerapeutico: [
            'Higienizar colchonetes, pufes e tatames',
            'Organizar brinquedos e materiais terapêuticos',
            'Varrer e passar pano com desinfetante no piso',
            'Retirar lixo local',
            'Limpar marcas de dedos em espelhos e vidros'
        ],
        recepcao: [
            'Limpar balcão de atendimento',
            'Organizar poltronas/revistas',
            'Limpar vidros/portas de entrada',
            'Aspirar tapete / Passar pano'
        ],
        recepcaoExpansao: [
            'Limpeza de superfícies e mesas',
            'Organizar cadeiras',
            'Retirar lixo local',
            'Passar pano no piso'
        ]
    },

    // --- TAREFAS POR AMBIENTE ---
    // O valor pode ser uma lista de tarefas OU o nome de um bloco em "checklists".
    tarefasPorLocal: {
        'Banheiro Masculino': [
            'Higienização do vaso e mictório',
            'Limpeza da pia e espelho',
            'Reposição de papel/sabonete',
            'Troca de lixo',
            'Lavar o piso'
        ],
        'Banheiro Feminino': [
            'Higienização dos vasos sanitários',
            'Limpeza da pia e espelho',
            'Reposição de papel/sabonete/produtos',
            'Troca de lixos',
            'Lavar o piso'
        ],
        'Recepção Principal': 'recepcao',
        Recepção: 'recepcao',
        'Recepção Expansão 1': 'recepcaoExpansao',
        'Recepção Expansão 2': 'recepcaoExpansao',
        'Área espera expansão': ['Organizar poltronas/cadeiras', 'Retirar lixos', 'Passar pano no piso'],
        Copa: 'copa',
        'Copa 1': 'copa',
        'Copa 2': 'copa',
        'Área Comum/Hall': [
            'Limpar corrimãos/maçanetas',
            'Organizar mobiliário comum',
            'Varrer e passar pano nas áreas de circulação'
        ],
        'Área de lavanderia': [
            'Limpar pias e tanques de lavagem',
            'Organizar produtos de limpeza',
            'Varrer e lavar o piso',
            'Retirar lixo acumulado'
        ],
        'Sala de RH': 'sala',
        'Sala do marketing': 'sala',
        'Sala marketing': 'sala',
        'Sala da ouvidoria': 'sala',
        'Sala supervisão (Ouvidoria)': 'sala',
        'Sala TI': 'sala',
        'Sala cobrança': 'sala',
        'Sala NAC': 'sala',
        Diretoria: 'sala',
        'Casa do chefe': 'sala',
        'Sala SAC': 'sala',
        'Sala FINANCEIRO': 'sala',
        'Sala da supervisão': 'sala',
        'Sala supervisor': 'sala',
        'Salão TO': 'salaoTerapeutico',
        'Salão expansão 1': 'salaoTerapeutico',
        'Salão expansão': 'salaoTerapeutico',
        'Mini Salão': 'salaoTerapeutico',
        'Salão psicomotricidade': 'salaoTerapeutico',
        'Salão IS': 'salaoTerapeutico',
        'Salão Fisioterapia': 'salaoTerapeutico',
        'Salão 1': 'salaoTerapeutico',
        'Salão 2': 'salaoTerapeutico',
        'Jardim expansão': 'jardim',
        'Parquinho lanchonete': 'jardim',
        'Jardim externo': 'jardim',
        'Jardim vilinha': 'jardim',
        'Área jardim parquinho': 'jardim',
        'Área jardim interno (copa)': 'jardim',
        'Jardim Interno': 'jardim',
        'Área Externa': 'jardim',
        'Área de estacionamento externo': 'estacionamento',
        Estacionamentos: 'estacionamento'
    },

    // Salas numeradas ("Sala 1", "Sala 2", ...) usam o bloco "sala".
    // Aqui se define quantas salas numeradas cada unidade tem.
    salasNumeradas: {
        'Unidade Matriz': 50,
        'Unidade Life': 20,
        'Unidade Sul': 20,
        'Unidade Parquelandia': 14
    },

    // --- AMBIENTES DE CADA UNIDADE (as salas numeradas entram automaticamente) ---
    ambientesPorUnidade: {
        'Unidade Matriz': [
            'Recepção Principal', 'Recepção Expansão 1', 'Recepção Expansão 2', 'Área espera expansão',
            'Área Comum/Hall', 'Banheiro Masculino', 'Banheiro Feminino', 'Copa 1', 'Copa 2',
            'Sala de RH', 'Sala do marketing', 'Sala marketing', 'Sala da ouvidoria',
            'Sala supervisão (Ouvidoria)', 'Sala TI', 'Sala cobrança', 'Sala NAC', 'Diretoria',
            'Salão TO', 'Salão expansão 1', 'Salão expansão', 'Mini Salão', 'Salão psicomotricidade',
            'Jardim expansão', 'Área de estacionamento externo', 'Parquinho lanchonete'
        ],
        'Unidade Life': [
            'Recepção Principal', 'Recepção Expansão 1', 'Recepção Expansão 2', 'Área Comum/Hall',
            'Banheiro Masculino', 'Banheiro Feminino', 'Copa 1', 'Copa 2',
            'Sala de RH', 'Sala do marketing', 'Sala da ouvidoria', 'Casa do chefe',
            'Salão IS', 'Salão Fisioterapia', 'Salão TO', 'Jardim externo', 'Jardim vilinha'
        ],
        'Unidade Sul': [
            'Recepção Principal', 'Área Comum/Hall', 'Área de lavanderia',
            'Banheiro Masculino', 'Banheiro Feminino', 'Copa 1',
            'Sala SAC', 'Sala FINANCEIRO', 'Sala da supervisão', 'Sala TI',
            'Salão 1', 'Salão 2', 'Salão psicomotricidade',
            'Área jardim parquinho', 'Área jardim interno (copa)', 'Estacionamentos'
        ],
        'Unidade Parquelandia': [
            'Recepção', 'Copa', 'Sala supervisor', 'Salão TO', 'Salão psicomotricidade',
            'Jardim Interno', 'Área Externa'
        ]
    }
};
