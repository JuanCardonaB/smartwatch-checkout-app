import { join } from 'path';

/** Absolute path to the folder where uploaded product images are stored. */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

/** Public route (without global `api` prefix) under which images are served. */
export const UPLOADS_ROUTE = '/uploads';

/** Allowed image mime types for uploads. */
export const ALLOWED_IMAGE_MIME = /^image\/(png|jpe?g|webp|gif|avif)$/;

/** Max size per uploaded file (5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
