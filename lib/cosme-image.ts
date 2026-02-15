import { uploadAndGetURL, deleteFile } from '@/lib/firebase/storage';

const BUCKET_PREFIX = 'cosme-images';

export async function uploadCosmeImage(
  userId: string,
  itemId: string,
  file: File,
  variant: 'original' | 'thumbnail' | 'card' = 'original'
): Promise<string> {
  const ext = variant === 'original' ? 'jpg' : 'webp';
  const path = `${BUCKET_PREFIX}/${userId}/${itemId}/${variant}.${ext}`;
  return uploadAndGetURL(path, file);
}

export async function deleteCosmeImage(
  userId: string,
  itemId: string
): Promise<void> {
  const variants = ['original.jpg', 'thumbnail.webp', 'card.webp'] as const;
  const deletions = variants.map((v) =>
    deleteFile(`${BUCKET_PREFIX}/${userId}/${itemId}/${v}`).catch(() => {})
  );
  await Promise.all(deletions);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
