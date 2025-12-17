import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class OcrService {
  private apiKey = process.env.OCR_SPACE_API_KEY;

  async extractTextFromBuffer(fileBuffer: Buffer): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, 'invoice.jpg');

      const res = await axios.post('https://api.ocr.space/parse/image', formData, {
        headers: {
          apikey: this.apiKey,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
      });

      const parsed = res.data.ParsedResults?.[0]?.ParsedText;
      return parsed || '';
    } catch (err) {
      console.error('Erro ao processar OCR:', err);
      throw new InternalServerErrorException('Falha ao processar OCR');
    }
  }
}
