import {
  FileText,
  FileVideo,
  FileImage,
  FileArchive,
  File,
} from 'lucide-react';
import type { TrainingMaterial } from '@/types/material';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (type: TrainingMaterial['type']) => {
  const icons = {
    document: FileText,
    video: FileVideo,
    image: FileImage,
    archive: FileArchive,
    other: File,
  };
  return icons[type];
};

export const getFileIconColor = (type: TrainingMaterial['type']) => {
  const colors = {
    document: 'text-blue-500',
    video: 'text-red-500',
    image: 'text-green-500',
    archive: 'text-yellow-500',
    other: 'text-gray-500',
  };
  return colors[type];
};
