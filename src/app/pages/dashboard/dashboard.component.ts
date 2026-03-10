import { Component, OnInit , ChangeDetectorRef } from '@angular/core';
import { BoardService } from '../../services/board.service';
import { Column } from '../../models/column.model';
import { Task } from '../../models/task.model';
import { AuthService } from '../../auth/services/auth.service';


@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {

  columns: Column[] = [];

  totalTasks = 0;
  completedTasks = 0;
  deliveredTasks = 0;
  pendingTasks = 0;
  doneTasks = 0;
  todoTasks = 0;
  inProgressTasks = 0;

  highPriority = 0;
  mediumPriority = 0;
  lowPriority = 0;

  recentTasks: Task[] = []

  columnStats: { id: string; title: string; count: number }[] = [];

  constructor(
    private boardService: BoardService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) return;

    this.boardService.getBoard().subscribe((boards: any[]) => {

      const userBoard = boards.find(
        board => board.userId === currentUser.id
      );
      console.log("USER BOARD LOADED");
      if (!userBoard) return;

      this.columns = userBoard.columns;

      this.calculateStats();

      this.cdr.detectChanges();

    });

  }

  loadDashboard() {
    this.calculateStats();
    console.log("REFRESHED")
  }


  calculateStats() {

    this.setTotalTasks();

    this.setCompletedTasks();
    this.setDeliveredTasks();

    this.setDoneTasks();
    this.setPendingTasks();

    this.setTodoTasks();
    this.setInProgressTasks();

    this.calculateColumnAnalytics();

    this.setPriorityStats();
    this.setRecentTasks();

    //sprint stats
    this.calculateSprintProgress();
    this.calculateSprintDaysLeft();
    this.calculateSprintTaskStats();
    this.generateSprintShiftLabel();
    this.calculateOverdueTasks();

  }

  //get all tasks
  getAllTasks(): Task[] {
    return this.columns.flatMap(column => column.tasks);
  }

  //total tasks
  setTotalTasks() {
    const allTasks = this.getAllTasks();
    this.totalTasks = allTasks.length;
  }

  //completed tasks
  setCompletedTasks() {

    const completedColumn = this.columns.find(
      column => column.id === 'completed'
    );

    this.completedTasks = completedColumn
      ? completedColumn.tasks.length
      : 0;

  }

  //delivered tasks
  setDeliveredTasks() {

    const deliveredColumn = this.columns.find(c => c.id === 'delivered');

    this.deliveredTasks = deliveredColumn ? deliveredColumn.tasks.length : 0;

  }

  //done taks

  setDoneTasks() {

    this.doneTasks = this.completedTasks + this.deliveredTasks;

  }

  //pending taks
  setPendingTasks() {

    this.pendingTasks = this.totalTasks - this.doneTasks;

  }

  //todo tasks
  setTodoTasks() {

    const todoColumn = this.columns.find(c => c.id === 'todo');

    this.todoTasks = todoColumn ? todoColumn.tasks.length : 0;

  }

  //in progress tasks
  setInProgressTasks() {

    const progressColumn = this.columns.find(c => c.id === 'progress');

    this.inProgressTasks = progressColumn ? progressColumn.tasks.length : 0;

  }

  //column analytics
  calculateColumnAnalytics() {

    this.columnStats = this.columns.map(column => ({
      id: column.id,
      title: column.title,
      count: column.tasks.length
    }));

  }

  //priority stats
  setPriorityStats() {

    const allTasks = this.getAllTasks();

    this.highPriority = allTasks.filter(
      task => task.priority === 'High'
    ).length;

    this.mediumPriority = allTasks.filter(
      task => task.priority === 'Medium'
    ).length;

    this.lowPriority = allTasks.filter(
      task => task.priority === 'Low'
    ).length;

  }

  //recent tasks
  setRecentTasks() {

    const allTasks = this.getAllTasks();

    this.recentTasks = [...allTasks]
      .sort((a, b) => {

        const timeA = a.enteredDate ? new Date(a.enteredDate).getTime() : 0;
        const timeB = b.enteredDate ? new Date(b.enteredDate).getTime() : 0;

        return timeB - timeA;

      })
      .slice(0, 5);

  }

  //SPRINT DATA
  
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

}
