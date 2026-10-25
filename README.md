# LMS Frontend - EduCore Learning Management System

Modern Learning Management System built with Angular 22, Tailwind CSS 4, and Supabase.

## Features

✨ **Dark/Light Theme** - Seamless theme switching with system preference detection
🔔 **Toast Notifications** - Beautiful toast notifications across the app
📱 **Responsive Design** - Works perfectly on all devices
🎨 **Modern UI** - Clean and professional interface with Tailwind CSS
🔐 **Authentication** - Secure admin and student login
📊 **Real-time Dashboard** - Live updates with Supabase Realtime
🎓 **Course Management** - Manage courses, assignments, quizzes, and more

## Tech Stack

- **Framework:** Angular 22
- **Styling:** Tailwind CSS 4
- **Backend:** Supabase
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 11+

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd LMS
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables

Create a `src/environments/environment.ts` file with your Supabase credentials:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    key: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

Create a `src/environments/environment.development.ts` file:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    key: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

4. Start development server
```bash
npm start
```

The app will open at `http://localhost:4200`

## Building for Production

```bash
npm run build
```

Build output will be in `dist/lms-frontend/browser/`

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI
```bash
npm i -g vercel
```

2. Deploy
```bash
vercel
```

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Import the project in Vercel dashboard
3. Vercel will auto-detect Angular and use the settings from `vercel.json`
4. Add environment variables in Vercel dashboard (if needed)
5. Deploy!

### Environment Variables for Vercel

If you need to use environment variables in production, add them in Vercel dashboard:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/         # Route guards
│   │   ├── services/       # Core services (auth, toast, theme, etc.)
│   │   └── config/         # Configuration files
│   ├── features/
│   │   ├── admin/          # Admin features
│   │   └── students/       # Student features
│   ├── shared/
│   │   └── components/     # Reusable components
│   └── app.ts              # Root component
├── environments/           # Environment configurations
└── styles.css             # Global styles
```

## Key Features Implementation

### Dark Mode
- System preference detection
- Persistent theme storage in localStorage
- Smooth transitions between themes
- Toggle available in admin topbar

### Toast Notifications
Toast service is available throughout the app:

```typescript
import { Toast } from './core/services/toast.service';

constructor(private toast: Toast) {}

// Usage
this.toast.success('Operation successful!');
this.toast.error('Something went wrong');
this.toast.warning('Please be careful');
this.toast.info('Here is some information');
```

## Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run watch` - Build and watch for changes
- `npm test` - Run tests

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private - All rights reserved

## Support

For issues and questions, please contact the development team.
