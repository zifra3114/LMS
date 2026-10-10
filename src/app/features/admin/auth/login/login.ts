import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { FormInputComponent } from '../../../../shared/components/form-input/form-input';
import { Toast } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ButtonComponent, FormInputComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class AdminLoginComponent {
  private readonly toast = inject(Toast);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  isLoading = false;

  async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (this.isLoading) return;

    if (!this.email.trim() || !this.password) {
      this.toast.warning('Please enter your email and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.toast.error('Please enter a valid email address.');
      return;
    }

    this.isLoading = true;
    const { error } = await this.auth.login(this.email.trim(), this.password);
    this.isLoading = false;

    if (error) {
      this.toast.error(error);
      return;
    }

    this.toast.success('Login successful. Welcome back!');
    await this.router.navigateByUrl('/admin/dashboard');
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    this.toast.info('Password recovery will be available soon.');
  }
}