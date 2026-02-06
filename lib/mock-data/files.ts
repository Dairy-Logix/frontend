import { FileItem } from "@/lib/types";

// Mock Files
export const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "project-proposal-2024.pdf",
    originalName: "Project Proposal 2024.pdf",
    mimeType: "application/pdf",
    size: 2458624, // 2.4 MB
    path: "/uploads/documents/project-proposal-2024.pdf",
    url: "https://example.com/uploads/documents/project-proposal-2024.pdf",
    folder: "documents",
    uploadedBy: {
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
    uploadedById: "1",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "team-photo.jpg",
    originalName: "Team Photo.jpg",
    mimeType: "image/jpeg",
    size: 1536789, // 1.5 MB
    path: "/uploads/images/team-photo.jpg",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
    folder: "images",
    uploadedBy: {
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
    uploadedById: "2",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "financial-report-q1.xlsx",
    originalName: "Financial Report Q1.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 456789, // 445 KB
    path: "/uploads/documents/financial-report-q1.xlsx",
    url: "https://example.com/uploads/documents/financial-report-q1.xlsx",
    folder: "documents",
    uploadedBy: {
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
    uploadedById: "1",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "logo-design.png",
    originalName: "Logo Design.png",
    mimeType: "image/png",
    size: 234567, // 229 KB
    path: "/uploads/images/logo-design.png",
    url: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=800",
    folder: "images",
    uploadedBy: {
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
    uploadedById: "2",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    name: "meeting-notes.docx",
    originalName: "Meeting Notes.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 89456, // 87 KB
    path: "/uploads/documents/meeting-notes.docx",
    url: "https://example.com/uploads/documents/meeting-notes.docx",
    folder: "documents",
    uploadedBy: {
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
    uploadedById: "1",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "6",
    name: "product-demo.mp4",
    originalName: "Product Demo.mp4",
    mimeType: "video/mp4",
    size: 15678901, // 15 MB
    path: "/uploads/videos/product-demo.mp4",
    url: "https://example.com/uploads/videos/product-demo.mp4",
    folder: "videos",
    uploadedBy: {
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
    uploadedById: "2",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "7",
    name: "banner-image.jpg",
    originalName: "Banner Image.jpg",
    mimeType: "image/jpeg",
    size: 987654, // 964 KB
    path: "/uploads/images/banner-image.jpg",
    url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
    folder: "images",
    uploadedBy: {
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
    uploadedById: "1",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "8",
    name: "contract-template.pdf",
    originalName: "Contract Template.pdf",
    mimeType: "application/pdf",
    size: 678901, // 663 KB
    path: "/uploads/documents/contract-template.pdf",
    url: "https://example.com/uploads/documents/contract-template.pdf",
    folder: "documents",
    uploadedBy: {
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
    uploadedById: "2",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock API Functions
let files = [...mockFiles];

export const getFilesPage = (
  page: number = 1,
  pageSize: number = 12,
  search?: string,
  folder?: string,
  mimeType?: string
) => {
  let filtered = [...files];

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (file) =>
        file.originalName.toLowerCase().includes(searchLower) ||
        file.name.toLowerCase().includes(searchLower)
    );
  }

  // Folder filter
  if (folder) {
    filtered = filtered.filter((file) => file.folder === folder);
  }

  // MIME type filter
  if (mimeType) {
    filtered = filtered.filter((file) => file.mimeType.startsWith(mimeType));
  }

  // Sort by updated date (newest first)
  filtered.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

export const getFileById = (id: string) => {
  return files.find((file) => file.id === id);
};

export const uploadFile = (input: Partial<FileItem>) => {
  const newFile: FileItem = {
    id: String(files.length + 1),
    name: input.name || "",
    originalName: input.originalName || input.name || "",
    mimeType: input.mimeType || "application/octet-stream",
    size: input.size || 0,
    path: input.path || "",
    url: input.url || "",
    folder: input.folder,
    uploadedBy: mockFiles[0].uploadedBy,
    uploadedById: "1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  files.push(newFile);
  return newFile;
};

export const deleteFile = (id: string) => {
  const index = files.findIndex((file) => file.id === id);
  if (index === -1) return false;
  files.splice(index, 1);
  return true;
};

export const deleteFiles = (ids: string[]) => {
  files = files.filter((file) => !ids.includes(file.id));
  return true;
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

// Helper function to get file icon based on MIME type
export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎥";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📊";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "🗜️";
  return "📁";
};
