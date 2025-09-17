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
      forms: {
        Row: {
          id: string
          label: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          is_active?: boolean
          created_at?: string
        }
      }
      passages: {
        Row: {
          id: string
          form_id: string
          section: 'EN' | 'MATH' | 'RD' | 'SCI'
          passage_type: string
          title: string
          passage_text: string
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          section: 'EN' | 'MATH' | 'RD' | 'SCI'
          passage_type: string
          title: string
          passage_text: string
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          section?: 'EN' | 'MATH' | 'RD' | 'SCI'
          passage_type?: string
          title?: string
          passage_text?: string
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          stem: string
          answer: string
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          difficulty: number
          explanation: string
          skill_id: string | null
          time_limit_secs: number | null
          stem_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          stem: string
          answer: string
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          difficulty?: number
          explanation: string
          skill_id?: string | null
          time_limit_secs?: number | null
          stem_hash?: string
          created_at?: string
        }
        Update: {
          id?: string
          stem?: string
          answer?: string
          choice_a?: string
          choice_b?: string
          choice_c?: string
          choice_d?: string
          difficulty?: number
          explanation?: string
          skill_id?: string | null
          time_limit_secs?: number | null
          stem_hash?: string
          created_at?: string
        }
      }
      form_questions: {
        Row: {
          form_id: string
          section: 'EN' | 'MATH' | 'RD' | 'SCI'
          ord: number
          question_id: string
          passage_id: string | null
        }
        Insert: {
          form_id: string
          section: 'EN' | 'MATH' | 'RD' | 'SCI'
          ord: number
          question_id: string
          passage_id?: string | null
        }
        Update: {
          form_id?: string
          section?: 'EN' | 'MATH' | 'RD' | 'SCI'
          ord?: number
          question_id?: string
          passage_id?: string | null
        }
      }
      skills: {
        Row: {
          id: string
          section: 'EN' | 'MATH' | 'RD' | 'SCI'
          name: string
          description: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          section: 'EN' | 'MATH' | 'RD' | 'SCI'
          name: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          section?: 'EN' | 'MATH' | 'RD' | 'SCI'
          name?: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          form_id: string
          section: 'EN' | 'MATH' | 'RD' | 'SCI' | 'FULL'
          mode: 'diagnostic' | 'drill' | 'timed' | 'review'
          time_limit_sec: number | null
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          form_id: string
          section: 'EN' | 'MATH' | 'RD' | 'SCI' | 'FULL'
          mode: 'diagnostic' | 'drill' | 'timed' | 'review'
          time_limit_sec?: number | null
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          form_id?: string
          section?: 'EN' | 'MATH' | 'RD' | 'SCI' | 'FULL'
          mode?: 'diagnostic' | 'drill' | 'timed' | 'review'
          time_limit_sec?: number | null
          started_at?: string
          ended_at?: string | null
        }
      }
      attempts: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          form_id: string
          question_id: string
          question_ord: number
          choice_order: number[]
          correct_idx: number
          selected_idx: number | null
          time_spent_ms: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          form_id: string
          question_id: string
          question_ord: number
          choice_order: number[]
          correct_idx: number
          selected_idx?: number | null
          time_spent_ms?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          form_id?: string
          question_id?: string
          question_ord?: number
          choice_order?: number[]
          correct_idx?: number
          selected_idx?: number | null
          time_spent_ms?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      review_queue: {
        Row: {
          user_id: string
          question_id: string
          due_at: string
          interval_days: number
          ease: number
          lapses: number
          created_at: string
        }
        Insert: {
          user_id: string
          question_id: string
          due_at: string
          interval_days?: number
          ease?: number
          lapses?: number
          created_at?: string
        }
        Update: {
          user_id?: string
          question_id?: string
          due_at?: string
          interval_days?: number
          ease?: number
          lapses?: number
          created_at?: string
        }
      }
      user_prefs: {
        Row: {
          user_id: string
          email_ok: boolean
          push_ok: boolean
          quiet_start: string | null
          quiet_end: string | null
          reduced_motion: boolean
          dyslexia_font: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email_ok?: boolean
          push_ok?: boolean
          quiet_start?: string | null
          quiet_end?: string | null
          reduced_motion?: boolean
          dyslexia_font?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email_ok?: boolean
          push_ok?: boolean
          quiet_start?: string | null
          quiet_end?: string | null
          reduced_motion?: boolean
          dyslexia_font?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      goal: {
        Row: {
          user_id: string
          test_date: string
          daily_target_minutes: number
          preferred_window: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          test_date: string
          daily_target_minutes?: number
          preferred_window?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          test_date?: string
          daily_target_minutes?: number
          preferred_window?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      accommodations: {
        Row: {
          user_id: string
          time_multiplier: number
          created_at: string
        }
        Insert: {
          user_id: string
          time_multiplier?: number
          created_at?: string
        }
        Update: {
          user_id?: string
          time_multiplier?: number
          created_at?: string
        }
      }
      study_plan_days: {
        Row: {
          id: string
          user_id: string
          day_number: number
          date: string
          target_minutes: number
          completed_minutes: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_number: number
          date: string
          target_minutes: number
          completed_minutes?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_number?: number
          date?: string
          target_minutes?: number
          completed_minutes?: number
          created_at?: string
        }
      }
      study_tasks: {
        Row: {
          id: string
          plan_day_id: string
          task_type: 'drill' | 'timed' | 'review' | 'diagnostic'
          section: 'EN' | 'MATH' | 'RD' | 'SCI' | null
          skill_id: string | null
          estimated_minutes: number
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          plan_day_id: string
          task_type: 'drill' | 'timed' | 'review' | 'diagnostic'
          section?: 'EN' | 'MATH' | 'RD' | 'SCI' | null
          skill_id?: string | null
          estimated_minutes: number
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          plan_day_id?: string
          task_type?: 'drill' | 'timed' | 'review' | 'diagnostic'
          section?: 'EN' | 'MATH' | 'RD' | 'SCI' | null
          skill_id?: string | null
          estimated_minutes?: number
          completed?: boolean
          created_at?: string
        }
      }
      admin_users: {
        Row: {
          user_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      v_form_section: {
        Row: {
          form_id: string
          section: 'EN' | 'MATH' | 'RD' | 'SCI'
          ord: number
          question_id: string
          passage_id: string | null
          stem: string
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          answer: string
          difficulty: number
          explanation: string
          skill_id: string | null
          passage_title: string | null
          passage_text: string | null
        }
      }
    }
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
  }
}