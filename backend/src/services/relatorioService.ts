import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RelatorioService {
  async resumoPeriodo(usuarioId: string, inicio: Date, fim: Date) {
    const entradas = await prisma.transacao.aggregate({ _sum: { valorCentavos: true }, where: { usuarioId, tipo: 'ENTRADA', dataMovimento: { gte: inicio, lt: fim }}});
    const saidas = await prisma.transacao.aggregate({ _sum: { valorCentavos: true }, where: { usuarioId, tipo: 'SAIDA', dataMovimento: { gte: inicio, lt: fim }}});
    const manejo = await prisma.transacao.aggregate({ _sum: { valorCentavos: true }, where: { usuarioId, tipo: 'MANEJO', dataMovimento: { gte: inicio, lt: fim }}});
    return {
      periodoInicio: inicio,
      periodoFim: fim,
      entradasCentavos: entradas._sum.valorCentavos || 0,
      saidasCentavos: saidas._sum.valorCentavos || 0,
      manejoCentavos: manejo._sum.valorCentavos || 0
    };
  }

  async relatorioDia(usuarioId: string, data: Date) {
    const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const fim = new Date(data.getFullYear(), data.getMonth(), data.getDate()+1);
    return this.resumoPeriodo(usuarioId, inicio, fim);
  }

  async relatorioMes(usuarioId: string, ano: number, mes: number) {
    const inicio = new Date(ano, mes-1, 1);
    const fim = new Date(ano, mes, 1);
    return this.resumoPeriodo(usuarioId, inicio, fim);
  }

  async relatorioAno(usuarioId: string, ano: number) {
    const inicio = new Date(ano,0,1);
    const fim = new Date(ano+1,0,1);
    return this.resumoPeriodo(usuarioId, inicio, fim);
  }
}
