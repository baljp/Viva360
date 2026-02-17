import { v2 as cloudinary } from 'cloudinary';
import { isMockMode } from './supabase.service';
import { logger } from '../lib/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Uploads an image (base64 or path) to Cloudinary.
   * In Mock Mode, keeps the original payload to preserve visual parity in local/test flows.
   */
  static async uploadImage(imagePath: string, folder: string = 'viva360/metamorphosis') {
    if (!imagePath) return imagePath;

    if (isMockMode()) {
      return imagePath;
    }

    // In production-like environments, if Cloudinary is not configured,
    // keep the original image instead of replacing with placeholder.
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
      return imagePath;
    }

    try {
      const uploadPromise = cloudinary.uploader.upload(imagePath, {
        folder,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Cloudinary upload timeout')), 5000);
      });
      const result = await Promise.race([uploadPromise, timeoutPromise]);
      return result.secure_url;
    } catch (error) {
      logger.warn('cloudinary.upload_failed', error);
      // Fallback to avoid breaking the flow
      return imagePath; 
    }
  }

  /**
   * Generates a transformed URL for specific UI needs (e.g. thumbnails)
   */
  static getThumbnail(url: string) {
    if (url.includes('cloudinary.com')) {
      return url.replace('/upload/', '/upload/c_thumb,w_200,g_face/');
    }
    return url;
  }
}
