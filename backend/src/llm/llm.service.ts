import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LlmService {
  private apiKey = process.env.GEMINI_API_KEY;

  async explainText(text: string) {
    if (!text) return '';
    const res = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: 'gemini-1.5-t',
        input: `Explique o seguinte texto de forma clara e resumida:\n\n${text}`,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return res.data.output_text || '';
  }
}