// DSL de regras de consagração - estrutura básica e parse
import { z } from 'zod';

export const AcaoSchema = z.object({
  tipo: z.string(), // DIZIMO, OFERTA_REGULAR etc.
  percentual: z.union([
    z.number(), // fixo ex 0.10
    z.object({ faixaMin: z.number(), faixaMax: z.number() }) // faixa ex {0.05,0.10}
  ]),
  ordem: z.number()
});

export const RegraConsagracaoSchema = z.object({
  nome: z.string(),
  quando: z.object({ tipoTransacao: z.array(z.string()).optional() }).optional(),
  excecoes: z.object({ receitaNaoRecorrente: z.boolean().optional() }).optional(),
  acoes: z.array(AcaoSchema)
});

export type RegraConsagracao = z.infer<typeof RegraConsagracaoSchema>;

export function parseRegras(json: unknown): RegraConsagracao[] {
  if (!Array.isArray(json)) throw new Error('DSL raiz deve ser lista');
  return json.map(r => RegraConsagracaoSchema.parse(r));
}

export function selecionarRegra(regras: RegraConsagracao[], contexto: { isNaoRecorrente?: boolean }): RegraConsagracao | undefined {
  // Simplificado: primeira regra aplica; pode evoluir para matching complexo
  return regras.find(r => {
    if (contexto.isNaoRecorrente && r.excecoes?.receitaNaoRecorrente) {
      return true;
    }
    return true;
  });
}
