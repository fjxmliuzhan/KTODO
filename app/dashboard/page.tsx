/**
 * 仪表板页面 - 主看板
 * 显示个人任务和好友共享看板，支持实时同步和任务排序
 */
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import TaskItem from '@/components/TaskItem'
import CreateTaskForm from '@/components/CreateTaskForm'
import TagManager from '@/components/TagManager'
import FriendRequest from '@/components/FriendRequest'
import FriendList from '@/components/FriendList'
import AddFriend from '@/components/AddFriend'
import CreateSharedBoard from '@/components/CreateSharedBoard'
import RealtimeStatus from '@/components/RealtimeStatus'
import { useRealtimeSubscriptions, useSharedBoardRealtime } from '@/lib/hooks/useRealtime'
import { useRouter } from 'next/navigation'

type FilterType = 'all' | 'pending' | 'completed' | 'high' | 'medium' | 'low'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [friendships, setFriendships] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [personalTasks, setPersonalTasks] = useState<any[]>([])
  const [sharedBoards, setSharedBoards] = useState<any[]>([])
  const [sharedBoardTasks, setSharedBoardTasks] = useState<any[]>([])  
  const [personalFilter, setPersonalFilter] = useState<FilterType>('all')
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [showAddTask, setShowAddTask] = useState<string | null>(null)

  // 获取初始数据
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/login')
      return
    }
    setUser(user)

    // 获取好友
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id, profiles(username, full_name, avatar_url)')
      .eq('user_id', user.id)
    setFriendships(friendships || [])

    // 获取好友请求
    const { data: pendingRequests } = await supabase
      .from('friend_requests')
      .select('id, sender_id, profiles(username, full_name)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
    setPendingRequests(pendingRequests || [])

    // 获取个人任务（按排序顺序）
    const { data: personalTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .is('shared_board_id', null)
      .order('completed', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    setPersonalTasks(personalTasks || [])

    // 获取共享看板
    const friendBoardIds = await Promise.all(
      (friendships || []).map(async (f: any) => {
        const { data } = await supabase
          .from('shared_board_members')
          .select('board_id')
          .eq('user_id', f.friend_id)
        return data?.map((m: any) => m.board_id) || []
      })
    )

    const { data: sharedBoards } = await supabase
      .from('shared_boards')
      .select('*')
      .or(`created_by.eq.${user.id}`)
    const memberBoards = friendBoardIds.flat()
    
    const allBoards = [...(sharedBoards || []), ...(await Promise.all(
      memberBoards.map(async (id: string) => {
        const { data } = await supabase
          .from('shared_boards')
          .select('*')
          .eq('id', id)
          .single()
        return data
      })
    )).filter(Boolean)]

    setSharedBoards(allBoards)

    // 获取共享看板任务
    const tasks = await Promise.all(
      allBoards.map(async (board: any) => {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('shared_board_id', board.id)
          .order('completed', { ascending: true })
          .order('sort_order', { ascending: true })
        return { board, tasks: tasks || [] }
      })
    )
    setSharedBoardTasks(tasks)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 实时订阅个人任务
  const { 
    tasks: realtimeTasks, 
    connected: realtimeConnected 
  } = useRealtimeSubscriptions(user?.id || '')

  // 实时同步个人任务
  useEffect(() => {
    if (realtimeTasks.length > 0) {
      setPersonalTasks(realtimeTasks)
    }
  }, [realtimeTasks])

  // 筛选个人任务
  const filteredPersonalTasks = personalTasks.filter((task: any) => {
    switch (personalFilter) {
      case 'pending':
        return !task.completed
      case 'completed':
        return task.completed
      case 'high':
        return task.priority === 'high'
      case 'medium':
        return task.priority === 'medium'
      case 'low':
        return task.priority === 'low'
      default:
        return true
    }
  })

  // 任务排序函数
  const movePersonalTaskUp = async (index: number) => {
    if (index === 0) return
    const tasks = [...filteredPersonalTasks]
    const [currentTask, prevTask] = [tasks[index], tasks[index - 1]]
    
    // 交换 sort_order
    await Promise.all([
      supabase
        .from('tasks')
        .update({ sort_order: prevTask.sort_order })
        .eq('id', currentTask.id),
      supabase
        .from('tasks')
        .update({ sort_order: currentTask.sort_order })
        .eq('id', prevTask.id),
    ])
    
    fetchData()
  }

  const movePersonalTaskDown = async (index: number) => {
    if (index === filteredPersonalTasks.length - 1) return
    const tasks = [...filteredPersonalTasks]
    const [currentTask, nextTask] = [tasks[index], tasks[index + 1]]
    
    // 交换 sort_order
    await Promise.all([
      supabase
        .from('tasks')
        .update({ sort_order: nextTask.sort_order })
        .eq('id', currentTask.id),
      supabase
        .from('tasks')
        .update({ sort_order: currentTask.sort_order })
        .eq('id', nextTask.id),
    ])
    
    fetchData()
  }

  // 共享看板任务排序
  const moveSharedTaskUp = async (boardId: string, index: number) => {
    const boardData = sharedBoardTasks.find((bt: any) => bt.board.id === boardId)
    if (!boardData || index === 0) return
    
    const tasks = [...boardData.tasks]
    const [currentTask, prevTask] = [tasks[index], tasks[index - 1]]
    
    await Promise.all([
      supabase
        .from('tasks')
        .update({ sort_order: prevTask.sort_order })
        .eq('id', currentTask.id),
      supabase
        .from('tasks')
        .update({ sort_order: currentTask.sort_order })
        .eq('id', prevTask.id),
    ])
    
    fetchData()
  }

  const moveSharedTaskDown = async (boardId: string, index: number) => {
    const boardData = sharedBoardTasks.find((bt: any) => bt.board.id === boardId)
    if (!boardData || index === boardData.tasks.length - 1) return
    
    const tasks = [...boardData.tasks]
    const [currentTask, nextTask] = [tasks[index], tasks[index + 1]]
    
    await Promise.all([
      supabase
        .from('tasks')
        .update({ sort_order: nextTask.sort_order })
        .eq('id', currentTask.id),
      supabase
        .from('tasks')
        .update({ sort_order: currentTask.sort_order })
        .eq('id', nextTask.id),
    ])
    
    fetchData()
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                D
              </div>
              <h1 className="text-2xl font-bold text-gray-900">TODO</h1>
            </div>
            <div className="flex items-center gap-4">
              <RealtimeStatus connected={realtimeConnected} />
              <div className="hidden sm:block">
                <span className="text-sm text-gray-600">{user?.email}</span>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧栏 - 好友和标签 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 好友请求 */}
            {pendingRequests.length > 0 && (
              <FriendRequest onRequestSent={handleRefresh} />
            )}

            {/* 好友列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">好友</h2>
                <button
                  onClick={() => setShowCreateBoard(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  创建看板
                </button>
              </div>
              <div className="p-4">
                <FriendList onFriendUpdated={handleRefresh} />
              </div>
            </div>

            {/* 标签管理 */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">我的标签</h2>
              <TagManager />
            </div>
          </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 个人任务 */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">我的任务</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {personalTasks.filter((t: any) => !t.completed).length} 个待完成
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={personalFilter}
                    onChange={(e) => setPersonalFilter(e.target.value as FilterType)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="all">全部</option>
                    <option value="pending">待完成</option>
                    <option value="completed">已完成</option>
                    <option value="high">高优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="low">低优先级</option>
                  </select>
                </div>
              </div>
              
              {filteredPersonalTasks.length > 0 ? (
                <div className="space-y-2">
                  {filteredPersonalTasks.map((task: any, index: number) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onUpdated={handleRefresh}
                      onMoveUp={() => movePersonalTaskUp(index)}
                      onMoveDown={() => movePersonalTaskDown(index)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">还没有任务</p>
                  <p className="text-sm text-gray-400">点击下方按钮创建第一个任务吧！</p>
                </div>
              )}

              {/* 创建任务表单 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <CreateTaskForm onSuccess={handleRefresh} />
              </div>
            </div>

            {/* 共享看板 */}
            {sharedBoardTasks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">共享看板</h2>
                {sharedBoardTasks.map(({ board, tasks }: any) => (
                  <SharedBoardCard
                    key={board.id}
                    board={board}
                    tasks={tasks}
                    friendships={friendships}
                    user={user}
                    onAddTask={() => setShowAddTask(board.id)}
                    onTaskUpdated={handleRefresh}
                    onMoveUp={(index: number) => moveSharedTaskUp(board.id, index)}
                    onMoveDown={(index: number) => moveSharedTaskDown(board.id, index)}
                  />
                ))}
              </div>
            )}

            {/* 创建共享看板提示 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-3">创建新的共享看板</h3>
                  <p className="text-sm opacity-90 mb-4">
                    邀请好友一起协作完成任务，实时同步进度
                  </p>
                  <button
                    onClick={() => setShowCreateBoard(true)}
                    className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition shadow-lg"
                  >
                    创建看板
                  </button>
                </div>
                <div className="text-6xl opacity-20">📋</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 创建共享看板弹窗 */}
      {showCreateBoard && (
        <CreateSharedBoard
          friends={friendships}
          onSuccess={() => {
            setShowCreateBoard(false)
            handleRefresh()
          }}
        />
      )}

      {/* 添加共享任务弹窗 */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">创建共享任务</h3>
              <button
                onClick={() => setShowAddTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <CreateTaskForm
              boardId={showAddTask}
              onSuccess={() => {
                setShowAddTask(null)
                handleRefresh()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 共享看板卡片组件
 */
function SharedBoardCard({ board, tasks, friendships, user, onAddTask, onTaskUpdated, onMoveUp, onMoveDown }: any) {
  const { tasks: realtimeTasks, connected: realtimeConnected } = useSharedBoardRealtime(board.id)
  const [currentTasks, setCurrentTasks] = useState(tasks)

  useEffect(() => {
    if (realtimeTasks.length > 0) {
      setCurrentTasks(realtimeTasks)
    } else if (tasks.length > 0 && currentTasks.length === 0) {
      setCurrentTasks(tasks)
    }
  }, [realtimeTasks, tasks])

  const friend = friendships.find((f: any) => f.friend_id === board.created_by)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
            {board.name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{board.name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">
                {board.created_by === user.id ? '我创建的' : `与 ${friend?.profiles?.username} 的看板`}
              </p>
              <RealtimeStatus connected={realtimeConnected} />
            </div>
          </div>
        </div>
        <button
          onClick={onAddTask}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          + 添加任务
        </button>
      </div>
      
      {/* 共享任务列表 */}
      <div className="p-4 space-y-2">
        {currentTasks.length > 0 ? (
          currentTasks.map((task: any, index: number) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onUpdated={onTaskUpdated}
              onMoveUp={() => onMoveUp(index)}
              onMoveDown={() => onMoveDown(index)}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">这个看板还没有任务</p>
          </div>
        )}
      </div>
    </div>
  )
}
