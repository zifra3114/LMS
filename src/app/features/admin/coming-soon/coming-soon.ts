import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header [title]="title" />
    <div class="rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
      This section is under development.
    </div>
  `,
})
export class ComingSoonComponent {
  title = this.format(inject(ActivatedRoute).snapshot.url[0]?.path ?? '');

  private format(path: string): string {
    return path.charAt(0).toUpperCase() + path.slice(1);
  }
}