import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) { }

  async create(file: Express.Multer.File, userId: string) {
    // 1️⃣ valida se veio arquivo
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não suportado');
    }

    const fileUrl = await this.storageService.uploadFile(
      'documents',
      `${Date.now()}-${file.originalname}`,
      file.buffer,
    );

    return this.prisma.document.create({
      data: {
        filename: file.originalname,
        fileUrl,
        userId,
      },
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
      include: { ocrResult: true },
    });
  }

  async saveOcrResult(documentId: string, text: string) {
    const existing = await this.prisma.oCRResult.findUnique({
      where: { documentId },
    });

    if (existing) {
      return this.prisma.oCRResult.update({
        where: { documentId },
        data: { text, processedAt: new Date() },
      });
    }

    return this.prisma.oCRResult.create({
      data: {
        text,
        documentId,
      },
    });
  }
}
