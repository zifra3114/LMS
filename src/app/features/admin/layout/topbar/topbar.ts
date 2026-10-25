import { Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Toast } from '../../../../core/services/toast.service';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [IconComponent, ThemeToggleComponent],
  template: `
    <header class="sticky top-0 z-20 flex h-16 items-center justify-between bg-white/90 px-4 backdrop-blur sm:px-8 border-b border-slate-200/80 dark:bg-slate-800/90 dark:border-slate-700/80">
      <!-- Hamburger Menu Button: Mobile par Visible (lg:hidden), Desktop par Hidden -->
      <button
        type="button"
        (click)="menuClick.emit()"
        class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label="Toggle sidebar"
      >
        <app-icon name="menu" [size]="22" />
      </button>

      <!-- Desktop Spacer when button is hidden -->
      <div class="hidden lg:block"></div>

      <!-- Admin Profile Section -->
      <div class="flex items-center gap-3">
        <!-- Theme Toggle -->
        <app-theme-toggle />
        <div class="relative">
          <button
            type="button"
            (click)="menuOpen.set(!menuOpen())"
            class="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-slate-100 transition-colors dark:hover:bg-slate-700"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white shadow-sm">
              {{ initial() }}
            </span>
            <span class="hidden text-sm font-medium capitalize text-slate-800 sm:inline dark:text-slate-200">{{ name() }}</span>
            <app-icon name="chevron-down" [size]="16" />
          </button>

          @if (menuOpen()) {
            <div class="fixed inset-0 z-10" (click)="menuOpen.set(false)"></div>
            <div class="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:bg-slate-800 dark:border-slate-700">
              <p class="truncate px-3 py-2 text-xs text-slate-500 border-b border-slate-100 mb-1 dark:text-slate-400 dark:border-slate-700">{{ email() }}</p>
              <button
                type="button"
                (click)="logout()"
                class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <app-icon name="log-out" [size]="16" />
                Sign out
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
})
export class TopbarComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  menuClick = output<void>();
  email = signal('');
  menuOpen = signal(false);

  name = computed(() => this.email().split('@')[0]);
  initial = computed(() => this.name().charAt(0).toUpperCase());

  async ngOnInit(): Promise<void> {
    this.email.set((await this.auth.getCurrentEmail()) ?? '');
  }

  async logout(): Promise<void> {
    this.menuOpen.set(false);
    await this.auth.logout();
    this.toast.info('You have been signed out.');
    await this.router.navigateByUrl('/', { replaceUrl: true });
  }
}