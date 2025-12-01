import { PrismaClient, StatusMidia } from '@prisma/client';

const prisma = new PrismaClient();

export class MidiaService {
  async registrarCaptura(usuarioId: string, tipo: string, telegramFileId?: string) {
    return prisma.midia.create({
      data: {
        usuarioId,
        tipo,
        telegramFileId,
        status: 'CAPTURADO'
      }
    });
  }

  async atualizar(id: string, data: Partial<{ transcriptRaw: string; transcript: string; valorDetectadoCentavos: number; valorConfidence: number; intentClass: string; categoriaSugestao: string; subcategoriaSugestao: string; status: StatusMidia; erro: string; transacaoId: string; }>) {
    return prisma.midia.update({ where: { id }, data });
  }

  async obter(id: string) {
    return prisma.midia.findUnique({ where: { id } });
  }
}
