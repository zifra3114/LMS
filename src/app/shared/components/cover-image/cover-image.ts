import { Component, input } from '@angular/core';

/**
 * Shows an image completely (no cropping). Empty space around the image is
 * filled with a blurred copy of the same image.
 * Give it a size from the parent, e.g. class="block h-64".
 */
@Component({
  selector: 'app-cover-image',
  standalone: true,
  host: { class: 'relative block overflow-hidden bg-slate-100' },
  template: `
    @if (src()) {
      <img
        [src]="src()"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
      />
      <img
        [src]="src()"
        [alt]="alt()"
        class="relative h-full w-full object-contain"
        decoding="async"
      />
    }
  `,
})
export class CoverImageComponent {
  src = input<string | null>('');
  alt = input('');
}