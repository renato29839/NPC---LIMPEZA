/**
 * NPC LIMPEZA - Google Apps Script (versão 2)
 *
 * O QUE MUDA EM RELAÇÃO À VERSÃO ATUAL
 *  - A ABA PRINCIPAL CONTINUA IGUAL: cada valor é gravado na coluna cujo
 *    cabeçalho tem o mesmo nome (Data, Hora, Unidade, Colaborador, Local,
 *    Concluídas, Pendentes, Observações). Nenhuma coluna é criada, movida ou
 *    apagada nessa aba, então fórmulas, filtros e gráficos continuam valendo.
 *  - Duas abas NOVAS são criadas automaticamente para análise:
 *      "Registros_Detalhe" -> 1 linha por registro, com códigos e números
 *      "Tarefas_Detalhe"   -> 1 linha por tarefa (concluída ou pendente)
 *  - Responde ao app se gravou ou não (permite a "confirmação real").
 *  - Nunca grava o mesmo registro duas vezes (usa o id_registro).
 *  - Protege contra fórmulas maliciosas digitadas nas observações.
 *
 * COMO PUBLICAR SEM PERDER A URL: veja apps-script/README.md.
 */

// ===================== CONFIGURAÇÃO =====================
// Nome da aba que recebe os registros hoje. Deixe '' para usar a primeira aba.
var ABA_PRINCIPAL = '';
var ABA_DETALHE = 'Registros_Detalhe';
var ABA_TAREFAS = 'Tarefas_Detalhe';
var VERSAO_SCRIPT = '2.0.0';

// Cabeçalho usado SOMENTE se a aba principal estiver totalmente vazia.
var CABECALHO_PADRAO = ['Data', 'Hora', 'Unidade', 'Colaborador', 'Local', 'Concluídas', 'Pendentes', 'Observações'];

// Nome de coluna (sem acento, minúsculo, só letras/números) -> campo enviado pelo app.
var APELIDOS = {
    data: 'data',
    dia: 'data',
    hora: 'hora',
    horario: 'hora',
    unidade: 'unidade',
    filial: 'unidade',
    unidadefilial: 'unidade',
    colaborador: 'colaborador',
    nome: 'colaborador',
    nomedocolaborador: 'colaborador',
    funcionario: 'colaborador',
    local: 'local',
    ambiente: 'local',
    sala: 'local',
    concluidas: 'concluidas',
    tarefasconcluidas: 'concluidas',
    realizadas: 'concluidas',
    tarefasrealizadas: 'concluidas',
    pendentes: 'pendentes',
    tarefaspendentes: 'pendentes',
    naorealizadas: 'pendentes',
    observacoes: 'observacoes',
    observacao: 'observacoes',
    obs: 'observacoes',
    // colunas novas, caso você queira acrescentá-las manualmente na aba principal:
    idregistro: 'id_registro',
    codigoambiente: 'codigo_ambiente',
    percentualconclusao: 'percentual_conclusao',
    percentual: 'percentual_conclusao'
};

var COLUNAS_DETALHE = [
    'id_registro', 'recebido_em', 'timestamp_iso', 'data', 'hora', 'unidade', 'codigo_ambiente', 'local',
    'colaborador', 'total_tarefas', 'qtd_concluidas', 'percentual_conclusao', 'concluidas', 'pendentes',
    'observacoes', 'enviado_offline', 'tentativas', 'versao_app'
];

var COLUNAS_TAREFAS = [
    'id_registro', 'recebido_em', 'data', 'unidade', 'codigo_ambiente', 'local', 'colaborador', 'tarefa', 'status'
];

// ===================== ENTRADAS =====================

/** Recebe os registros enviados pelo app. */
function doPost(e) {
    var lock = LockService.getScriptLock();
    try {
        lock.waitLock(20000);
    } catch (erro) {
        return responder({ ok: false, erro: 'Planilha ocupada. Tente novamente.' });
    }

    try {
        var dados = lerCorpo(e);
        var problema = validar(dados);
        if (problema) return responder({ ok: false, erro: problema });

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var detalhe = obterAba(planilha, ABA_DETALHE, COLUNAS_DETALHE);

        // Registros da versão 1 não têm id: gravados como sempre, sem deduplicação.
        if (dados.id_registro && jaExiste(detalhe, dados.id_registro)) {
            return responder({ ok: true, duplicado: true, id: dados.id_registro });
        }

        var recebidoEm = new Date();
        var principalOk = gravarPrincipal(planilha, dados);
        if (dados.id_registro) {
            gravarDetalhe(detalhe, dados, recebidoEm);
            gravarTarefas(planilha, dados, recebidoEm);
        }
        SpreadsheetApp.flush();

        var resposta = { ok: true, id: dados.id_registro || null };
        if (!principalOk) resposta.aviso = 'Cabeçalho da aba principal não reconhecido; registro salvo apenas em ' + ABA_DETALHE;
        return responder(resposta);
    } catch (erro) {
        console.error(erro);
        return responder({ ok: false, erro: 'Erro ao gravar na planilha: ' + erro.message });
    } finally {
        lock.releaseLock();
    }
}

/** Teste rápido: abrir a URL do Web App no navegador deve mostrar {"ok":true,...}. */
function doGet() {
    return responder({ ok: true, servico: 'npc-limpeza', versao: VERSAO_SCRIPT });
}

// ===================== GRAVAÇÃO =====================

/** Aba principal: grava cada campo na coluna de mesmo nome, sem mexer na estrutura. */
function gravarPrincipal(planilha, dados) {
    var aba = ABA_PRINCIPAL ? planilha.getSheetByName(ABA_PRINCIPAL) : planilha.getSheets()[0];
    if (!aba) throw new Error('Aba "' + ABA_PRINCIPAL + '" não encontrada.');

    if (aba.getLastRow() === 0) aba.appendRow(CABECALHO_PADRAO);

    var cabecalho = aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1)).getValues()[0];
    var reconhecidas = 0;
    var linha = cabecalho.map(function (titulo) {
        var campo = APELIDOS[normalizar(titulo)];
        if (!campo) return '';
        reconhecidas++;
        return seguro(dados[campo]);
    });

    if (reconhecidas < 3) return false; // cabeçalho inesperado: não arrisca bagunçar a aba
    aba.appendRow(linha);
    return true;
}

function gravarDetalhe(aba, dados, recebidoEm) {
    var linha = COLUNAS_DETALHE.map(function (coluna) {
        if (coluna === 'recebido_em') return recebidoEm;
        if (coluna === 'observacoes') return seguro(dados.observacoes_texto !== undefined ? dados.observacoes_texto : dados.observacoes);
        var v = dados[coluna];
        return typeof v === 'number' || typeof v === 'boolean' ? v : seguro(v);
    });
    aba.appendRow(linha);
}

function gravarTarefas(planilha, dados, recebidoEm) {
    var feitas = Array.isArray(dados.lista_concluidas) ? dados.lista_concluidas : [];
    var pendentes = Array.isArray(dados.lista_pendentes) ? dados.lista_pendentes : [];
    if (!feitas.length && !pendentes.length) return;

    var aba = obterAba(planilha, ABA_TAREFAS, COLUNAS_TAREFAS);
    var base = [
        dados.id_registro, recebidoEm, seguro(dados.data), seguro(dados.unidade),
        seguro(dados.codigo_ambiente), seguro(dados.local), seguro(dados.colaborador)
    ];
    var linhas = feitas
        .map(function (t) { return base.concat([seguro(t), 'Concluída']); })
        .concat(pendentes.map(function (t) { return base.concat([seguro(t), 'Pendente']); }));

    aba.getRange(aba.getLastRow() + 1, 1, linhas.length, COLUNAS_TAREFAS.length).setValues(linhas);
}

// ===================== AUXILIARES =====================

function lerCorpo(e) {
    if (!e || !e.postData || !e.postData.contents) throw new Error('Requisição sem dados.');
    return JSON.parse(e.postData.contents);
}

function validar(d) {
    if (!d || typeof d !== 'object') return 'Dados inválidos.';
    var obrigatorios = ['data', 'hora', 'unidade', 'colaborador', 'local'];
    for (var i = 0; i < obrigatorios.length; i++) {
        var v = d[obrigatorios[i]];
        if (v === undefined || v === null || String(v).trim() === '') return 'Campo obrigatório ausente: ' + obrigatorios[i];
    }
    if (String(d.colaborador).length > 80) return 'Nome do colaborador muito longo.';
    if (String(d.observacoes || '').length > 600) return 'Observações muito longas.';
    if (d.id_registro && !/^[A-Za-z0-9-]{8,64}$/.test(String(d.id_registro))) return 'id_registro inválido.';
    return null;
}

function obterAba(planilha, nome, colunas) {
    var aba = planilha.getSheetByName(nome);
    if (!aba) {
        aba = planilha.insertSheet(nome);
        aba.appendRow(colunas);
        aba.setFrozenRows(1);
        aba.getRange(1, 1, 1, colunas.length).setFontWeight('bold');
    }
    return aba;
}

function jaExiste(abaDetalhe, id) {
    var cache = CacheService.getScriptCache();
    if (cache.get('id:' + id)) return true;
    var ultima = abaDetalhe.getLastRow();
    var existe = ultima > 1 &&
        abaDetalhe.getRange(2, 1, ultima - 1, 1).createTextFinder(String(id)).matchEntireCell(true).findNext() !== null;
    if (!existe) cache.put('id:' + id, '1', 21600); // 6 h
    return existe;
}

/** Evita que um texto como "=IMPORTXML(...)" seja executado como fórmula. */
function seguro(valor) {
    if (valor === undefined || valor === null) return '';
    var s = String(valor);
    return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function normalizar(texto) {
    return String(texto)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function responder(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
