# Apps Script (lado da planilha)

O app funciona **com o Apps Script atual, sem mudar nada**: o `config.js` vem com
`confirmarGravacao: false`, que mantém o envio exatamente como antes.

O arquivo `Code.gs` desta pasta é a **versão 2**, opcional, que traz:

- **confirmação real** de que a planilha gravou (hoje o app não tem como saber);
- **proteção contra duplicados** (importante para o reenvio automático da fila offline);
- abas novas de análise, `Registros_Detalhe` e `Tarefas_Detalhe`;
- proteção contra fórmulas digitadas nas observações.

A aba principal **não muda de estrutura**: cada valor vai para a coluna com o mesmo nome
(Data, Hora, Unidade, Colaborador, Local, Concluídas, Pendentes, Observações).

## Passo a passo para publicar (mantendo a mesma URL)

1. Abra a planilha → **Extensões → Apps Script**.
2. **Faça um backup do código atual**: copie todo o conteúdo e salve neste repositório como
   `apps-script/Code_v1_backup.gs`. Assim dá para voltar a qualquer momento.
3. Compare o código atual com o `Code.gs` novo. Se o atual fizer algo além de gravar a linha
   (enviar e-mail, gravar em outra aba, etc.), avise antes de substituir.
4. Se a aba que recebe os registros **não for a primeira** da planilha, preencha
   `ABA_PRINCIPAL` no topo do `Code.gs` com o nome dela.
5. Cole o `Code.gs` no editor, no lugar do código antigo, e salve.
6. **Implantar → Gerenciar implantações** → clique no lápis da implantação existente →
   em *Versão*, escolha **Nova versão** → **Implantar**.
   ⚠️ Não use "Nova implantação": isso gera uma URL diferente e o app deixaria de enviar.
7. Teste: abra a URL do Web App no navegador. Deve aparecer `{"ok":true,"servico":"npc-limpeza",...}`.
8. Envie um registro de teste pelo app e confira: uma linha nova na aba principal (igual às
   antigas) e uma nas abas `Registros_Detalhe` e `Tarefas_Detalhe`.

## Ativar a confirmação real

Depois que o passo 8 funcionar, mude no `config.js`:

```js
confirmarGravacao: true,
```

A partir daí, se a planilha recusar ou falhar, o colaborador vê o erro e o registro não se perde.

## Como voltar atrás

- **App:** volte `confirmarGravacao` para `false`.
- **Script:** em *Gerenciar implantações → lápis → Versão*, escolha a versão anterior e implante.
