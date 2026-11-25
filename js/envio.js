/**
 * Envio dos registros para o Google Apps Script, com fila offline.
 *
 * Fluxo:
 *  1. Tenta enviar na hora.
 *  2. Se não houver internet (ou o envio cair), o registro é guardado no
 *     aparelho e reenviado sozinho quando a conexão voltar.
 *  3. Cada registro tem um id_registro único; o Apps Script v2 usa esse id
 *     para nunca gravar o mesmo registro duas vezes.
 *
 * Disponível em window.Envio.
 */
(function (raiz) {
    'use strict';

    const CHAVE_FILA = 'npc-limpeza:fila:v1';
    const CHAVE_FALHAS = 'npc-limpeza:falhas:v1';
    const INTERVALO_REENVIO_MS = 60000;
    const MAX_TENTATIVAS = 5;
    const ouvintes = new Set();
    let processando = false;
    let config = null;

    // ---------- armazenamento local (pode falhar em modo privado) ----------
    function lerFila() {
        try {
            const bruto = localStorage.getItem(CHAVE_FILA);
            const fila = bruto ? JSON.parse(bruto) : [];
            return Array.isArray(fila) ? fila : [];
        } catch (e) {
            return [];
        }
    }

    function salvarFila(fila) {
        try {
            localStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
            return true;
        } catch (e) {
            return false;
        } finally {
            avisar();
        }
    }

    function enfileirar(payload) {
        const fila = lerFila();
        if (fila.some((p) => p.id_registro === payload.id_registro)) return true;
        fila.push(payload);
        return salvarFila(fila);
    }

    function guardarFalha(payload) {
        try {
            const falhas = JSON.parse(localStorage.getItem(CHAVE_FALHAS) || '[]');
            falhas.push(payload);
            localStorage.setItem(CHAVE_FALHAS, JSON.stringify(falhas));
        } catch (e) {
            console.error('[Envio] Não foi possível guardar registro com falha:', payload);
        }
    }

    function avisar() {
        const qtd = lerFila().length;
        ouvintes.forEach((fn) => {
            try {
                fn(qtd);
            } catch (e) {
                /* ouvinte com erro não pode travar o envio */
            }
        });
    }

    // ---------- envio remoto ----------
    class ErroDeRede extends Error {}
    class ErroDoServidor extends Error {}

    async function enviarRemoto(payload) {
        const controle = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controle ? setTimeout(() => controle.abort(), config.envio.timeoutMs) : null;
        const confirmar = config.envio.confirmarGravacao === true;

        try {
            let resposta;
            try {
                resposta = await fetch(config.envio.url, {
                    method: 'POST',
                    mode: confirmar ? 'cors' : 'no-cors',
                    redirect: 'follow',
                    // text/plain evita a requisição de "preflight", que o Apps Script não aceita.
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload),
                    signal: controle ? controle.signal : undefined
                });
            } catch (e) {
                throw new ErroDeRede(e && e.name === 'AbortError' ? 'Tempo de envio esgotado' : 'Falha de conexão');
            }

            // Modo compatível: o navegador não deixa ler a resposta.
            if (!confirmar) return { status: 'enviado' };

            if (!resposta.ok) throw new ErroDeRede(`Servidor respondeu ${resposta.status}`);

            let json;
            try {
                json = await resposta.json();
            } catch (e) {
                throw new ErroDoServidor(
                    'A planilha respondeu em formato inesperado. Verifique se o Apps Script v2 foi publicado.'
                );
            }
            if (json && json.ok) return { status: 'confirmado', duplicado: !!json.duplicado };
            throw new ErroDoServidor((json && json.erro) || 'A planilha recusou o registro.');
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    /**
     * Envia um registro. Retorna:
     *  { status: 'confirmado' } gravação confirmada pela planilha
     *  { status: 'enviado' }    enviado (modo compatível, sem confirmação)
     *  { status: 'na-fila' }    sem conexão: guardado no aparelho
     *  { status: 'erro', mensagem }
     */
    async function enviar(payload) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return guardarParaDepois(payload);
        }
        try {
            const r = await enviarRemoto(payload);
            processarFila(); // aproveita a conexão para esvaziar a fila
            return r;
        } catch (e) {
            if (e instanceof ErroDeRede) return guardarParaDepois(payload);
            return { status: 'erro', mensagem: e.message };
        }
    }

    function guardarParaDepois(payload) {
        if (enfileirar(payload)) return { status: 'na-fila' };
        return {
            status: 'erro',
            mensagem: 'Sem conexão e não foi possível salvar no aparelho. Anote o registro e tente novamente.'
        };
    }

    /** Reenvia, em ordem, os registros guardados no aparelho. */
    async function processarFila() {
        if (processando) return;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
        processando = true;
        try {
            let fila = lerFila();
            while (fila.length > 0) {
                const item = Object.assign({}, fila[0], {
                    enviado_offline: true,
                    tentativas: (fila[0].tentativas || 0) + 1
                });
                try {
                    await enviarRemoto(item);
                } catch (e) {
                    if (e instanceof ErroDeRede) {
                        fila[0] = item;
                        salvarFila(fila);
                        break; // sem conexão: tenta de novo mais tarde
                    }
                    // Recusado pela planilha: vai para o fim da fila para não travar os demais.
                    // Após 5 tentativas, é movido para a lista de falhas (nunca é apagado).
                    console.warn('[Envio] Registro recusado pela planilha:', item.id_registro, e.message);
                    item.ultimo_erro = e.message;
                    fila = lerFila().filter((p) => p.id_registro !== item.id_registro);
                    if (item.tentativas >= MAX_TENTATIVAS) {
                        guardarFalha(item);
                    } else {
                        fila.push(item);
                    }
                    salvarFila(fila);
                    if (item.tentativas < MAX_TENTATIVAS) break;
                    continue;
                }
                fila = lerFila().filter((p) => p.id_registro !== item.id_registro);
                salvarFila(fila);
            }
        } finally {
            processando = false;
        }
    }

    function iniciar(cfg) {
        config = cfg;
        if (typeof window !== 'undefined') {
            window.addEventListener('online', processarFila);
            setInterval(processarFila, INTERVALO_REENVIO_MS);
        }
        processarFila();
    }

    raiz.Envio = {
        iniciar,
        enviar,
        processarFila,
        pendentes: () => lerFila().length,
        aoMudarFila: (fn) => {
            ouvintes.add(fn);
            fn(lerFila().length);
        }
    };
})(typeof self !== 'undefined' ? self : this);
