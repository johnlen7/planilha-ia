# Morfin Bot Backend

Backend inicial para bot Telegram de gestão financeira inspirado na planilha Mordomia Financeira.

## Stack
- Node.js + TypeScript
- Prisma + PostgreSQL
- Telegraf (Telegram Bot)
- Zod (validação DSL)

## Requisitos
- Node >= 18
- PostgreSQL >= 14

## Variáveis de Ambiente
Copie `.env.example` para `.env` e preencha.

## Instalação
```powershell
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Comandos Bot
- `/relatorio` resumo do mês atual
- `/consagrar` calcula consagrações mês
- Texto livre com valor lança saída (simplificado)

## Próximos Passos
1. Adicionar adapters STT/OCR.
2. Implementar confirmação de lançamento.
3. Cache Redis para relatórios.
4. Rotas HTTP complementares.

## Licença
Uso interno inicial.
