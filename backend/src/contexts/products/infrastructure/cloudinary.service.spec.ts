import { InternalServerErrorException } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

// Mock the cloudinary module before any imports resolve it
jest.mock('cloudinary', () => {
  const mockStream = {
    end: jest.fn(),
  };
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload_stream: jest.fn().mockReturnValue(mockStream),
        destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
      },
    },
  };
});

// Import after mocking
import { v2 as cloudinary } from 'cloudinary';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(() => {
    service = new CloudinaryService();
    jest.clearAllMocks();
  });

  /* ─────────────────────────────────────────
     uploadBuffer
  ───────────────────────────────────────── */

  describe('uploadBuffer', () => {
    it('resolves with the upload result on success', async () => {
      const fakeResult = {
        public_id: 'products/abc123',
        secure_url: 'https://res.cloudinary.com/demo/image/upload/products/abc123.jpg',
      };

      // Simulate upload_stream calling the callback with a result
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts: unknown, callback: (err: null, result: typeof fakeResult) => void) => {
          callback(null, fakeResult);
          return { end: jest.fn() };
        },
      );

      const buffer = Buffer.from('fake-image-data');
      const result = await service.uploadBuffer(buffer, 'products');

      expect(result).toEqual(fakeResult);
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'products', resource_type: 'image' },
        expect.any(Function),
      );
    });

    it('uses default folder "products" when no folder argument is provided', async () => {
      const fakeResult = { public_id: 'products/xyz', secure_url: 'https://res.cloudinary.com/x.jpg' };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts: unknown, callback: (err: null, result: typeof fakeResult) => void) => {
          callback(null, fakeResult);
          return { end: jest.fn() };
        },
      );

      await service.uploadBuffer(Buffer.from('data'));

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'products', resource_type: 'image' },
        expect.any(Function),
      );
    });

    it('rejects with InternalServerErrorException when cloudinary returns an error', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts: unknown, callback: (err: Error, result: undefined) => void) => {
          callback(new Error('Upload failed'), undefined);
          return { end: jest.fn() };
        },
      );

      const buffer = Buffer.from('bad-data');
      await expect(service.uploadBuffer(buffer)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.uploadBuffer(buffer)).rejects.toThrow(
        'Cloudinary upload failed',
      );
    });

    it('rejects with InternalServerErrorException when result is null/undefined', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts: unknown, callback: (err: null, result: undefined) => void) => {
          callback(null, undefined);
          return { end: jest.fn() };
        },
      );

      await expect(service.uploadBuffer(Buffer.from('data'))).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  /* ─────────────────────────────────────────
     deleteRemoved
  ───────────────────────────────────────── */

  describe('deleteRemoved', () => {
    it('calls destroy for URLs that are removed and contain res.cloudinary.com', async () => {
      const previousUrls = [
        'https://res.cloudinary.com/demo/image/upload/v1234/products/old1.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1234/products/old2.jpg',
      ];
      const newUrls = [
        'https://res.cloudinary.com/demo/image/upload/v1234/products/old1.jpg',
      ];

      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.deleteRemoved(previousUrls, newUrls);

      // old2 was removed, old1 was kept
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('products/old2');
    });

    it('does not call destroy for non-cloudinary URLs that were removed', async () => {
      const previousUrls = [
        'https://example.com/non-cloudinary-image.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1234/products/kept.jpg',
      ];
      const newUrls = [
        'https://res.cloudinary.com/demo/image/upload/v1234/products/kept.jpg',
      ];

      await service.deleteRemoved(previousUrls, newUrls);

      // Non-cloudinary URL is filtered out
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('does nothing when all previous URLs are still present in new list', async () => {
      const urls = [
        'https://res.cloudinary.com/demo/image/upload/v1234/products/img1.jpg',
      ];

      await service.deleteRemoved(urls, urls);

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('handles empty previousUrls array gracefully', async () => {
      await service.deleteRemoved([], ['https://res.cloudinary.com/x.jpg']);
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('deletes all previous cloudinary URLs when newUrls is empty', async () => {
      const previousUrls = [
        'https://res.cloudinary.com/demo/image/upload/v1234/products/img1.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1234/products/img2.jpg',
      ];

      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.deleteRemoved(previousUrls, []);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(2);
    });

    it('ignores URLs that are in newUrls even if they are cloudinary URLs', async () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v5678/products/img.png';
      await service.deleteRemoved([url], [url]);
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });
  });

  /* ─────────────────────────────────────────
     destroyByUrl (tested via deleteRemoved)
  ───────────────────────────────────────── */

  describe('destroyByUrl (via deleteRemoved)', () => {
    it('extracts public_id without version prefix', async () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v1234567/products/my-watch.jpg';

      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.deleteRemoved([url], []);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('products/my-watch');
    });

    it('extracts public_id when there is no version prefix in URL', async () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/products/no-version.png';

      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.deleteRemoved([url], []);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('products/no-version');
    });

    it('does nothing when URL does not match upload pattern', async () => {
      // A res.cloudinary.com URL that does NOT contain /upload/ — won't match regex
      const url = 'https://res.cloudinary.com/demo/image/fetch/products/weird.jpg';

      await service.deleteRemoved([url], []);

      // destroyByUrl is called but regex fails to match, so destroy should NOT be called
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });
  });
});
