import { Component, input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
        <app-icon [name]="icon()" [size]="24" />
      </div>
      <div>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ label() }}</p>
        <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ value() }}</p>
        @if (hint()) {
          <p class="text-xs text-slate-400 dark:text-slate-500">{{ hint() }}</p>
        }
      </div>
    </div>
  `,
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input<IconName>('activity');
  hint = input('');
}