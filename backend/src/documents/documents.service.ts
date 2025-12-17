import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import PDFDocument from 'pdfkit';
import streamBuffers from 'stream-buffers';
import axios from 'axios';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) { }

  async create(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('Arquivo não enviado');

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) throw new BadRequestException('Tipo de arquivo não suportado');

    const fileUrl = await this.storageService.uploadFile(
      'documents',
      `${Date.now()}-${file.originalname}`,
      file.buffer,
    );

    return this.prisma.document.create({
      data: { filename: file.originalname, fileUrl, userId },
    });
  }

  findByUser(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        ocrResult: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.document.findFirst({
      where: { id, userId },
      include: { ocrResult: true, interactions: true },
    });
  }

  async saveOcrResult(documentId: string, text: string) {
    const existing = await this.prisma.oCRResult.findUnique({ where: { documentId } });
    if (existing) {
      return this.prisma.oCRResult.update({
        where: { documentId },
        data: { text, processedAt: new Date() },
      });
    }
    return this.prisma.oCRResult.create({ data: { text, documentId } });
  }

  async findById(documentId: string) {
    return this.prisma.document.findUnique({
      where: { id: documentId },
      include: { ocrResult: true, interactions: true },
    });
  }

  async generatePdf(documentId: string): Promise<Buffer> {
    const doc = await this.findById(documentId);
    if (!doc) throw new BadRequestException('Documento não encontrado');

    const pdf = new PDFDocument({ margin: 50 });
    const buffer = new streamBuffers.WritableStreamBuffer();

    pdf.pipe(buffer);

    /* ===== CAPA ===== */
    pdf
      .fontSize(20)
      .text('Documento Processado', { align: 'center' });

    pdf.moveDown(2);

    pdf
      .fontSize(12)
      .text(`Nome do arquivo: ${doc.filename}`)
      .moveDown(0.5)
      .text(`Data de upload: ${doc.uploadedAt.toLocaleString()}`);

    /* ===== OCR ===== */
    if (doc.ocrResult?.text) {
      const ocrText = doc.ocrResult.text.replace(/\n+/g, '\n');
      
      pdf
        .addPage()
        .fontSize(16)
        .text('Texto Extraído (OCR)', { underline: true });

      pdf.moveDown();

      pdf.fontSize(11).text(ocrText, {
        align: 'left',
      });
    }

    /* ===== LLM ===== */
    if (doc.interactions?.length) {
      pdf
        .addPage()
        .fontSize(16)
        .text('Interações com a LLM', { underline: true })
        .moveDown();

      for (let i = 0; i < doc.interactions.length; i += 2) {
        const question = doc.interactions[i];
        const answer = doc.interactions[i + 1];

        if (question?.role === 'user') {
          pdf.font('Helvetica-Bold').text('Pergunta:');
          pdf.font('Helvetica').text(question.message).moveDown();
        }

        if (answer?.role === 'llm') {
          pdf.font('Helvetica-Bold').text('Resposta:');
          pdf.font('Helvetica').text(answer.message).moveDown(1.5);
        }
      }
    }

    pdf.end();

    await new Promise(resolve => buffer.on('finish', resolve));

    return buffer.getContents() as Buffer;
  }

  async getFileBuffer(fileUrl: string): Promise<Buffer> {
    const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  }
}