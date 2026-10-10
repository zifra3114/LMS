import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [PageHeaderComponent, DataTableComponent, IconComponent],
  template: `
    <app-page-header title="Students" subtitle="Manage all registered students">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <app-icon name="plus" [size]="16" />
        Add student
      </button>
    </app-page-header>

    <app-data-table [columns]="columns" [rows]="students" emptyMessage="No students found." />
  `,
})
export class StudentsComponent {
  columns: TableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'grade', label: 'Grade' },
    { key: 'status', label: 'Status', badge: { Active: 'success', Pending: 'warning', Blocked: 'danger' } },
  ];

  // Sample data. Will be replaced with live data from Supabase.
  students = [
    { name: 'Ayesha Khan', email: 'ayesha@example.com', grade: '9th', status: 'Active' },
    { name: 'Hamza Ali', email: 'hamza@example.com', grade: '10th', status: 'Pending' },
  ];
}