/**
 * Supabase 数据库类型定义
 * 自动生成类型的补充，定义数据库表结构
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // 用户表 - 扩展 Supabase Auth
      profiles: {
        Row: {
          id: string // 与 auth.users.id 相同
          username: string // 用户名，用于添加好友
          full_name: string | null // 全名
          avatar_url: string | null // 头像 URL
          created_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      // 标签表
      tags: {
        Row: {
          id: string
          user_id: string // 标签创建者
          name: string // 标签名称
          color: string // 标签颜色
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      // 任务表
      tasks: {
        Row: {
          id: string
          user_id: string // 任务创建者
          title: string // 任务标题
          description: string | null // 任务描述
          priority: 'low' | 'medium' | 'high' // 优先级
          completed: boolean // 是否完成
          completed_at: string | null // 完成时间
          sort_order: number // 排序顺序
          shared_board_id: string | null // 共享看板 ID（如果属于共享看板）
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          completed?: boolean
          completed_at?: string | null
          sort_order?: number
          shared_board_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          completed?: boolean
          completed_at?: string | null
          sort_order?: number
          shared_board_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 任务标签关联表
      task_tags: {
        Row: {
          id: string
          task_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      // 好友请求表
      friend_requests: {
        Row: {
          id: string
          sender_id: string // 发送者 ID
          receiver_id: string // 接收者 ID
          status: 'pending' | 'accepted' | 'rejected' // 状态
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      // 好友关系表
      friendships: {
        Row: {
          id: string
          user_id: string // 用户 ID
          friend_id: string // 好友 ID
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          created_at?: string
        }
      }
      // 共享看板表
      shared_boards: {
        Row: {
          id: string
          name: string // 看板名称
          created_by: string // 创建者 ID
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      // 共享看板成员表
      shared_board_members: {
        Row: {
          id: string
          board_id: string // 看板 ID
          user_id: string // 用户 ID
          joined_at: string
        }
        Insert: {
          id?: string
          board_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          user_id?: string
          joined_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
