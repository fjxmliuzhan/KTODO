/**
 * 创建任务表单组件
 */
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CreateTaskFormProps {
  boardId?: string | null
  onSuccess?: () => void
}

export default function CreateTaskForm({ boardId, onSuccess }: CreateTaskFormProps) {
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      priority,
      shared_board_id: boardId || null,
      sort_order: 0,
    }).select()

    if (!error) {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setOpen(false)
      if (onSuccess) onSuccess()
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
      >
        + 新建任务
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {boardId ? '创建共享任务' : '创建新任务'}
        </h3>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">
            任务标题 *
          </label>
          <input
            id="taskTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="例如：完成项目报告"
          />
        </div>

        <div>
          <label htmlFor="taskDesc" className="block text-sm font-medium text-gray-700 mb-1">
            任务描述
          </label>
          <textarea
            id="taskDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
            placeholder="添加更多细节..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            优先级
          </label>
          <div className="flex gap-3">
            {(['low', 'medium', 'high'] as const).map((p) => (
              <label
                key={p}
                className={`flex-1 px-4 py-2 rounded-lg border-2 cursor-pointer transition ${
                  priority === p
                    ? p === 'high'
                      ? 'border-red-500 bg-red-50'
                      : p === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={priority === p}
                  onChange={() => setPriority(p)}
                  className="hidden"
                />
                <div className="text-center">
                  <p className="font-medium text-sm">
                    {p === 'low' ? '低' : p === 'medium' ? '中' : '高'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
          >
            {loading ? '创建中...' : '创建'}
          </button>
        </div>
      </form>
    </div>
  )
}
