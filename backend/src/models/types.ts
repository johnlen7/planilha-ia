export interface LancamentoInputBase {
  usuarioId: string;
  dataMovimento: Date;
  tipo: 'ENTRADA' | 'SAIDA' | 'MANEJO';
  valorCentavos: number;
  origemContaId?: string;
  destinoContaId?: string;
  categoriaId?: string;
  subcategoriaId?: string;
  observacao?: string;
  isNaoRecorrente?: boolean;
  fonteCaptura?: 'manual' | 'voice' | 'photo' | 'text';
  rawTexto?: string;
}

export interface ConsagracaoAlocacaoResult {
  tipo: string;
  percentual: number; // 0-100
  valorCentavos: number;
  ordem: number;
}

export interface GrauSnapshot {
  grau: string;
  faixaMinCentavos: number;
  faixaMaxCentavos: number;
  percentuais: Record<string, number>; // categoria -> percentual
  fidelidade: Record<string, number>; // subcategoria -> percentual (dentro do bucket Fidelidade)
}

export interface MotorConsagracaoContext {
  rendaBaseMesCentavos: number;
  grauSnapshot: GrauSnapshot;
  mes: number;
  ano: number;
}
