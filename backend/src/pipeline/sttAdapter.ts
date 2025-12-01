// Placeholder Speech-to-Text adapter
export interface STTResult {
  transcript: string;
  confidence: number;
  language?: string;
}

export class STTAdapter {
  async transcribe(voiceFileId: string): Promise<STTResult> {
    // Futuro: baixar arquivo Telegram, enviar para Whisper/OpenAI
    return {
      transcript: `Transcricao simulada para ${voiceFileId}`,
      confidence: 0.85,
      language: 'pt'
    };
  }
}
