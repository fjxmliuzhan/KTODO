/**
 * 标签管理组件
 * 创建、编辑、删除标签
 */
'use client'

import { useState, useEffect } from 'react'
import createClient from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Tag = Database['public']['Tables']['tags']['Row']

interface TagManagerProps {
  taskId?: string
}

export default function TagManager({ taskId }: TagManagerProps) {
  const supabase = createClient
  const [tags, setTags] = useState<Tag[]>([])
  const [taskTags, setTaskTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tagsData } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    setTags(tagsData || [])

    if (taskId) {
      const { data: taskTagsData } = await supabase
        .from('task_tags')
        .select('tag_id')
        .eq('task_id', taskId)
      
      setTaskTags(taskTagsData?.map((t: any) => t.tag_id) || [])
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('tags').insert({
      user_id: user.id,
      name: newTagName.trim(),
      color: newTagColor,
    }).select()

    if (!error) {
      setNewTagName('')
      setShowCreate(false)
      await loadTags()
    }
    setLoading(false)
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('确定要删除这个标签吗？')) return

    setLoading(true)
    const { error } = await supabase.from('tags').delete().eq('id', tagId)

    if (!error) await loadTags()
    setLoading(false)
  }

  const handleToggleTaskTag = async (tagId: string) => {
    if (!taskId) return

    setLoading(true)
    const isSelected = taskTags.includes(tagId)

    if (isSelected) {
      const { error } = await supabase
        .from('task_tags')
        .delete()
        .eq('task_id', taskId)
        .eq('tag_id', tagId)
      
      if (!error) {
        setTaskTags(taskTags.filter(id => id !== tagId))
      }
    } else {
      const { error } = await supabase.from('task_tags').insert({
        task_id: taskId,
        tag_id: tagId,
      })

      if (!error) {
        setTaskTags([...taskTags, tagId])
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* 标签列表 */}
      <div className="space-y-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-sm font-medium text-gray-900">{tag.name}</span>
            </div>
            {taskId ? (
              <button
                onClick={() => handleToggleTaskTag(tag.id)}
                disabled={loading}
                className={`px-3 py-1 text-xs rounded-full transition ${
                  taskTags.includes(tag.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {taskTags.includes(tag.id) ? '已添加' : '+ 添加'}
              </button>
            ) : (
              <button
                onClick={() => handleDeleteTag(tag.id)}
                disabled={loading}
                className="p-1 text-gray-400 hover:text-red-500 transition"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 创建新标签表单 */}
      {showCreate ? (
        <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">创建新标签</h4>
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="标签名称"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">颜色：</label>
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs uppercase"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateTag}
              disabled={loading || !newTagName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition"
            >
              {loading ? '创建中...' : '创建'}
            </button>
            <button
              onClick={() => {
                setShowCreate(false)
                setNewTagName('')
                setNewTagColor('#3B82F6')
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 text-sm font-medium transition"
        >
          + 创建标签
        </button>
      )}
    </div>
  )
}
