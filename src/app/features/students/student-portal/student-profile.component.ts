import { Component, OnInit, inject } from '@angular/core';
import { PAGE_STYLES } from './student-portal.styles';
import { StudentDataService, pick } from './student-data.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  template: `
    <div class="page-head">
      <span class="kicker">My Account</span>
      <h1>My Profile</h1>
      <p>Your registration details. Contact admission support to change anything.</p>
    </div>

    @if (profile(); as p) {
      <section class="profile-top">
        <span class="big-avatar">{{ initial(p.fullName) }}</span>
        <div>
          <h2>{{ p.fullName }}</h2>
          <p>{{ p.email }}</p>
        </div>
      </section>

      <div class="grid">
        <section class="panel">
          <h2>Personal Information</h2>
          <dl>
            <div><dt>Full Name</dt><dd>{{ p.fullName }}</dd></div>
            <div><dt>Email</dt><dd>{{ p.email || '—' }}</dd></div>
            <div><dt>Phone</dt><dd>{{ val(['phone', 'student_phone']) }}</dd></div>
            <div><dt>CNIC / B-Form</dt><dd>{{ val(['cnic', 'student_cnic']) }}</dd></div>
            <div><dt>Address</dt><dd>{{ val(['address']) }}</dd></div>
          </dl>
        </section>

        <section class="panel">
          <h2>Education &amp; Enrollment</h2>
          <dl>
            <div><dt>Qualification</dt><dd>{{ val(['last_education', 'qualification']) }}</dd></div>
            <div><dt>Laptop</dt><dd>{{ laptop() }}</dd></div>
            <div><dt>Course</dt><dd>{{ p.courseName || '—' }}</dd></div>
            <div><dt>Batch</dt><dd>{{ p.batchName || '—' }}</dd></div>
            <div><dt>Status</dt><dd>{{ val(['status']) }}</dd></div>
          </dl>
        </section>

        <section class="panel">
          <h2>Guardian Information</h2>
          <dl>
            <div><dt>Guardian Name</dt><dd>{{ val(['father_name', 'guardian_name']) }}</dd></div>
            <div><dt>Guardian Phone</dt><dd>{{ val(['father_phone', 'guardian_phone']) }}</dd></div>
            <div><dt>Guardian CNIC</dt><dd>{{ val(['father_cnic', 'guardian_cnic']) }}</dd></div>
          </dl>
        </section>
      </div>
    } @else {
      <div class="state"><span class="spinner"></span>Loading your profile...</div>
    }
  `,
  styles: [PAGE_STYLES, `
    .profile-top { display: flex; align-items: center; gap: 16px; padding: 22px; border-radius: 20px; background: #020617; color: #fff; margin-bottom: 18px; }
    .big-avatar { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 18px; background: #1d4ed8; font-size: 24px; font-weight: 900; flex: 0 0 auto; }
    .profile-top h2 { margin: 0 0 4px; font-size: 18px; font-weight: 900; }
    .profile-top p { margin: 0; color: #94a3b8; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    dl { margin: 0; display: flex; flex-direction: column; gap: 12px; }
    dl div { display: flex; flex-direction: column; gap: 3px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
    dl div:last-child { border-bottom: 0; padding-bottom: 0; }
    dt { color: #94a3b8; font-size: 9.5px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
    dd { margin: 0; font-size: 12.5px; font-weight: 800; overflow-wrap: anywhere; }
  `],
})
export class StudentProfileComponent implements OnInit {
  private readonly data = inject(StudentDataService);
  readonly profile = this.data.profile;

  async ngOnInit(): Promise<void> {
    await this.data.load();
  }

  initial(name: string): string {
    return (name.trim()[0] ?? 'S').toUpperCase();
  }

  val(keys: string[]): string {
    return pick(this.profile()?.raw, keys) || '—';
  }

  laptop(): string {
    const value = pick(this.profile()?.raw, ['laptop_available', 'laptop']).toLowerCase();
    if (!value) return '—';
    return value === 'true' || value === 'yes' || value === '1' ? 'Yes' : 'No';
  }
}