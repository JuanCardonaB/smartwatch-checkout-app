import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Injectable()
export class CloudinaryService {
  uploadBuffer(buffer: Buffer, folder = 'products'): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error || !result) {
            reject(new InternalServerErrorException('Cloudinary upload failed'));
          } else {
            resolve(result);
          }
        },
      );
      stream.end(buffer);
    });
  }

  /** Deletes all Cloudinary URLs that are no longer present in the updated list. */
  async deleteRemoved(previousUrls: string[], newUrls: string[]): Promise<void> {
    const newSet = new Set(newUrls);
    const removed = previousUrls.filter(
      (url) => !newSet.has(url) && url.includes('res.cloudinary.com'),
    );
    await Promise.all(removed.map((url) => this.destroyByUrl(url)));
  }

  private async destroyByUrl(url: string): Promise<void> {
    // Extract public_id from URL: everything after /upload/[v<digits>/] up to (but not including) the extension
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    if (!match) return;
    await cloudinary.uploader.destroy(match[1]);
  }
}
