import { Component, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../badge/badge';

export interface TableColumn {
  key: string;
  label: string;
  /** Agar diya to is column ki value badge ban kar dikhegi, e.g. { Active: 'success' } */
  badge?: Record<string, BadgeVariant>;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            @for (col of columns(); track col.key) {
              <th class="px-5 py-3 font-semibold">{{ col.label }}</th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
          @for (row of rows(); track $index) {
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
              @for (col of columns(); track col.key) {
                <td class="px-5 py-3 text-slate-700 dark:text-slate-300">
                  @if (col.badge) {
                    <app-badge [variant]="col.badge[row[col.key]] ?? 'neutral'">
                      {{ row[col.key] }}
                    </app-badge>
                  } @else {
                    {{ row[col.key] }}
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="columns().length" class="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
                {{ emptyMessage() }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class DataTableComponent {
  columns = input.required<TableColumn[]>();
  rows = input<Record<string, any>[]>([]);
  emptyMessage = input('No records found.');
}