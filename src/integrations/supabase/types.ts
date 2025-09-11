export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      diagnostics: {
        Row: {
          block: number
          completed_at: string | null
          id: string
          responses: Json | null
          score: number | null
          section: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          block: number
          completed_at?: string | null
          id?: string
          responses?: Json | null
          score?: number | null
          section: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          block?: number
          completed_at?: string | null
          id?: string
          responses?: Json | null
          score?: number | null
          section?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      error_bank: {
        Row: {
          last_missed_at: string
          miss_count: number | null
          question_id: string
          user_id: string
        }
        Insert: {
          last_missed_at?: string
          miss_count?: number | null
          question_id: string
          user_id: string
        }
        Update: {
          last_missed_at?: string
          miss_count?: number | null
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_bank_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          daily_time_cap_mins: number | null
          id: string
          test_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_time_cap_mins?: number | null
          id: string
          test_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_time_cap_mins?: number | null
          id?: string
          test_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          correct: number | null
          mastery_level: number | null
          median_time_ms: number | null
          seen: number | null
          skill_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          correct?: number | null
          mastery_level?: number | null
          median_time_ms?: number | null
          seen?: number | null
          skill_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          correct?: number | null
          mastery_level?: number | null
          median_time_ms?: number | null
          seen?: number | null
          skill_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer: string
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          created_at: string | null
          difficulty: number
          explanation: string | null
          id: string
          skill_id: string
          stem: string
          time_limit_secs: number | null
        }
        Insert: {
          answer: string
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          created_at?: string | null
          difficulty: number
          explanation?: string | null
          id?: string
          skill_id: string
          stem: string
          time_limit_secs?: number | null
        }
        Update: {
          answer?: string
          choice_a?: string
          choice_b?: string
          choice_c?: string
          choice_d?: string
          created_at?: string | null
          difficulty?: number
          explanation?: string | null
          id?: string
          skill_id?: string
          stem?: string
          time_limit_secs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          created_at: string | null
          due_at: string
          ease: number | null
          interval_days: number
          lapses: number | null
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_at: string
          ease?: number | null
          interval_days: number
          lapses?: number | null
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_at?: string
          ease?: number | null
          interval_days?: number
          lapses?: number | null
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      sim_results: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          raw_score: number
          section: string
          started_at: string
          time_stats_json: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          raw_score: number
          section: string
          started_at?: string
          time_stats_json?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          raw_score?: number
          section?: string
          started_at?: string
          time_stats_json?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          cluster: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number
          prereq_skill_ids: string[] | null
          subject: string
        }
        Insert: {
          cluster: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index: number
          prereq_skill_ids?: string[] | null
          subject: string
        }
        Update: {
          cluster?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          prereq_skill_ids?: string[] | null
          subject?: string
        }
        Relationships: []
      }
      study_plan_days: {
        Row: {
          generated_at: string | null
          tasks_json: Json | null
          the_date: string
          user_id: string
        }
        Insert: {
          generated_at?: string | null
          tasks_json?: Json | null
          the_date: string
          user_id: string
        }
        Update: {
          generated_at?: string | null
          tasks_json?: Json | null
          the_date?: string
          user_id?: string
        }
        Relationships: []
      }
      study_tasks: {
        Row: {
          accuracy: number | null
          created_at: string | null
          id: string
          median_time_ms: number | null
          reward_cents: number | null
          size: number
          skill_id: string | null
          status: string | null
          the_date: string
          type: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          id?: string
          median_time_ms?: number | null
          reward_cents?: number | null
          size: number
          skill_id?: string | null
          status?: string | null
          the_date: string
          type: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          id?: string
          median_time_ms?: number | null
          reward_cents?: number | null
          size?: number
          skill_id?: string | null
          status?: string | null
          the_date?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_user_skill_stats: {
        Row: {
          accuracy_percentage: number | null
          cluster: string | null
          combined_accuracy: number | null
          correct: number | null
          effective_median_time_ms: number | null
          last_seen_progress: string | null
          last_task_date: string | null
          mastery_level: number | null
          progress_median_time_ms: number | null
          recent_avg_accuracy: number | null
          recent_avg_time_ms: number | null
          recent_completed_tasks: number | null
          recent_tasks_count: number | null
          seen: number | null
          skill_id: string | null
          skill_name: string | null
          subject: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
