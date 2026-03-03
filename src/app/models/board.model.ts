import { Column } from './column.model';

export interface Board {
  id: string;
  userId: string;
  columns: Column[];
}