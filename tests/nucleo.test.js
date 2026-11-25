const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Nucleo = require('../js/nucleo.js');

// Carrega o config.js real (é um script de navegador, não um módulo).
function carregarConfig() {
    const codigo = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
    const ctx = {};
    vm.runInNewContext(codigo + '\nthis.CONFIG = CONFIG;', ctx);
    return ctx.CONFIG;
}

test('slug e código do ambiente são estáveis e sem acento', () => {
    assert.equal(Nucleo.slug('Salão psicomotricidade'), 'SALAO-PSICOMOTRICIDADE');
    assert.equal(Nucleo.slug('Área jardim interno (copa)'), 'AREA-JARDIM-INTERNO-COPA');
    assert.equal(Nucleo.codigoAmbiente('MTZ', 'Sala 12'), 'MTZ-SALA-12');
});

test('normalizarNome padroniza espaços e maiúsculas', () => {
    assert.equal(Nucleo.normalizarNome('  joão   DA silva '), 'João da Silva');
    assert.equal(Nucleo.normalizarNome('MARIA'), 'Maria');
    assert.equal(Nucleo.normalizarNome(''), '');
});

test('config.js: todo ambiente tem tarefas e não há códigos repetidos', () => {
    const { unidades, problemas } = Nucleo.montarCatalogo(carregarConfig());
    assert.deepEqual(problemas, []);
    assert.equal(unidades.length, 4);
    unidades.forEach((u) => {
        u.ambientes.forEach((a) => assert.ok(a.tarefas.length > 0, `${u.nome} / ${a.nome} sem tarefas`));
    });
});

test('catálogo mantém os mesmos ambientes da versão 1', () => {
    const { unidades } = Nucleo.montarCatalogo(carregarConfig());
    const qtd = Object.fromEntries(unidades.map((u) => [u.nome, u.ambientes.length]));
    assert.deepEqual(qtd, {
        'Unidade Matriz': 26 + 50,
        'Unidade Life': 17 + 20,
        'Unidade Sul': 16 + 20,
        'Unidade Parquelandia': 7 + 14
    });
});

test('Unidade Parquelandia tem os ambientes pedidos', () => {
    const { unidades } = Nucleo.montarCatalogo(carregarConfig());
    const pql = unidades.find((u) => u.nome === 'Unidade Parquelandia');
    const nomes = pql.ambientes.map((a) => a.nome);
    for (let i = 1; i <= 14; i++) assert.ok(nomes.includes(`Sala ${i}`));
    ['Copa', 'Sala supervisor', 'Salão TO', 'Salão psicomotricidade', 'Recepção', 'Jardim Interno', 'Área Externa']
        .forEach((n) => assert.ok(nomes.includes(n), n));
    assert.equal(pql.sigla, 'PQL');
});

test('todo ambiente cai em uma categoria conhecida do menu', () => {
    const { unidades } = Nucleo.montarCatalogo(carregarConfig());
    unidades.forEach((u) => u.ambientes.forEach((a) => assert.notEqual(Nucleo.categoria(a.nome), 'Outros', a.nome)));
    assert.equal(Nucleo.categoria('Salão TO'), 'Salões terapêuticos');
    assert.equal(Nucleo.categoria('Sala 7'), 'Salas numeradas');
    assert.equal(Nucleo.categoria('Sala TI'), 'Salas administrativas');
    assert.equal(Nucleo.categoria('Área Comum/Hall'), 'Áreas comuns');
    assert.equal(Nucleo.categoria('Área Externa'), 'Áreas externas');
});

test('salas numeradas ficam em ordem natural (2 antes de 10)', () => {
    const grupos = Nucleo.agruparAmbientes(['Sala 10', 'Sala 2', 'Sala 1', 'Copa'].map((nome) => ({ nome })));
    assert.deepEqual(grupos.map((g) => g.nome), ['Copas e apoio', 'Salas numeradas']);
    assert.deepEqual(grupos[1].ambientes.map((a) => a.nome), ['Sala 1', 'Sala 2', 'Sala 10']);
});

test('payload mantém os campos da versão 1 com o mesmo formato', () => {
    const agora = new Date(2026, 10, 25, 9, 5);
    const p = Nucleo.montarPayload({
        agora,
        colaborador: ' joão silva ',
        unidade: 'Unidade Sul',
        local: 'Copa 1',
        codigoAmbiente: 'SUL-COPA-1',
        concluidas: ['A', 'B'],
        pendentes: ['C'],
        observacoes: '',
        id: 'teste-123456'
    });
    assert.equal(p.data, agora.toLocaleDateString('pt-BR'));
    assert.equal(p.hora, agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    assert.equal(p.colaborador, 'João Silva');
    assert.equal(p.concluidas, 'A, B');
    assert.equal(p.pendentes, 'C');
    assert.equal(p.observacoes, 'Sem observações');
    assert.equal(p.percentual_conclusao, 67);
    assert.equal(p.total_tarefas, 3);
    assert.equal(p.id_registro, 'teste-123456');
    assert.equal(p.observacoes_texto, '');
});

test('payload sem tarefas marcadas usa "Nenhuma" como na versão 1', () => {
    const p = Nucleo.montarPayload({ colaborador: 'Ana', unidade: 'U', local: 'L', concluidas: [], pendentes: ['X'] });
    assert.equal(p.concluidas, 'Nenhuma');
    assert.equal(p.percentual_conclusao, 0);
    assert.match(p.id_registro, /^[A-Za-z0-9-]{8,64}$/);
});
