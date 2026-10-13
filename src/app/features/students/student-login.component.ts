import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { Toast } from '../../core/services/toast.service';

/* Login ke baad student yahan jayega (dashboard agle step mein banayenge) */
const STUDENT_DASHBOARD_ROUTE = '/student/dashboard';

/*
  Left side ki video: public folder ki files Angular mein root se serve hoti hain,
  is liye path '/login.mp4' hota hai ('public/login.mp4' nahi).
  Agar video load na ho to gradient panel dikhega.
*/
const HERO_VIDEO = '/login.mp4';

const REMEMBER_KEY = 'educore_student_email';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="login-page">
      <div class="login-shell">

        <!-- Left: hero image -->
        <aside class="hero">
          <div class="hero-fallback"></div>
          @if (heroOk()) {
            <video
              class="hero-img"
              [src]="heroVideo"
              [muted]="true"
              autoplay
              loop
              playsinline
              preload="auto"
              aria-hidden="true"
              (error)="heroOk.set(false)"
            ></video>
          }
          <div class="hero-shade"></div>
          <div class="hero-text">
            <span class="hero-kicker">WELCOME TO EDUCORE</span>
            <h2>EXPLORE.<br />LEARN. GROW.</h2>
            <p>One platform. Endless possibilities.</p>
          </div>
        </aside>

        <!-- Right: form -->
        <section class="form-side">
          <div class="form-inner">
            <a routerLink="/" class="logo" aria-label="EduCore home">E</a>

            <h1>WELCOME BACK</h1>
            <p class="subtitle">Enter your email and password to access your account</p>

            <form #loginForm="ngForm" (ngSubmit)="login()" class="login-form">
              <div class="field">
                <label for="login-email">Email</label>
                <input id="login-email" type="email" name="email" [(ngModel)]="email" required email autocomplete="email" placeholder="Enter your email" class="form-input"/>
              </div>

              <div class="field">
                <label for="login-password">Password</label>
                <div class="password-box">
                  <input id="login-password" [type]="showPassword() ? 'text' : 'password'" name="password" [(ngModel)]="password" required autocomplete="current-password" placeholder="Enter your password" class="form-input"/>
                  <button type="button" class="eye-btn" (click)="showPassword.set(!showPassword())" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                    @if (showPassword()) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="m1 1 22 22"/></svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div class="row">
                <label class="remember">
                  <input type="checkbox" name="remember" [(ngModel)]="remember" />
                  <span>Remember me</span>
                </label>
                <button type="button" class="link-btn" (click)="forgotPassword()">Forgot Password</button>
              </div>

              @if (errorMessage()) {
                <div class="error-box" role="alert">{{ errorMessage() }}</div>
              }

              <button type="submit" class="submit-button" [disabled]="loginForm.invalid || loading()">
                @if (loading()) { <span class="spinner"></span> Signing in... }
                @else { Sign In }
              </button>
            </form>

            <div class="divider"><span>SECURE STUDENT ACCESS</span></div>
            <p class="foot">Registered students only.</p>
            <p class="foot register">New student? <a routerLink="/student/register">Register here</a></p>
          </div>
        </section>
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; width: 100%; min-width: 0; color: #0f172a; }
    * { box-sizing: border-box; }

    .login-page {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 32px 20px;
      background:
        radial-gradient(60% 60% at 10% 10%, #ffffff 0%, transparent 70%),
        radial-gradient(60% 60% at 95% 90%, #ffffff 0%, transparent 65%),
        linear-gradient(135deg, #e3f1fa 0%, #d6eaf6 50%, #e6f2fa 100%);
    }

    .login-shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      width: min(100%, 1120px);
      min-height: 609px;
      padding: 8px;
      border-radius: 28px;
      background: #fff;
      box-shadow: 0 30px 70px rgb(15 23 42 / 12%);
    }

    /* Hero */
    .hero { position: relative; isolation: isolate; overflow: hidden; border-radius: 22px; min-height: 420px; color: #fff; }
    .hero-fallback { position: absolute; inset: 0; z-index: -3; background:
      radial-gradient(70% 60% at 25% 20%, rgb(56 189 248 / 55%) 0%, transparent 60%),
      radial-gradient(60% 50% at 85% 55%, rgb(99 102 241 / 55%) 0%, transparent 60%),
      linear-gradient(160deg, #0b1b3a 0%, #0f2a56 55%, #162e63 100%); }
    .hero-img { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; }
    .hero-shade { position: absolute; inset: 0; z-index: -1; background: linear-gradient(to top, rgb(2 6 23 / 88%) 0%, rgb(2 6 23 / 35%) 45%, transparent 75%); }
    .hero-text { position: absolute; left: 28px; right: 28px; bottom: 30px; }
    .hero-kicker { display: block; font-size: 11px; font-weight: 800; letter-spacing: .2em; margin-bottom: 14px; }
    .hero-text h2 { margin: 0; font-size: clamp(34px, 4.2vw, 52px); line-height: 1; font-weight: 900; letter-spacing: -.03em; }
    .hero-text p { margin: 14px 0 0; font-size: 14px; font-weight: 500; }

    /* Form side */
    .form-side { display: grid; place-items: center; padding: 32px 24px; }
    .form-inner { width: min(100%, 408px); text-align: center; }
    .logo { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 13px; background: #0b1020; color: #fff; font-size: 20px; font-weight: 900; text-decoration: none; }
    h1 { margin: 26px 0 0; font-size: 28px; line-height: 1.1; font-weight: 900; letter-spacing: -.02em; color: #05091a; }
    .subtitle { margin: 14px 0 34px; color: #64748b; font-size: 12.5px; }

    .login-form { display: flex; flex-direction: column; gap: 18px; text-align: left; }
    .field label { display: block; margin-bottom: 9px; color: #111827; font-size: 13.5px; font-weight: 700; }
    .form-input { display: block; width: 100%; height: 50px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; padding: 0 16px; color: #0f172a; font-family: inherit; font-size: 14px; outline: none; transition: border-color .18s ease, box-shadow .18s ease; }
    .form-input::placeholder { color: #9ca3af; }
    .form-input:hover { border-color: #d1d5db; }
    .form-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgb(79 70 229 / 12%); }

    .password-box { position: relative; }
    .password-box .form-input { padding-right: 48px; }
    .eye-btn { position: absolute; top: 50%; right: 8px; transform: translateY(-50%); display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: 9px; background: transparent; color: #6b7280; cursor: pointer; }
    .eye-btn:hover { background: #eef2ff; color: #4338ca; }
    .eye-btn svg { width: 18px; height: 18px; }

    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: -2px; }
    .remember { display: inline-flex; align-items: center; gap: 8px; color: #4b5563; font-size: 12px; cursor: pointer; }
    .remember input { width: 15px; height: 15px; accent-color: #4338ca; cursor: pointer; }
    .link-btn { border: 0; background: none; padding: 0; color: #0f172a; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
    .link-btn:hover { color: #4338ca; text-decoration: underline; }

    .error-box { padding: 11px 13px; border: 1px solid #fecdd3; border-radius: 11px; background: #fff1f2; color: #be123c; font-size: 12px; font-weight: 600; line-height: 1.6; }

    .submit-button { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; height: 52px; border: 0; border-radius: 12px; background: #020617; color: #fff; font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 22px rgb(2 6 23 / 25%); transition: background .2s ease, transform .15s ease; }
    .submit-button:hover:not(:disabled) { background: #1d4ed8; }
    .submit-button:active:not(:disabled) { transform: scale(.99); }
    .submit-button:disabled { cursor: not-allowed; opacity: .55; box-shadow: none; }

    .spinner { display: inline-block; width: 17px; height: 17px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .divider { display: flex; align-items: center; gap: 14px; margin-top: 30px; color: #6b7280; font-size: 10px; font-weight: 800; letter-spacing: .16em; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
    .foot { margin: 22px 0 0; color: #94a3b8; font-size: 11.5px; }
    .foot.register { margin-top: 8px; }
    .foot a { color: #4338ca; font-weight: 800; text-decoration: none; }
    .foot a:hover { text-decoration: underline; }

    button:focus-visible, a:focus-visible { outline: 3px solid rgb(79 70 229 / 35%); outline-offset: 2px; }

    @media (max-width: 900px) {
      .login-shell { grid-template-columns: minmax(0, 1fr); min-height: 0; width: min(100%, 480px); }
      .hero { display: none; }
      .form-side { padding: 28px 12px; }
    }

    @media (max-width: 480px) {
      .login-page { padding: 16px 12px; }
      .login-shell { border-radius: 22px; }
      h1 { font-size: 25px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
    }
  `],
})
export class StudentLoginComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);

  readonly heroVideo = HERO_VIDEO;
  readonly heroOk = signal(true);
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal('');

  email = '';
  password = '';
  remember = false;

  ngOnInit(): void {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        this.email = saved;
        this.remember = true;
      }
    } catch {
      // storage available nahi to ignore
    }
  }

  forgotPassword(): void {
    this.toast.warning(
      'Please contact your admission support team to reset your password.',
      'Reset Password',
    );
  }

  async login(): Promise<void> {
    if (this.loading()) return;

    const email = this.email.trim().toLowerCase();
    const password = this.password;

    if (!email || !password) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      try {
        if (this.remember) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // ignore
      }

      this.toast.success('Signed in successfully.', 'Welcome Back');
      await this.router.navigateByUrl(STUDENT_DASHBOARD_ROUTE);
    } catch (error: unknown) {
      const message = this.friendlyError(error instanceof Error ? error.message : '');
      this.errorMessage.set(message);
      this.toast.error(message, 'Login Failed');
    } finally {
      this.loading.set(false);
    }
  }

  private friendlyError(raw: string): string {
    const m = raw.toLowerCase();
    if (m.includes('invalid login credentials')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (m.includes('email not confirmed')) {
      return 'Your email is not confirmed yet. Please contact your admission support team.';
    }
    if (m.includes('rate limit') || m.includes('too many')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (m.includes('fetch') || m.includes('network')) {
      return 'Unable to reach the server. Please check your internet connection.';
    }
    return raw || 'Login failed. Please try again.';
  }
}