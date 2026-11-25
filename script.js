/**
 * SISTEMA DE CONTROLE DE LIMPEZA - NEUROPSICOCENTRO
 * Interface do formulário. Regras de negócio: js/nucleo.js | Envio: js/envio.js
 * Ambientes e tarefas: config.js
 */
/* global CONFIG, Nucleo, Envio */
(function () {
    'use strict';

    const CHAVE_ULTIMO_NOME = 'npc-limpeza:colaborador';
    const CHAVE_ULTIMA_UNIDADE = 'npc-limpeza:unidade';

    const { unidades, problemas } = Nucleo.montarCatalogo(CONFIG);
    if (problemas.length) console.warn('[Config] Verifique o config.js:\n- ' + problemas.join('\n- '));

    // --- ELEMENTOS ---
    const $ = (id) => document.getElementById(id);
    const form = $('form-limpeza');
    const inputNome = $('colaborador');
    const unidadeSelect = $('unidade-select');
    const localSelect = $('local-select');
    const containerTarefas = $('container-tarefas');
    const listaTarefas = $('lista-tarefas');
    const btnEnviar = $('btn-enviar');
    const btnMarcarTodas = $('btn-marcar-todas');
    const obsTextarea = $('observacoes');
    const obsChars = $('obs-chars');
    const loading = $('loading');

    let enviando = false;

    // --- ARMAZENAMENTO LOCAL SEGURO ---
    const memoria = {
        ler(chave) {
            try {
                return localStorage.getItem(chave) || '';
            } catch (e) {
                return '';
            }
        },
        gravar(chave, valor) {
            try {
                localStorage.setItem(chave, valor);
            } catch (e) {
                /* modo privado: apenas não lembra */
            }
        }
    };

    // --- CATÁLOGO ---
    function unidadeAtual() {
        return unidades.find((u) => u.nome === unidadeSelect.value) || null;
    }

    function ambienteAtual() {
        const u = unidadeAtual();
        return u ? u.ambientes.find((a) => a.codigo === localSelect.value) || null : null;
    }

    function preencherUnidades() {
        unidades.forEach((u) => unidadeSelect.add(new Option(u.nome, u.nome)));
    }

    function preencherColaboradores() {
        const lista = $('lista-colaboradores');
        (CONFIG.colaboradores || []).forEach((nome) => {
            const opt = document.createElement('option');
            opt.value = nome;
            lista.appendChild(opt);
        });
    }

    function preencherAmbientes() {
        const u = unidadeAtual();
        localSelect.textContent = ''; // remove opções e grupos
        esconderTarefas();
        if (!u) {
            localSelect.add(new Option('Selecione primeiro a unidade...', ''));
            localSelect.disabled = true;
            return;
        }
        localSelect.add(new Option(`Selecione o ambiente (${u.ambientes.length})...`, ''));
        // Agrupado por categoria; o valor da opção é o código fixo, o texto é o nome exibido.
        Nucleo.agruparAmbientes(u.ambientes).forEach((grupo) => {
            const og = document.createElement('optgroup');
            og.label = grupo.nome;
            grupo.ambientes.forEach((a) => og.appendChild(new Option(a.nome, a.codigo)));
            localSelect.appendChild(og);
        });
        localSelect.disabled = false;
    }

    // --- TAREFAS ---
    function esconderTarefas() {
        listaTarefas.textContent = '';
        $('btn-enviar-resumo').textContent = '';
        containerTarefas.classList.add('hidden');
        atualizarBotao();
    }

    function renderizarTarefas() {
        const ambiente = ambienteAtual();
        listaTarefas.textContent = '';
        if (!ambiente) {
            esconderTarefas();
            return;
        }

        ambiente.tarefas.forEach((tarefa, i) => {
            // O <label> é o cartão inteiro: tocar em qualquer ponto marca a tarefa.
            const card = document.createElement('label');
            card.className = 'tarefa-card';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = tarefa;

            const num = document.createElement('span');
            num.className = 'tarefa-num';
            num.textContent = `${i + 1}.`;
            num.setAttribute('aria-hidden', 'true');

            const texto = document.createElement('span');
            texto.className = 'tarefa-texto';
            texto.textContent = tarefa; // textContent: nunca interpreta HTML

            cb.addEventListener('change', () => {
                card.classList.toggle('card-checked', cb.checked);
                atualizarContador();
            });

            card.append(cb, num, texto);
            listaTarefas.appendChild(card);
        });

        containerTarefas.classList.remove('hidden');
        atualizarContador();
        atualizarBotao();
    }

    function checkboxes() {
        return Array.from(listaTarefas.querySelectorAll('input[type="checkbox"]'));
    }

    function atualizarContador() {
        const todas = checkboxes();
        const feitas = todas.filter((c) => c.checked).length;
        const pct = todas.length ? Math.round((feitas / todas.length) * 100) : 0;
        $('tarefas-contador').textContent = `${feitas} de ${todas.length} · ${pct}%`;
        $('progresso-barra').style.width = pct + '%';
        $('progresso-barra').classList.toggle('completo', todas.length > 0 && feitas === todas.length);
        $('btn-enviar-resumo').textContent = todas.length
            ? `${ambienteAtual().nome} · ${feitas} de ${todas.length} tarefas`
            : '';
        btnMarcarTodas.textContent = feitas === todas.length && todas.length ? 'Desmarcar todas' : 'Marcar todas';
    }

    btnMarcarTodas.addEventListener('click', () => {
        const todas = checkboxes();
        const marcar = !todas.every((c) => c.checked);
        todas.forEach((c) => {
            c.checked = marcar;
            c.dispatchEvent(new Event('change'));
        });
    });

    function atualizarBotao() {
        btnEnviar.disabled = enviando || !ambienteAtual();
    }

    // --- VALIDAÇÃO ---
    function mostrarErroCampo(campo, mensagem) {
        const span = $(`${campo.id}-error`);
        campo.classList.add('campo-invalido');
        campo.setAttribute('aria-invalid', 'true');
        if (span) {
            span.textContent = mensagem;
            span.classList.remove('hidden');
        }
    }

    function limparErroCampo(campo) {
        const span = $(`${campo.id}-error`);
        campo.classList.remove('campo-invalido');
        campo.removeAttribute('aria-invalid');
        if (span) {
            span.textContent = '';
            span.classList.add('hidden');
        }
    }

    function validar() {
        let primeiroInvalido = null;
        const regras = [
            [inputNome, () => Nucleo.normalizarNome(inputNome.value).length >= 3, 'Informe seu nome (mínimo 3 letras).'],
            [unidadeSelect, () => !!unidadeAtual(), 'Selecione a unidade.'],
            [localSelect, () => !!ambienteAtual(), 'Selecione o ambiente.']
        ];
        regras.forEach(([campo, ok, msg]) => {
            if (ok()) {
                limparErroCampo(campo);
            } else {
                mostrarErroCampo(campo, msg);
                primeiroInvalido = primeiroInvalido || campo;
            }
        });
        if (primeiroInvalido) primeiroInvalido.focus();
        return !primeiroInvalido;
    }

    // --- MODAIS ---
    let focoAnterior = null;

    function abrirModal(modal, botaoFoco) {
        focoAnterior = document.activeElement;
        modal.classList.remove('hidden');
        if (botaoFoco) botaoFoco.focus();
    }

    function fecharModal(modal) {
        modal.classList.add('hidden');
        if (focoAnterior && typeof focoAnterior.focus === 'function') focoAnterior.focus();
    }

    function mostrarResultado(titulo, mensagem, icone) {
        $('success-title').textContent = titulo;
        $('success-message').textContent = mensagem;
        $('success-icon').textContent = icone;
        abrirModal($('success-modal'), $('btn-close-success'));
    }

    function mostrarErro(mensagem) {
        $('error-message').textContent = mensagem;
        abrirModal($('error-modal'), $('btn-close-error'));
    }

    function confirmar() {
        return new Promise((resolve) => {
            const modal = $('confirm-modal');
            const sim = $('btn-confirm-sim');
            const nao = $('btn-confirm-nao');
            const fim = (resposta) => {
                sim.removeEventListener('click', aoSim);
                nao.removeEventListener('click', aoNao);
                fecharModal(modal);
                resolve(resposta);
            };
            const aoSim = () => fim(true);
            const aoNao = () => fim(false);
            sim.addEventListener('click', aoSim);
            nao.addEventListener('click', aoNao);
            abrirModal(modal, nao);
        });
    }

    $('btn-close-success').addEventListener('click', () => fecharModal($('success-modal')));
    $('btn-close-error').addEventListener('click', () => fecharModal($('error-modal')));
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        ['success-modal', 'error-modal'].forEach((id) => {
            if (!$(id).classList.contains('hidden')) fecharModal($(id));
        });
        if (!$('confirm-modal').classList.contains('hidden')) $('btn-confirm-nao').click();
    });

    // --- FILA OFFLINE (banner) ---
    function atualizarBanner(qtd) {
        const banner = $('banner-fila');
        if (!qtd) {
            banner.classList.add('hidden');
            return;
        }
        $('banner-fila-texto').textContent =
            qtd === 1 ? '1 registro aguardando envio' : `${qtd} registros aguardando envio`;
        banner.classList.remove('hidden');
    }

    $('btn-reenviar').addEventListener('click', async () => {
        await Envio.processarFila();
        if (Envio.pendentes() > 0) mostrarErro('Ainda sem conexão. Os registros continuam salvos e serão enviados automaticamente.');
    });

    // --- EVENTOS DO FORMULÁRIO ---
    unidadeSelect.addEventListener('change', () => {
        limparErroCampo(unidadeSelect);
        preencherAmbientes();
        memoria.gravar(CHAVE_ULTIMA_UNIDADE, unidadeSelect.value);
    });

    localSelect.addEventListener('change', () => {
        limparErroCampo(localSelect);
        renderizarTarefas();
    });

    inputNome.addEventListener('input', () => limparErroCampo(inputNome));
    inputNome.addEventListener('blur', () => {
        if (inputNome.value.trim()) inputNome.value = Nucleo.normalizarNome(inputNome.value);
    });

    obsTextarea.addEventListener('input', () => {
        obsChars.textContent = obsTextarea.value.length;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (enviando || !validar()) return;

        const todas = checkboxes();
        const concluidas = todas.filter((c) => c.checked).map((c) => c.value);
        const pendentes = todas.filter((c) => !c.checked).map((c) => c.value);

        if (concluidas.length === 0 && !(await confirmar())) return;

        const ambiente = ambienteAtual();
        const payload = Nucleo.montarPayload({
            colaborador: inputNome.value,
            unidade: unidadeAtual().nome,
            local: ambiente.nome,
            codigoAmbiente: ambiente.codigo,
            concluidas,
            pendentes,
            observacoes: obsTextarea.value,
            versaoApp: CONFIG.versaoApp
        });

        enviando = true;
        atualizarBotao();
        loading.classList.remove('hidden');

        let resultado;
        try {
            resultado = await Envio.enviar(payload);
        } catch (erro) {
            console.error(erro);
            resultado = { status: 'erro', mensagem: 'Erro inesperado. Tente novamente.' };
        } finally {
            loading.classList.add('hidden');
            enviando = false;
        }

        if (resultado.status === 'erro') {
            atualizarBotao();
            mostrarErro(resultado.mensagem);
            return; // mantém o formulário preenchido para nova tentativa
        }

        memoria.gravar(CHAVE_ULTIMO_NOME, payload.colaborador);
        limparParaProximoRegistro();

        if (resultado.status === 'confirmado') {
            mostrarResultado('Registro gravado!', `${payload.local}: gravado na planilha com sucesso.`, '✓');
        } else if (resultado.status === 'enviado') {
            mostrarResultado('Registro enviado!', `${payload.local}: enviado para a planilha.`, '✓');
        } else {
            mostrarResultado(
                'Salvo no aparelho',
                'Sem conexão no momento. O registro foi guardado e será enviado automaticamente quando a internet voltar.',
                '📶'
            );
        }
    });

    /** Mantém nome e unidade (o colaborador costuma registrar vários ambientes seguidos). */
    function limparParaProximoRegistro() {
        localSelect.value = '';
        obsTextarea.value = '';
        obsChars.textContent = '0';
        esconderTarefas();
    }

    // --- TEMA: claro / escuro / automático (segue o celular) ---
    const CHAVE_TEMA = 'npc-limpeza:tema';
    const midiaEscuro = window.matchMedia('(prefers-color-scheme: dark)');

    function aplicarTema(pref) {
        const escuro = pref === 'escuro' || (pref === 'auto' && midiaEscuro.matches);
        document.documentElement.setAttribute('data-theme', escuro ? 'dark' : 'light');
        document.querySelectorAll('.seletor-tema [data-tema]').forEach((b) => {
            b.setAttribute('aria-checked', String(b.dataset.tema === pref));
        });
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = escuro ? '#0f172a' : '#0d9488';
    }

    function temaAtual() {
        const pref = memoria.ler(CHAVE_TEMA);
        return ['claro', 'escuro', 'auto'].includes(pref) ? pref : 'auto';
    }

    document.querySelectorAll('.seletor-tema [data-tema]').forEach((botao) => {
        botao.addEventListener('click', () => {
            memoria.gravar(CHAVE_TEMA, botao.dataset.tema);
            aplicarTema(botao.dataset.tema);
        });
    });

    // No modo automático, acompanha a troca de tema do celular em tempo real.
    const aoMudarTemaDoSistema = () => {
        if (temaAtual() === 'auto') aplicarTema('auto');
    };
    if (midiaEscuro.addEventListener) midiaEscuro.addEventListener('change', aoMudarTemaDoSistema);
    else if (midiaEscuro.addListener) midiaEscuro.addListener(aoMudarTemaDoSistema);

    // --- INICIALIZAÇÃO ---
    function iniciar() {
        aplicarTema(temaAtual());
        $('versao-app').textContent = `· v${CONFIG.versaoApp}`;
        preencherUnidades();
        preencherColaboradores();

        inputNome.value = memoria.ler(CHAVE_ULTIMO_NOME);

        const ultima = memoria.ler(CHAVE_ULTIMA_UNIDADE);
        if (unidades.some((u) => u.nome === ultima)) {
            unidadeSelect.value = ultima;
            preencherAmbientes();
        }

        Envio.aoMudarFila(atualizarBanner);
        Envio.iniciar(CONFIG);

        if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
            navigator.serviceWorker.register('sw.js').catch((e) => console.warn('[PWA] Service worker:', e));
        }
    }

    iniciar();
})();
