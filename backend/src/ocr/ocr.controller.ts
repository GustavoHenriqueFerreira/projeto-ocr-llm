import { Controller, Post, UseGuards, Req, Get, Param, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OcrService } from './ocr.service';
import { DocumentsService } from '../documents/documents.service';

@Controller('ocr')
export class OcrController {
  constructor(
    private readonly ocrService: OcrService,
    private readonly documentsService: DocumentsService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('process/:documentId')
  async processDocument(@Param('documentId') documentId: string, @Req() req) {
    const document = await this.documentsService.findOne(
      documentId,
      req.user.userId,
    );

    if (!document) {
      throw new NotFoundException(
        'Documento não encontrado ou não pertence ao usuário',
      );
    }

    if (document.ocrResult) {
      return {
        text: document.ocrResult.text,
        processedAt: document.ocrResult.processedAt,
        fromCache: true,
      };
    }

    const fileBuffer = await this.documentsService.getFileBuffer(
      document.fileUrl,
    );

    const text = await this.ocrService.extractTextFromBuffer(fileBuffer);
    const ocrResult = await this.documentsService.saveOcrResult(
      documentId,
      text,
    );

    return {
      text: ocrResult.text,
      processedAt: ocrResult.processedAt,
      fromCache: false,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':documentId')
  async getOcrResult(@Param('documentId') documentId: string, @Req() req) {
    const document = await this.documentsService.findOne(documentId, req.user.userId);
    if (!document || !document.ocrResult) {
      throw new NotFoundException('Nenhum resultado OCR encontrado para este documento');
    }
    return { text: document.ocrResult.text, processedAt: document.ocrResult.processedAt };
  }
}