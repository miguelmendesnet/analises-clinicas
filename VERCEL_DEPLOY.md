# Deploy no Vercel

## O que ficou preparado

- Desenvolvimento local:
  usa `storage/data.json` como base persistente local.
- Produção no Vercel:
  usa `Vercel Blob` para persistir PDFs e dados da app.
- Seed inicial:
  o ficheiro `storage/data.json` viaja com o deploy para a app abrir já com os dados atuais.

## Passos no Vercel

1. Criar/importar o projeto no Vercel.
2. Adicionar a integração `Vercel Blob` ao projeto.
3. Confirmar que a env var `BLOB_READ_WRITE_TOKEN` ficou disponível no projeto.
4. Fazer deploy.

## Comportamento importante

- Sem `BLOB_READ_WRITE_TOKEN`, a app abre mas o upload em produção é bloqueado com uma mensagem clara.
- Com `BLOB_READ_WRITE_TOKEN`, uploads passam a ser persistentes.
