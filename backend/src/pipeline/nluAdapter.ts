// Placeholder NLU adapter para intenção e categoria sugestão
export interface NLUResult {
  intentClass: 'ENTRADA' | 'SAIDA' | 'MANEJO' | 'CONSULTA';
  categoriaSugestao?: string;
  subcategoriaSugestao?: string;
  confidence: number;
}

export class NLUAdapter {
  async classify(text: string): Promise<NLUResult> {
    const lower = text.toLowerCase();
    if (lower.includes('recebi') || lower.includes('salário') || lower.includes('renda')) {
      return { intentClass: 'ENTRADA', categoriaSugestao: 'RENDA', subcategoriaSugestao: 'RENDA_RECORRENTE', confidence: 0.9 };
    }
    if (lower.includes('transfer') || lower.includes('mover')) {
      return { intentClass: 'MANEJO', confidence: 0.6 };
    }
    if (lower.startsWith('quanto') || lower.startsWith('relatorio')) {
      return { intentClass: 'CONSULTA', confidence: 0.7 };
    }
    return { intentClass: 'SAIDA', categoriaSugestao: 'CUSTEIO', confidence: 0.7 };
  }
}
