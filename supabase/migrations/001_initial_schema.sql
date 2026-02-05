-- ============================================
-- 双人协同 Todo 系统 - 数据库初始化脚本
-- ============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户配置表 (profiles)
-- 扩展 Supabase Auth 的用户信息
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ============================================
-- 2. 标签表 (tags)
-- 用户创建的自定义标签
-- ============================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, name)
);

-- ============================================
-- 3. 共享看板表 (shared_boards)
-- 两人共享的任务看板
-- ============================================
CREATE TABLE IF NOT EXISTS public.shared_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT '共享看板',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ============================================
-- 4. 共享看板成员表 (shared_board_members)
-- 共享看板的成员（通常是两个人）
-- ============================================
CREATE TABLE IF NOT EXISTS public.shared_board_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES public.shared_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(board_id, user_id)
);

-- ============================================
-- 5. 任务表 (tasks)
-- 核心任务数据表
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  shared_board_id UUID REFERENCES public.shared_boards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ============================================
-- 6. 任务标签关联表 (task_tags)
-- 多对多关系：一个任务可以有多个标签
-- ============================================
CREATE TABLE IF NOT EXISTS public.task_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(task_id, tag_id)
);

-- ============================================
-- 7. 好友请求表 (friend_requests)
-- 好友请求记录
-- ============================================
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(sender_id, receiver_id)
);

-- ============================================
-- 8. 好友关系表 (friendships)
-- 已确认的好友关系
-- ============================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- ============================================
-- 创建索引以优化查询性能
-- ============================================

-- profiles 索引
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- tasks 索引
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_shared_board_id_idx ON public.tasks(shared_board_id);
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS tasks_user_completed_idx ON public.tasks(user_id, completed);

-- tags 索引
CREATE INDEX IF NOT EXISTS tags_user_id_idx ON public.tags(user_id);

-- task_tags 索引
CREATE INDEX IF NOT EXISTS task_tags_task_id_idx ON public.task_tags(task_id);
CREATE INDEX IF NOT EXISTS task_tags_tag_id_idx ON public.task_tags(tag_id);

-- friend_requests 索引
CREATE INDEX IF NOT EXISTS friend_requests_receiver_idx ON public.friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS friend_requests_sender_idx ON public.friend_requests(sender_id, status);

-- friendships 索引
CREATE INDEX IF NOT EXISTS friendships_user_id_idx ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_id_idx ON public.friendships(friend_id);

-- shared_boards 索引
CREATE INDEX IF NOT EXISTS shared_board_members_board_idx ON public.shared_board_members(board_id);
CREATE INDEX IF NOT EXISTS shared_board_members_user_idx ON public.shared_board_members(user_id);

-- ============================================
-- 启用行级安全性 (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_board_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 策略
-- ============================================

-- profiles: 用户可以读取所有配置文件（用于查找好友），但只能修改自己的
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- tags: 用户只能操作自己的标签
CREATE POLICY "Users can view their own tags"
  ON public.tags FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON public.tags FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- tasks: 用户可以查看自己的任务和共享看板中的任务
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT USING (
    auth.uid() = user_id OR
    shared_board_id IN (
      SELECT board_id FROM public.shared_board_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own tasks"
  ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update tasks in their shared boards"
  ON public.tasks FOR UPDATE USING (
    auth.uid() = user_id OR
    shared_board_id IN (
      SELECT board_id FROM public.shared_board_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- task_tags: 通过任务关联的权限
CREATE POLICY "Users can view task tags for accessible tasks"
  ON public.task_tags FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_tags.task_id
      AND (t.user_id = auth.uid() OR t.shared_board_id IN (
        SELECT board_id FROM public.shared_board_members WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can insert tags to their own tasks"
  ON public.task_tags FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_tags.task_id
      AND (t.user_id = auth.uid() OR t.shared_board_id IN (
        SELECT board_id FROM public.shared_board_members WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can delete tags from their tasks"
  ON public.task_tags FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_tags.task_id
      AND (t.user_id = auth.uid() OR t.shared_board_id IN (
        SELECT board_id FROM public.shared_board_members WHERE user_id = auth.uid()
      ))
    )
  );

-- friend_requests: 用户可以查看自己相关的好友请求
CREATE POLICY "Users can view their friend requests"
  ON public.friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders can update their friend requests"
  ON public.friend_requests FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Receivers can accept/reject friend requests"
  ON public.friend_requests FOR UPDATE USING (auth.uid() = receiver_id);

-- friendships: 用户可以查看自己的好友关系
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert their friendships"
  ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE USING (auth.uid() = user_id);

-- shared_boards: 只有成员可以查看
CREATE POLICY "Members can view shared boards"
  ON public.shared_boards FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shared_board_members WHERE board_id = shared_boards.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shared boards"
  ON public.shared_boards FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can update shared boards"
  ON public.shared_boards FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shared_board_members WHERE board_id = shared_boards.id AND user_id = auth.uid()
    )
  );

-- shared_board_members: 成员可以查看
CREATE POLICY "Members can view board membership"
  ON public.shared_board_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shared_board_members WHERE board_id = shared_board_members.board_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add members to their boards"
  ON public.shared_board_members FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM public.shared_boards WHERE id = shared_board_members.board_id
    )
  );

-- ============================================
-- 创建自动更新 updated_at 的触发器
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shared_boards_updated_at
  BEFORE UPDATE ON public.shared_boards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 创建用户 profile 自动创建的触发器
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 启用 Realtime 功能
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_board_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
