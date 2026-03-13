import { Component, Input, Output, EventEmitter,HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent {

  @Input() task!: Task;

  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<number>();

  onEdit() {
    this.edit.emit(this.task);
  }

  onDelete() {
    this.delete.emit(this.task.id);
  }

  showImage: boolean = false;

  toggleImage() {
    this.showImage = !this.showImage;
  }

  imageModalOpen: boolean = false;

openImageModal() {
  this.imageModalOpen = true;
}

closeImageModal() {
  this.imageModalOpen = false;
}

@HostListener('document:click', ['$event'])
handleDocumentClick(event: MouseEvent) {

  if (!this.imageModalOpen) return;

  const clickedInsideModal = (event.target as HTMLElement).closest('.modal-content');

  if (!clickedInsideModal) {
    this.closeImageModal();
  }

}
}
