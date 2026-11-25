/**
 * Regras de negócio puras (sem acesso à tela), usadas pelo app e pelos testes.
 * No navegador ficam disponíveis em window.Nucleo; no Node, via require().
 */
(function (raiz, fabrica) {
    const api = fabrica();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        raiz.Nucleo = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const SEM_TAREFAS = 'Nenhuma';
    const SEM_OBSERVACOES = 'Sem observações';
    const PARTICULAS = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

    /** "Sala do marketing" -> "SALA-DO-MARKETING" */
    function slug(texto) {
        return String(texto)
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /** Código fixo do ambiente, ex.: "MTZ-SALA-12". */
    function codigoAmbiente(sigla, local) {
        return `${sigla}-${slug(local)}`;
    }

    // Categorias do menu de ambientes, na ordem em que aparecem.
    const CATEGORIAS = [
        ['Recepção e espera', /^(recepcao|area espera)/],
        ['Banheiros', /^banheiro/],
        ['Copas e apoio', /^(copa|area de lavanderia)/],
        ['Áreas comuns', /^area comum/],
        ['Salões terapêuticos', /^(salao|mini salao)/],
        ['Salas numeradas', /^sala \d+$/],
        ['Salas administrativas', /^(sala|diretoria|casa do chefe)/],
        ['Áreas externas', /^(jardim|parquinho|area|estacionamento)/]
    ];
    const OUTROS = 'Outros';

    function semAcento(texto) {
        return String(texto)
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .trim();
    }

    /** "Salão TO" -> "Salões terapêuticos" */
    function categoria(nomeAmbiente) {
        const n = semAcento(nomeAmbiente);
        const achada = CATEGORIAS.find(([, regra]) => regra.test(n));
        return achada ? achada[0] : OUTROS;
    }

    /** Agrupa os ambientes por categoria (ordem fixa) e ordena por nome, com números em ordem natural. */
    function agruparAmbientes(ambientes) {
        const ordem = CATEGORIAS.map(([nome]) => nome).concat(OUTROS);
        const grupos = new Map(ordem.map((nome) => [nome, []]));
        ambientes.forEach((a) => grupos.get(categoria(a.nome)).push(a));
        return ordem
            .filter((nome) => grupos.get(nome).length)
            .map((nome) => ({
                nome,
                ambientes: grupos
                    .get(nome)
                    .slice()
                    .sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR', { numeric: true, sensitivity: 'base' }))
            }));
    }

    /** "  joão   da silva " -> "João da Silva" */
    function normalizarNome(nome) {
        return String(nome || '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLocaleLowerCase('pt-BR')
            .split(' ')
            .map((parte, i) =>
                i > 0 && PARTICULAS.has(parte) ? parte : parte.charAt(0).toLocaleUpperCase('pt-BR') + parte.slice(1)
            )
            .join(' ');
    }

    /**
     * Transforma o CONFIG em um catálogo pronto para uso:
     *  unidades: [{ nome, sigla, ambientes: [{ nome, codigo, tarefas }] }]
     * Também devolve "problemas" de configuração (ambiente sem tarefas, etc.).
     */
    function montarCatalogo(config) {
        const problemas = [];

        function resolverTarefas(local) {
            let valor = config.tarefasPorLocal[local];
            if (valor === undefined && /^Sala \d+$/.test(local)) valor = 'sala';
            if (typeof valor === 'string') {
                const bloco = config.checklists[valor];
                if (!bloco) problemas.push(`Bloco de tarefas "${valor}" não existe (ambiente "${local}").`);
                return bloco ? bloco.slice() : [];
            }
            if (!Array.isArray(valor) || valor.length === 0) {
                problemas.push(`Ambiente "${local}" não tem tarefas cadastradas.`);
                return [];
            }
            return valor.slice();
        }

        const unidades = Object.keys(config.ambientesPorUnidade).map((nomeUnidade) => {
            const sigla = (config.unidades[nomeUnidade] && config.unidades[nomeUnidade].sigla) || slug(nomeUnidade);
            const nomes = config.ambientesPorUnidade[nomeUnidade].slice();
            const qtdSalas = (config.salasNumeradas && config.salasNumeradas[nomeUnidade]) || 0;
            for (let i = 1; i <= qtdSalas; i++) nomes.push(`Sala ${i}`);

            const vistos = new Set();
            const ambientes = [];
            nomes.forEach((nome) => {
                const codigo = codigoAmbiente(sigla, nome);
                if (vistos.has(codigo)) {
                    problemas.push(`Ambiente repetido na ${nomeUnidade}: "${nome}".`);
                    return;
                }
                vistos.add(codigo);
                ambientes.push({ nome, codigo, tarefas: resolverTarefas(nome) });
            });

            return { nome: nomeUnidade, sigla, ambientes };
        });

        return { unidades, problemas };
    }

    function gerarId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
        return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }

    /**
     * Monta o registro enviado ao Apps Script.
     *
     * COMPATIBILIDADE: os 8 primeiros campos têm exatamente o mesmo nome e
     * formato da versão 1 — o Apps Script atual continua gravando igual.
     * Os demais campos são novos e são ignorados pelo script antigo.
     */
    function montarPayload(dados) {
        const agora = dados.agora || new Date();
        const concluidas = dados.concluidas || [];
        const pendentes = dados.pendentes || [];
        const total = concluidas.length + pendentes.length;
        const obs = String(dados.observacoes || '').trim();

        return {
            // --- campos da versão 1 (não alterar nome nem formato) ---
            data: agora.toLocaleDateString('pt-BR'),
            hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            unidade: dados.unidade,
            colaborador: normalizarNome(dados.colaborador),
            local: dados.local,
            concluidas: concluidas.join(', ') || SEM_TAREFAS,
            pendentes: pendentes.join(', ') || SEM_TAREFAS,
            observacoes: obs || SEM_OBSERVACOES,

            // --- campos novos (versão 2) ---
            id_registro: dados.id || gerarId(),
            timestamp_iso: agora.toISOString(),
            codigo_ambiente: dados.codigoAmbiente || '',
            total_tarefas: total,
            qtd_concluidas: concluidas.length,
            percentual_conclusao: total ? Math.round((concluidas.length / total) * 100) : 0,
            lista_concluidas: concluidas.slice(),
            lista_pendentes: pendentes.slice(),
            observacoes_texto: obs,
            versao_app: dados.versaoApp || '',
            enviado_offline: false,
            tentativas: 0
        };
    }

    return {
        SEM_TAREFAS,
        SEM_OBSERVACOES,
        slug,
        codigoAmbiente,
        normalizarNome,
        montarCatalogo,
        categoria,
        agruparAmbientes,
        gerarId,
        montarPayload
    };
});
