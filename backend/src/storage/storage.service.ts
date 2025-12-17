import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async uploadFile(
    bucket: string,
    fileName: string,
    fileBuffer: Buffer,
  ): Promise<string> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, { upsert: true });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }
}