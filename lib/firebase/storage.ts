import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type UploadResult,
} from 'firebase/storage';
import { storage } from './client';

// Upload file to Firebase Storage
export const uploadFile = async (
  path: string,
  file: File | Blob
): Promise<UploadResult> => {
  const storageRef = ref(storage, path);
  return uploadBytes(storageRef, file);
};

// Get download URL for a file
export const getFileURL = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

// Delete a file from storage
export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

// Upload and get URL in one operation
export const uploadAndGetURL = async (
  path: string,
  file: File | Blob
): Promise<string> => {
  await uploadFile(path, file);
  return getFileURL(path);
};
