import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import * as multer from 'multer';

@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) { }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { storage: multer.memoryStorage() }),
  )
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
}