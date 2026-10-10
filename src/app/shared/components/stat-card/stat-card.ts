import { Component, input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <app-icon [name]="icon()" [size]="24" />
      </div>
      <div>
        <p class="text-sm text-slate-500">{{ label() }}</p>
        <p class="text-2xl font-bold text-slate-900">{{ value() }}</p>
        @if (hint()) {
          <p class="text-xs text-slate-400">{{ hint() }}</p>
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