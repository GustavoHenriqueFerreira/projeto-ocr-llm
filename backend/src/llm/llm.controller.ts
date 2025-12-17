import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
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
        @Req() req,
    ) {
        // Gera explicação via LLM
        const answer = await this.llmService.explainText(question);

        // Salva pergunta e resposta no banco
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