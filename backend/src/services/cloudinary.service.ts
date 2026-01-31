import { v2 as cloudinary } from 'cloudinary';
import { isMockMode } from './supabase.service';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Uploads an image (base64 or path) to Cloudinary.
   * In Mock Mode, it returns a static Unsplash/Placeholder URL to avoid external calls.
   */
  static async uploadImage(imagePath: string, folder: string = 'viva360/metamorphosis') {
    if (isMockMode() || !process.env.CLOUDINARY_API_KEY) {
      // Return a professional placeholder for mock mode
      return `https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800&folder=${folder}`;
    }

    try {
      const result = await cloudinary.uploader.upload(imagePath, {
        folder,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
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
