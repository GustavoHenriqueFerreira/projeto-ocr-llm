import { Module } from '@nestjs/common';
import { OcrModule } from './ocr/ocr.module';
import { LlmModule } from './llm/llm.module';
import { DocumentsModule } from './documents/documents.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    DocumentsModule,
    OcrModule,
    LlmModule,
  ],
})
export class AppModule {}