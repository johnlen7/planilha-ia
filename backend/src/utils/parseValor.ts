export function extrairValorCentavos(texto: string): { valorCentavos: number | null; confidence: number } {
  // Busca números monetários (ex: 1.234,56 ou 1234.56)
  const regex = /(\d{1,3}(?:[\.\s]\d{3})*|\d+)([\.,]\d{2})?/g;
  const matches = [...texto.matchAll(regex)];
  if (!matches.length) return { valorCentavos: null, confidence: 0 };
  // heurística: maior valor no texto
  let maior = 0;
  for (const m of matches) {
    const inteiro = m[1].replace(/[\.\s]/g, '');
    const dec = m[2] ? m[2].replace(/[\.,]/, '') : '00';
    const centavos = parseInt(inteiro, 10) * 100 + parseInt(dec, 10);
    if (centavos > maior) maior = centavos;
  }
  return { valorCentavos: maior, confidence: 0.7 };
}
