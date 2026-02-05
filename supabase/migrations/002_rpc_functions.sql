-- ============================================
-- RPC 函数 - 用于 API 路由
-- ============================================

-- 发送好友请求 RPC
CREATE OR REPLACE FUNCTION send_friend_request(
  p_sender_id UUID,
  p_username TEXT
)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receiver_id UUID;
BEGIN
  -- 查找接收者
  SELECT id INTO v_receiver_id
  FROM profiles
  WHERE username ILIKE (p_username || '%')
  LIMIT 1;

  IF v_receiver_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_receiver_id = p_sender_id THEN
    RAISE EXCEPTION 'Cannot add yourself as friend';
  END IF;

  -- 检查是否已存在好友关系或待处理请求
  IF EXISTS (
    SELECT 1 FROM friend_requests
    WHERE (sender_id = p_sender_id AND receiver_id = v_receiver_id)
       OR (sender_id = v_receiver_id AND receiver_id = p_sender_id)
    AND status IN ('pending', 'accepted')
  ) THEN
    RAISE EXCEPTION 'Friend request already exists';
  END IF;

  -- 创建请求
  INSERT INTO friend_requests (sender_id, receiver_id, status)
  VALUES (p_sender_id, v_receiver_id, 'pending')
  RETURNING *;
END;
$$;

-- 接受好友请求 RPC
CREATE OR REPLACE FUNCTION accept_friend_request(
  p_request_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  friend_id UUID,
  username TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id UUID;
BEGIN
  -- 更新请求状态
  UPDATE friend_requests
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_request_id AND receiver_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or forbidden';
  END IF;

  -- 获取发送者ID
  SELECT sender_id INTO v_sender_id
  FROM friend_requests
  WHERE id = p_request_id;

  -- 创建好友关系（双向）
  INSERT INTO friendships (user_id, friend_id)
  VALUES (p_user_id, v_sender_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO friendships (user_id, friend_id)
  VALUES (v_sender_id, p_user_id)
  ON CONFLICT DO NOTHING;

  -- 返回好友信息
  SELECT TRUE AS success, v_sender_id AS friend_id, 
         p.username, p.full_name
  FROM profiles p
  WHERE p.id = v_sender_id;
END;
$$;

-- 删除好友 RPC
CREATE OR REPLACE FUNCTION delete_friend(
  p_user_id UUID,
  p_friend_id UUID
)
RETURNS TABLE (
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM friendships
  WHERE (user_id = p_user_id AND friend_id = p_friend_id)
     OR (user_id = p_friend_id AND friend_id = p_user_id);

  SELECT TRUE AS success;
END;
$$;

-- 创建任务 RPC
CREATE OR REPLACE FUNCTION create_task(
  p_user_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'medium',
  p_shared_board_id UUID DEFAULT NULL,
  p_sort_order INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  priority TEXT,
  completed BOOLEAN,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER,
  shared_board_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO tasks (user_id, title, description, priority, shared_board_id, sort_order, completed)
  VALUES (p_user_id, p_title, p_description, p_priority, p_shared_board_id, p_sort_order, false)
  RETURNING *;
END;
$$;

-- 更新任务 RPC
CREATE OR REPLACE FUNCTION update_task(
  p_task_id UUID,
  p_user_id UUID,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_completed BOOLEAN DEFAULT NULL,
  p_completed_at TIMESTAMPTZ DEFAULT NULL,
  p_sort_order INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  priority TEXT,
  completed BOOLEAN,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER,
  shared_board_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_user_id UUID;
  v_task_shared_board_id UUID;
BEGIN
  -- 获取任务信息
  SELECT user_id, shared_board_id INTO v_task_user_id, v_task_shared_board_id
  FROM tasks
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  -- 检查权限
  IF v_task_user_id != p_user_id THEN
    IF v_task_shared_board_id IS NOT NULL THEN
      -- 检查是否是共享看板成员
      IF NOT EXISTS (
        SELECT 1 FROM shared_board_members
        WHERE board_id = v_task_shared_board_id AND user_id = p_user_id
      ) THEN
        RAISE EXCEPTION 'Forbidden - not a board member';
      END IF;
    ELSE
      RAISE EXCEPTION 'Forbidden - not your task';
    END IF;
  END IF;

  -- 更新任务
  UPDATE tasks
  SET 
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    priority = COALESCE(p_priority, priority),
    completed = COALESCE(p_completed, completed),
    completed_at = COALESCE(p_completed_at, completed_at),
    sort_order = COALESCE(p_sort_order, sort_order),
    updated_at = NOW()
  WHERE id = p_task_id
  RETURNING *;
END;
$$;

-- 删除任务 RPC
CREATE OR REPLACE FUNCTION delete_task(
  p_task_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_user_id UUID;
BEGIN
  -- 获取任务信息
  SELECT user_id INTO v_task_user_id
  FROM tasks
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  -- 检查权限
  IF v_task_user_id != p_user_id THEN
    RAISE EXCEPTION 'Forbidden - not your task';
  END IF;

  -- 删除任务
  DELETE FROM tasks WHERE id = p_task_id;

  SELECT TRUE AS success;
END;
$$;

-- 创建共享看板 RPC
CREATE OR REPLACE FUNCTION create_shared_board(
  p_board_name TEXT,
  p_user_id UUID,
  p_friend_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查是否是好友
  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id = p_user_id AND friend_id = p_friend_id)
       OR (user_id = p_friend_id AND friend_id = p_user_id)
  ) THEN
    RAISE EXCEPTION 'Not friends with this user';
  END IF;

  -- 创建看板
  INSERT INTO shared_boards (name, created_by)
  VALUES (p_board_name, p_user_id)
  RETURNING *;
END;
$$;

-- 获取用户的共享看板 RPC
CREATE OR REPLACE FUNCTION get_user_boards(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT sb.*
  FROM shared_boards sb
  WHERE EXISTS (
    SELECT 1 FROM shared_board_members sbm
    WHERE sbm.board_id = sb.id AND sbm.user_id = p_user_id
  )
  ORDER BY sb.created_at DESC;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION send_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION accept_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION delete_friend TO authenticated;
GRANT EXECUTE ON FUNCTION create_task TO authenticated;
GRANT EXECUTE ON FUNCTION update_task TO authenticated;
GRANT EXECUTE ON FUNCTION delete_task TO authenticated;
GRANT EXECUTE ON FUNCTION create_shared_board TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_boards TO authenticated;
