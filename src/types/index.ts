export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface Album {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  createdBy: string;
  createdAt: string;
  photoCount: number;
}

export interface Photo {
  id: string;
  filename: string;
  url: string;
  thumbnail: string;
  albumId: string;
  uploadedBy: string;
  uploadedAt: string;
  width: number;
  height: number;
}

export interface Comment {
  id: string;
  content: string;
  photoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}