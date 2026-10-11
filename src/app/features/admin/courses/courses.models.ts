export type CourseStatus = 'Published' | 'Drafted';

export type CourseLevel = 'Basic' | 'Intermediate' | 'Expert';

export type CourseType = 'single' | 'bundle';

export type BatchStatus =
  | 'Upcoming'
  | 'Ongoing'
  | 'Completed'
  | 'Cancelled';

// ==============================
// Course Model
// ==============================

export interface Course {
  id: number;
  title: string;
  description: string;
  created_at: string;
  status: CourseStatus;
  duration: string;
  price: number;
  level: CourseLevel;
  type: CourseType;
  thumbnail: string;
}

// ==============================
// Course Input
// ==============================

export type CourseInput = Omit<Course, 'id' | 'created_at'>;

// ==============================
// Course Batch Model
// ==============================

export interface CourseBatch {
  id: number;
  course_id: number;
  batch_name: string;
  batch_code: string;
  start_date: string;
  end_date: string;
  status: BatchStatus;
  created_at: string; // <-- fixed (pehle createdAT tha)
}

// ==============================
// Create / Update Batch Input
// ==============================

export type CourseBatchInput = Omit<CourseBatch, 'id' | 'created_at'>;