import { User } from "@/lib/types";

export const mockUsers: User[] = [
  {
    id: "1",
    email: "john.doe@example.com",
    username: "johndoe",
    firstName: "John",
    lastName: "Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    role: "admin",
    status: "active",
    createdAt: new Date(2024, 0, 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    email: "jane.smith@example.com",
    username: "janesmith",
    firstName: "Jane",
    lastName: "Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    role: "user",
    status: "active",
    createdAt: new Date(2024, 1, 10).toISOString(),
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
    createdAt: new Date(2024, 2, 5).toISOString(),
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
    createdAt: new Date(2024, 2, 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    email: "charlie.brown@example.com",
    username: "charlieb",
    firstName: "Charlie",
    lastName: "Brown",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
    role: "user",
    status: "inactive",
    createdAt: new Date(2024, 3, 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    email: "diana.prince@example.com",
    username: "dianaprince",
    firstName: "Diana",
    lastName: "Prince",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
    role: "admin",
    status: "active",
    createdAt: new Date(2024, 3, 25).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    email: "edward.norton@example.com",
    username: "ednorton",
    firstName: "Edward",
    lastName: "Norton",
    role: "user",
    status: "active",
    createdAt: new Date(2024, 4, 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    email: "fiona.gallagher@example.com",
    username: "fionag",
    firstName: "Fiona",
    lastName: "Gallagher",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona",
    role: "moderator",
    status: "active",
    createdAt: new Date(2024, 4, 18).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "9",
    email: "george.martin@example.com",
    username: "georgem",
    firstName: "George",
    lastName: "Martin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=George",
    role: "user",
    status: "suspended",
    createdAt: new Date(2024, 5, 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10",
    email: "hannah.montana@example.com",
    username: "hannahm",
    firstName: "Hannah",
    lastName: "Montana",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah",
    role: "user",
    status: "active",
    createdAt: new Date(2024, 5, 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "11",
    email: "isaac.newton@example.com",
    username: "isaacn",
    firstName: "Isaac",
    lastName: "Newton",
    role: "user",
    status: "active",
    createdAt: new Date(2024, 6, 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "12",
    email: "julia.roberts@example.com",
    username: "juliar",
    firstName: "Julia",
    lastName: "Roberts",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia",
    role: "user",
    status: "active",
    createdAt: new Date(2024, 6, 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "13",
    email: "kevin.hart@example.com",
    username: "kevinh",
    firstName: "Kevin",
    lastName: "Hart",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin",
    role: "moderator",
    status: "active",
    createdAt: new Date(2024, 7, 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "14",
    email: "laura.palmer@example.com",
    username: "laurap",
    firstName: "Laura",
    lastName: "Palmer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura",
    role: "user",
    status: "inactive",
    createdAt: new Date(2024, 7, 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "15",
    email: "michael.scott@example.com",
    username: "michaels",
    firstName: "Michael",
    lastName: "Scott",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    role: "admin",
    status: "active",
    createdAt: new Date(2024, 8, 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Simulated API functions
export const getUsersPage = (
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  role?: string,
  status?: string
) => {
  let filtered = [...mockUsers];

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower)
    );
  }

  // Apply role filter
  if (role && role !== "all") {
    filtered = filtered.filter((user) => user.role === role);
  }

  // Apply status filter
  if (status && status !== "all") {
    filtered = filtered.filter((user) => user.status === status);
  }

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

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find((user) => user.id === id);
};

export const createUser = (user: Omit<User, "id" | "createdAt" | "updatedAt">): User => {
  const newUser: User = {
    ...user,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockUsers.push(newUser);
  return newUser;
};

export const updateUser = (id: string, updates: Partial<User>): User | undefined => {
  const index = mockUsers.findIndex((user) => user.id === id);
  if (index === -1) return undefined;

  mockUsers[index] = {
    ...mockUsers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return mockUsers[index];
};

export const deleteUser = (id: string): boolean => {
  const index = mockUsers.findIndex((user) => user.id === id);
  if (index === -1) return false;

  mockUsers.splice(index, 1);
  return true;
};
