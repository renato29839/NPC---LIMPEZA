# NPC Limpeza: checklist digital de limpeza

Sistema web usado pelos colaboradores do **Neuropsicocentro** para registrar a limpeza
de cada ambiente. Cada registro vai para uma **planilha Google** por meio de um Google Apps Script.

## Como funciona

```
Celular do colaborador ──► index.html (formulário) ──► Google Apps Script ──► Google Sheets
                                   │
                                   └─ sem internet? o registro fica salvo no aparelho
                                      e é reenviado sozinho quando a conexão volta
```

## Estrutura

| Arquivo | Para que serve |
|---|---|
| `index.html` | Formulário |
| `config.js` | **Ambientes, tarefas, colaboradores e URL do Apps Script.** Único arquivo a editar no dia a dia |
| `script.js` | Comportamento da tela |
| `js/nucleo.js` | Regras de dados (códigos de ambiente, padronização de nomes, montagem do registro) |
| `js/envio.js` | Envio para a planilha e fila offline |
| `style.css` | Estilos próprios (inclui o modo escuro) |
| `assets/tailwind.css` | Tailwind **gerado** (não editar à mão) |
| `sw.js`, `manifest.webmanifest`, `icons/` | App instalável (PWA) e funcionamento offline |
| `apps-script/` | Código do lado da planilha e instruções de publicação |
| `tests/` | Testes automáticos |

## Tarefas comuns

**Adicionar um ambiente:** em `config.js`, inclua o nome em `ambientesPorUnidade` e as
tarefas em `tarefasPorLocal`, ou use um bloco pronto, como `'sala'` ou `'copa'`.
Depois rode `npm test`, que avisa se algum ambiente ficou sem tarefas.

**Não renomeie ambientes existentes.** Os relatórios separam o nome antigo do novo.

**Publicar uma nova versão:** aumente `versaoApp` em `config.js` e `VERSAO` em `sw.js`.
Isso força os celulares a baixarem a versão nova.

## Desenvolvimento

Requer [Node.js](https://nodejs.org) 18 ou superior.

```bash
npm install          # instala as ferramentas (apenas uma vez)
npm run serve        # abre em http://localhost:8080
npm run build:css    # regenera assets/tailwind.css após mudar classes no HTML/JS
npm run check        # lint + testes (também rodam no GitHub a cada push)
```

## Dados enviados para a planilha

Os 8 campos da versão 1 continuam **com o mesmo nome e formato**, então a planilha atual segue
funcionando sem nenhuma alteração: `data`, `hora`, `unidade`, `colaborador`, `local`,
`concluidas`, `pendentes` e `observacoes`.

A versão 2 acrescenta campos para análise, que o script antigo simplesmente ignora:
`id_registro`, `timestamp_iso`, `codigo_ambiente`, `total_tarefas`, `qtd_concluidas`,
`percentual_conclusao`, `lista_concluidas`, `lista_pendentes`, `enviado_offline`,
`tentativas` e `versao_app`.

Para gravar esses campos e ter **confirmação real de gravação**, publique o Apps Script v2.
O passo a passo está em [`apps-script/README.md`](apps-script/README.md).

## Privacidade (LGPD)

O sistema grava o nome do colaborador, que é um dado pessoal. Restrinja o acesso à planilha
a quem realmente precisa e defina por quanto tempo os registros devem ser mantidos.
