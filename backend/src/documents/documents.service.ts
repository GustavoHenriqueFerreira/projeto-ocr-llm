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

  async generatePdf(documentId: string) {
    const doc = await this.findById(documentId);
    if (!doc) throw new BadRequestException('Documento não encontrado');

    const pdf = new PDFDocument();
    const writableBuffer = new streamBuffers.WritableStreamBuffer();

    pdf.pipe(writableBuffer);

    pdf.fontSize(18).text(`Documento: ${doc.filename}`, { underline: true });
    pdf.moveDown();

    if (doc.ocrResult) {
      pdf.fontSize(14).text('Texto OCR:', { bold: true });
      pdf.fontSize(12).text(doc.ocrResult.text);
      pdf.moveDown();
    }

    if (doc.interactions?.length) {
      pdf.fontSize(14).text('Interações LLM:', { bold: true });
      doc.interactions.forEach(i => {
        pdf.fontSize(12).text(`[${i.role}] ${i.message}`);
      });
    }

    pdf.end();
    await new Promise(resolve => pdf.on('end', resolve));

    return writableBuffer.getBuffer();
  }

  async getFileBuffer(fileUrl: string): Promise<Buffer> {
    const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  }
}