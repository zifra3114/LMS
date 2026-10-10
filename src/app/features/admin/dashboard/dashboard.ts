import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table';
import { IconName } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [PageHeaderComponent, StatCardComponent, DataTableComponent],
  template: `
    <app-page-header title="Dashboard" subtitle="Overview of your learning management system" />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      @for (s of stats; track s.label) {
        <app-stat-card [label]="s.label" [value]="s.value" [icon]="s.icon" />
      }
    </div>

    <h2 class="mb-3 mt-8 text-lg font-semibold text-slate-800">Recent students</h2>
    <app-data-table [columns]="columns" [rows]="recent" emptyMessage="No students found." />
  `,
})
export class AdminDashboardComponent {
  // Sample data. Will be replaced with live data from Supabase.
  stats: { label: string; value: number; icon: IconName }[] = [
    { label: 'Students', value: 128, icon: 'graduation-cap' },
    { label: 'Teachers', value: 14, icon: 'user-check' },
    { label: 'Courses', value: 22, icon: 'book-open' },
    { label: 'Active classes', value: 9, icon: 'activity' },
  ];

  columns: TableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', badge: { Active: 'success', Pending: 'warning', Blocked: 'danger' } },
  ];

  recent = [
    { name: 'Ayesha Khan', email: 'ayesha@example.com', status: 'Active' },
    { name: 'Hamza Ali', email: 'hamza@example.com', status: 'Pending' },
    { name: 'Sara Ahmed', email: 'sara@example.com', status: 'Blocked' },
  ];
}