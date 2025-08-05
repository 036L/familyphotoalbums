/*
  # 家族向けアルバムアプリ初期スキーマ

  1. New Tables
    - `profiles` - ユーザープロフィール情報
      - `id` (uuid, primary key, auth.users参照)
      - `name` (text, 表示名)
      - `avatar_url` (text, アバター画像URL)
      - `role` (text, 権限レベル)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `albums` - アルバム情報
      - `id` (uuid, primary key)
      - `title` (text, アルバムタイトル)
      - `description` (text, 説明)
      - `cover_image_url` (text, カバー画像URL)
      - `created_by` (uuid, 作成者ID)
      - `is_public` (boolean, 公開設定)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `photos` - 写真・動画情報
      - `id` (uuid, primary key)
      - `filename` (text, ファイル名)
      - `original_filename` (text, 元のファイル名)
      - `url` (text, ファイルURL)
      - `thumbnail_url` (text, サムネイルURL)
      - `file_type` (text, ファイルタイプ)
      - `file_size` (integer, ファイルサイズ)
      - `width` (integer, 幅)
      - `height` (integer, 高さ)
      - `album_id` (uuid, アルバムID)
      - `uploaded_by` (uuid, アップロード者ID)
      - `metadata` (jsonb, メタデータ)
      - `created_at` (timestamp)
    
    - `comments` - コメント情報
      - `id` (uuid, primary key)
      - `content` (text, コメント内容)
      - `photo_id` (uuid, 写真ID)
      - `user_id` (uuid, ユーザーID)
      - `parent_id` (uuid, 親コメントID)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for family members to access shared albums
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  avatar_url text,
  role text DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  original_filename text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size integer NOT NULL,
  width integer,
  height integer,
  album_id uuid REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Albums policies
CREATE POLICY "Users can read all albums"
  ON albums FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create albums"
  ON albums FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own albums"
  ON albums FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own albums"
  ON albums FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Photos policies
CREATE POLICY "Users can read all photos"
  ON photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload photos"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- Comments policies
CREATE POLICY "Users can read all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Users can view photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'photos');

CREATE POLICY "Users can update own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);