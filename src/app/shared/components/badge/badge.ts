import { Component, computed, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STYLES: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span
     class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      [class]="styles()"
    >
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
  styles = computed(() => STYLES[this.variant()]);
}