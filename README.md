# BeatMitra Admin Panel

A modern, multi-tenant dairy management system built with Next.js. This admin panel enables super admins to manage multiple dairy tenants on a subscription-based model.

## 🚀 Overview

BeatMitra is a comprehensive dairy management platform designed to help dairy businesses streamline their operations. The admin panel provides powerful tools for managing multiple tenants, subscriptions, and core dairy operations.

## 👥 User Roles

- **Super Admin**: Platform administrators who can manage all tenants, subscriptions, and system-wide settings
- **Admin**: Tenant administrators who manage their specific dairy operations, products, users, and settings

## ✨ Key Features

### Multi-Tenancy
- Tenant isolation with secure data separation
- Subscription-based access control
- Tenant onboarding and management
- Usage tracking and billing

### Dashboard & Analytics
- Real-time operational metrics
- Sales and revenue analytics
- Inventory tracking
- User activity monitoring

### User Management
- Role-based access control (RBAC)
- User invitations and onboarding
- Activity logs and audit trails

### Product Management
- Product catalog management
- Inventory tracking
- Price management
- Category organization

### Settings & Configuration
- Tenant-specific settings
- Subscription management
- System configuration
- Theme customization

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Animations**: Framer Motion

## 📋 Prerequisites

- Node.js 20 or higher
- npm, yarn, pnpm, or bun
- Docker (optional, for containerized development)

## 🚀 Getting Started

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Update the `.env.local` file with your configuration.

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Development

1. **Build and run with Docker**
   ```bash
   docker build --target development -t beatmitra-frontend:dev .
   docker run -p 3000:3000 -v $(pwd):/app beatmitra-frontend:dev
   ```

2. **Or use Docker Compose** (if available)
   ```bash
   docker-compose up
   ```

## 🏗 Project Structure

```
frontend/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── providers/        # Context providers
│   └── ui/               # UI components (shadcn/ui)
├── lib/                   # Utility functions and configurations
│   ├── api/              # API client and hooks
│   ├── constants/        # App constants
│   ├── mock-data/        # Mock data for development
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   └── utils.ts          # Utility functions
├── public/               # Static assets
├── Dockerfile            # Multi-stage Docker configuration
└── package.json          # Project dependencies
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🐳 Docker

### Development Build
```bash
docker build --target development -t beatmitra-frontend:dev .
```

### Production Build
```bash
docker build --target production -t beatmitra-frontend:prod .
docker run -p 3000:3000 beatmitra-frontend:prod
```

## 🌐 Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend application URL
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL (for real-time features)

## 🔐 Authentication

The application uses JWT-based authentication with:
- Access tokens for API requests
- Refresh tokens for token renewal
- Secure HTTP-only cookies (production)
- Role-based access control

## 📱 Mobile App Integration

The platform is designed to integrate with mobile applications for:
- Field staff operations
- Delivery management
- Customer portals
- Real-time updates

(Mobile app development details will be added in future updates)

## 🚢 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker Production
```bash
docker build --target production -t beatmitra-frontend:latest .
docker run -p 3000:3000 beatmitra-frontend:latest
```

## 📄 License

All rights reserved. This is proprietary software.

## 🤝 Contributing

This is a private project. For team members, please follow the established git workflow and coding standards.

## 📞 Support

For issues or questions, please contact the development team.
