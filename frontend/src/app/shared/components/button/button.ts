import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() loading = false;
  @Input() disabled = false;

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }
}