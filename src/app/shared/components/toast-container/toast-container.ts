import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Toast, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-3">
      @for (item of toast.toasts$ | async; track item.id) {
        <div
          role="status"
          class="pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg transition-all duration-300"
          [class]="styles[item.type] + (item.leaving ? ' translate-x-6 opacity-0' : ' translate-x-0 opacity-100')"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-slate-900">{{ item.title || defaults[item.type] }}</p>
            <p class="mt-0.5 break-words text-sm text-slate-600">{{ item.message }}</p>
          </div>
          <button
            type="button"
            (click)="toast.dismiss(item.id)"
            aria-label="Close"
            class="shrink-0 text-slate-400 transition hover:text-slate-700"
          >✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toast = inject(Toast);

  readonly defaults: Record<ToastType, string> = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  };

  readonly styles: Record<ToastType, string> = {
    success: 'border-emerald-200 border-l-4 border-l-emerald-500',
    error: 'border-red-200 border-l-4 border-l-red-500',
    warning: 'border-amber-200 border-l-4 border-l-amber-500',
    info: 'border-blue-200 border-l-4 border-l-blue-500',
  };
}