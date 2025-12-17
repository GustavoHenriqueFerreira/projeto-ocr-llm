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
      .text('Documento Processado', { align: 'center' })
      .moveDown();

    pdf
      .fontSize(12)
      .text(`Nome do arquivo: ${doc.filename}`)
      .text(`Data de upload: ${doc.uploadedAt.toLocaleString()}`)
      .moveDown(2);

    /* ===== OCR ===== */
    if (doc.ocrResult?.text) {
      pdf
        .addPage()
        .fontSize(16)
        .text('Texto Extraído (OCR)', { underline: true })
        .moveDown();

      pdf.fontSize(11).text(doc.ocrResult.text, {
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
          pdf
            .fontSize(12)
            .text('Pergunta:', { continued: false })
            .font('Helvetica-Bold')
            .text(question.message)
            .font('Helvetica')
            .moveDown(0.5);
        }

        if (answer?.role === 'llm') {
          pdf
            .fontSize(12)
            .text('Resposta:', { continued: false })
            .font('Helvetica-Bold')
            .text(answer.message)
            .font('Helvetica')
            .moveDown(1.5);
        }
      }
    }

    pdf.end();
    await new Promise(resolve => pdf.on('end', resolve));

    return buffer.getBuffer();
  }

  async getFileBuffer(fileUrl: string): Promise<Buffer> {
    const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  }
}