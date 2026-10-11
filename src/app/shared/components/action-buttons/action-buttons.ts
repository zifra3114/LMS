import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-action-buttons',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="flex items-center gap-2">
      @if (showView) {
        <button
          type="button"
          (click)="viewClick.emit()"
          title="View details"
          aria-label="View details"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <app-icon name="eye" [size]="18" />
        </button>
      }

      @if (showEdit) {
        <button
          type="button"
          (click)="editClick.emit()"
          title="Edit"
          aria-label="Edit"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <app-icon name="pencil" [size]="18" />
        </button>
      }

      @if (showDelete) {
        <button
          type="button"
          (click)="deleteClick.emit()"
          [disabled]="deleteDisabled || deleteLoading"
          [title]="deleteLoading ? 'Deleting...' : 'Delete'"
          aria-label="Delete"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          @if (deleteLoading) {
            <app-icon name="loader" [size]="18" />
          } @else {
            <app-icon name="trash-2" [size]="18" />
          }
        </button>
      }
    </div>
  `,
})
export class ActionButtonsComponent {
  @Input() showView = true;
  @Input() showEdit = true;
  @Input() showDelete = true;

  @Input() deleteDisabled = false;
  @Input() deleteLoading = false;

  @Output() viewClick = new EventEmitter<void>();
  @Output() editClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();
}