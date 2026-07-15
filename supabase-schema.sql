-- Supabase 数据库表结构
-- 在 Supabase 项目的 SQL Editor 中执行

-- 分类表
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'Tag',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 打卡记录表
CREATE TABLE check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT,
  record_date DATE NOT NULL,
  record_time TIME NOT NULL,
  topic_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 媒体文件表
CREATE TABLE media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  storage_path TEXT NOT NULL,
  size BIGINT,
  duration INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全策略（RLS）
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- 分类表策略
CREATE POLICY "Users can manage own categories"
  ON categories FOR ALL
  USING (auth.uid() = user_id);

-- 打卡记录表策略
CREATE POLICY "Users can manage own check_ins"
  ON check_ins FOR ALL
  USING (auth.uid() = user_id);

-- 媒体文件表策略
CREATE POLICY "Users can manage own media_files"
  ON media_files FOR ALL
  USING (auth.uid() = user_id);

-- 创建媒体文件存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- 媒体存储访问策略
CREATE POLICY "Users can upload own media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.uid()::text = owner);

CREATE POLICY "Users can read own media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media' AND auth.uid()::text = owner);

CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.uid()::text = owner);
