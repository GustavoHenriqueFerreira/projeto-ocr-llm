import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LlmService } from './llm.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('llm')
export class LlmController {
  constructor(
    private llmService: LlmService,
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('explain')
  async explain(
    @Body('documentId') documentId: string,
    @Body('prompt') prompt: string,
    @Req() req,
  ) {
    const answer = await this.llmService.explainText(prompt);

    await this.prisma.interaction.createMany({
      data: [
        {
          role: 'user',
          message: prompt,
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