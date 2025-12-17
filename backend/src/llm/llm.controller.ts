import { Controller, Post, Body, UseGuards, Req, BadRequestException, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LlmService } from './llm.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('llm')
export class LlmController {
    constructor(
        private llmService: LlmService,
        private prisma: PrismaService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('explain')
    async explain(
        @Body('documentId') documentId: string,
        @Body('question') question: string,
    ) {
        if (!question?.trim()) {
            throw new BadRequestException('Pergunta vazia');
        }

        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: { ocrResult: true },
        });

        if (!document || !document.ocrResult?.text) {
            throw new BadRequestException('OCR não encontrado para este documento');
        }

        const prompt = `
Você é um assistente especializado em explicar documentos para usuários leigos.
Responda de forma clara, objetiva e em português.

=== TEXTO DO DOCUMENTO ===
${document.ocrResult.text}

=== PERGUNTA DO USUÁRIO ===
${question}
`;

        const answer = await this.llmService.explainText(prompt);

        if (!answer?.trim()) {
            throw new BadRequestException('Modelo não retornou resposta');
        }

        await this.prisma.interaction.createMany({
            data: [
                {
                    role: 'user',
                    message: question,
                    documentId,
                },
                {
                    role: 'llm',
                    message: answer,
                    documentId,
                },
            ],
        });

        return { answer };
    }
}