import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';
import { TopbarComponent } from './topbar/topbar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="min-h-screen bg-white dark:bg-slate-900">
      <app-admin-sidebar [open]="sidebarOpen()" (closed)="sidebarOpen.set(false)" />

      <div class="transition-[padding] duration-200" [class]="sidebarOpen() ? 'lg:pl-64' : ''">
        <app-admin-topbar (menuClick)="sidebarOpen.set(!sidebarOpen())" />
        <main class="px-4 pb-10 pt-2 sm:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  // Open by default on desktop, closed on mobile.
  sidebarOpen = signal(window.innerWidth >= 1024);
}