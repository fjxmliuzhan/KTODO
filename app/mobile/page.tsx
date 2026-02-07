/**
 * 移动端优化组件 - 自适应布局和触摸友好的交互
 */
'use client'

import { useState, useEffect } from 'react'
import createClient from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

type FilterType = 'all' | 'pending' | 'completed' | 'high' | 'medium' | 'low'

export default function MobileDashboardPage() {
  const supabase = createClient
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tasks' | 'boards' | 'friends'>('tasks')
  const [tasks, setTasks] = useState<any[]>([])
  const [boards, setBoards] = useState<any[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // 加载数据
  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/login')
      return
    }
    setUser(user)

    // 加载任务
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('completed', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    setTasks(tasks || [])

    // 加载共享看板
    const { data: boards } = await supabase
      .from('shared_boards')
      .select('*')
      .or(`created_by.eq.${user.id}`)
    setBoards(boards || [])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // 筛选任务
  const filteredTasks = tasks.filter((task: any) => {
    switch (filter) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 移动端顶部导航 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                D
              </div>
              <h1 className="text-xl font-bold text-gray-900">TODO</h1>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 移动端选项卡 */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
            }`}
          >
            <span className="block text-center">📝</span>
            <span className="block text-center text-xs mt-1">任务</span>
          </button>
          <button
            onClick={() => setActiveTab('boards')}
            className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'boards'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
            }`}
          >
            <span className="block text-center">📋</span>
            <span className="block text-center text-xs mt-1">看板</span>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
            }`}
          >
            <span className="block text-center">👥</span>
            <span className="block text-center text-xs mt-1">好友</span>
          </button>
        </div>
      </div>

      {/* 移动端内容区 */}
      <div className="px-4">
        {/* 任务筛选 */}
        {activeTab === 'tasks' && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {([
              { value: 'all', label: '全部' },
              { value: 'pending', label: '待完成' },
              { value: 'completed', label: '已完成' },
              { value: "high", label: "高" },
              { value: "medium", label: "中" },
              { value: "low", label: "低" }
            ] as { value: FilterType; label: string }[]).map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* 任务列表 */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task: any) => (
                <MobileTaskItem
                  key={task.id}
                  task={task}
                  onUpdated={loadData}
                />
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600 mb-2">还没有任务</p>
                <p className="text-sm text-gray-400">点击下方按钮创建第一个任务吧！</p>
              </div>
            )}
          </div>
        )}

        {/* 看板列表 */}
        {activeTab === 'boards' && (
          <div className="space-y-3">
            {boards.length > 0 ? (
              boards.map((board: any) => (
                <MobileBoardCard
                  key={board.id}
                  board={board}
                  onUpdated={loadData}
                />
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-600 mb-2">还没有共享看板</p>
                <p className="text-sm text-gray-400">创建一个看板，邀请好友一起协作吧！</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 悬浮操作按钮 */}
      {activeTab === 'tasks' && (
        <button
          onClick={() => setShowCreateTask(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg flex items-center justify-center text-3xl transition-all z-50"
        >
          +
        </button>
      )}

      {activeTab === 'boards' && (
        <button
          onClick={() => setShowCreateBoard(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-lg flex items-center justify-center text-3xl transition-all z-50"
        >
          +
        </button>
      )}

      {/* 创建任务弹窗 */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">创建新任务</h3>
              <button
                onClick={() => setShowCreateTask(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <MobileCreateTaskForm
              onSuccess={() => {
                setShowCreateTask(false)
                loadData()
              }}
            />
          </div>
        </div>
      )}

      {/* 创建看板弹窗 */}
      {showCreateBoard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">创建共享看板</h3>
              <button
                onClick={() => setShowCreateBoard(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">共享看板功能即将推出，敬请期待！</p>
          </div>
        </div>
      )}

      {/* 侧边菜单 */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-2xl z-50">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
                  {user?.email?.[0].toUpperCase() || user?.email?.split('@')[0][0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">用户</p>
                  <p className="text-sm text-gray-500 truncate max-w-[180px]">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-3 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4 4m4-4h12" />
                  <path d="M10 6v14a2 2 0 002 2H8a2 2 0 002-2V6a2 2 0 012-2h.095c.511 0 .951.226 1.328.338l1.766 2.217A5 5 0 00.3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 00.696 5.808l1.766 2.217A5 5 0 00.3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 00.696 5.808l1.766 2.217A5 5 0 00.3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 00.696 5.808l1.766 2.217A5 5 0 00.3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 00.696 5.808z" />
                </svg>
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * 移动端任务项组件
 */
function MobileTaskItem({ task, onUpdated }: { task: any; onUpdated: () => void }) {
  const supabase = createClient
  const [showMenu, setShowMenu] = useState(false)

  const handleToggleComplete = async () => {
    await supabase
      .from('tasks')
      .update({
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      })
      .eq('id', task.id)
    onUpdated()
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个任务吗？')) return
    await supabase.from('tasks').delete().eq('id', task.id)
    onUpdated()
    setShowMenu(false)
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200">
      <div className="flex items-start gap-3">
        {/* 完成按钮 */}
        <button
          onClick={handleToggleComplete}
          className={`flex-shrink-0 w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300'
          }`}
        >
          {task.completed && (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* 任务内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-base font-medium ${
              task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
            }`}>
              {task.title}
            </p>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="1" />
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h.095c.511 0 .951.226 1.328.338l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808z" />
                <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              </svg>
            </button>
          </div>
          {task.description && (
            <p className="text-sm text-gray-500 mt-1 truncate">{task.description}</p>
          )}
        </div>
      </div>

      {/* 优先级标签 */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[task.priority]}`}>
          {task.priority === 'low' ? '低' : task.priority === 'medium' ? '中' : '高'}
        </span>
        {showMenu && (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium"
            >
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 移动端看板卡片组件
 */
function MobileBoardCard({ board, onUpdated }: { board: any; onUpdated: () => void }) {
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    const loadTasks = async () => {
      const supabase = createClient
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('shared_board_id', board.id)
        .order('completed', { ascending: true })
        .order('sort_order', { ascending: true })
      setTasks(data || [])
    }
    loadTasks()
  }, [board.id])

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {board.name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{board.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">共享看板</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {tasks.length > 0 ? (
          tasks.slice(0, 3).map((task: any) => (
            <MobileTaskItem key={task.id} task={task} onUpdated={onUpdated} />
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">这个看板还没有任务</p>
          </div>
        )}
        {tasks.length > 3 && (
          <div className="text-center pt-2">
            <p className="text-sm text-blue-600">还有 {tasks.length - 3} 个任务...</p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 移动端创建任务表单
 */
function MobileCreateTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const supabase = createClient
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('tasks').insert({
      user_id: user.id,
      title: title.trim(),
      priority,
      sort_order: Date.now(),
      completed: false,
    })

    setTitle('')
    setPriority('medium')
    setLoading(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          任务标题
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
          placeholder="例如：完成项目报告"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          优先级
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'low', label: '低', color: 'border-green-300 hover:bg-green-50' },
            { value: 'medium', label: '中', color: 'border-yellow-300 hover:bg-yellow-50' },
            { value: 'high', label: '高', color: 'border-red-300 hover:bg-red-50' }
          ] as const).map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`py-3 border-2 rounded-xl font-medium transition-all ${
                priority === p.value
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : `bg-white ${p.color} text-gray-700`
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all"
      >
        {loading ? '创建中...' : '创建任务'}
      </button>
    </form>
  )
}
