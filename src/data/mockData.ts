import { Album, Photo, Comment, User } from '../types';

export const mockUser: User = {
  id: '1',
  name: '田中太郎',
  email: 'taro@example.com',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
  role: 'admin'
};

export const mockAlbums: Album[] = [
  {
    id: '1',
    title: '2024年家族旅行',
    description: '沖縄での楽しい思い出',
    coverImage: 'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdBy: '1',
    createdAt: '2024-01-15',
    photoCount: 24
  },
  {
    id: '2',
    title: 'お正月2024',
    description: 'みんなでお雑煮を食べました',
    coverImage: 'https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdBy: '1',
    createdAt: '2024-01-01',
    photoCount: 18
  },
  {
    id: '3',
    title: '桜の季節',
    description: '近所の公園で花見',
    coverImage: 'https://images.pexels.com/photos/1647962/pexels-photo-1647962.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdBy: '1',
    createdAt: '2024-04-05',
    photoCount: 12
  },
  {
    id: '4',
    title: '夏祭り',
    description: '地域の夏祭りに参加',
    coverImage: 'https://images.pexels.com/photos/1679618/pexels-photo-1679618.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdBy: '1',
    createdAt: '2024-07-20',
    photoCount: 30
  }
];

export const mockPhotos: Record<string, Photo[]> = {
  '1': [
    {
      id: '1',
      filename: 'beach1.jpg',
      url: 'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=800',
      thumbnail: 'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=300',
      albumId: '1',
      uploadedBy: '1',
      uploadedAt: '2024-01-15T10:00:00Z',
      width: 800,
      height: 600
    },
    {
      id: '2',
      filename: 'sunset.jpg',
      url: 'https://images.pexels.com/photos/358238/pexels-photo-358238.jpeg?auto=compress&cs=tinysrgb&w=800',
      thumbnail: 'https://images.pexels.com/photos/358238/pexels-photo-358238.jpeg?auto=compress&cs=tinysrgb&w=300',
      albumId: '1',
      uploadedBy: '1',
      uploadedAt: '2024-01-15T18:30:00Z',
      width: 800,
      height: 600
    },
    {
      id: '3',
      filename: 'family.jpg',
      url: 'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=800',
      thumbnail: 'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=300',
      albumId: '1',
      uploadedBy: '1',
      uploadedAt: '2024-01-16T12:15:00Z',
      width: 800,
      height: 600
    },
    {
      id: '4',
      filename: 'food.jpg',
      url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
      thumbnail: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
      albumId: '1',
      uploadedBy: '1',
      uploadedAt: '2024-01-16T19:00:00Z',
      width: 800,
      height: 600
    }
  ]
};

export const mockComments: Record<string, Comment[]> = {
  '1': [
    {
      id: '1',
      content: 'とても綺麗な海ですね！天気も良くて最高です。',
      photoId: '1',
      userId: '1',
      userName: '田中太郎',
      userAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      content: 'みんなで泳いで楽しかった〜！',
      photoId: '1',
      userId: '2',
      userName: '田中花子',
      userAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      createdAt: '2024-01-15T11:00:00Z'
    }
  ],
  '2': [
    {
      id: '3',
      content: 'この夕日、本当に美しいですね。写真で見ても感動します。',
      photoId: '2',
      userId: '3',
      userName: '田中おじいちゃん',
      userAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      createdAt: '2024-01-15T19:00:00Z'
    }
  ]
};