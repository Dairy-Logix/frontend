import { Article, ArticleStatus, Tag } from "@/lib/types";

// Mock Tags
export const mockTags: Tag[] = [
  {
    id: "1",
    name: "Technology",
    slug: "technology",
    color: "#3b82f6",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Development",
    slug: "development",
    color: "#10b981",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Design",
    slug: "design",
    color: "#f59e0b",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Tutorial",
    slug: "tutorial",
    color: "#8b5cf6",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "News",
    slug: "news",
    color: "#ef4444",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock Articles
export const mockArticles: Article[] = [
  {
    id: "1",
    title: "Getting Started with Next.js 15",
    slug: "getting-started-with-nextjs-15",
    content: "Next.js 15 brings amazing new features including improved performance, better developer experience, and enhanced server components...",
    excerpt: "Learn about the latest features in Next.js 15 and how to get started with your first project.",
    coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
    author: {
      id: "1",
      email: "admin@example.com",
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    authorId: "1",
    status: "published",
    tags: [mockTags[0], mockTags[1]],
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    title: "Building Beautiful UIs with Tailwind CSS",
    slug: "building-beautiful-uis-with-tailwind-css",
    content: "Tailwind CSS is a utility-first CSS framework that makes it easy to build beautiful and responsive user interfaces...",
    excerpt: "Discover how to create stunning user interfaces using Tailwind CSS utility classes.",
    coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    author: {
      id: "2",
      email: "john.doe@example.com",
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      role: "user",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    authorId: "2",
    status: "published",
    tags: [mockTags[2], mockTags[3]],
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "Mastering TypeScript for React Applications",
    slug: "mastering-typescript-for-react-applications",
    content: "TypeScript adds static typing to JavaScript, making your React applications more robust and maintainable...",
    excerpt: "Learn how to leverage TypeScript to build type-safe React applications.",
    coverImage: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800",
    author: {
      id: "1",
      email: "admin@example.com",
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    authorId: "1",
    status: "published",
    tags: [mockTags[0], mockTags[1], mockTags[3]],
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    title: "Modern API Development with NestJS",
    slug: "modern-api-development-with-nestjs",
    content: "NestJS is a progressive Node.js framework for building efficient and scalable server-side applications...",
    excerpt: "Explore NestJS features and learn how to build production-ready APIs.",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    author: {
      id: "2",
      email: "john.doe@example.com",
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      role: "user",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    authorId: "2",
    status: "published",
    tags: [mockTags[0], mockTags[1]],
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    title: "Docker Best Practices for Developers",
    slug: "docker-best-practices-for-developers",
    content: "Docker containers have revolutionized how we build, ship, and run applications. Learn the best practices...",
    excerpt: "Essential Docker tips and tricks for development and production environments.",
    coverImage: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800",
    author: {
      id: "1",
      email: "admin@example.com",
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    authorId: "1",
    status: "draft",
    tags: [mockTags[0], mockTags[3]],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "6",
    title: "State Management in React: A Complete Guide",
    slug: "state-management-in-react-complete-guide",
    content: "Managing state in React applications can be challenging. This guide covers all major state management solutions...",
    excerpt: "Compare different state management approaches and choose the right one for your project.",
    coverImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
    author: {
      id: "2",
      email: "john.doe@example.com",
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      role: "user",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    authorId: "2",
    status: "published",
    tags: [mockTags[0], mockTags[1], mockTags[3]],
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock API Functions
let articles = [...mockArticles];

export const getArticlesPage = (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  status?: ArticleStatus,
  tag?: string
) => {
  let filtered = [...articles];

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (article) =>
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt?.toLowerCase().includes(searchLower) ||
        article.author.username.toLowerCase().includes(searchLower)
    );
  }

  // Status filter
  if (status) {
    filtered = filtered.filter((article) => article.status === status);
  }

  // Tag filter
  if (tag) {
    filtered = filtered.filter((article) =>
      article.tags.some((t) => t.slug === tag)
    );
  }

  // Sort by updated date (newest first)
  filtered.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = filtered.slice(start, end);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  };
};

export const getArticleById = (id: string) => {
  return articles.find((article) => article.id === id);
};

export const createArticle = (input: Partial<Article>) => {
  const newArticle: Article = {
    id: String(articles.length + 1),
    title: input.title || "",
    slug: input.slug || input.title?.toLowerCase().replace(/\s+/g, "-") || "",
    content: input.content || "",
    excerpt: input.excerpt,
    coverImage: input.coverImage,
    author: mockArticles[0].author,
    authorId: "1",
    status: input.status || "draft",
    tags: input.tags || [],
    publishedAt: input.status === "published" ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  articles.push(newArticle);
  return newArticle;
};

export const updateArticle = (id: string, input: Partial<Article>) => {
  const index = articles.findIndex((article) => article.id === id);
  if (index === -1) return null;

  articles[index] = {
    ...articles[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  return articles[index];
};

export const deleteArticle = (id: string) => {
  const index = articles.findIndex((article) => article.id === id);
  if (index === -1) return false;
  articles.splice(index, 1);
  return true;
};

export const deleteArticles = (ids: string[]) => {
  articles = articles.filter((article) => !ids.includes(article.id));
  return true;
};
