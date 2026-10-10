
export type CourseStatus = 'Published' | 'Drafted';

export type CourseLevel = 'Basic' | 'Intermediate' | 'Expert';

export interface Course {
  id: number;
  title: string;
  description: string;
  createdAt: string; // ISO date
  status: CourseStatus;
  duration: string;
  price: number;
  level: CourseLevel;
  type: 'single' | 'bundle';

  /** Image URL or Tailwind gradient classes used as a placeholder. */
  thumbnail: string;
}