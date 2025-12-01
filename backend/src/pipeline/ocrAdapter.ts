// Placeholder OCR adapter
export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
}

export class OCRAdapter {
  async extract(photoFileId: string): Promise<OCRResult> {
    // Futuro: baixar arquivo e rodar Tesseract
    return {
      text: `Texto extraído simulado da foto ${photoFileId}`,
      confidence: 0.8,
      language: 'pt'
    };
  }
}
