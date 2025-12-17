import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LlmService {
  private apiKey = process.env.GEMINI_API_KEY;

  async explainText(prompt: string): Promise<string> {
    if (!prompt) return '';

    const res = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        timeout: 15000,
      },
    );

    return (
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    );
  }
}