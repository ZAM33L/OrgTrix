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

}
