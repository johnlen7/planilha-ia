import 'dotenv/config';
import { buildBot } from './bot/telegramBot.js';

async function main() {
  const bot = buildBot();
  await bot.launch();
  console.log('Bot iniciado');
  // Graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch(err => {
  console.error('Erro ao iniciar', err);
  process.exit(1);
});
