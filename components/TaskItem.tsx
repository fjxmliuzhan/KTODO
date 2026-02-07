/**
 * 任务项组件 - 支持拖拽排序
 */
'use client'

import { useState } from 'react'
import createClient from '@/lib/supabase/client'

interface TaskItemProps {
  task: any
  onUpdated?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export default function TaskItem({ task, onUpdated, onMoveUp, onMoveDown }: TaskItemProps) {
  const supabase = createClient
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleToggleComplete = async () => {
    const { error } = await supabase
      .from('tasks')
      .update({
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      })
      .eq('id', task.id)

    if (!error && onUpdated) onUpdated()
  }

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('tasks')
      .update({
        title: title.trim(),
      })
      .eq('id', task.id)

    if (!error) {
      setEditing(false)
      if (onUpdated) onUpdated()
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个任务吗？')) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id)

    if (!error && onUpdated) onUpdated()
    setShowMenu(false)
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-red-100 text-red-700 border-red-200',
  }

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高',
  }

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
      <div className="flex items-center gap-3 p-4">
        {/* 拖拽手柄 */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMoveUp}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="上移"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={onMoveDown}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="下移"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 完成状态 */}
        <button
          onClick={handleToggleComplete}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {task.completed && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* 任务内容 */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                } else if (e.key === 'Escape') {
                  setEditing(false)
                  setTitle(task.title)
                }
              }}
              className="w-full px-3 py-1.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              autoFocus
            />
          ) : (
            <div
              onClick={() => setEditing(true)}
              className={`cursor-pointer ${
                task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
              } transition-all`}
            >
              <p className="text-sm font-medium">{task.title}</p>
              {task.description && (
                <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
              )}
            </div>
          )}
        </div>

        {/* 优先级标签 */}
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>

        {/* 菜单按钮 */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="1" />
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h.095c.511 0 .951.226 1.328.338l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 5 0 0 0 .696 5.808l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808z" />
            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
          </svg>
        </button>

        {/* 下拉菜单 */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
            <button
              onClick={() => {
                setEditing(true)
                setShowMenu(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-3.5 3.5a2.121 2.121 0 0 1 3-3L12 9" />
              </svg>
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h.095c.511 0 .951.226 1.328.338l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808l1.766 2.217A5 5 0 0 0 .3 8.001c1.228.39 2.072 1.24 2.57 1.649l.767.566a5 5 0 0 0 .696 5.808z" />
                <path d="M10 14v4" />
                <path d="M12 18h4" />
                <path d="M12 2v4" />
              </svg>
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
