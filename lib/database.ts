import { UUID } from 'node:crypto';

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: UUID;
          content: string
          created_at: string
          archived: boolean
          is_starred: boolean;
        }
      }
      employee: {
        Row: {
          id: UUID;
          full_name: string
          created_at: string
        }
      }
      employees: {
        Row: {
          id: UUID;
          full_name: string
          email: string
          created_at: string
        }
      }
      task_templates: {
        Row: {
          id: UUID;
          name: string
          category: string
          updated_at: string
          created_at: string
          shift_type: 'opening' | 'closing';
          is_active: boolean
          description: string
        }
      }
      tasks: {
        Row: {
          id: UUID;
          name: string
          category: string
          updated_at: string
          created_at: string
        }
      }
      shifts: {
        Row: {
          id: UUID;
          date: string
          employee_id: string
          created_at: string
        }
      }
      assigned_tasks: {
        Row: {
          id: UUID;
          shift_id: string
          template_id: string
          created_at: string
        }
      }
      cash_reports: {
        Row: {
          id: UUID;
          shift_id: string
          created_at: string
        }
      }
    }
  }
}

// Supprimer les interfaces dupliquées et uniformiser les types
export interface Employee {
  id: string;  // Changed from number to string
  email: string;
  full_name: string;
  role: string;
  created_at?: string;
}

export interface TaskTemplateWithDetails {
  id: string;  // Changed from number to string
  name: string;
  category: string;
  description: string;
  is_active: boolean;
  updated_at: string;
  created_at?: string;
}

export interface AssignedTaskWithDetails {
  id: string;
  template_id: string;
  shift_id: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  employee_id: string | null;
  employee_full_name: string | null;
  created_at: string;
  template?: TaskTemplateWithDetails;
  employee?: Employee;
}

export interface ShiftWithDetails {
  id: string;
  date: string;
  shift_type: 'opening' | 'closing';
  employee_id: string | null;
  status: 'planned' | 'in_progress' | 'completed';
  created_at?: string;
  tasks?: AssignedTask[];
  employee?: Employee;
}



export type CreateShiftParams = Omit<Shift, 'id' | 'created_at'>;

export type Task = Database['public']['Tables']['task_templates']['Row']

export type Shift = Database['public']['Tables']['shifts']['Row']

export interface AssignedTask {
  id: string;
  template_id: string;
  shift_id: string;
  employee_id: string | null;
  employee_full_name: string | null;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  template: TaskTemplate;

}

export interface TaskTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}



export type CashReport = Database['public']['Tables']['cash_reports']['Row']
