// Common Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'user' | 'moderator';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface CreateUserInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: Category;
  categoryId: string;
  status: ProductStatus;
  stock: number;
  sku: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  stock: number;
  sku: string;
  images?: File[];
  tags?: string[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  status?: ProductStatus;
  stock?: number;
  sku?: string;
  images?: File[];
  tags?: string[];
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  productsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
}

// Article Types
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: User;
  authorId: string;
  status: ArticleStatus;
  tags: Tag[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface CreateArticleInput {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: File;
  tags?: string[];
  status?: ArticleStatus;
}

export interface UpdateArticleInput {
  title?: string;
  content?: string;
  excerpt?: string;
  coverImage?: File;
  tags?: string[];
  status?: ArticleStatus;
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagInput {
  name: string;
  color?: string;
}

// File Types
export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  folder?: string;
  uploadedBy: User;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadFileInput {
  file: File;
  folder?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  data?: Record<string, any>;
  createdAt: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalArticles: number;
  totalFiles: number;
  usersGrowth: number;
  productsGrowth: number;
  articlesGrowth: number;
  filesGrowth: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

// Filter Types
export interface FilterOption {
  label: string;
  value: string;
}

export interface ActiveFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: any;
}

// Table Types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (sortBy: string) => void;
  };
  selection?: {
    selectedRows: Set<string>;
    onSelectionChange: (selectedRows: Set<string>) => void;
  };
  actions?: {
    view?: (row: T) => void;
    edit?: (row: T) => void;
    delete?: (row: T) => void;
  };
}
