import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  leaving: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Toast {
  private nextId = 0;
  private readonly maxToasts = 10;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  private readonly toastSubject = new BehaviorSubject<ToastMessage[]>([]);
  readonly toasts$ = this.toastSubject.asObservable();

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  remove(id: number): void {
    const timer = this.timers.get(id);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.toastSubject.next(
      this.toastSubject.value.filter((toast) => toast.id !== id),
    );
  }

  dismiss(id: number): void {
    const toast = this.toastSubject.value.find((item) => item.id === id);

    if (!toast || toast.leaving) return;

    this.toastSubject.next(
      this.toastSubject.value.map((item) =>
        item.id === id ? { ...item, leaving: true } : item,
      ),
    );

    setTimeout(() => this.remove(id), 300);
  }

  private show(message: string, type: ToastType): void {
    // 5 pehle se hain to sabse purana hata do
    const current = this.toastSubject.value;
    if (current.length >= this.maxToasts) {
      this.remove(current[0].id);
    }

    const id = ++this.nextId;

    this.toastSubject.next([
      ...this.toastSubject.value,
      { id, type, message, leaving: false },
    ]);

    const timer = setTimeout(() => this.dismiss(id), 4000);
    this.timers.set(id, timer);
  }
}