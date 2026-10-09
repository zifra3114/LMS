import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-form-input',
  standalone: true,
  template: `
    <div class="field">
      <label [for]="id" class="field-label">{{ label }}</label>

      <input
        class="field-input"
        [id]="id"
        [name]="name"
        [type]="type"
        [placeholder]="placeholder"
        [autocomplete]="autocomplete"
        [value]="value"
        [required]="required"
        (input)="valueChange.emit($any($event.target).value)"
      />
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .field-label {
      display: block;
      color: #334155;
      font-size: 13px;
      font-weight: 600;
    }

    .field-input {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: 13px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
      color: #0f172a;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;
    }

    .field-input::placeholder {
      color: #94a3b8;
    }

    .field-input:hover {
      border-color: #cbd5e1;
    }

    .field-input:focus {
      border-color: #6478d3;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(100, 120, 211, 0.15);
    }
  `,
})
export class FormInputComponent {
  @Input() id = '';
  @Input() name = '';
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' = 'text';
  @Input() placeholder = '';
  @Input() autocomplete = '';
  @Input() value = '';
  @Input() required = false;

  @Output() valueChange = new EventEmitter<string>();
}