import { Telegraf, Context } from 'telegraf';
import { TransacaoService } from '../services/transacaoService.js';
import { RelatorioService } from '../services/relatorioService.js';
import { extrairValorCentavos } from '../utils/parseValor.js';
import { ConsagracaoService } from '../services/consagracaoService.js';
import { MotorConsagracao } from '../rules/engine.js';
import { parseRegras } from '../rules/dsl.js';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TOKEN_TELEGRAM;
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN/TOKEN_TELEGRAM não definido no ambiente');
}

export function buildBot() {
  const bot = new Telegraf(BOT_TOKEN);
  const transacaoService = new TransacaoService();
  const relatorioService = new RelatorioService();
  const regras = parseRegras([
    {
      nome: 'Consagracoes pos-receita',
      acoes: [
        { tipo: 'DIZIMO', percentual: 0.10, ordem: 1 },
        { tipo: 'OFERTA_REGULAR', percentual: { faixaMin: 0.05, faixaMax: 0.10 }, ordem: 2 },
        { tipo: 'POUPANCA', percentual: 0.05, ordem: 3 },
        { tipo: 'CUSTEIO', percentual: 0.05, ordem: 4 }
      ]
    }
  ]);
  const motor = new MotorConsagracao(regras);
  const consagracaoService = new ConsagracaoService(motor);

  bot.start(async (ctx: Context) => {
    ctx.reply('Bem-vindo ao Morfin Bot. Envie um texto com valor para lançar ou use /relatorio.');
  });

  bot.command('relatorio', async (ctx: Context) => {
    const usuarioId = ctx.from.id.toString();
    const hoje = new Date();
    const resumo = await relatorioService.relatorioMes(usuarioId, hoje.getFullYear(), hoje.getMonth()+1);
    ctx.reply(`Entradas: ${(resumo.entradasCentavos/100).toFixed(2)}\nSaidas: ${(resumo.saidasCentavos/100).toFixed(2)}\nManejo: ${(resumo.manejoCentavos/100).toFixed(2)}`);
  });

  bot.on('text', async (ctx: Context) => {
    const usuarioId = ctx.from.id.toString();
    const texto = ctx.message.text;
    const { valorCentavos } = extrairValorCentavos(texto);
    if (!valorCentavos) {
      ctx.reply('Não detectei valor. Informe algo como "Comprei mercado 123,45".');
      return;
    }
    const transacao = await transacaoService.criarLancamento({
      usuarioId,
      dataMovimento: new Date(),
      tipo: valorCentavos >= 0 ? 'SAIDA' : 'ENTRADA',
      valorCentavos: Math.abs(valorCentavos),
      observacao: texto,
      fonteCaptura: 'text'
    });
    ctx.reply(`Lancado ${ (valorCentavos/100).toFixed(2) } indice ${transacao.indice}`);
  });

  bot.command('consagrar', async (ctx: Context) => {
    const usuarioId = ctx.from.id.toString();
    const hoje = new Date();
    const aloc = await consagracaoService.calcularEPersistir(usuarioId, hoje.getMonth()+1, hoje.getFullYear(), { isNaoRecorrente: false });
    if (!aloc.length) {
      ctx.reply('Nenhum snapshot ou renda base encontrada.');
      return;
    }
    const linhas = aloc.map((a: any) => `${a.tipo}: ${(a.valorCentavos/100).toFixed(2)}`).join('\n');
    ctx.reply(`Consagrações mês:\n${linhas}`);
  });

  return bot;
}
