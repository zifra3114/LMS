import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from '../../../../shared/components/icon/icon';

export interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-30 bg-black/40 lg:hidden" (click)="closed.emit()"></div>
    }

    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-slate-50 transition-transform duration-200"
      [class.-translate-x-full]="!open()"
    >
      <div class="flex h-16 items-center gap-3 px-6">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
          <app-icon name="graduation-cap" [size]="20" />
        </div>
        <span class="text-lg font-bold text-slate-900">EduCore <span class="font-normal text-slate-400">LMS</span></span>
      </div>

      <nav class="space-y-1 px-3 py-4">
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            (click)="onNavigate()"
            class="nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <app-icon [name]="item.icon" [size]="18" />
            {{ item.label }}
          </a>
        }
      </nav>
    </aside>
  `,
  styles: `
    .nav-link.active {
      background-color: #e2e8f0;
      color: #0f172a;
      font-weight: 600;
    }
  `,
})
export class SidebarComponent {
  open = input(false);
  closed = output<void>();

  items: NavItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Courses', path: '/admin/courses', icon: 'book-open' },
    { label: 'Quizzes', path: '/admin/quizzes', icon: 'circle-help' },
    { label: 'Assignments', path: '/admin/assignments', icon: 'clipboard-list' },
    { label: 'Announcements', path: '/admin/announcements', icon: 'megaphone' },
    { label: 'Students', path: '/admin/students', icon: 'graduation-cap' },
    { label: 'Earnings', path: '/admin/earnings', icon: 'wallet' },
    { label: 'Reports', path: '/admin/reports', icon: 'chart-column' },
    { label: 'Add-ons', path: '/admin/add-ons', icon: 'package' },
    { label: 'Settings', path: '/admin/settings', icon: 'settings' },
  ];

  /** On small screens the sidebar closes after navigating. */
  onNavigate(): void {
    if (window.innerWidth < 1024) this.closed.emit();
  }
}