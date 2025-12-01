import { PrismaClient } from '@prisma/client';
import { MotorConsagracao } from '../rules/engine.js';
import { MotorConsagracaoContext } from '../models/types.js';

const prisma = new PrismaClient();

export class ConsagracaoService {
  constructor(private motor: MotorConsagracao) {}

  async calcularEPersistir(usuarioId: string, mes: number, ano: number, flags: { isNaoRecorrente?: boolean }) {
    // renda base: soma ENTRADA categoria Renda do mês
    const rendaBase = await prisma.transacao.aggregate({
      _sum: { valorCentavos: true },
      where: {
        usuarioId,
        tipo: 'ENTRADA',
        categoriaId: 'RENDA',
        dataMovimento: {
          gte: new Date(ano, mes - 1, 1),
          lt: new Date(ano, mes, 1)
        }
      }
    });
    const rendaBaseCentavos = rendaBase._sum.valorCentavos || 0;

    let snapshot = await prisma.parametrosGrauHistorico.findFirst({
      where: { ano, mes },
      orderBy: { criadoEm: 'desc' }
    });
    if (!snapshot) {
      // classificação de grau simplificada
      const renda = rendaBaseCentavos;
      const grau = renda <= 100000 ? 'SUB' : renda <= 400000 ? 'M1' : renda <= 700000 ? 'M2' : renda <= 1000000 ? 'M3' : renda <= 1300000 ? 'M4' : 'M5';
      snapshot = await prisma.parametrosGrauHistorico.create({
        data: {
          grau,
          faixaMinCentavos: 0,
          faixaMaxCentavos: 999999999,
          percentuaisJson: { DIZIMO: 0.10, OFERTA_REGULAR: { faixaMin: 0.05, faixaMax: 0.10 }, POUPANCA: 0.05, CUSTEIO: 0.05 },
          fidelidadeJson: { DIZIMO: 0.10 },
          mes,
          ano
        }
      });
    }

    const ctx: MotorConsagracaoContext = {
      rendaBaseMesCentavos: rendaBaseCentavos,
      grauSnapshot: {
        grau: snapshot.grau,
        faixaMinCentavos: snapshot.faixaMinCentavos,
        faixaMaxCentavos: snapshot.faixaMaxCentavos,
        percentuais: snapshot.percentuaisJson as Record<string, number>,
        fidelidade: snapshot.fidelidadeJson as Record<string, number>
      },
      mes,
      ano
    };

    const alocacoes = this.motor.calcular(ctx, flags);

    // Persistir (sem transacao vinculada: agregada mensal)
    const rows = await Promise.all(alocacoes.map(a => prisma.consagracao.create({
      data: {
        usuarioId,
        transacaoId: null,
        parametrosSnapshotId: snapshot.id,
        tipo: a.tipo as any,
        percentual: a.percentual / 100,
        valorCentavos: a.valorCentavos,
        ordem: a.ordem,
        mes,
        ano
      }
    })));
    return rows;
  }
}
