import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  private readonly toastService = inject(Toast);

  readonly toasts$ = this.toastService.toasts$;

  dismissToast(id: number): void {
    this.toastService.dismiss(id);
  }
}