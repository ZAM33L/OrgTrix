import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { TaskComponent } from '../task/task.component';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { Column } from '../../models/column.model';
import { OverlayModule } from '@angular/cdk/overlay';


@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, TaskComponent, DragDropModule, OverlayModule],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.css']
})
export class ColumnComponent {


  @Input() title!: string;
  @Input() tasks: Task[] = [];
  @Input() color!: string;

  @Input() showAddButton = false;
  @Input() showDeleteAll = false;

  @Input() showOnlyOverdue = false;
  @Input() showOnlySprintTasks: boolean = false;


  @Input() columnId!: string;
  @Input() connectedTo: string[] = [];


  @Input() isMenuOpen = false;
  @Input() sortField?: 'priority' | 'dueDate';
  @Input() sortDirection?: 'asc' | 'desc';

  @Output() menuToggle = new EventEmitter<string>();

  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<{ taskId: number; columnId: string }>();
  @Output() addTask = new EventEmitter<void>();
  @Output() deleteAll = new EventEmitter<void>();
  @Output() taskMoved = new EventEmitter<void>();
  @Output() sort = new EventEmitter<'priority' | 'dueDate'>();
  @Output() resetSort = new EventEmitter<void>();

  @Output() deleteColumn = new EventEmitter<string>();

  @Output() imageClicked = new EventEmitter<string>();

handleImageClick(image: string) {
  this.imageClicked.emit(image);
}

  /* ========================= */
  /* MENU */
  /* ========================= */

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.menuToggle.emit();
  }


  /* ========================= */
  /* TASK ACTIONS */
  /* ========================= */

  onEdit(task: Task) {
    this.edit.emit(task);
  }

  onDelete(taskId: number) {
    this.delete.emit({
      columnId: this.columnId,
      taskId: taskId
    });
  }

  onAddTask() {
    this.addTask.emit();
  }

  onDeleteAll() {
    this.deleteAll.emit();
  }

  /* ========================= */
  /* DRAG DROP */
  /* ========================= */

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    this.taskMoved.emit();
  }

  onSort(field: 'priority' | 'dueDate') {
    this.sort.emit(field);
  }

  onResetSort() {
    this.resetSort.emit()
  }

  onDeleteColumn() {
    this.deleteColumn.emit(this.columnId);
    this.toggleMenu(new MouseEvent('click')); // closes menu
  }

  /* ========================= */
  /* HEADER COLOR UTILS */
  /* ========================= */
  getHeaderGradient(color: string): string {
    switch (color) {
      case 'red': return 'linear-gradient(135deg, #e74c3c, #c0392b)';
      case 'yellow': return 'linear-gradient(135deg, #f1c40f, #d4ac0d)';
      case 'green': return 'linear-gradient(135deg, #2ecc71, #27ae60)';
      case 'blue': return 'linear-gradient(135deg, #3498db, #2980b9)';
      case 'purple': return 'linear-gradient(135deg, #9b59b6, #8e44ad)';
      case 'orange': return 'linear-gradient(135deg, #e67e22, #d35400)';
      case 'pink': return 'linear-gradient(135deg, #ff6b81, #ff4757)';
      case 'teal': return 'linear-gradient(135deg, #1abc9c, #16a085)';
      case 'gray': return 'linear-gradient(135deg, #95a5a6, #7f8c8d)';
      default: return 'linear-gradient(135deg, #3498db, #2980b9)'; // default blue
    }
  }

  getTextColor(color: string): string {
    const darkColors = ['red', 'green', 'blue', 'purple', 'teal'];
    return darkColors.includes(color) ? '#fff' : '#000'; // simple contrast
  }

  //priority count dropdown
  isPriorityDropdownOpen = false;

  openPriorityDropdown() {
    this.isPriorityDropdownOpen = true;
  }

  closePriorityDropdown() {
    this.isPriorityDropdownOpen = false;
  }

  get highCount(): number {
    return this.tasks.filter(task => task.priority === "High").length;
  }

  get mediumCount(): number {
    return this.tasks.filter(task => task.priority === 'Medium').length;
  }

  get lowCount(): number {
    return this.tasks.filter(task => task.priority === 'Low').length;
  }

  // =========================
  // PRIORITY FILTER STATE
  // =========================

  // ADDED: store selected priority filter
  selectedPriority: 'High' | 'Medium' | 'Low' | null = null;


  // ADDED: filter handler when dropdown item clicked
  filterByPriority(priority: 'High' | 'Medium' | 'Low') {
    this.selectedPriority = priority;
    this.closePriorityDropdown();
  }


  // ADDED: clear filter and show all tasks
  clearPriorityFilter() {
    this.selectedPriority = null;
    this.closePriorityDropdown();
  }


  // ADDED: filtered tasks getter
  get filteredTasks(): Task[] {

    // if no filter applied
    if (!this.selectedPriority) {
      return this.tasks;
    }

    // return filtered tasks
    return this.tasks.filter(
      task => task.priority === this.selectedPriority
    );
  }

  //overdue check

  isTaskOverdue(task: any): boolean {
  if (!task.dueDate) return false;

  const today = new Date();
  const due = new Date(task.dueDate);

  today.setHours(0,0,0,0);
  due.setHours(0,0,0,0);

  return due < today;

  
  
}
//sprint check
workingDays: number[] = [1, 2, 3, 4, 5];

isTaskInSprintWeek(task: any): boolean {

  if (!task.dueDate) return false;

  const today = new Date();
  today.setHours(0,0,0,0);

  const currentDay = today.getDay();

  const firstWorkDay = this.workingDays[0];
  const lastWorkDay = this.workingDays[this.workingDays.length - 1];

  // sprint start
  const startOfSprint = new Date(today);
  startOfSprint.setDate(today.getDate() - (currentDay - firstWorkDay));
  startOfSprint.setHours(0,0,0,0);

  // sprint end
  const endOfSprint = new Date(startOfSprint);
  endOfSprint.setDate(startOfSprint.getDate() + (lastWorkDay - firstWorkDay));
  endOfSprint.setHours(23,59,59,999);

  const due = new Date(task.dueDate);

  return due >= startOfSprint && due <= endOfSprint;
}


}
