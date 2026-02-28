import { Component, HostListener, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';

import { Task } from '../../models/task.model';
import { Column } from '../../models/column.model';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ColumnComponent } from '../column/column.component';

import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

import { BoardService } from '../../services/board.service';


@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ColumnComponent,
    OverlayModule,
    ScrollingModule
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent {

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private boardService: BoardService
  ) { }

  currentUser: any;

  // =============================
  // INIT
  // =============================

  ngOnInit() {
    console.log('BoardComponent initialized');
    const user = this.authService.getCurrentUser();

    if (!user) {
      console.warn('No logged in user found');
      this.router.navigate(['/signin']);
      return;
    }
    this.currentUser = user;
    this.loadBoard();
  }

  // =============================
  // LOCAL STORAGE
  // =============================

  saveBoard() {
    this.boardService.saveBoard(this.columns);
    console.log('Board saved for current user');
  }

  loadBoard() {

    console.log('Loading board from BoardService...');

    const savedBoard = this.boardService.getBoard();

    if (!savedBoard || savedBoard.length === 0) {
      console.log('No board found for user. Using default columns.');
      return;
    }

    // Restore date objects
    savedBoard.forEach(column => {
      column.tasks.forEach(task => {
        if (task.dueDate) {
          task.dueDate = new Date(task.dueDate);
        }
      });
    });

    this.columns = savedBoard;

    console.log('Board loaded successfully for current user');
  }

  // =============================
  // COLUMNS
  // =============================
  columns: Column[] = [
    { id: 'todo', title: 'To Do', color: 'red', tasks: [] },
    { id: 'progress', title: 'In Progress', color: 'yellow', tasks: [] },
    { id: 'completed', title: 'Completed', color: 'green', tasks: [] },
    { id: 'delivered', title: 'Delivered', color: 'blue', tasks: [] }
  ];

  get connectedColumnIds(): string[] {
    return this.columns.map(c => c.id);
  }

  currentColumnId = '';

  // =============================
  // ADD MODAL
  // =============================

  showAddModal = false;
  attemptedSubmit = false;

  newTask: Task = this.createEmptyTask();

  openAddModal(columnId: string) {
    this.currentColumnId = columnId;
    this.showAddModal = true;
    this.attemptedSubmit = false;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.attemptedSubmit = false;
    this.resetNewTask();
  }

  addTask() {
    this.attemptedSubmit = true;

    //validation
    if (!this.newTask.title.trim() || !this.newTask.dueDate) {
      this.showNotification('Please fill all required fields !!', 'info')
      return;
    }
    const column = this.columns.find(c => c.id === this.currentColumnId);
    if (!column) {
      console.log('Column not found while adding task');
      return;
    }

    column.tasks.push({
      ...this.newTask,
      id: Date.now()
    });
    console.log(`Task added to column "${column.title}"`, {
      ...this.newTask,
      id: Date.now()
    });

    this.saveBoard();
    this.closeAddModal();
    this.showNotification('Task added successfully!', 'success');
  }

  private createEmptyTask(): Task {
    return {
      id: 0,
      title: '',
      description: '',
      priority: 'Medium',
      dueDate: null
    };
  }

  private resetNewTask() {
    this.newTask = this.createEmptyTask();
  }

  // =============================
  // EDIT MODAL
  // =============================

  showEditModal = false;
  editingTask: Task | null = null;
  attemptedEditSubmit = false;

  openEditModal(task: Task) {
    this.editingTask = { ...task };
    this.showEditModal = true;
    this.attemptedEditSubmit = false;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingTask = null;
  }

  updateTask() {
    this.attemptedEditSubmit = true;

    if (!this.editingTask) {
      console.log('❌ No task selected for update');
      return;
    }

    if (!this.editingTask.title.trim()) {
      this.showNotification('Title cannot be empty', "info")
      return;
    }

    for (const column of this.columns) {
      const index = column.tasks.findIndex(t => t.id === this.editingTask!.id);
      if (index !== -1) {
        column.tasks[index] = { ...this.editingTask };
        console.log(`Task updated in column "${column.title}"`, this.editingTask);
        break;
      }
    }
    this.saveBoard();
    this.closeEditModal();
    this.showNotification('Task updated successfully!', 'success');
  }

  // =============================
  // DELETE SINGLE TASK
  // =============================

  showTaskDeleteConfirm = false;
  taskToDelete: { columnId: string; taskId: number } | null = null;

  openTaskDeleteConfirm(data: { columnId: string; taskId: number }) {
    this.taskToDelete = data;
    this.showTaskDeleteConfirm = true;
  }

  closeTaskDeleteConfirm() {
    this.showTaskDeleteConfirm = false;
    this.taskToDelete = null;
  }

  confirmTaskDelete() {
    if (!this.taskToDelete) {
      console.log('No task selected for deletion');
      return;
    }

    const column = this.columns.find(c => c.id === this.taskToDelete!.columnId);
    if (column) {
      column.tasks = column.tasks.filter(
        task => task.id !== this.taskToDelete!.taskId
      );
      console.log(`Task deleted from column "${column.title}". ID:`, this.taskToDelete.taskId);
    }
    this.saveBoard();
    this.closeTaskDeleteConfirm();
    this.showNotification("Task deleted !", 'success')
  }

  // =============================
  // DELETE ALL IN COLUMN
  // =============================

  showDeleteConfirm = false;
  deleteColumnId = '';

  openDeleteConfirm(columnId: string) {
    this.deleteColumnId = columnId;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
  }

  confirmDelete() {
    const column = this.columns.find(c => c.id === this.deleteColumnId);
    if (column) {
      column.tasks = [];
      console.log(`All tasks cleared in column "${column.title}"`);
    }
    this.saveBoard();
    this.closeDeleteConfirm();
    this.showNotification(` tasks have been removed in Column "${column?.title}".`, 'info');
  }

  // =============================
  // DRAG DROP SAVE
  // =============================

  onTaskMoved() {
    console.log('Drag & drop detected. Board order updated.');
    this.saveBoard();
  }

  // =============================
  // COLUMN MENU
  // =============================

  activeMenuColumnId: string | null = null;

  toggleMenu(columnId: string) {
    this.activeMenuColumnId =
      this.activeMenuColumnId === columnId ? null : columnId;
  }

  @HostListener('document:click')
  closeMenus() {
    this.activeMenuColumnId = null;
    this.isToolbarMenuOpen = false;
  }

  // =============================
  // PRIORITY DROPDOWNS
  // =============================

  isAddDropdownOpen = false;
  isEditDropdownOpen = false;

  toggleAddDropdown() {
    this.isAddDropdownOpen = !this.isAddDropdownOpen;
  }

  closeAddDropdown() {
    this.isAddDropdownOpen = false;
  }

  selectAddPriority(value: 'High' | 'Medium' | 'Low') {
    this.newTask.priority = value;
    this.closeAddDropdown();
  }

  toggleEditDropdown() {
    this.isEditDropdownOpen = !this.isEditDropdownOpen;
  }

  closeEditDropdown() {
    this.isEditDropdownOpen = false;
  }

  selectEditPriority(value: 'High' | 'Medium' | 'Low') {
    if (this.editingTask) {
      this.editingTask.priority = value;
    }
    this.closeEditDropdown();
  }

  // =============================
  // DATE PICKER (CDK)
  // =============================

  isAddDateOpen = false;
  isEditDateOpen = false;

  dateOverlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top'
    }
  ];

  currentMonth = new Date();

  toggleAddDate() {
    this.isAddDateOpen = !this.isAddDateOpen;
  }

  closeAddDate() {
    this.isAddDateOpen = false;
  }

  toggleEditDate() {
    this.isEditDateOpen = !this.isEditDateOpen;
  }

  closeEditDate() {
    this.isEditDateOpen = false;
  }

  isPastDate(date: Date): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const selected = new Date(date)
    selected.setHours(0, 0, 0, 0)

    return selected < today
  }
  selectAddDate(date: Date) {
    if (this.isPastDate(date)) {
      this.showNotification('Cannot select past dates!', 'info');
      console.log('Cannot select past dates!', 'info');
      return;
    }
    this.newTask.dueDate = date;
    this.closeAddDate();
  }

  selectEditDate(date: Date) {
    if (this.isPastDate(date)) {
      this.showNotification('Cannot select past dates!', 'info');
      console.log('Cannot select past dates!', 'info');
      return;
    }
    if (this.editingTask) {
      this.editingTask.dueDate = date;
    }
    this.closeEditDate();
  }

  getDaysInMonth(): Date[] {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const days: Date[] = [];

    for (let i = 1; i <= lastDay; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  nextMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
  }

  previousMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
  }

  nextYear() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear() + 1,
      this.currentMonth.getMonth(),
      1
    );
  }

  previousYear() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear() - 1,
      this.currentMonth.getMonth(),
      1
    );
  }

  /* ========================= */
  /* Sorting */
  /* ========================= */

  sortColumn(column: Column, field: 'priority' | 'dueDate') {
    console.log(`Sorting column "${column.title}" by ${field}`);

    //cloning the original order
    if (!column.originalTasks) {
      column.originalTasks = [...column.tasks];
    }
    //clicking same field -> toggle
    if (column.sortField === field) {
      column.sortDirection = column.sortDirection === 'asc' ? 'desc' : 'asc';
    }
    else {
      column.sortField = field;
      column.sortDirection = 'asc'
    }

    const direction = column.sortDirection === 'asc' ? 1 : -1;

    if (field === 'priority') {
      const priorityOrder = {
        High: 1,
        Medium: 2,
        Low: 3
      };

      column.tasks.sort((a, b) =>
        (priorityOrder[a.priority] - priorityOrder[b.priority]) * direction
      );

    }

    if (field === 'dueDate') {
      column.tasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1 * direction;
        if (!b.dueDate) return -1 * direction;

        return (a.dueDate.getTime() - b.dueDate.getTime()) * direction;
      });
    }
    console.log('Sort direction:', column.sortDirection);
    this.saveBoard();
  }

  resetColumnSort(column: Column) {
    if (column.originalTasks) {
      column.tasks = [...column.originalTasks];
      console.log(`Sort reset for column "${column.title}"`);
    }

    column.sortField = undefined;
    column.sortDirection = undefined;

    this.saveBoard();
  }

  // =============================
  // ADD COLUMN MODAL
  // =============================

  showAddColumnModal = false;

  columnTitleInput = '';
  columnColorInput = 'blue';
  columnInsertPosition = 0;

  // CDK DROPDOWNS FOR ADD COLUMN
  isColumnColorOpen = false;
  isColumnPositionOpen = false;


  openAddColumnModal() {
    this.columnTitleInput = '';
    this.columnColorInput = 'blue'
    this.columnInsertPosition = this.columns.length;
    this.showAddColumnModal = true
  }
  closeAddColumnModal() {
    this.showAddColumnModal = false;
    this.attemptedColumnSubmit = false;
  }

  toggleColumnColor() {
    this.isColumnColorOpen = !this.isColumnColorOpen;
  }

  closeColumnColor() {
    this.isColumnColorOpen = false;
  }

  toggleColumnPosition() {
    this.isColumnPositionOpen = !this.isColumnPositionOpen;
  }

  closeColumnPosition() {
    this.isColumnPositionOpen = false;
  }

  // Available colors for new columns
  availableColors: { name: string; value: string }[] = [
    { name: 'Red', value: 'red' },
    { name: 'Yellow', value: 'yellow' },
    { name: 'Green', value: 'green' },
    { name: 'Blue', value: 'blue' },
    { name: 'Purple', value: 'purple' },
    { name: 'Orange', value: 'orange' },
    { name: 'Pink', value: 'pink' },
    { name: 'Teal', value: 'teal' }
  ];

  attemptedColumnSubmit = false;

  addColumn() {

    this.attemptedColumnSubmit = true;


    if (!this.columnTitleInput.trim()) {
      this.showNotification('Please fill column title', 'info')
      console.log('❌ Cannot add column without title');
      return;
    }

    const newColumn: Column = {
      id: 'col-' + Date.now(),
      title: this.columnTitleInput.trim(),
      color: this.columnColorInput,
      tasks: []
    };
    this.columns.splice(this.columnInsertPosition, 0, newColumn);

    console.log('New column added:', newColumn);
    console.log('Inserted at position:', this.columnInsertPosition);

    this.saveBoard();
    this.closeAddColumnModal();
    this.showNotification(`Column "${newColumn.title}" added`, 'success');
  }

  // =============================
  // DELETE COLUMN MODAL
  // =============================

  // Column delete modal state
  showColumnDeleteConfirm = false;
  columnToDeleteId: string | null = null;

  // Trigger modal
  openDeleteColumnConfirm(columnId: string) {
    this.columnToDeleteId = columnId;
    this.showColumnDeleteConfirm = true;
  }

  // Close modal
  closeDeleteColumnConfirm() {
    this.showColumnDeleteConfirm = false;
    this.columnToDeleteId = null;
  }

  // Confirm deletion
  confirmColumnDelete() {

    if (!this.columnToDeleteId) {
      console.log('No columns deleted')
      return;
    }
    const column = this.columns.find(
      col => col.id === this.columnToDeleteId
    );

    this.columns = this.columns.filter(
      col => col.id !== this.columnToDeleteId
    );

    console.log(`Column deleted: ${column?.title}`);

    this.saveBoard();
    this.closeDeleteColumnConfirm();
    this.showNotification(`Column "${column?.title}" and its tasks have been removed.`, 'info');
  }

  // =============================
  // RESET BOARD
  // =============================
  isToolbarMenuOpen = false;
  showResetBoardConfirm = false;

  toggleToolbarMenu(event: MouseEvent) {
    event.stopPropagation()
    this.isToolbarMenuOpen = !this.isToolbarMenuOpen;
  }

  openResetBoardConfirm() {
    this.isToolbarMenuOpen = false;
    this.showResetBoardConfirm = true;
  }

  closeResetBoardConfirm() {
    this.showResetBoardConfirm = false;
  }

  confirmResetBoard() {

    console.log("Resetting board for current user");

    this.boardService.clearBoard();

    this.showResetBoardConfirm = false;

    location.reload();
  }

  // =============================
  // EDIT COLUMN MODAL
  // =============================

  showEditColumnModal = false;

  editColumnId: string | null = null;
  editColumnTitle = '';
  editColumnColor = 'blue';
  editColumnPosition = 0;

  // Dropdown states
  isEditColumnSelectOpen = false;
  isEditColumnColorOpen = false;
  isEditColumnPositionOpen = false;

  attemptedColumnEditSubmit = false;


  // =============================
  // OPEN / CLOSE MODAL
  // =============================

  openEditColumnModal() {

    this.attemptedColumnEditSubmit = false;

    if (!this.columns.length) {
      console.log('No columns available to edit');
      return;
    }

    // Default select first column
    const column = this.columns[0];

    this.editColumnId = column.id;
    this.editColumnTitle = column.title;
    this.editColumnColor = column.color;
    this.editColumnPosition = this.columns.indexOf(column);

    this.showEditColumnModal = true;

    console.log('Edit Column modal opened');
  }

  closeEditColumnModal() {

    this.attemptedColumnEditSubmit = false;

    this.showEditColumnModal = false;
    this.editColumnId = null;

    // Close all dropdowns
    this.isEditColumnSelectOpen = false;
    this.isEditColumnColorOpen = false;
    this.isEditColumnPositionOpen = false;

    console.log('Edit Column modal closed');
  }

  get selectedEditColumn() {
    return this.columns.find(col => col.id === this.editColumnId) || null;
  }


  // =============================
  // SELECT COLUMN TO EDIT
  // =============================

  selectColumnToEdit(columnId: string) {
    const column = this.columns.find(col => col.id === columnId);
    if (!column) return;

    this.editColumnId = column.id;
    this.editColumnTitle = column.title;
    this.editColumnColor = column.color;
    this.editColumnPosition = this.columns.indexOf(column);

    this.closeEditColumnSelect();

    console.log(`Selected column to edit: ${column.title}`);
  }


  // =============================
  // UPDATE COLUMN
  // =============================

updateColumn() {
  this.attemptedColumnEditSubmit = true;

  if (!this.editColumnId) return;

  if (!this.editColumnTitle.trim()) {
    this.showNotification('Column title cannot be empty', 'info');
    return;
  }

  const index = this.columns.findIndex(col => col.id === this.editColumnId);
  if (index === -1) return;

  const updatedColumn: Column = {
    ...this.columns[index],
    title: this.editColumnTitle.trim(),
    color: this.editColumnColor
  };

  // Remove old column
  this.columns.splice(index, 1);

  let newPosition = this.editColumnPosition;

  // 🔥 IMPORTANT FIX
  if (index < this.editColumnPosition) {
    newPosition--;
  }

  this.columns.splice(newPosition, 0, updatedColumn);

  this.saveBoard();
  this.closeEditColumnModal();
  this.showNotification(`Column "${updatedColumn.title}" updated`, 'info');
}


  // =============================
  // DROPDOWN TOGGLES
  // =============================

  // Column Select Dropdown
  toggleEditColumnSelect() {
    this.isEditColumnSelectOpen = !this.isEditColumnSelectOpen;
  }

  closeEditColumnSelect() {
    this.isEditColumnSelectOpen = false;
  }


  // Color Dropdown
  toggleEditColumnColor() {
    this.isEditColumnColorOpen = !this.isEditColumnColorOpen;
  }

  closeEditColumnColor() {
    this.isEditColumnColorOpen = false;
  }


  // Position Dropdown
  toggleEditColumnPosition() {
    this.isEditColumnPositionOpen = !this.isEditColumnPositionOpen;
  }

  closeEditColumnPosition() {
    this.isEditColumnPositionOpen = false;
  }

  // =============================
  // TOAST NOTIFICATION SYSTEM
  // =============================



  toastMessage = '';
  toastType: 'success' | 'info' = 'success';
  showToast = false;

  showNotification(message: string, type: 'success' | 'info' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges(); // 👈 force UI update
    }, 3000);
  }


  logout() {
    // Clear login status
    this.authService.signout(); // implement this in AuthService
    this.router.navigate(['/signin']);
  }

  // BoardComponent
  showLogoutConfirm = false;

  openLogoutConfirm() {
    this.showLogoutConfirm = true;
  }

  closeLogoutConfirm() {
    this.showLogoutConfirm = false;
  }

  confirmLogout() {
    this.authService.signout(); // clears login
    this.router.navigate(['/signin']);
    this.showLogoutConfirm = false;
  }

  //ham menu
  closeToolbarMenu() {
    this.isToolbarMenuOpen = false;
  }
}


