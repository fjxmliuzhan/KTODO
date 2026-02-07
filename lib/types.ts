export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          priority: string
          completed: boolean
          completed_at: string | null
          shared_board_id: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          priority?: string
          completed?: boolean
          completed_at?: string | null
          shared_board_id?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          priority?: string
          completed?: boolean
          completed_at?: string | null
          shared_board_id?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}