import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { DocumentsModule } from './documents/documents.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, DocumentsModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}