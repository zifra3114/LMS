
import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { FormInputComponent } from '../../../../shared/components/form-input/form-input';
import { Toast } from "../../../../core/services/toast.service";
@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ButtonComponent, FormInputComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class AdminLoginComponent {
  private readonly toast = inject(Toast);

  email = '';
  password = '';
  isLoading = false;

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (!this.email.trim() || !this.password) {
      this.toast.warning('Please enter your email and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.toast.error('Please enter a valid email address.');
      return;
    }

    // Real authentication will be added when the backend API is ready.
    this.toast.info('Login API is not connected yet. We will connect it next.');
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    this.toast.info('Password recovery will be available after backend setup.');
  }
}