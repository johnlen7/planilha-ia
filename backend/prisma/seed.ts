import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  // Categorias essenciais
  const categorias = [
    { id: 'RENDA', nome: 'Renda', bloqueada: false },
    { id: 'DIZIMO', nome: 'Dízimo', bloqueada: true },
    { id: 'OFERTA', nome: 'Oferta', bloqueada: true },
    { id: 'POUPANCA', nome: 'Poupança', bloqueada: true },
    { id: 'CUSTEIO', nome: 'Custeio', bloqueada: true }
  ];
  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { id: c.id },
      update: {},
      create: c
    });
  }

  // Subcategorias básicas
  const subcats = [
    { id: 'RENDA_RECORRENTE', nome: 'Renda Recorrente', categoriaId: 'RENDA' },
    { id: 'RENDA_VARIAVEL', nome: 'Renda Variável', categoriaId: 'RENDA' }
  ];
  for (const s of subcats) {
    await prisma.subcategoria.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, visivel: true, lockName: false, bloqueada: false }
    });
  }

  console.log('Seed concluído');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
