import { Telegraf, Context } from 'telegraf';
// Declaração mínima para process sob ambientes sem @types disponível em build step
declare const process: { env: Record<string,string|undefined> };
import { TransacaoService } from '../services/transacaoService.js';
import { RelatorioService } from '../services/relatorioService.js';
import { extrairValorCentavos } from '../utils/parseValor.js';
import { ConsagracaoService } from '../services/consagracaoService.js';
import { MidiaService } from '../services/midiaService.js';
import { STTAdapter } from '../pipeline/sttAdapter.js';
import { OCRAdapter } from '../pipeline/ocrAdapter.js';
import { NLUAdapter } from '../pipeline/nluAdapter.js';
import { MotorConsagracao } from '../rules/engine.js';
import { parseRegras } from '../rules/dsl.js';

const BOT_TOKEN = (process.env.BOT_TOKEN ?? process.env.TOKEN_TELEGRAM ?? '').trim();
if (BOT_TOKEN.length === 0) {
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
  const midiaService = new MidiaService();
  const stt = new STTAdapter();
  const ocr = new OCRAdapter();
  const nlu = new NLUAdapter();

  bot.start(async (ctx: Context) => {
    if (!ctx.from) return;
    ctx.reply('Bem-vindo ao Morfin Bot. Envie um texto com valor para lançar ou use /relatorio.');
  });

  bot.command('relatorio', async (ctx: Context) => {
    if (!ctx.from) return;
    const usuarioId = String(ctx.from.id);
    const hoje = new Date();
    const resumo = await relatorioService.relatorioMes(usuarioId, hoje.getFullYear(), hoje.getMonth()+1);
    ctx.reply(`Entradas: ${(resumo.entradasCentavos/100).toFixed(2)}\nSaidas: ${(resumo.saidasCentavos/100).toFixed(2)}\nManejo: ${(resumo.manejoCentavos/100).toFixed(2)}`);
  });

  bot.on('text', async (ctx: Context) => {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;
    const usuarioId = String(ctx.from.id);
    const texto = (ctx.message as any).text as string;
    const { valorCentavos } = extrairValorCentavos(texto);
    if (!valorCentavos) {
      ctx.reply('Não detectei valor. Informe algo como "Comprei mercado 123,45".');
      return;
    }
    const transacao = await transacaoService.criarLancamento({
      usuarioId,
      dataMovimento: new Date(),
      tipo: valorCentavos >= 0 ? 'SAIDA' : 'ENTRADA', // simplificado
      valorCentavos: Math.abs(valorCentavos),
      observacao: texto,
      fonteCaptura: 'text'
    });
    ctx.reply(`Lancado ${ (valorCentavos/100).toFixed(2) } indice ${transacao.indice}`);
  });

  bot.on('voice', async (ctx: Context) => {
    if (!ctx.from || !ctx.message || !('voice' in ctx.message)) return;
    const usuarioId = String(ctx.from.id);
    const voice: any = (ctx.message as any).voice;
    const fileId: string = voice.file_id;
    const midia = await midiaService.registrarCaptura(usuarioId, 'voice', fileId);
    const sttResult = await stt.transcribe(fileId);
    const nluRes = await nlu.classify(sttResult.transcript);
    const { valorCentavos, confidence: valorConfidence } = extrairValorCentavos(sttResult.transcript);
    await midiaService.atualizar(midia.id, {
      transcriptRaw: sttResult.transcript,
      transcript: sttResult.transcript,
      valorDetectadoCentavos: valorCentavos || undefined,
      valorConfidence: valorConfidence,
      intentClass: nluRes.intentClass,
      categoriaSugestao: nluRes.categoriaSugestao,
      subcategoriaSugestao: nluRes.subcategoriaSugestao,
      status: 'PARSE_OK'
    });
    ctx.reply(`Voice transcrito: "${sttResult.transcript}"\nValor: ${valorCentavos ? (valorCentavos/100).toFixed(2) : 'não detectado'}\nIntent: ${nluRes.intentClass}\nPara confirmar: /confirm ${midia.id} [entrada|saida]`);
  });

  bot.on('photo', async (ctx: Context) => {
    if (!ctx.from || !ctx.message || !('photo' in ctx.message)) return;
    const usuarioId = String(ctx.from.id);
    const photos: any[] = (ctx.message as any).photo;
    if (!photos?.length) return;
    const largest: any = photos[photos.length - 1];
    const fileId: string = largest.file_id;
    const midia = await midiaService.registrarCaptura(usuarioId, 'photo', fileId);
    const ocrResult = await ocr.extract(fileId);
    const nluRes = await nlu.classify(ocrResult.text);
    const { valorCentavos, confidence: valorConfidence } = extrairValorCentavos(ocrResult.text);
    await midiaService.atualizar(midia.id, {
      transcriptRaw: ocrResult.text,
      transcript: ocrResult.text,
      valorDetectadoCentavos: valorCentavos || undefined,
      valorConfidence: valorConfidence,
      intentClass: nluRes.intentClass,
      categoriaSugestao: nluRes.categoriaSugestao,
      subcategoriaSugestao: nluRes.subcategoriaSugestao,
      status: 'PARSE_OK'
    });
    ctx.reply(`Foto OCR: "${ocrResult.text}"\nValor: ${valorCentavos ? (valorCentavos/100).toFixed(2) : 'não detectado'}\nIntent: ${nluRes.intentClass}\nPara confirmar: /confirm ${midia.id} [entrada|saida]`);
  });

  bot.command('confirm', async (ctx: Context) => {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;
    const usuarioId = String(ctx.from.id);
    const parts = (ctx.message as any).text.trim().split(/\s+/);
    if (parts.length < 2) {
      ctx.reply('Uso: /confirm <midiaId> [entrada|saida|manejo]');
      return;
    }
    const midiaId = parts[1];
    const tipoRaw = parts[2];
    const midia = await midiaService.obter(midiaId);
    if (!midia || midia.usuarioId !== usuarioId) {
      ctx.reply('Midia não encontrada');
      return;
    }
    if (!midia.valorDetectadoCentavos) {
      ctx.reply('Midia sem valor detectado');
      return;
    }
    const tipoMap: Record<string,string> = { entrada: 'ENTRADA', saida: 'SAIDA', manejo: 'MANEJO' };
    const tipo = tipoMap[(tipoRaw||'').toLowerCase()] || (midia.intentClass === 'ENTRADA' ? 'ENTRADA' : midia.intentClass === 'SAIDA' ? 'SAIDA' : 'MANEJO');
    const transacao = await transacaoService.criarLancamento({
      usuarioId,
      dataMovimento: new Date(),
      tipo: tipo as any,
      valorCentavos: midia.valorDetectadoCentavos,
      observacao: midia.transcript || midia.transcriptRaw || undefined,
      categoriaId: midia.categoriaSugestao || undefined,
      subcategoriaId: midia.subcategoriaSugestao || undefined,
      fonteCaptura: midia.tipo as any
    });
    await midiaService.atualizar(midia.id, { status: 'CONFIRMADO', transacaoId: transacao.id });
    ctx.reply(`Transação confirmada indice ${transacao.indice} valor ${(transacao.valorCentavos/100).toFixed(2)}`);
  });

  bot.command('consagrar', async (ctx: Context) => {
    if (!ctx.from) return;
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
