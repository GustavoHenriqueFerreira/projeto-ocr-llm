import {
  Controller,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';
import { DocumentsService } from '../documents/documents.service';
import * as multer from 'multer';

@Controller('ocr')
export class OcrController {
  constructor(
    private readonly ocrService: OcrService,
    private readonly documentsService: DocumentsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('process/:documentId')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async processDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('documentId') documentId: string,
    @Req() req,
  ) {
    // Checa se o documento pertence ao usuário
    const document = await this.documentsService.findOne(documentId, req.user.userId);
    if (!document) {
      return { error: 'Documento não encontrado ou não pertence ao usuário' };
    }

    const text = await this.ocrService.extractTextFromBuffer(file.buffer);
    const ocrResult = await this.documentsService.saveOcrResult(documentId, text);

    return { success: true, text: ocrResult.text };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':documentId')
  async getOcrResult(@Param('documentId') documentId: string, @Req() req) {
    const document = await this.documentsService.findOne(documentId, req.user.userId);
    if (!document || !document.ocrResult) {
      return { error: 'Nenhum resultado OCR encontrado para este documento' };
    }
    return { text: document.ocrResult.text, processedAt: document.ocrResult.processedAt };
  }
}