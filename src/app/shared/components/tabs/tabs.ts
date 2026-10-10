import { Component, input, model } from '@angular/core';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  template: `
    <div class="flex gap-6" role="tablist">
      @for (t of tabs(); track t.key) {
        <button
          type="button"
          role="tab"
          (click)="active.set(t.key)"
          class="-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors"
          [class]="
            active() === t.key
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          "
        >
          {{ t.label }}
          @if (t.count !== undefined) {
            <span class="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{{ t.count }}</span>
          }
        </button>
      }
    </div>
  `,
})
export class TabsComponent {
  tabs = input.required<TabItem[]>();
  active = model.required<string>();
}