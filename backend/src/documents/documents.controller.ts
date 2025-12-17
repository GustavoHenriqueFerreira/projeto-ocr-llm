import { Controller, Post, Get, Param, Res, UseInterceptors, UploadedFile, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import * as multer from 'multer';
import type { Response } from 'express';

@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) { }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  upload(@UploadedFile() file: Express.Multer.File, @Req() req) {
    return this.documentsService.create(file, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findMyDocuments(@Req() req) {
    return this.documentsService.findByUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.documentsService.findOne(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/download')
  async downloadPdf(
    @Param('id') id: string,
    @Req() req,
    @Res() res: Response,
  ) {
    const document = await this.documentsService.findOne(id, req.user.userId);
    if (!document) {
      return res.status(404).json({ message: 'Documento não encontrado' });
    }

    const pdfBuffer = await this.documentsService.generatePdf(id);

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.filename}-ocr-llm.pdf"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  }
}