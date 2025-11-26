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
      accommodations: {
        Row: {
          accommodation_type: string
          created_at: string
          id: string
          time_multiplier: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accommodation_type?: string
          created_at?: string
          id?: string
          time_multiplier?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accommodation_type?: string
          created_at?: string
          id?: string
          time_multiplier?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attempts: {
        Row: {
          choice_order: number[]
          correct_idx: number
          created_at: string | null
          form_id: string
          id: string
          question_id: string
          question_ord: number
          selected_idx: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          choice_order: number[]
          correct_idx: number
          created_at?: string | null
          form_id: string
          id?: string
          question_id: string
          question_ord: number
          selected_idx?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          choice_order?: number[]
          correct_idx?: number
          created_at?: string | null
          form_id?: string
          id?: string
          question_id?: string
          question_ord?: number
          selected_idx?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calculator_practice: {
        Row: {
          calculator_model: string
          completed_at: string | null
          completion_time_ms: number
          id: string
          lesson_id: string
          mode: string
          time_saved_ms: number | null
          user_id: string
        }
        Insert: {
          calculator_model?: string
          completed_at?: string | null
          completion_time_ms: number
          id?: string
          lesson_id: string
          mode: string
          time_saved_ms?: number | null
          user_id: string
        }
        Update: {
          calculator_model?: string
          completed_at?: string | null
          completion_time_ms?: number
          id?: string
          lesson_id?: string
          mode?: string
          time_saved_ms?: number | null
          user_id?: string
        }
        Relationships: []
      }
      diagnostics: {
        Row: {
          block: number
          completed_at: string | null
          id: string
          notes: string | null
          responses: Json | null
          score: number | null
          section: string
          source: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          block: number
          completed_at?: string | null
          id?: string
          notes?: string | null
          responses?: Json | null
          score?: number | null
          section: string
          source?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          block?: number
          completed_at?: string | null
          id?: string
          notes?: string | null
          responses?: Json | null
          score?: number | null
          section?: string
          source?: string | null
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
      form_questions: {
        Row: {
          form_id: string
          ord: number
          passage_id: string | null
          question_id: string
          section: string
        }
        Insert: {
          form_id: string
          ord: number
          passage_id?: string | null
          question_id: string
          section: string
        }
        Update: {
          form_id?: string
          ord?: number
          passage_id?: string | null
          question_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_questions_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          label: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
        }
        Relationships: []
      }
      lesson_content: {
        Row: {
          checkpoint_quiz_q1: string[] | null
          checkpoint_quiz_q10: string[] | null
          checkpoint_quiz_q2: string[] | null
          checkpoint_quiz_q3: string[] | null
          checkpoint_quiz_q4: string[] | null
          checkpoint_quiz_q5: string[] | null
          checkpoint_quiz_q6: string[] | null
          checkpoint_quiz_q7: string[] | null
          checkpoint_quiz_q8: string[] | null
          checkpoint_quiz_q9: string[] | null
          common_traps: string | null
          concept_explanation: string | null
          difficulty: string | null
          error_analysis: string | null
          estimated_minutes: number | null
          guided_practice: string | null
          id: number
          independent_practice: string | null
          independent_practice_answers: string | null
          objectives: string | null
          overview_html: string
          recap: string | null
          skill_code: string
          skill_id: string | null
        }
        Insert: {
          checkpoint_quiz_q1?: string[] | null
          checkpoint_quiz_q10?: string[] | null
          checkpoint_quiz_q2?: string[] | null
          checkpoint_quiz_q3?: string[] | null
          checkpoint_quiz_q4?: string[] | null
          checkpoint_quiz_q5?: string[] | null
          checkpoint_quiz_q6?: string[] | null
          checkpoint_quiz_q7?: string[] | null
          checkpoint_quiz_q8?: string[] | null
          checkpoint_quiz_q9?: string[] | null
          common_traps?: string | null
          concept_explanation?: string | null
          difficulty?: string | null
          error_analysis?: string | null
          estimated_minutes?: number | null
          guided_practice?: string | null
          id?: number
          independent_practice?: string | null
          independent_practice_answers?: string | null
          objectives?: string | null
          overview_html: string
          recap?: string | null
          skill_code: string
          skill_id?: string | null
        }
        Update: {
          checkpoint_quiz_q1?: string[] | null
          checkpoint_quiz_q10?: string[] | null
          checkpoint_quiz_q2?: string[] | null
          checkpoint_quiz_q3?: string[] | null
          checkpoint_quiz_q4?: string[] | null
          checkpoint_quiz_q5?: string[] | null
          checkpoint_quiz_q6?: string[] | null
          checkpoint_quiz_q7?: string[] | null
          checkpoint_quiz_q8?: string[] | null
          checkpoint_quiz_q9?: string[] | null
          common_traps?: string | null
          concept_explanation?: string | null
          difficulty?: string | null
          error_analysis?: string | null
          estimated_minutes?: number | null
          guided_practice?: string | null
          id?: number
          independent_practice?: string | null
          independent_practice_answers?: string | null
          objectives?: string | null
          overview_html?: string
          recap?: string | null
          skill_code?: string
          skill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_content_skill_code_fkey"
            columns: ["skill_code"]
            isOneToOne: true
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_content_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      mastery: {
        Row: {
          avg_time_ms: number
          correct: number
          last_updated: string
          skill_id: string
          total: number
          user_id: string
        }
        Insert: {
          avg_time_ms?: number
          correct?: number
          last_updated?: string
          skill_id: string
          total?: number
          user_id: string
        }
        Update: {
          avg_time_ms?: number
          correct?: number
          last_updated?: string
          skill_id?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mastery_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_links: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      passages: {
        Row: {
          chart_images: string[] | null
          created_at: string
          form_id: string
          has_charts: boolean | null
          id: string
          line_numbers_enabled: boolean | null
          marked_text: Json | null
          passage_format: string | null
          passage_text: string
          passage_type: string | null
          section: string
          title: string | null
        }
        Insert: {
          chart_images?: string[] | null
          created_at?: string
          form_id: string
          has_charts?: boolean | null
          id: string
          line_numbers_enabled?: boolean | null
          marked_text?: Json | null
          passage_format?: string | null
          passage_text: string
          passage_type?: string | null
          section: string
          title?: string | null
        }
        Update: {
          chart_images?: string[] | null
          created_at?: string
          form_id?: string
          has_charts?: boolean | null
          id?: string
          line_numbers_enabled?: boolean | null
          marked_text?: Json | null
          passage_format?: string | null
          passage_text?: string
          passage_type?: string | null
          section?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passages_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_verified: boolean | null
          created_at: string | null
          daily_time_cap_mins: number | null
          diagnostic_completed: boolean | null
          first_name: string | null
          has_study_plan: boolean | null
          id: string
          last_name: string | null
          onboarding_complete: boolean | null
          onboarding_step: string | null
          plan_mode: string | null
          privacy_accepted: boolean | null
          sim_preferred_dow: number | null
          test_date: string | null
          tos_accepted: boolean | null
          updated_at: string | null
        }
        Insert: {
          age_verified?: boolean | null
          created_at?: string | null
          daily_time_cap_mins?: number | null
          diagnostic_completed?: boolean | null
          first_name?: string | null
          has_study_plan?: boolean | null
          id: string
          last_name?: string | null
          onboarding_complete?: boolean | null
          onboarding_step?: string | null
          plan_mode?: string | null
          privacy_accepted?: boolean | null
          sim_preferred_dow?: number | null
          test_date?: string | null
          tos_accepted?: boolean | null
          updated_at?: string | null
        }
        Update: {
          age_verified?: boolean | null
          created_at?: string | null
          daily_time_cap_mins?: number | null
          diagnostic_completed?: boolean | null
          first_name?: string | null
          has_study_plan?: boolean | null
          id?: string
          last_name?: string | null
          onboarding_complete?: boolean | null
          onboarding_step?: string | null
          plan_mode?: string | null
          privacy_accepted?: boolean | null
          sim_preferred_dow?: number | null
          test_date?: string | null
          tos_accepted?: boolean | null
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
          calculator_allowed: boolean | null
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          choice_e: string | null
          created_at: string | null
          difficulty: number
          explanation: string | null
          id: string
          image_caption: string | null
          image_position: string | null
          image_url: string | null
          position_in_passage: number | null
          reference_number: number | null
          skill_id: string
          stem: string
          time_limit_secs: number | null
          underlined_text: string | null
        }
        Insert: {
          answer: string
          calculator_allowed?: boolean | null
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          choice_e?: string | null
          created_at?: string | null
          difficulty: number
          explanation?: string | null
          id?: string
          image_caption?: string | null
          image_position?: string | null
          image_url?: string | null
          position_in_passage?: number | null
          reference_number?: number | null
          skill_id: string
          stem: string
          time_limit_secs?: number | null
          underlined_text?: string | null
        }
        Update: {
          answer?: string
          calculator_allowed?: boolean | null
          choice_a?: string
          choice_b?: string
          choice_c?: string
          choice_d?: string
          choice_e?: string | null
          created_at?: string | null
          difficulty?: number
          explanation?: string | null
          id?: string
          image_caption?: string | null
          image_position?: string | null
          image_url?: string | null
          position_in_passage?: number | null
          reference_number?: number | null
          skill_id?: string
          stem?: string
          time_limit_secs?: number | null
          underlined_text?: string | null
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
      responses: {
        Row: {
          correct: boolean
          question_id: string
          selected: string
          session_id: string
          submitted_at: string
          time_ms: number
        }
        Insert: {
          correct: boolean
          question_id: string
          selected: string
          session_id: string
          submitted_at?: string
          time_ms: number
        }
        Update: {
          correct?: boolean
          question_id?: string
          selected?: string
          session_id?: string
          submitted_at?: string
          time_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
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
      rewards_ledger: {
        Row: {
          amount_cents: number
          earned_at: string | null
          id: string
          rule_id: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          amount_cents: number
          earned_at?: string | null
          id?: string
          rule_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          amount_cents?: number
          earned_at?: string | null
          id?: string
          rule_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_ledger_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "rewards_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_rules: {
        Row: {
          amount_cents: number
          created_at: string | null
          id: string
          parent_id: string | null
          threshold: Json
          type: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          id?: string
          parent_id?: string | null
          threshold: Json
          type: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          id?: string
          parent_id?: string | null
          threshold?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_rules_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          coached: boolean
          created_at: string
          ended_at: string | null
          form_id: string
          id: string
          mode: string
          section: string
          started_at: string
          time_limit_sec: number
          user_id: string
        }
        Insert: {
          coached?: boolean
          created_at?: string
          ended_at?: string | null
          form_id: string
          id?: string
          mode: string
          section: string
          started_at?: string
          time_limit_sec: number
          user_id: string
        }
        Update: {
          coached?: boolean
          created_at?: string
          ended_at?: string | null
          form_id?: string
          id?: string
          mode?: string
          section?: string
          started_at?: string
          time_limit_sec?: number
          user_id?: string
        }
        Relationships: []
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
          code: string | null
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
          code?: string | null
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
          code?: string | null
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
      staging_items: {
        Row: {
          answer: string
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          difficulty: string
          explanation: string | null
          form_id: string
          image_caption: string | null
          image_position: string | null
          image_url: string | null
          lesson_code: string | null
          ord: number
          passage_id: string | null
          passage_text: string | null
          passage_title: string | null
          question: string
          section: string
          skill_code: string
          staging_id: number
        }
        Insert: {
          answer: string
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          difficulty: string
          explanation?: string | null
          form_id: string
          image_caption?: string | null
          image_position?: string | null
          image_url?: string | null
          lesson_code?: string | null
          ord: number
          passage_id?: string | null
          passage_text?: string | null
          passage_title?: string | null
          question: string
          section: string
          skill_code: string
          staging_id?: number
        }
        Update: {
          answer?: string
          choice_a?: string
          choice_b?: string
          choice_c?: string
          choice_d?: string
          difficulty?: string
          explanation?: string | null
          form_id?: string
          image_caption?: string | null
          image_position?: string | null
          image_url?: string | null
          lesson_code?: string | null
          ord?: number
          passage_id?: string | null
          passage_text?: string | null
          passage_title?: string | null
          question?: string
          section?: string
          skill_code?: string
          staging_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "staging_items_lesson_code_fkey"
            columns: ["lesson_code"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plan_days: {
        Row: {
          generated_at: string | null
          is_light_day: boolean | null
          tasks_json: Json | null
          the_date: string
          user_id: string
        }
        Insert: {
          generated_at?: string | null
          is_light_day?: boolean | null
          tasks_json?: Json | null
          the_date: string
          user_id: string
        }
        Update: {
          generated_at?: string | null
          is_light_day?: boolean | null
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
          is_critical: boolean | null
          median_time_ms: number | null
          phase: number | null
          reward_cents: number | null
          size: number
          skill_id: string | null
          status: string | null
          the_date: string
          time_limit_seconds: number | null
          type: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          id?: string
          is_critical?: boolean | null
          median_time_ms?: number | null
          phase?: number | null
          reward_cents?: number | null
          size: number
          skill_id?: string | null
          status?: string | null
          the_date: string
          time_limit_seconds?: number | null
          type: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          id?: string
          is_critical?: boolean | null
          median_time_ms?: number | null
          phase?: number | null
          reward_cents?: number | null
          size?: number
          skill_id?: string | null
          status?: string | null
          the_date?: string
          time_limit_seconds?: number | null
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
      test_package_sections: {
        Row: {
          created_at: string | null
          form_id: string
          ord: number
          package_id: string
          section: string
          time_limit_minutes: number
        }
        Insert: {
          created_at?: string | null
          form_id: string
          ord: number
          package_id: string
          section: string
          time_limit_minutes: number
        }
        Update: {
          created_at?: string | null
          form_id?: string
          ord?: number
          package_id?: string
          section?: string
          time_limit_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_package_sections_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_package_sections_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "test_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      test_packages: {
        Row: {
          created_at: string | null
          id: string
          label: string
        }
        Insert: {
          created_at?: string | null
          id: string
          label: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
        }
        Relationships: []
      }
      tutor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_sessions: {
        Row: {
          created_at: string
          id: string
          last_used_at: string
          mode: string
          subject: string
          topic: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string
          mode: string
          subject: string
          topic: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string
          mode?: string
          subject?: string
          topic?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          id: string
          start_with: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          start_with?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          start_with?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          daily_minutes: number
          email_notifications: boolean
          id: string
          preferred_end_hour: number | null
          preferred_start_hour: number | null
          quiet_end_hour: number | null
          quiet_start_hour: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_minutes?: number
          email_notifications?: boolean
          id?: string
          preferred_end_hour?: number | null
          preferred_start_hour?: number | null
          quiet_end_hour?: number | null
          quiet_start_hour?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_minutes?: number
          email_notifications?: boolean
          id?: string
          preferred_end_hour?: number | null
          preferred_start_hour?: number | null
          quiet_end_hour?: number | null
          quiet_start_hour?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_form_section: {
        Row: {
          answer: string | null
          choice_a: string | null
          choice_b: string | null
          choice_c: string | null
          choice_d: string | null
          explanation: string | null
          form_id: string | null
          ord: number | null
          passage_id: string | null
          passage_text: string | null
          passage_title: string | null
          question: string | null
          question_id: string | null
          section: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_questions_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_user_skill_stats: {
        Row: {
          accuracy_percentage: number | null
          cluster: string | null
          combined_accuracy: number | null
          correct: number | null
          effective_median_time_ms: number | null
          last_seen_progress: string | null
          last_task_date: string | null
          last_updated: string | null
          mastery_correct: number | null
          mastery_level: number | null
          mastery_total: number | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_email?: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
