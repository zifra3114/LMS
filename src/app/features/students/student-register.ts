import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { SupabaseService } from '../../core/services/supabase.service';

type DbRow = Record<string, unknown>;
type NoticeType = 'success' | 'error' | 'warning';

interface CatalogItem {
  id: string;
  name: string;
  courseId?: string;
}

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-[#f8fafc] text-slate-800">

      <!-- Header / Top Navbar -->
      <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <a routerLink="/" class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m2.5 8.5 9.5-5 9.5 5-9.5 5-9.5-5Z"/>
                <path d="M6.5 11v5c3.3 2.6 7.7 2.6 11 0v-5"/>
                <path d="M21.5 9v6"/>
              </svg>
            </div>
            <div>
              <span class="block text-lg font-black tracking-tight text-slate-900">EduCore</span>
              <span class="block text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Student Admission Portal
              </span>
            </div>
          </a>

          <a routerLink="/"
            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"/>
              <path d="M9 12h12"/>
            </svg>
            Back to Home
          </a>
        </div>
      </header>

      <!-- Main Layout Container (Balanced 3-Column Layout) -->
      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="grid gap-8 lg:grid-cols-12 items-start">

          <!-- Left Info Widgets -->
          <div class="hidden lg:col-span-3 lg:block space-y-5 sticky top-24">
            <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div class="flex items-center gap-2.5 text-blue-600 font-bold text-xs uppercase tracking-wider">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Registration Steps
              </div>
              <ul class="mt-4 space-y-4 text-xs font-medium text-slate-600">
                <li class="flex items-start gap-3">
                  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-[11px]">1</span>
                  <span>Fill personal contact & address details</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-[11px]">2</span>
                  <span>Add education qualification & guardian info</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-[11px]">3</span>
                  <span>Select preferred course and active batch</span>
                </li>
              </ul>
            </div>

            <div class="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-md">
              <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12 12 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
                </svg>
                Need Assistance?
              </div>
              <p class="mt-2 text-xs text-blue-100 leading-relaxed">
                If you face issues with batch selection or CNIC verification, contact our support helpline.
              </p>
            </div>
          </div>

          <!-- Center Registration Form Panel -->
          <div class="lg:col-span-6 w-full">
            <div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-100">

              <div class="border-b border-slate-100 bg-slate-50/50 px-6 py-6 sm:px-8">
                <div class="flex items-center justify-between">
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                    </svg>
                    New Admission
                  </span>
                  <span class="text-xs text-slate-400 font-medium">* Required fields</span>
                </div>
                <h1 class="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
                  Student Registration
                </h1>
                <p class="mt-1 text-xs text-slate-500">
                  Please fill in your details carefully to complete your enrollment.
                </p>
              </div>

              <form #registrationForm="ngForm"
                (ngSubmit)="registerStudent()"
                class="space-y-6 p-6 sm:p-8">

                <!-- Personal Information -->
                <div class="space-y-4">
                  <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      1. Personal Details
                    </h3>
                  </div>

                  <!-- Full Name -->
                  <div>
                    <label for="student-name" class="mb-1.5 block text-xs font-semibold text-slate-700">
                      Full Name <span class="text-rose-500">*</span>
                    </label>
                    <input id="student-name" name="fullName"
                      [(ngModel)]="fullName" required maxlength="120"
                      autocomplete="name" placeholder="e.g. Zifra Firdous"
                      class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"/>
                  </div>

                  <!-- Email -->
                  <div>
                    <label for="student-email" class="mb-1.5 block text-xs font-semibold text-slate-700">
                      Email Address <span class="text-rose-500">*</span>
                    </label>
                    <input id="student-email" type="email" name="email"
                      [(ngModel)]="email" required email autocomplete="email"
                      placeholder="you@example.com"
                      class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"/>
                  </div>

                  <!-- Phone & CNIC -->
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label for="student-phone" class="mb-1.5 block text-xs font-semibold text-slate-700">
                        Phone Number <span class="text-rose-500">*</span>
                      </label>
                      <input id="student-phone" type="tel" name="studentPhone"
                        [(ngModel)]="studentPhone" required
                        pattern="[+]?[0-9 ()-]{10,20}" maxlength="20"
                        placeholder="+92 300 1234567"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    <div>
                      <label for="student-cnic" class="mb-1.5 block text-xs font-semibold text-slate-700">
                        CNIC / B-Form <span class="text-rose-500">*</span>
                      </label>
                      <input id="student-cnic" type="text" name="studentCnic"
                        [(ngModel)]="studentCnic" required
                        pattern="[0-9]{5}-?[0-9]{7}-?[0-9]" maxlength="15"
                        placeholder="42101-1234567-1"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"/>
                    </div>
                  </div>

                  <!-- Address -->
                  <div>
                    <label for="student-address" class="mb-1.5 block text-xs font-semibold text-slate-700">
                      Residential Address <span class="text-rose-500">*</span>
                    </label>
                    <textarea id="student-address" name="address"
                      [(ngModel)]="address" required maxlength="500" rows="3"
                      placeholder="House no, street, area, city"
                      class="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"></textarea>
                  </div>
                </div>

                <!-- Education Information -->
                <div class="space-y-4 pt-2">
                  <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                    </svg>
                    <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      2. Education & Equipment
                    </h3>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label for="last-education" class="mb-1.5 block text-xs font-semibold text-slate-700">
                        Qualification <span class="text-rose-500">*</span>
                      </label>
                      <input id="last-education" name="lastEducation"
                        [(ngModel)]="lastEducation" required maxlength="150"
                        placeholder="e.g. Matric / Intermediate"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    <div>
                      <label for="laptop-availability" class="mb-1.5 block text-xs font-semibold text-slate-700">
                        Have Laptop? <span class="text-rose-500">*</span>
                      </label>
                      <select id="laptop-availability" name="laptopAvailable"
                        [(ngModel)]="laptopAvailable" required
                        class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100">
                        <option value="">Select option</option>
                        <option value="yes">Yes, I have a laptop</option>
                        <option value="no">No laptop available</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Father / Guardian Information -->
                <div class="space-y-4 pt-2">
                  <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a5.97 5.97 0 0 0-.942 3.197" />
                    </svg>
                    <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      3. Guardian Information
                    </h3>
                  </div>

                  <div>
                    <label for="father-name" class="mb-1.5 block text-xs font-semibold text-slate-700">
                      Father / Guardian Name <span class="text-rose-500">*</span>
                    </label>
                    <input id="father-name" name="fatherName"
                      [(ngModel)]="fatherName" required maxlength="120"
                      placeholder="Father or Guardian Name"
                      class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"/>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label for="father-phone" class="mb-1.5 block text-xs font-semibold text-slate-700">
                        Guardian Phone <span class="text-rose-500">*</span>
                      </label>
                      <input id="father-phone" type="tel" name="fatherPhone"
                        [(ngModel)]="fatherPhone" required
                        pattern="[+]?[0-9 ()-]{10,20}" maxlength="20"
                        placeholder="+92 300 1234567"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    <div>
                      <label for="father-cnic" class="mb-1.5 block text-xs font-semibold text-slate-700">
                        Guardian CNIC <span class="font-normal text-slate-400">(Optional)</span>
                      </label>
                      <input id="father-cnic" type="text" name="fatherCnic"
                        [(ngModel)]="fatherCnic"
                        pattern="[0-9]{5}-?[0-9]{7}-?[0-9]" maxlength="15"
                        placeholder="42101-1234567-1"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"/>
                    </div>
                  </div>
                </div>

                <!-- Course & Batch Selection -->
                <div class="space-y-4 pt-2">
                  <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
                    </svg>
                    <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      4. Course & Batch Selection
                    </h3>
                  </div>

                  @if (catalogLoading()) {
                    <div class="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 font-medium">
                      <div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                      Fetching available courses and batches...
                    </div>
                  }

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label for="student-course" class="mb-1.5 block text-xs font-semibold text-slate-700">
                        Course <span class="text-rose-500">*</span>
                      </label>
                      <select id="student-course" name="courseId"
                        [(ngModel)]="selectedCourse"
                        (ngModelChange)="onCourseChange()"
                        required [disabled]="catalogLoading() || courses().length === 0"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-50">
                        <option value="">Select Course</option>
                        @for (course of courses(); track course.id) {
                          <option [value]="course.id">{{ course.name }}</option>
                        }
                      </select>
                    </div>

                    <div>
                      <label for="student-batch" class="mb-1.5 block text-xs font-semibold text-slate-700">
                        Batch <span class="text-rose-500">*</span>
                      </label>
                      <select id="student-batch" name="batchId"
                        [(ngModel)]="selectedBatch" required
                        [disabled]="!selectedCourse || catalogLoading() || availableBatches.length === 0"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-50">
                        <option value="">Select Batch</option>
                        @for (batch of availableBatches; track batch.id) {
                          <option [value]="batch.id">{{ batch.name }}</option>
                        }
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Status Notice -->
                @if (notice()) {
                  <div role="status"
                    class="rounded-xl border p-3.5 text-xs font-semibold leading-relaxed"
                    [class.border-emerald-200]="noticeType() === 'success'"
                    [class.bg-emerald-50]="noticeType() === 'success'"
                    [class.text-emerald-800]="noticeType() === 'success'"
                    [class.border-rose-200]="noticeType() === 'error'"
                    [class.bg-rose-50]="noticeType() === 'error'"
                    [class.text-rose-800]="noticeType() === 'error'"
                    [class.border-amber-200]="noticeType() === 'warning'"
                    [class.bg-amber-50]="noticeType() === 'warning'"
                    [class.text-amber-800]="noticeType() === 'warning'">
                    {{ notice() }}
                  </div>
                }

                <!-- Submit Button -->
                <button type="submit"
                  [disabled]="registrationForm.invalid || saving() || registered() || catalogLoading()"
                  class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">

                  @if (saving()) {
                    <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Submitting Application...
                  } @else if (registered()) {
                    Application Submitted
                  } @else {
                    Submit Registration
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12h14m-6-6 6 6-6 6"/>
                    </svg>
                  }
                </button>

                <div class="border-t border-slate-100 pt-4 text-center">
                  <p class="text-xs text-slate-500 font-medium">
                    Already registered with us?
                    <a routerLink="/student/login"
                      class="font-bold text-blue-600 hover:text-blue-800 hover:underline">
                      Student Login
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>

          <!-- Right Security/Info Panel -->
          <div class="hidden lg:col-span-3 lg:block space-y-5 sticky top-24">
            <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75s-2.25 2.25-3.75 3.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
                Data Privacy
              </div>
              <p class="mt-2 text-xs text-slate-500 leading-relaxed">
                Your personal and CNIC details are encrypted and strictly kept confidential under EduCore privacy rules.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  `,
})
export class StudentRegisterComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);

  readonly courses = signal<CatalogItem[]>([]);
  readonly batches = signal<CatalogItem[]>([]);
  readonly catalogLoading = signal(true);

  readonly saving = signal(false);
  readonly registered = signal(false);
  readonly notice = signal('');
  readonly noticeType = signal<NoticeType>('warning');

  fullName = '';
  email = '';
  studentPhone = '';
  studentCnic = '';
  address = '';

  lastEducation = '';
  laptopAvailable: '' | 'yes' | 'no' = '';

  fatherName = '';
  fatherPhone = '';
  fatherCnic = '';
  fatherOccupation = '';

  selectedCourse = '';
  selectedBatch = '';

  get availableBatches(): CatalogItem[] {
    if (!this.selectedCourse) {
      return [];
    }

    return this.batches().filter(
      batch => batch.courseId === this.selectedCourse,
    );
  }

  async ngOnInit(): Promise<void> {
    await this.loadCatalogs();
  }

  private async loadCatalogs(): Promise<void> {
    this.catalogLoading.set(true);
    this.notice.set('');

    try {
      const [courseResult, batchResult] = await Promise.all([
        this.supabase.client.from('courses').select('*'),
        this.supabase.client.from('course_batches').select('*'),
      ]);

      if (courseResult.error) {
        throw courseResult.error;
      }

      if (batchResult.error) {
        throw batchResult.error;
      }

      const courseRows = (courseResult.data ?? []) as DbRow[];
      const batchRows = (batchResult.data ?? []) as DbRow[];

      const courses: CatalogItem[] = courseRows
        .map(row => ({
          id: this.readValue(row, ['course_id', 'id']),
          name: this.readValue(row, [
            'course_name',
            'course_title',
            'title',
            'name',
          ]),
        }))
        .filter(item => item.id !== '' && item.name !== '');

      const batches: CatalogItem[] = batchRows
        .map(row => ({
          id: this.readValue(row, [
            'course_batch_id',
            'batch_id',
            'id',
          ]),
          name: this.readValue(row, [
            'batch_name',
            'course_batch_name',
            'batch_title',
            'title',
            'name',
          ]),
          courseId: this.readValue(row, [
            'course_id',
            'courseId',
          ]),
        }))
        .filter(item =>
          item.id !== '' &&
          item.name !== '' &&
          item.courseId !== '',
        );

      this.courses.set(courses);
      this.batches.set(batches);

      if (courses.length === 0) {
        this.showNotice(
          'No courses were found.',
          'warning',
        );
      }
    } catch (error: unknown) {
      this.showNotice(
        error instanceof Error
          ? `Unable to load data: ${error.message}`
          : 'Unable to load courses.',
        'error',
      );
    } finally {
      this.catalogLoading.set(false);
    }
  }

  onCourseChange(): void {
    this.selectedBatch = '';
    this.notice.set('');
    this.noticeType.set('warning');
  }

  async registerStudent(): Promise<void> {
    if (this.saving() || this.registered()) {
      return;
    }

    const fullName = this.fullName.trim();
    const email = this.email.trim().toLowerCase();
    const studentPhone = this.studentPhone.trim();
    const studentCnic = this.normalizeCnic(this.studentCnic);
    const address = this.address.trim();
    const lastEducation = this.lastEducation.trim();

    const fatherName = this.fatherName.trim();
    const fatherPhone = this.fatherPhone.trim();
    const fatherCnic = this.fatherCnic
      ? this.normalizeCnic(this.fatherCnic)
      : null;
    const fatherOccupation = this.fatherOccupation.trim() || null;

    if (
      !fullName ||
      !email ||
      !studentPhone ||
      !studentCnic ||
      !address ||
      !lastEducation ||
      !this.laptopAvailable ||
      !fatherName ||
      !fatherPhone ||
      !this.selectedCourse ||
      !this.selectedBatch
    ) {
      this.showNotice(
        'Please complete all required fields.',
        'warning',
      );
      return;
    }

    this.saving.set(true);
    this.notice.set('');

    try {
      const { data, error } =
        await this.supabase.client.functions.invoke('register-student', {
          body: {
            fullName,
            email,
            studentPhone,
            studentCnic,
            address,
            lastEducation,
            laptopAvailable: this.laptopAvailable === 'yes',

            fatherName,
            fatherPhone,
            fatherCnic,
            fatherOccupation,

            courseId: this.selectedCourse,
            batchId: this.selectedBatch,
          },
        });

      if (error) {
        if (error instanceof FunctionsHttpError) {
          // Function ran, but it returned an error response
          const details = await error.context.json().catch(() => null);
          throw new Error(
            details?.error ??
              details?.message ??
              'Function returned an error.',
          );
        }

        if (error instanceof FunctionsFetchError) {
          // Request never reached the function
          console.error('Edge Function fetch error:', error);
          throw new Error(
            'Server se connect nahi ho paya. Edge Function deploy, CORS aur environment.ts check karein.',
          );
        }

        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      this.registered.set(true);
      this.showNotice(
        data?.message ??
          'Registration request completed.',
        'success',
      );
    } catch (error: unknown) {
      this.showNotice(
        error instanceof Error
          ? error.message
          : 'Registration failed.',
        'error',
      );
    } finally {
      this.saving.set(false);
    }
  }

  private normalizeCnic(value: string): string {
    return value.replace(/\D/g, '');
  }

  private readValue(row: DbRow, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      ) {
        return String(value).trim();
      }
    }

    return '';
  }

  private showNotice(message: string, type: NoticeType): void {
    this.notice.set(message);
    this.noticeType.set(type);
  }
}