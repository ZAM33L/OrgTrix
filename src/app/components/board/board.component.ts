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

  boardId!: string;

  // =============================
  // LOCAL STORAGE
  // =============================

  // saveBoard() {
  //   this.boardService.saveBoard(this.columns);
  //   console.log('Board saved for current user');
  // }

  //api version

  saveBoard() {

    if (!this.boardId) {

      this.boardService.createBoard(this.columns)
        .subscribe(newBoard => {
          this.boardId = newBoard.id;
        });

    } else {

      this.boardService.updateBoard(this.boardId, this.columns)
        .subscribe({
          next: () => { },
          error: err => console.error('Board save failed', err)
        });
    }
  }

  //localStorage version

  // loadBoard() {

  //   console.log('Loading board from BoardService...');

  //   const savedBoard = this.boardService.getBoard();

  //   if (!savedBoard || savedBoard.length === 0) {
  //     console.log('No board found for user. Using default columns.');
  //     return;
  //   }

  //   // Restore date objects
  //   savedBoard.forEach(column => {
  //     column.tasks.forEach(task => {
  //       if (task.dueDate) {
  //         task.dueDate = new Date(task.dueDate);
  //       }
  //     });
  //   });

  //   this.columns = savedBoard;

  //   console.log('Board loaded successfully for current user');
  // }

  updateBoardStats() {
    this.calculateSprintProgress();
    this.calculateOverdueTasks();
  }

  // ====================================================
  // NEW API VERSION
  // ====================================================

  loadBoard() {

    console.log('LOAD BOARD CALLED');

    this.boardService.getBoard().subscribe(board => {

      if (board.length > 0) {

        this.boardId = board[0].id;
        const savedBoard = board[0].columns;

        // Restore dates
        savedBoard.forEach(column => {
          column.tasks.forEach(task => {
            if (task.dueDate) {
              task.dueDate = new Date(task.dueDate);
            }
            if (task.enteredDate) {
              task.enteredDate = new Date(task.enteredDate);
            }
          });
        });

        this.columns = savedBoard;

        this.updateBoardStats();
        this.cdr.detectChanges();

      } else {
        console.log('Creating first board for user');
        // First-time user → create board
        this.boardService.createBoard(this.columns)
          .subscribe(newBoard => {
            this.boardId = newBoard.id;
            this.cdr.detectChanges();
          });
      }
    });
  }

  // =============================
  // COLUMNS
  // =============================
  columns: Column[] = [
    {
      id: 'todo', title: 'To Do', color: 'red', tasks: []
    },
    {
      id: 'progress', title: 'In Progress', color: 'yellow', tasks: []
    },
    {
      id: 'completed', title: 'Completed', color: 'green', tasks: []
    },
    {
      id: 'delivered', title: 'Delivered', color: 'blue', tasks: []
    }
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

  isAddEnteredDateOpen = false;

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

  toggleAddEnteredDate() {
    this.isAddEnteredDateOpen = !this.isAddEnteredDateOpen;
  }

  closeAddEnteredDate() {
    this.isAddEnteredDateOpen = false;
  }

  selectAddEnteredDate(day: Date) {
    this.newTask.enteredDate = new Date(day);
    this.closeAddEnteredDate();
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
    const newTaskId = Date.now() + Math.floor(Math.random() * 1000);
    column.tasks.push({
      ...this.newTask,
      id: newTaskId,
    });
    console.log(`Task added to column "${column.title}"`, {
      ...this.newTask,
      id: newTaskId
    });

    this.saveBoard();
    this.updateBoardStats();
    this.closeAddModal();
    this.showNotification('Task added successfully!', 'success');
  }

  private createEmptyTask(): Task {
    return {
      id: 0,
      title: '',
      description: '',
      priority: 'Medium',
      dueDate: null,
      enteredDate: new Date()
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

  isEditEnteredDateOpen = false;


  openEditModal(task: Task) {
    this.editingTask = { ...task };
    this.showEditModal = true;
    this.attemptedEditSubmit = false;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingTask = null;
  }

  toggleEditEnteredDate() {
    this.isEditEnteredDateOpen = !this.isEditEnteredDateOpen;
  }

  closeEditEnteredDate() {
    this.isEditEnteredDateOpen = false;
  }

  selectEditEnteredDate(day: Date) {
    if (!this.editingTask) return;

    this.editingTask.enteredDate = new Date(day);
    this.closeEditEnteredDate();
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
    this.updateBoardStats();
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
    this.updateBoardStats();
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
    this.updateBoardStats();
    this.closeDeleteConfirm();
    this.showNotification(` tasks have been removed in Column "${column?.title}".`, 'info');
  }

  // =============================
  // DRAG DROP SAVE
  // =============================

  onTaskMoved() {
    console.log('Drag & drop detected. Board order updated.');
    this.saveBoard();
    this.updateBoardStats();
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
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom'
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
    event.stopPropagation();
    this.closeAllPopups();
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

    // LOCALSTORAGE VERSION (COMMENTED)
    /*
    this.boardService.clearBoard();
    location.reload();
    */

    // NEW API VERSION

    this.boardService.deleteBoard(this.boardId)
      .subscribe(() => {
        location.reload();
      });
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
      this.cdr.detectChanges(); //force UI update
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


  // =============================
  // PROFILE MODALS
  // =============================

  showViewProfileModal = false;
  showEditProfileModal = false;
  showDeleteProfileModal = false;

  // USER FIELDS
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  officeId = '';

  attemptedProfileSubmit = false;
  isProcessing = false;

  showProfilePopup = false;

  closeAllPopups() {
    this.isToolbarMenuOpen = false;
    this.showProfilePopup = false;
    this.showSprintSummaryModal = false;
  }

  toggleProfilePopup(event: MouseEvent) {
    event.stopPropagation();
    this.closeAllPopups();

    this.currentUser = this.authService.getCurrentUser();

    this.showProfilePopup = !this.showProfilePopup;
  }

  closeProfilePopup() {
    this.showProfilePopup = false;
  }


  // =============================
  // OPEN VIEW PROFILE
  // =============================

  openViewProfile() {

    const user = this.authService.getCurrentUser();

    if (!user) {
      console.log('No user found');
      return;
    }

    this.name = user.name;
    this.email = user.email;
    this.officeId = user.officeId;

    this.showViewProfileModal = true;
  }

  // =============================
  // CLOSE VIEW PROFILE
  // =============================

  closeViewProfile() {
    this.showViewProfileModal = false;
  }

  // =============================
  // GO TO EDIT PROFILE
  // =============================

  goToEditProfile() {

    this.showViewProfileModal = false;

    const user = this.authService.getCurrentUser();

    if (!user) return;

    this.name = user.name;
    this.email = user.email;
    this.officeId = user.officeId;

    this.password = '';
    this.confirmPassword = '';

    this.showEditProfileModal = true;
  }

  // =============================
  // BACK TO VIEW PROFILE
  // =============================

  backToViewProfile() {

    this.showEditProfileModal = false;

    this.openViewProfile();
  }


  //edit profile

  openEditProfile() {
    const user = this.authService.getCurrentUser();

    if (!user) {
      console.log('No user found');
      return;
    }

    this.name = user.name;
    this.email = user.email;
    this.officeId = user.officeId;
    this.password = '';
    this.confirmPassword = '';

    this.showEditProfileModal = true;
  }

  closeEditProfile() {
    this.showEditProfileModal = false;
    this.attemptedProfileSubmit = false;
  }

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  isValidPassword(): boolean {
    return this.password.length >= 8;
  }

  passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  isValidOfficeId(): boolean {
    const officeRegex = /^OT\d{6}$/;
    return officeRegex.test(this.officeId);
  }

  updateProfile() {

    this.attemptedProfileSubmit = true;

    this.name = this.name.trim();
    this.email = this.email.trim();
    this.officeId = this.officeId.trim().toUpperCase();

    if (!this.name || !this.email || !this.officeId) return;

    if (!this.isValidEmail()) return;

    if (this.password && !this.isValidPassword()) return;

    if (this.password && !this.passwordsMatch()) return;

    if (!this.isValidOfficeId()) return;

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.showNotification('User not found. Please login again.', 'info');
      return;
    }

    // Prevent using current password again
    if (this.password && this.password === currentUser.password) {
      this.showNotification('New password cannot be same as current password', 'info');
      return;
    }

    // Prevent using previous password
    if (
      this.password &&
      currentUser.passwordHistory &&
      currentUser.passwordHistory.includes(this.password)
    ) {
      this.showNotification('You cannot reuse your previous password', 'info');
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: this.name,
      email: this.email,
      officeId: this.officeId,
      password: this.password ? this.password : currentUser.password,
      passwordHistory: this.password
        ? [currentUser.password, ...(currentUser.passwordHistory || [])]
        : currentUser.passwordHistory
    };

    this.isProcessing = true;

    this.authService.updateProfile(updatedUser).subscribe({

      next: (result) => {

        this.isProcessing = false;

        if (result?.success) {

          // refresh current user from service
          this.currentUser = this.authService.getCurrentUser();

          this.showNotification('Profile updated successfully', 'success');

          this.closeEditProfile();

          this.cdr.detectChanges();

        } else {
          this.showNotification(result?.message || 'Update failed', 'info');
        }
      },

      error: () => {

        this.isProcessing = false;

        this.showNotification('Something went wrong', 'info');
      }

    });

  }

  // ===============================
  // DELETE PROFILE FLOW
  // ===============================

  // Modal state variables
  showDeleteProfileConfirm = false;
  showPasswordConfirm = false;
  deletePassword = '';
  attemptedDeleteProfile = false;

  // Open the initial delete confirmation modal
  openDeleteProfileConfirm() {
    this.showDeleteProfileConfirm = true;
  }

  // Close the initial delete confirmation modal
  closeDeleteProfileConfirm() {
    this.showDeleteProfileConfirm = false;
  }

  // Proceed to password confirmation modal
  proceedToPasswordConfirm() {
    this.showDeleteProfileConfirm = false; // close delete modal
    this.showPasswordConfirm = true;
    this.deletePassword = '';
    this.attemptedDeleteProfile = false;
  }

  // Close the password confirmation modal
  closePasswordConfirm() {
    this.showPasswordConfirm = false;
    this.deletePassword = '';
    this.attemptedDeleteProfile = false;
  }

  // ===============================
  // CONFIRM DELETE WITH PASSWORD
  // ===============================
  confirmDeleteWithPassword() {
    this.attemptedDeleteProfile = true;

    if (!this.deletePassword) return;

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.showNotification('User not found. Please login again.', 'info');
      return;
    }

    // Verify password
    if (this.deletePassword !== currentUser.password) {
      this.showNotification('Incorrect password. Deletion cancelled.', 'info');
      return;
    }

    // Step 1: Delete all boards of this user
    this.boardService.deleteBoardsByUser(currentUser.id).subscribe({
      next: () => {
        console.log('All boards deleted for user:', currentUser.id);

        // Step 2: Delete the user
        this.authService.deleteProfile(currentUser.id).subscribe({
          next: (result) => {
            if (result.success) {
              this.showPasswordConfirm = false;
              this.showNotification('Your profile and all boards have been deleted.', 'success');
              this.router.navigate(['/signin']);
            } else {
              this.showNotification(result?.message || 'Profile deletion failed', 'info');
            }
          },
          error: (err) => {
            console.error('Error deleting profile:', err);
            this.showNotification('Failed to delete profile', 'info');
          }
        });
      },
      error: (err) => {
        console.error('Error deleting boards:', err);
        this.showNotification('Failed to delete user boards', 'info');
      }
    });
  }

  // sprint progress
  sprintProgressPercent: number = 0;
  workingDays: number[] = [1, 2, 3, 4, 5]; // Mon-Fri default

  calculateSprintProgress() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay();

    const firstWorkDay = this.workingDays[0];
    const lastWorkDay = this.workingDays[this.workingDays.length - 1];

    // calculate sprint start
    const startOfSprint = new Date(today);
    startOfSprint.setDate(today.getDate() - (currentDay - firstWorkDay));
    startOfSprint.setHours(0, 0, 0, 0);

    // calculate sprint end
    const endOfSprint = new Date(startOfSprint);
    endOfSprint.setDate(startOfSprint.getDate() + (lastWorkDay - firstWorkDay));
    endOfSprint.setHours(23, 59, 59, 999);

    let sprintTasks: any[] = [];
    let completedSprintTasks: any[] = [];

    this.columns.forEach(column => {

      column.tasks.forEach(task => {

        if (!task.dueDate) return;

        const due = new Date(task.dueDate);

        if (due >= startOfSprint && due <= endOfSprint) {

          sprintTasks.push(task);

          const title = column.title.toLowerCase();

          if (title === 'completed' || title === 'delivered') {
            completedSprintTasks.push(task);
          }

        }

      });

    });

    if (sprintTasks.length === 0) {
      this.sprintProgressPercent = 0;
      return;
    }

    this.sprintProgressPercent = Math.round(
      (completedSprintTasks.length / sprintTasks.length) * 100
    );

  }

  //tasks overdue
  overdueTasksCount: number = 0;

  calculateOverdueTasks() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);   // remove time

    let overdue = 0;

    this.columns.forEach(column => {

      column.tasks.forEach(task => {

        if (!task.dueDate) return;

        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);  // remove time

        const title = column.title.toLowerCase();
        const isFinished = title === 'delivered' || title === 'completed';

        if (due < today && !isFinished) {
          overdue++;
        }

      });

    });

    this.overdueTasksCount = overdue;
  }

  //sprint summary
  showSprintSummaryModal = false;

  sprintShiftLabel = '';

  generateSprintShiftLabel() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = this.workingDays[0];
    const lastDay = this.workingDays[this.workingDays.length - 1];

    const currentDay = today.getDay();

    const start = new Date(today);
    start.setDate(today.getDate() - (currentDay - firstDay));

    const end = new Date(start);
    end.setDate(start.getDate() + (lastDay - firstDay));

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    };

    const startText = start.toLocaleDateString('en-US', options);
    const endText = end.toLocaleDateString('en-US', options);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    this.sprintShiftLabel =
      `${days[firstDay]}–${days[lastDay]} (${startText} - ${endText})`;

  }

  // sprint time
  sprintDaysLeft: number = 0;

  calculateSprintDaysLeft() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay();

    const firstWorkDay = this.workingDays[0];
    const lastWorkDay = this.workingDays[this.workingDays.length - 1];

    // sprint start
    const startOfSprint = new Date(today);
    startOfSprint.setDate(today.getDate() - (currentDay - firstWorkDay));

    // sprint end
    const endOfSprint = new Date(startOfSprint);
    endOfSprint.setDate(startOfSprint.getDate() + (lastWorkDay - firstWorkDay));

    let daysLeft = 0;

    const checkDate = new Date(today);

    while (checkDate <= endOfSprint) {

      if (this.workingDays.includes(checkDate.getDay())) {
        daysLeft++;
      }

      checkDate.setDate(checkDate.getDate() + 1);
    }

    this.sprintDaysLeft = daysLeft;

  }

  // sprint task stats
  sprintTotalTasks: number = 0;
  sprintCompletedTasks: number = 0;
  sprintRemainingTasks: number = 0;

  calculateSprintTaskStats() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay();

    const firstWorkDay = this.workingDays[0];
    const lastWorkDay = this.workingDays[this.workingDays.length - 1];

    // sprint start
    const startOfSprint = new Date(today);
    startOfSprint.setDate(today.getDate() - (currentDay - firstWorkDay));
    startOfSprint.setHours(0, 0, 0, 0);

    // sprint end
    const endOfSprint = new Date(startOfSprint);
    endOfSprint.setDate(startOfSprint.getDate() + (lastWorkDay - firstWorkDay));
    endOfSprint.setHours(23, 59, 59, 999);

    let sprintTasks: any[] = [];
    let completedTasks: any[] = [];

    this.columns.forEach(column => {

      column.tasks.forEach(task => {

        if (!task.dueDate) return;

        const due = new Date(task.dueDate);

        if (due >= startOfSprint && due <= endOfSprint) {

          sprintTasks.push(task);

          const title = column.title.toLowerCase();

          if (title === 'completed' || title === 'delivered') {
            completedTasks.push(task);
          }

        }

      });

    });

    this.sprintTotalTasks = sprintTasks.length;
    this.sprintCompletedTasks = completedTasks.length;
    this.sprintRemainingTasks =
      this.sprintTotalTasks - this.sprintCompletedTasks;

  }

  openSprintSummary() {
    this.calculateSprintProgress();
    this.calculateOverdueTasks();
    this.generateSprintShiftLabel();

    this.showSprintSummaryModal = true;

  }

  closeSprintSummary() {
    this.showSprintSummaryModal = false;
  }

  toggleSprintSummary(event: MouseEvent) {

    event.stopPropagation();
    this.closeAllPopups();
    this.calculateSprintProgress();
    this.calculateOverdueTasks();

    this.calculateSprintDaysLeft();
    this.calculateSprintTaskStats();

    this.generateSprintShiftLabel();

    this.showSprintSummaryModal = !this.showSprintSummaryModal;

  }
  isAnyModalOpen(): boolean {
    return (
      this.showEditProfileModal ||
      this.showViewProfileModal ||
      this.showDeleteProfileModal
    );
  }

  @HostListener('document:click')
  handleOutsideClick() {

    if (this.isAnyModalOpen()) return;

    this.showSprintSummaryModal = false;
    this.showProfilePopup = false;
    this.isToolbarMenuOpen = false;
  }

  //dashboard

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

}


