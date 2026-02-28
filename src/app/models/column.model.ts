import { Task } from './task.model';

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  sortField?: 'priority' | 'dueDate' | null;
  sortDirection?: 'asc' | 'desc' | null;
  originalTasks?: Task[];
}
