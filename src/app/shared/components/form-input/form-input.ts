
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-form-input',
  standalone: true,
  templateUrl: './form-input.html',
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