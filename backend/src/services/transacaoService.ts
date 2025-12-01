import { PrismaClient } from '@prisma/client';
import { LancamentoInputBase } from '../models/types.js';

const prisma = new PrismaClient();

export class TransacaoService {
  async criarLancamento(input: LancamentoInputBase) {
    // heurística índice sequencial por ano
    const ano = input.dataMovimento.getFullYear();
    const countAno = await prisma.transacao.count({ where: { usuarioId: input.usuarioId, dataMovimento: {
      gte: new Date(ano,0,1), lt: new Date(ano+1,0,1)
    }}});
    const indice = String(countAno + 1).padStart(4, '0');

    // detectar não recorrente (simplificado): se não existe transacao mesma subcategoria nos últimos 180 dias
    let isNaoRecorrente = false;
    if (input.subcategoriaId) {
      const existe = await prisma.transacao.findFirst({
        where: {
          usuarioId: input.usuarioId,
          subcategoriaId: input.subcategoriaId,
          dataMovimento: { gte: new Date(input.dataMovimento.getTime() - 180*24*3600*1000) }
        }
      });
      isNaoRecorrente = !existe;
    }

    const transacao = await prisma.transacao.create({
      data: {
        usuarioId: input.usuarioId,
        indice,
        dataMovimento: input.dataMovimento,
        tipo: input.tipo as any,
        valorCentavos: input.valorCentavos,
        origemContaId: input.origemContaId,
        destinoContaId: input.destinoContaId,
        categoriaId: input.categoriaId,
        subcategoriaId: input.subcategoriaId,
        observacao: input.observacao,
        isNaoRecorrente
      }
    });
    return transacao;
  }
}
