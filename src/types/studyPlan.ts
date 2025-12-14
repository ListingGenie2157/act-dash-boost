export interface PlanTaskJson {
  sequence?: number;
  type: string;
  skill_id?: string | null;
  question_id?: string | null;
  size?: number;
  estimated_mins?: number;
  title?: string;
}
