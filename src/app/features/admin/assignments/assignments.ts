import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';

import {
  AssignmentBatchOption,
  AssignmentCourseOption,
  AssignmentRecord,
  AssignmentService,
} from '../../../core/services/assignment.service';
import { Toast } from '../../../core/services/toast.service';

// NOTE: adjust this path if your ActionButtonsComponent lives somewhere else.
import { ActionButtonsComponent } from '../../../shared/components/action-buttons/action-buttons';

type StatusFilter = 'all' | 'open' | 'closed';
type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, RouterOutlet, ActionButtonsComponent],
  template: `
    <main class="assignment-page">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="eyebrow">
            <span class="eyebrow-dot"></span>
            LEARNING MANAGEMENT
          </div>

          <h1>Assignments</h1>

          <p class="page-description">
            Manage assignments, track deadlines and organize student work.
          </p>
        </div>

        <a
          routerLink="/admin/assignments/new"
          class="primary-button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create assignment
        </a>
      </header>

      <!-- Statistics -->
      <section class="stats-grid" aria-label="Assignment statistics">
        <article class="stat-card">
          <div class="stat-icon stat-icon-blue">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
          </div>
          <div class="stat-content">
            <p>Total assignments</p>
            <strong>{{ assignments().length }}</strong>
            <span>All assignments</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon stat-icon-green">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.5 2.5L16 9" />
            </svg>
          </div>
          <div class="stat-content">
            <p>Open assignments</p>
            <strong>{{ openCount() }}</strong>
            <span>Available to students</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon stat-icon-red">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <div class="stat-content">
            <p>Closed assignments</p>
            <strong>{{ closedCount() }}</strong>
            <span>Not currently available</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon stat-icon-amber">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <div class="stat-content">
            <p>Due in 7 days</p>
            <strong>{{ dueSoonCount() }}</strong>
            <span>Upcoming deadlines</span>
          </div>
        </article>
      </section>

      <!-- Filters and Search -->
      <section class="toolbar">
        <div class="status-tabs" aria-label="Filter assignments">
          @for (f of filters; track f.value) {
            <button
              type="button"
              class="status-tab"
              [class.active]="statusFilter() === f.value"
              [attr.aria-pressed]="statusFilter() === f.value"
              (click)="statusFilter.set(f.value)"
            >
              {{ f.label }}
              <span class="tab-count">{{ countFor(f.value) }}</span>
            </button>
          }
        </div>

        <div class="toolbar-actions">
          <div class="search-wrapper" [class.search-expanded]="searchOpen()">
            <svg
              class="search-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>

            <!-- type="text" (not "search") so the browser does not add its own clear button -->
            <input
              #searchInput
              type="text"
              autocomplete="off"
              placeholder="Search assignments..."
              aria-label="Search assignments"
              [ngModel]="search()"
              (ngModelChange)="search.set($event)"
              (focus)="searchOpen.set(true)"
              (blur)="onSearchBlur()"
              (keydown.escape)="closeSearch()"
            />

            @if (search()) {
              <button
                type="button"
                class="clear-search"
                aria-label="Clear search"
                (mousedown)="$event.preventDefault()"
                (click)="search.set('')"
              >
                &times;
              </button>
            }
          </div>

          <div class="course-select-wrapper">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16M7 12h10M10 19h4" />
            </svg>

            <select
              aria-label="Filter by course"
              [ngModel]="courseFilter()"
              (ngModelChange)="courseFilter.set($event)"
            >
              <option [ngValue]="null">All courses</option>
              @for (course of courses(); track course.id) {
                <option [ngValue]="course.id">{{ course.title }}</option>
              }
            </select>
          </div>

          <div class="view-toggle" aria-label="Choose layout">
            <button
              type="button"
              aria-label="Grid view"
              title="Grid view"
              [class.selected]="viewMode() === 'grid'"
              [attr.aria-pressed]="viewMode() === 'grid'"
              (click)="viewMode.set('grid')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="List view"
              title="List view"
              [class.selected]="viewMode() === 'list'"
              [attr.aria-pressed]="viewMode() === 'list'"
              (click)="viewMode.set('list')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Loading -->
      @if (loading() && !assignments().length) {
        <section class="state-card">
          <div class="loading-spinner"></div>
          <h2>Loading assignments</h2>
          <p>Please wait while your assignments are being loaded.</p>
        </section>
      }

      <!-- Error -->
      @else if (error()) {
        <section class="state-card error-state">
          <div class="state-icon error-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 9v4m0 4h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>

          <h2>Unable to load assignments</h2>
          <p>{{ error() }}</p>

          <button
            type="button"
            class="primary-button"
            (click)="load()"
          >
            Try again
          </button>
        </section>
      }

      <!-- Empty State -->
      @else if (!filtered().length) {
        <section class="state-card">
          <div class="state-icon empty-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M9 13h6M9 17h4" />
            </svg>
          </div>

          <h2>
            {{
              assignments().length
                ? 'No assignments found'
                : 'Create your first assignment'
            }}
          </h2>

          <p>
            {{
              assignments().length
                ? 'Try changing your search or filters.'
                : 'Create an assignment to start organizing student work.'
            }}
          </p>

          @if (!assignments().length) {
            <a
              routerLink="/admin/assignments/new"
              class="primary-button"
            >
              <span>+</span>
              Create assignment
            </a>
          } @else {
            <button
              type="button"
              class="secondary-button"
              (click)="resetFilters()"
            >
              Clear filters
            </button>
          }
        </section>
      }

      <!-- Grid View -->
      @else if (viewMode() === 'grid') {
        <section class="assignment-grid" aria-label="Assignments">
          @for (a of filtered(); track a.id) {
            <article class="assignment-card">
              <a
                class="assignment-cover"
                [routerLink]="['/admin/assignments', a.id, 'view']"
                [attr.aria-label]="'View ' + a.title"
              >
                @if (a.attachment_url) {
                  <img
                    [src]="a.attachment_url"
                    [alt]="a.title"
                    loading="lazy"
                  />
                } @else {
                  <div class="cover-placeholder">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6M9 13h6M9 17h4" />
                    </svg>
                    <span>Assignment</span>
                  </div>
                }

                <span
                  class="status-badge cover-status"
                  [class.status-open]="isOpen(a)"
                  [class.status-closed]="!isOpen(a)"
                >
                  <span class="status-dot"></span>
                  {{ isOpen(a) ? 'Open' : 'Closed' }}
                </span>
              </a>

              <div class="assignment-body">
                <div class="assignment-meta">
                  <span class="course-label">{{ courseName(a.course_id) }}</span>
                  <span class="meta-separator">·</span>
                  <span class="batch-label">
                    {{ a.batch_id !== null ? batchName(a.batch_id) : 'All batches' }}
                  </span>
                </div>

                <h2 class="assignment-title">{{ a.title }}</h2>

                <p class="assignment-description">
                  {{ a.description || 'No instructions provided.' }}
                </p>

                <div class="assignment-details">
                  <div class="detail-item">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3v18M17 7H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6" />
                    </svg>
                    <span>{{ a.total_marks }} marks</span>
                  </div>

                  <div class="detail-item">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M16 3v4M8 3v4M3 11h18" />
                    </svg>
                    <span>
                      {{ a.deadline ? (a.deadline | date: 'MMM d, y') : 'No deadline' }}
                    </span>
                  </div>
                </div>

                <div class="card-actions">
                  @if (isOpen(a)) {
                    <button
                      type="button"
                      class="action-button close-button"
                      [disabled]="busyId() !== null"
                      (click)="close(a)"
                    >
                      {{ busyId() === a.id ? 'Please wait...' : 'Close assignment' }}
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="action-button reopen-button"
                      [disabled]="busyId() !== null"
                      (click)="startReopen(a)"
                    >
                      {{ busyId() === a.id ? 'Please wait...' : 'Reopen' }}
                    </button>
                  }

                  <div class="icon-actions">
                    <app-action-buttons
                      [deleteDisabled]="busyId() !== null"
                      [deleteLoading]="deletingId() === a.id"
                      (viewClick)="viewAssignment(a)"
                      (editClick)="editAssignment(a)"
                      (deleteClick)="deleteTarget.set(a)"
                    />
                  </div>
                </div>
              </div>
            </article>
          }
        </section>
      }

      <!-- List View -->
      @else {
        <section class="table-card">
          <div class="table-heading">
            <div>
              <h2>All assignments</h2>
              <p>{{ filtered().length }} assignments displayed</p>
            </div>
          </div>

          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Course / Batch</th>
                  <th>Marks</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th class="actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                @for (a of filtered(); track a.id) {
                  <tr>
                    <td>
                      <div class="table-assignment">
                        <div class="table-thumbnail">
                          @if (a.attachment_url) {
                            <img [src]="a.attachment_url" [alt]="a.title" loading="lazy" />
                          } @else {
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <path d="M14 2v6h6" />
                            </svg>
                          }
                        </div>

                        <div class="table-title-wrap">
                          <a
                            class="table-title"
                            [routerLink]="['/admin/assignments', a.id, 'view']"
                          >
                            {{ a.title }}
                          </a>
                          <p>{{ a.description || 'No instructions provided' }}</p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong class="table-course">{{ courseName(a.course_id) }}</strong>
                      <span class="table-subtext">
                        {{ a.batch_id !== null ? batchName(a.batch_id) : 'All batches' }}
                      </span>
                    </td>

                    <td><strong>{{ a.total_marks }}</strong></td>

                    <td>
                      {{ a.deadline ? (a.deadline | date: 'MMM d, y') : '—' }}
                    </td>

                    <td>
                      <span
                        class="status-badge"
                        [class.status-open]="isOpen(a)"
                        [class.status-closed]="!isOpen(a)"
                      >
                        <span class="status-dot"></span>
                        {{ isOpen(a) ? 'Open' : 'Closed' }}
                      </span>
                    </td>

                    <td>
                      <div class="table-actions">
                        @if (isOpen(a)) {
                          <button
                            type="button"
                            class="mini-action mini-close"
                            [disabled]="busyId() !== null"
                            (click)="close(a)"
                          >
                            Close
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="mini-action mini-reopen"
                            [disabled]="busyId() !== null"
                            (click)="startReopen(a)"
                          >
                            Reopen
                          </button>
                        }

                        <app-action-buttons
                          [deleteDisabled]="busyId() !== null"
                          [deleteLoading]="deletingId() === a.id"
                          (viewClick)="viewAssignment(a)"
                          (editClick)="editAssignment(a)"
                          (deleteClick)="deleteTarget.set(a)"
                        />
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <!-- Reopen Confirmation -->
      @if (reopenTarget(); as r) {
        <div class="dialog-backdrop" (click)="cancelReopen()">
          <section
            class="dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reopen-heading"
            (click)="$event.stopPropagation()"
          >
            <div class="dialog-icon dialog-icon-blue">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5M12 7v5l3 2" />
              </svg>
            </div>

            <h2 id="reopen-heading">Reopen assignment</h2>

            <p class="dialog-description">
              The deadline for <strong>{{ r.title }}</strong> has passed.
              Select a new deadline in the future.
            </p>

            <label class="field-label" for="newDeadline">
              New deadline <span>*</span>
            </label>

            <input
              id="newDeadline"
              class="deadline-input"
              type="datetime-local"
              [min]="minimumDeadline"
              [ngModel]="newDeadline()"
              (ngModelChange)="newDeadline.set($event)"
            />

            <div class="dialog-actions">
              <button
                type="button"
                class="secondary-button"
                (click)="cancelReopen()"
              >
                Cancel
              </button>

              <button
                type="button"
                class="primary-button"
                [disabled]="!newDeadline() || busyId() !== null"
                (click)="confirmReopen()"
              >
                {{ busyId() === r.id ? 'Reopening...' : 'Confirm reopen' }}
              </button>
            </div>
          </section>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (deleteTarget(); as d) {
        <div class="dialog-backdrop" (click)="deleteTarget.set(null)">
          <section
            class="dialog-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-heading"
            (click)="$event.stopPropagation()"
          >
            <div class="dialog-icon dialog-icon-red">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" />
                <path d="M10 10v6M14 10v6" />
              </svg>
            </div>

            <h2 id="delete-heading">Delete assignment?</h2>

            <p class="dialog-description">
              <strong>{{ d.title }}</strong> will be permanently deleted.
              This action cannot be undone.
            </p>

            <div class="warning-note">
              Please confirm that you want to delete this assignment.
            </div>

            <div class="dialog-actions">
              <button
                type="button"
                class="secondary-button"
                (click)="deleteTarget.set(null)"
              >
                Cancel
              </button>

              <button
                type="button"
                class="danger-button"
                [disabled]="busyId() !== null"
                (click)="confirmDelete()"
              >
                {{ deletingId() === d.id ? 'Deleting...' : 'Delete assignment' }}
              </button>
            </div>
          </section>
        </div>
      }
    </main>

    <router-outlet />
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
      color: #172033;
      background: #ffffff;
      min-height: 100%;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    :host * {
      box-sizing: border-box;
    }

    .assignment-page {
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
      padding: 32px clamp(16px, 3vw, 38px) 48px;
      background: #ffffff;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 28px;
    }

    .eyebrow {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      color: #64748b;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.6px;
    }

    .eyebrow-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #4776ee;
      box-shadow: 0 0 0 4px #e8edff;
    }

    .page-header h1 {
      margin: 0;
      color: #172033;
      font-size: clamp(26px, 3vw, 34px);
      font-weight: 800;
      letter-spacing: -1.2px;
      line-height: 1.2;
    }

    .page-description {
      margin: 9px 0 0;
      color: #7b8497;
      font-size: 13px;
      line-height: 1.7;
    }

    .primary-button,
    .secondary-button,
    .danger-button {
      display: inline-flex;
      min-height: 42px;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 0 17px;
      border: 1px solid transparent;
      border-radius: 11px;
      font: inherit;
      font-size: 12px;
      font-weight: 750;
      text-decoration: none;
      cursor: pointer;
      transition: background .2s ease, border-color .2s ease,
        box-shadow .2s ease, transform .2s ease;
    }

    .primary-button {
      color: #fff;
      background: #315fe8;
      box-shadow: 0 5px 12px rgb(49 95 232 / 16%);
    }

    .primary-button:hover:not(:disabled) {
      background: #244ed0;
      box-shadow: 0 7px 17px rgb(49 95 232 / 22%);
      transform: translateY(-1px);
    }

    .primary-button svg,
    .secondary-button svg,
    .danger-button svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    button:disabled {
      cursor: not-allowed !important;
      opacity: .55;
      transform: none !important;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 25px;
    }

    .stat-card {
      display: flex;
      min-height: 132px;
      align-items: center;
      gap: 15px;
      padding: 22px 18px;
      overflow: hidden;
      background: #fff;
      border: 1px solid #e9edf5;
      border-radius: 17px;
      box-shadow: 0 3px 12px rgb(28 43 75 / 2%);
      transition: transform .2s ease, box-shadow .2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 9px 24px rgb(28 43 75 / 6%);
    }

    .stat-icon {
      display: flex;
      width: 48px;
      height: 48px;
      flex: 0 0 48px;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
    }

    .stat-icon svg {
      width: 22px;
      height: 22px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .stat-icon-blue {
      color: #4168e8;
      background: #edf2ff;
    }

    .stat-icon-green {
      color: #13966a;
      background: #e9faf3;
    }

    .stat-icon-red {
      color: #e25361;
      background: #fff0f1;
    }

    .stat-icon-amber {
      color: #d48a12;
      background: #fff6e5;
    }

    .stat-content {
      min-width: 0;
    }

    .stat-content p {
      margin: 0 0 6px;
      color: #758096;
      font-size: 11px;
      font-weight: 650;
      line-height: 1.5;
    }

    .stat-content strong {
      display: block;
      color: #1c2740;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -1px;
      line-height: 1.1;
    }

    .stat-content > span {
      display: block;
      margin-top: 5px;
      color: #9aa2b1;
      font-size: 10px;
      line-height: 1.5;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 18px;
      margin-bottom: 23px;
      padding: 13px 17px;
      background: #fff;
      border: 1px solid #e9edf5;
      border-radius: 16px;
      box-shadow: 0 3px 12px rgb(28 43 75 / 2%);
    }

    .status-tabs {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .status-tab {
      display: inline-flex;
      min-height: 40px;
      align-items: center;
      gap: 8px;
      padding: 0 13px;
      color: #7b8497;
      background: transparent;
      border: 0;
      border-radius: 9px;
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: background .2s ease, color .2s ease;
    }

    .status-tab:hover {
      color: #315fe8;
      background: #f5f7ff;
    }

    .status-tab.active {
      color: #315fe8;
      background: #edf2ff;
    }

    .tab-count {
      display: inline-flex;
      min-width: 22px;
      height: 21px;
      align-items: center;
      justify-content: center;
      padding: 0 6px;
      color: #748097;
      background: #f0f2f7;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
    }

    .status-tab.active .tab-count {
      color: #315fe8;
      background: #fff;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 9px;
    }

    .search-wrapper {
      position: relative;
      display: flex;
      width: 43px;
      height: 41px;
      align-items: center;
      overflow: hidden;
      background: #fff;
      border: 1px solid #e5e9f1;
      border-radius: 10px;
      transition: width .22s ease, border-color .2s ease, box-shadow .2s ease;
    }

    .search-wrapper.search-expanded,
    .search-wrapper:focus-within {
      width: 220px;
      border-color: #8aa4ff;
      box-shadow: 0 0 0 3px rgb(49 95 232 / 9%);
    }

    .search-icon {
      position: absolute;
      left: 13px;
      width: 17px;
      height: 17px;
      flex: 0 0 17px;
      fill: none;
      stroke: #7b879c;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: none;
    }

    .search-wrapper input {
      width: 100%;
      height: 100%;
      min-width: 0;
      padding: 0 30px 0 39px;
      color: #25304a;
      background: transparent;
      border: 0;
      outline: 0;
      font: inherit;
      font-size: 11px;
      -webkit-appearance: none;
      appearance: none;
    }

    /* Safety net: hide any native clear (x) button so only our own one shows */
    .search-wrapper input::-webkit-search-cancel-button,
    .search-wrapper input::-webkit-search-decoration,
    .search-wrapper input::-webkit-search-results-button,
    .search-wrapper input::-webkit-search-results-decoration {
      display: none;
      -webkit-appearance: none;
    }

    .search-wrapper input::-ms-clear,
    .search-wrapper input::-ms-reveal {
      display: none;
      width: 0;
      height: 0;
    }

    .search-wrapper input::placeholder {
      color: #a1a9b8;
    }

    .search-wrapper:not(.search-expanded):not(:focus-within) input {
      padding-left: 43px;
      color: transparent;
      cursor: pointer;
    }

    .clear-search {
      position: absolute;
      right: 7px;
      display: flex;
      width: 23px;
      height: 23px;
      align-items: center;
      justify-content: center;
      padding: 0;
      color: #778197;
      background: #f1f3f8;
      border: 0;
      border-radius: 6px;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
    }

    .clear-search:hover {
      color: #34415a;
      background: #e6e9f1;
    }

    .course-select-wrapper {
      position: relative;
      display: flex;
      height: 41px;
      align-items: center;
      border: 1px solid #e5e9f1;
      border-radius: 10px;
      background: #fff;
    }

    .course-select-wrapper > svg {
      position: absolute;
      left: 11px;
      width: 16px;
      height: 16px;
      fill: none;
      stroke: #7b879c;
      stroke-width: 1.8;
      stroke-linecap: round;
      pointer-events: none;
    }

    .course-select-wrapper select {
      width: 145px;
      height: 100%;
      padding: 0 10px 0 34px;
      color: #536078;
      background: transparent;
      border: 0;
      outline: 0;
      font: inherit;
      font-size: 11px;
      cursor: pointer;
    }

    .view-toggle {
      display: flex;
      height: 41px;
      align-items: center;
      gap: 3px;
      padding: 4px;
      background: #f5f6fa;
      border: 1px solid #e8ebf2;
      border-radius: 10px;
    }

    .view-toggle button {
      display: flex;
      width: 31px;
      height: 31px;
      align-items: center;
      justify-content: center;
      color: #8490a4;
      background: transparent;
      border: 0;
      border-radius: 7px;
      cursor: pointer;
      transition: color .2s ease, background .2s ease, box-shadow .2s ease;
    }

    .view-toggle button.selected {
      color: #315fe8;
      background: #fff;
      box-shadow: 0 2px 5px rgb(28 43 75 / 9%);
    }

    .view-toggle svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .assignment-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 19px;
      align-items: stretch;
    }

    .assignment-card {
      display: flex;
      min-width: 0;
      flex-direction: column;
      overflow: hidden;
      background: #fff;
      border: 1px solid #e8ecf4;
      border-radius: 17px;
      box-shadow: 0 3px 12px rgb(28 43 75 / 3%);
      transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
    }

    .assignment-card:hover {
      transform: translateY(-4px);
      border-color: #dce4ff;
      box-shadow: 0 14px 32px rgb(34 53 96 / 8%);
    }

    .assignment-cover {
      position: relative;
      display: flex;
      height: 172px;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: linear-gradient(140deg, #edf2ff, #f5f7fc 55%, #e8efff);
      text-decoration: none;
    }

    .assignment-cover > img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform .35s ease;
    }

    .assignment-card:hover .assignment-cover > img {
      transform: scale(1.035);
    }

    .cover-placeholder {
      display: flex;
      align-items: center;
      flex-direction: column;
      gap: 8px;
      color: #8199e4;
    }

    .cover-placeholder svg {
      width: 43px;
      height: 43px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.35;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .cover-placeholder span {
      font-size: 10px;
      font-weight: 750;
      letter-spacing: .5px;
    }

    .status-badge {
      display: inline-flex;
      width: fit-content;
      align-items: center;
      gap: 6px;
      padding: 6px 9px;
      border-radius: 7px;
      font-size: 10px;
      font-weight: 800;
      white-space: nowrap;
    }

    .cover-status {
      position: absolute;
      top: 12px;
      right: 12px;
      box-shadow: 0 2px 8px rgb(20 30 60 / 6%);
    }

    .status-open {
      color: #13805c;
      background: #e6f8ef;
    }

    .status-closed {
      color: #cf4653;
      background: #fff0f1;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      flex: 0 0 6px;
      background: currentColor;
      border-radius: 50%;
    }

    .assignment-body {
      display: flex;
      flex: 1;
      flex-direction: column;
      padding: 18px;
    }

    .assignment-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      color: #8993a6;
      font-size: 10px;
      font-weight: 650;
    }

    .course-label,
    .batch-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .course-label {
      color: #4266d8;
    }

    .meta-separator {
      flex: 0 0 auto;
      color: #c2c8d4;
    }

    .assignment-title {
      display: -webkit-box;
      overflow: hidden;
      margin: 12px 0 0;
      color: #202b43;
      font-size: 15px;
      font-weight: 800;
      line-height: 1.5;
      overflow-wrap: anywhere;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .assignment-description {
      display: -webkit-box;
      min-height: 42px;
      overflow: hidden;
      margin: 7px 0 0;
      color: #8992a4;
      font-size: 11px;
      line-height: 1.8;
      overflow-wrap: anywhere;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .assignment-details {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 17px;
    }

    .detail-item {
      display: inline-flex;
      min-height: 30px;
      align-items: center;
      gap: 6px;
      padding: 0 8px;
      color: #637087;
      background: #f5f7fb;
      border: 1px solid #edf0f6;
      border-radius: 7px;
      font-size: 10px;
      font-weight: 650;
    }

    .detail-item svg {
      width: 13px;
      height: 13px;
      flex: 0 0 13px;
      fill: none;
      stroke: #8490a6;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-top: auto;
      padding-top: 17px;
      border-top: 1px solid #eff1f6;
    }

    .action-button {
      min-height: 34px;
      padding: 0 10px;
      border: 1px solid transparent;
      border-radius: 8px;
      font: inherit;
      font-size: 10px;
      font-weight: 750;
      cursor: pointer;
      transition: background .2s ease, color .2s ease, border-color .2s ease;
    }

    .close-button {
      color: #d24d59;
      background: #fff0f1;
      border-color: #ffe2e4;
    }

    .close-button:hover:not(:disabled) {
      color: #fff;
      background: #d94d5a;
    }

    .reopen-button {
      color: #315fe8;
      background: #edf2ff;
      border-color: #dfe7ff;
    }

    .reopen-button:hover:not(:disabled) {
      color: #fff;
      background: #315fe8;
    }

    .icon-actions {
      display: flex;
      align-items: center;
      margin-left: auto;
    }

    /* Table View */
    .table-card {
      overflow: hidden;
      background: #fff;
      border: 1px solid #e8ecf4;
      border-radius: 16px;
      box-shadow: 0 3px 12px rgb(28 43 75 / 3%);
    }

    .table-heading {
      padding: 20px 22px;
      border-bottom: 1px solid #edf0f5;
    }

    .table-heading h2 {
      margin: 0;
      color: #25304a;
      font-size: 14px;
      font-weight: 800;
    }

    .table-heading p {
      margin: 5px 0 0;
      color: #929bad;
      font-size: 11px;
    }

    .table-scroll {
      width: 100%;
      overflow-x: auto;
    }

    .table-scroll table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 11px;
    }

    .table-scroll thead {
      background: #f8f9fc;
    }

    .table-scroll th {
      padding: 14px 16px;
      color: #8993a6;
      border-bottom: 1px solid #edf0f5;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .7px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .table-scroll td {
      padding: 15px 16px;
      color: #657087;
      border-bottom: 1px solid #f0f2f7;
      vertical-align: middle;
    }

    .table-scroll tbody tr {
      transition: background .15s ease;
    }

    .table-scroll tbody tr:hover {
      background: #fafbff;
    }

    .table-scroll tbody tr:last-child td {
      border-bottom: 0;
    }

    .table-assignment {
      display: flex;
      min-width: 215px;
      align-items: center;
      gap: 12px;
    }

    .table-thumbnail {
      display: flex;
      width: 57px;
      height: 49px;
      flex: 0 0 57px;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      color: #8096dd;
      background: #eef2ff;
      border-radius: 9px;
    }

    .table-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .table-thumbnail svg {
      width: 23px;
      height: 23px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .table-title-wrap {
      min-width: 0;
    }

    .table-title {
      display: block;
      max-width: 230px;
      overflow: hidden;
      color: #26324b;
      font-size: 11px;
      font-weight: 800;
      text-decoration: none;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .table-title:hover {
      color: #315fe8;
    }

    .table-title-wrap p {
      max-width: 230px;
      overflow: hidden;
      margin: 5px 0 0;
      color: #9aa2b2;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .table-course,
    .table-subtext {
      display: block;
      max-width: 170px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .table-course {
      color: #45536d;
      font-size: 11px;
    }

    .table-subtext {
      margin-top: 5px;
      color: #9aa2b2;
      font-size: 10px;
    }

    .actions-heading {
      text-align: right;
    }

    .table-actions {
      display: flex;
      min-width: 155px;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .mini-action {
      min-height: 30px;
      padding: 0 9px;
      border: 1px solid transparent;
      border-radius: 7px;
      font: inherit;
      font-size: 10px;
      font-weight: 750;
      cursor: pointer;
    }

    .mini-close {
      color: #d24d59;
      background: #fff0f1;
    }

    .mini-reopen {
      color: #315fe8;
      background: #edf2ff;
    }

    /* Empty, Loading and Error States */
    .state-card {
      display: flex;
      min-height: 310px;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 35px 20px;
      text-align: center;
      background: #fff;
      border: 1px solid #e9edf5;
      border-radius: 17px;
    }

    .state-icon {
      display: flex;
      width: 64px;
      height: 64px;
      align-items: center;
      justify-content: center;
      margin-bottom: 17px;
      border-radius: 18px;
    }

    .state-icon svg {
      width: 30px;
      height: 30px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .empty-icon {
      color: #5274e5;
      background: #edf2ff;
    }

    .error-icon {
      color: #d94d5a;
      background: #fff0f1;
    }

    .state-card h2 {
      margin: 0;
      color: #25304a;
      font-size: 17px;
      font-weight: 800;
    }

    .state-card p {
      max-width: 420px;
      margin: 9px 0 20px;
      color: #8992a4;
      font-size: 12px;
      line-height: 1.8;
      overflow-wrap: anywhere;
    }

    .loading-spinner {
      width: 35px;
      height: 35px;
      margin-bottom: 18px;
      border: 3px solid #e6ebfa;
      border-top-color: #315fe8;
      border-radius: 50%;
      animation: assignment-spin .8s linear infinite;
    }

    @keyframes assignment-spin {
      to { transform: rotate(360deg); }
    }

    .secondary-button {
      color: #536078;
      background: #fff;
      border-color: #e0e5ee;
    }

    .secondary-button:hover {
      background: #f6f8fc;
      border-color: #cdd5e4;
    }

    .danger-button {
      color: #fff;
      background: #d94755;
    }

    .danger-button:hover:not(:disabled) {
      background: #bd3543;
    }

    /* Confirmation Dialogs */
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 110;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background: rgb(19 29 49 / 58%);
      backdrop-filter: blur(5px);
      animation: assignment-fade-in .16s ease-out;
    }

    .dialog-card {
      width: 100%;
      max-width: 440px;
      padding: 27px;
      background: #fff;
      border: 1px solid rgb(255 255 255 / 65%);
      border-radius: 19px;
      box-shadow: 0 24px 80px rgb(9 19 44 / 25%);
      animation: assignment-dialog-in .2s ease-out;
    }

    .dialog-icon {
      display: flex;
      width: 49px;
      height: 49px;
      align-items: center;
      justify-content: center;
      margin-bottom: 19px;
      border-radius: 14px;
    }

    .dialog-icon svg {
      width: 23px;
      height: 23px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .dialog-icon-blue {
      color: #315fe8;
      background: #edf2ff;
    }

    .dialog-icon-red {
      color: #d94755;
      background: #fff0f1;
    }

    .dialog-card h2 {
      margin: 0;
      color: #202b43;
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -.4px;
    }

    .dialog-description {
      margin: 10px 0 20px;
      color: #7c879a;
      font-size: 12px;
      line-height: 1.9;
      overflow-wrap: anywhere;
    }

    .dialog-description strong {
      color: #34415a;
    }

    .field-label {
      display: block;
      margin-bottom: 8px;
      color: #4b5871;
      font-size: 11px;
      font-weight: 750;
    }

    .field-label span {
      color: #d94755;
    }

    .deadline-input {
      width: 100%;
      min-height: 43px;
      padding: 0 12px;
      color: #34415a;
      background: #fff;
      border: 1px solid #dfe5ef;
      border-radius: 9px;
      outline: none;
      font: inherit;
      font-size: 12px;
      transition: border-color .2s ease, box-shadow .2s ease;
    }

    .deadline-input:focus {
      border-color: #7190f4;
      box-shadow: 0 0 0 3px rgb(49 95 232 / 10%);
    }

    .warning-note {
      margin: 0 0 22px;
      padding: 11px 13px;
      color: #a64b52;
      background: #fff5f5;
      border: 1px solid #ffe5e6;
      border-radius: 9px;
      font-size: 11px;
      line-height: 1.7;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 9px;
      margin-top: 24px;
    }

    @keyframes assignment-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes assignment-dialog-in {
      from { opacity: 0; transform: translateY(8px) scale(.985); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Responsive Layout */
    @media (max-width: 1150px) {
      .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .assignment-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .toolbar {
        align-items: flex-start;
        flex-direction: column;
      }

      .toolbar-actions {
        width: 100%;
      }

      .search-wrapper.search-expanded,
      .search-wrapper:focus-within {
        width: min(260px, 40vw);
      }
    }

    @media (max-width: 650px) {
      .assignment-page {
        padding: 23px 14px 32px;
      }

      .page-header {
        align-items: flex-start;
        flex-direction: column;
        gap: 17px;
        margin-bottom: 22px;
      }

      .page-header .primary-button {
        width: 100%;
      }

      .page-description {
        font-size: 12px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 18px;
      }

      .stat-card {
        min-height: 108px;
        align-items: flex-start;
        flex-direction: column;
        gap: 10px;
        padding: 14px;
        border-radius: 13px;
      }

      .stat-icon {
        width: 35px;
        height: 35px;
        flex-basis: 35px;
        border-radius: 10px;
      }

      .stat-icon svg {
        width: 18px;
        height: 18px;
      }

      .stat-content p {
        font-size: 10px;
      }

      .stat-content strong {
        font-size: 24px;
      }

      .stat-content > span {
        font-size: 9px;
      }

      .toolbar {
        gap: 12px;
        padding: 12px;
        margin-bottom: 17px;
      }

      .status-tabs {
        width: 100%;
        justify-content: space-between;
      }

      .status-tab {
        gap: 5px;
        padding: 0 8px;
        font-size: 11px;
      }

      .toolbar-actions {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
        gap: 7px;
      }

      .search-wrapper {
        width: 100%;
        grid-column: 1 / -1;
      }

      .search-wrapper.search-expanded,
      .search-wrapper:focus-within {
        width: 100%;
      }

      .search-wrapper:not(.search-expanded):not(:focus-within) input {
        padding-left: 43px;
      }

      .course-select-wrapper {
        min-width: 0;
      }

      .course-select-wrapper select {
        width: 100%;
        min-width: 0;
        font-size: 10px;
      }

      .view-toggle {
        justify-content: center;
      }

      .assignment-grid {
        grid-template-columns: minmax(0, 1fr);
        gap: 14px;
      }

      .assignment-cover {
        height: 185px;
      }

      .assignment-body {
        padding: 16px;
      }

      .assignment-title {
        font-size: 14px;
      }

      .table-heading {
        padding: 17px;
      }

      .dialog-card {
        padding: 22px;
      }

      .dialog-actions > button {
        flex: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host *,
      :host *::before,
      :host *::after {
        scroll-behavior: auto !important;
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
      }
    }
  `],
})
export class AssignmentsComponent {
  private readonly service = inject(AssignmentService);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('searchInput')
  private searchInput?: ElementRef<HTMLInputElement>;

  readonly filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ];

  readonly assignments = signal<AssignmentRecord[]>([]);
  readonly courses = signal<AssignmentCourseOption[]>([]);
  readonly batches = signal<AssignmentBatchOption[]>([]);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly busyId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);

  readonly search = signal('');
  readonly searchOpen = signal(false);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly courseFilter = signal<number | null>(null);
  readonly viewMode = signal<ViewMode>('grid');

  readonly deleteTarget = signal<AssignmentRecord | null>(null);
  readonly reopenTarget = signal<AssignmentRecord | null>(null);
  readonly newDeadline = signal('');

  get minimumDeadline(): string {
    const now = new Date();
    const local = new Date(
      now.getTime() - now.getTimezoneOffset() * 60_000,
    );

    return local.toISOString().slice(0, 16);
  }

  readonly openCount = computed(
    () => this.assignments().filter((a) => this.isOpen(a)).length,
  );

  readonly closedCount = computed(
    () => this.assignments().length - this.openCount(),
  );

  readonly dueSoonCount = computed(() => {
    const now = Date.now();
    const week = now + 7 * 24 * 60 * 60 * 1000;

    return this.assignments().filter((a) => {
      if (!this.isOpen(a) || !a.deadline) return false;

      const deadline = new Date(a.deadline).getTime();

      return Number.isFinite(deadline) && deadline > now && deadline <= week;
    }).length;
  });

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const courseId = this.courseFilter();

    return this.assignments().filter((a) => {
      const matchesStatus =
        status === 'all' ||
        (status === 'open' ? this.isOpen(a) : !this.isOpen(a));

      const matchesCourse =
        courseId === null || Number(a.course_id) === Number(courseId);

      const matchesSearch =
        !query ||
        (a.title ?? '').toLowerCase().includes(query) ||
        (a.description ?? '').toLowerCase().includes(query) ||
        this.courseName(a.course_id).toLowerCase().includes(query) ||
        (
          a.batch_id !== null
            ? this.batchName(a.batch_id)
            : 'all batches'
        ).toLowerCase().includes(query);

      return matchesStatus && matchesCourse && matchesSearch;
    });
  });

  constructor() {
    void this.load();

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const path = event.urlAfterRedirects
          .split('?')[0]
          .replace(/\/$/, '');

        if (path === '/admin/assignments') {
          void this.load(false);
        }
      });
  }

  // Navigation (used by the shared action buttons)

  viewAssignment(a: AssignmentRecord): void {
    void this.router.navigate(['/admin/assignments', a.id, 'view']);
  }

  editAssignment(a: AssignmentRecord): void {
    void this.router.navigate(['/admin/assignments', a.id, 'edit']);
  }

  // Search and filters

  openSearch(): void {
    this.searchOpen.set(true);

    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  closeSearch(): void {
    this.search.set('');
    this.searchOpen.set(false);
    this.searchInput?.nativeElement.blur();
  }

  /** Collapse back to the icon when the box loses focus while empty. */
  onSearchBlur(): void {
    if (!this.search().trim()) {
      this.searchOpen.set(false);
    }
  }

  resetFilters(): void {
    this.search.set('');
    this.searchOpen.set(false);
    this.statusFilter.set('all');
    this.courseFilter.set(null);
  }

  countFor(value: StatusFilter): number {
    if (value === 'open') return this.openCount();
    if (value === 'closed') return this.closedCount();

    return this.assignments().length;
  }

  // Assignment helpers

  isOpen(a: AssignmentRecord): boolean {
    if (a.status !== 'open') return false;

    if (!a.deadline) return true;

    const deadline = new Date(a.deadline).getTime();

    return Number.isFinite(deadline) && deadline > Date.now();
  }

  courseName(id: number): string {
    return (
      this.courses().find((course) => course.id === id)?.title ??
      `Course #${id}`
    );
  }

  batchName(id: number): string {
    const batch = this.batches().find((item) => item.id === id);

    return batch
      ? `${batch.batch_name} (${batch.batch_code})`
      : `Batch #${id}`;
  }

  // Data loading

  async load(showSpinner = true): Promise<void> {
    if (showSpinner) this.loading.set(true);

    this.error.set('');

    try {
      const [assignments, courses, batches] = await Promise.all([
        this.service.getAssignments(),
        this.service
          .getCourses()
          .catch(() => [] as AssignmentCourseOption[]),
        this.service
          .getAllBatches()
          .catch(() => [] as AssignmentBatchOption[]),
      ]);

      this.assignments.set(assignments);
      this.courses.set(courses);
      this.batches.set(batches);
    } catch (error) {
      this.error.set(
        this.messageOf(
          error,
          'Something went wrong while loading assignments.',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }

  // Close assignment

  async close(a: AssignmentRecord): Promise<void> {
    if (this.busyId() !== null) return;

    this.busyId.set(a.id);

    try {
      await this.service.closeAssignment(a.id);

      this.toast.success('Assignment closed.', 'Assignment');

      await this.load(false);
    } catch (error) {
      this.toast.error(
        this.messageOf(error, 'Could not close the assignment.'),
        'Assignment',
      );
    } finally {
      this.busyId.set(null);
    }
  }

  // Reopen assignment

  startReopen(a: AssignmentRecord): void {
    if (this.busyId() !== null) return;

    const deadlinePassed =
      !!a.deadline &&
      new Date(a.deadline).getTime() <= Date.now();

    if (deadlinePassed) {
      this.newDeadline.set('');
      this.reopenTarget.set(a);
      return;
    }

    void this.reopen(a, null);
  }

  cancelReopen(): void {
    if (this.busyId() !== null) return;

    this.reopenTarget.set(null);
    this.newDeadline.set('');
  }

  async confirmReopen(): Promise<void> {
    const target = this.reopenTarget();
    const value = this.newDeadline();

    if (!target || !value || this.busyId() !== null) return;

    const selectedDate = new Date(value);

    if (!Number.isFinite(selectedDate.getTime())) {
      this.toast.error('Choose a valid deadline.', 'Assignment');
      return;
    }

    if (selectedDate.getTime() <= Date.now()) {
      this.toast.error(
        'Choose a deadline in the future.',
        'Assignment',
      );
      return;
    }

    await this.reopen(target, selectedDate.toISOString());
  }

  private async reopen(
    a: AssignmentRecord,
    deadline: string | null,
  ): Promise<void> {
    if (this.busyId() !== null) return;

    this.busyId.set(a.id);

    try {
      await this.service.reopenAssignment(a.id, deadline);

      this.reopenTarget.set(null);
      this.newDeadline.set('');

      this.toast.success('Assignment reopened.', 'Assignment');

      await this.load(false);
    } catch (error) {
      this.toast.error(
        this.messageOf(error, 'Could not reopen the assignment.'),
        'Assignment',
      );
    } finally {
      this.busyId.set(null);
    }
  }

  // Delete assignment

  async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();

    if (!target || this.busyId() !== null) return;

    this.busyId.set(target.id);
    this.deletingId.set(target.id);

    try {
      await this.service.deleteAssignment(target.id);

      this.deleteTarget.set(null);

      this.toast.success('Assignment deleted.', 'Assignment');

      await this.load(false);
    } catch (error) {
      this.toast.error(
        this.messageOf(error, 'Could not delete the assignment.'),
        'Assignment',
      );
    } finally {
      this.busyId.set(null);
      this.deletingId.set(null);
    }
  }

  private messageOf(error: unknown, fallback: string): string {
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return fallback;
  }
}