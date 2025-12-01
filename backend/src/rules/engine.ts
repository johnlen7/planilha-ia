import { RegraConsagracao, selecionarRegra } from './dsl.js';
import { MotorConsagracaoContext, ConsagracaoAlocacaoResult } from '../models/types.js';

interface EngineOptions {
  arredondamento: 'floor-last-adjust';
}

export class MotorConsagracao {
  constructor(private regras: RegraConsagracao[], private opts: EngineOptions = { arredondamento: 'floor-last-adjust' }) {}

  calcular(ctx: MotorConsagracaoContext, flags: { isNaoRecorrente?: boolean }): ConsagracaoAlocacaoResult[] {
    const regra = selecionarRegra(this.regras, flags);
    if (!regra) return [];
    const base = ctx.rendaBaseMesCentavos;

    const resultados: ConsagracaoAlocacaoResult[] = [];
    let acumulado = 0;

    for (const acao of regra.acoes.sort((a,b)=>a.ordem - b.ordem)) {
      let percentual: number;
      if (typeof acao.percentual === 'number') {
        percentual = acao.percentual;
      } else {
        // faixa: para receita não recorrente escolher mínimo; recorrente escolher máximo
        percentual = flags.isNaoRecorrente ? acao.percentual.faixaMin : acao.percentual.faixaMax;
      }
      const bruto = base * percentual;
      let valor = Math.floor(bruto); // centavos assumindo base já em centavos
      resultados.push({ tipo: acao.tipo, percentual: percentual * 100, valorCentavos: valor, ordem: acao.ordem });
      acumulado += valor;
    }

    // Ajuste residual (diferença por truncamento)
    const residual = base - acumulado;
    if (residual !== 0 && resultados.length) {
      resultados[resultados.length - 1].valorCentavos += residual;
    }

    return resultados;
  }
}
