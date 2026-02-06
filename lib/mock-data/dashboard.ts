import { DashboardStats, User, Product, Article } from "@/lib/types";

export const mockDashboardStats: DashboardStats = {
  totalUsers: 1248,
  totalProducts: 356,
  totalArticles: 89,
  totalFiles: 1567,
  usersGrowth: 12.5,
  productsGrowth: 8.3,
  articlesGrowth: 15.7,
  filesGrowth: 22.1,
};

export const mockRecentUsers: User[] = [
  {
    id: "1",
    email: "john.doe@example.com",
    username: "johndoe",
    firstName: "John",
    lastName: "Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    role: "user",
    status: "active",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    email: "jane.smith@example.com",
    username: "janesmith",
    firstName: "Jane",
    lastName: "Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    role: "admin",
    status: "active",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    email: "bob.johnson@example.com",
    username: "bobjohnson",
    firstName: "Bob",
    lastName: "Johnson",
    role: "user",
    status: "active",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    email: "alice.williams@example.com",
    username: "alicew",
    firstName: "Alice",
    lastName: "Williams",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    role: "moderator",
    status: "active",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    email: "charlie.brown@example.com",
    username: "charlieb",
    firstName: "Charlie",
    lastName: "Brown",
    role: "user",
    status: "inactive",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockChartData = {
  revenue: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue",
        data: [12500, 15200, 18700, 22100, 19800, 25400],
        borderColor: "hsl(var(--chart-1))",
        backgroundColor: "hsl(var(--chart-1) / 0.1)",
      },
    ],
  },
  users: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "New Users",
        data: [45, 62, 58, 73, 81, 94],
        borderColor: "hsl(var(--chart-2))",
        backgroundColor: "hsl(var(--chart-2) / 0.1)",
      },
    ],
  },
  traffic: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Visitors",
        data: [1200, 1900, 1500, 2100, 1800, 2400, 2200],
        borderColor: "hsl(var(--chart-3))",
        backgroundColor: "hsl(var(--chart-3) / 0.1)",
      },
    ],
  },
};

export const mockActivities = [
  {
    id: "1",
    type: "user_registered",
    message: "New user registered: johndoe",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    type: "product_created",
    message: "New product added: Premium Headphones",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    type: "article_published",
    message: "Article published: Getting Started with React",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    type: "file_uploaded",
    message: "File uploaded: company-logo.png",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    type: "user_login",
    message: "User logged in: janesmith",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];
