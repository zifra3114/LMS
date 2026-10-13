import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon';

/**
 * Table ke action buttons: Upload (optional), View, Edit, Delete.
 * Purane use-cases ke liye backward compatible: showUpload default false hai.
 */
@Component({
  selector: 'app-action-buttons',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="flex items-center gap-1">
      @if (showUpload) {
        <button
          type="button"
          [title]="uploadLabel"
          [attr.aria-label]="uploadLabel"
          [disabled]="uploadDisabled"
          (click)="uploadClick.emit()"
          class="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      }

      @if (showView) {
        <button
          type="button"
          title="View"
          aria-label="View"
          (click)="viewClick.emit()"
          class="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
        >
          <app-icon name="eye" [size]="18" />
        </button>
      }

      @if (showEdit) {
        <button
          type="button"
          title="Edit"
          aria-label="Edit"
          (click)="editClick.emit()"
          class="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
        >
          <app-icon name="pencil" [size]="18" />
        </button>
      }

      @if (showDelete) {
        <button
          type="button"
          title="Delete"
          aria-label="Delete"
          [disabled]="deleteDisabled || deleteLoading"
          (click)="deleteClick.emit()"
          class="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <app-icon [name]="deleteLoading ? 'loader' : 'trash-2'" [size]="18" />
        </button>
      }
    </div>
  `,
})
export class ActionButtonsComponent {
  @Input() showView = true;
  @Input() showEdit = true;
  @Input() showDelete = true;
  @Input() showUpload = false;

  @Input() deleteDisabled = false;
  @Input() deleteLoading = false;
  @Input() uploadDisabled = false;
  @Input() uploadLabel = 'Upload video';

  @Output() viewClick = new EventEmitter<void>();
  @Output() editClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();
  @Output() uploadClick = new EventEmitter<void>();
}