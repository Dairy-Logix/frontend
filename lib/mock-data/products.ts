import { Product, Category } from "@/lib/types";

export const mockCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    description: "Electronic devices and gadgets",
    icon: "Laptop",
    productsCount: 45,
    createdAt: new Date(2024, 0, 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Clothing",
    slug: "clothing",
    description: "Fashion and apparel",
    icon: "Shirt",
    productsCount: 89,
    createdAt: new Date(2024, 0, 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Books",
    slug: "books",
    description: "Books and publications",
    icon: "BookOpen",
    productsCount: 124,
    createdAt: new Date(2024, 0, 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Home & Garden",
    slug: "home-garden",
    description: "Home improvement and garden supplies",
    icon: "Home",
    productsCount: 67,
    createdAt: new Date(2024, 0, 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Sports",
    slug: "sports",
    description: "Sports equipment and gear",
    icon: "Dumbbell",
    productsCount: 52,
    createdAt: new Date(2024, 0, 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones Pro",
    description:
      "Premium wireless headphones with active noise cancellation and 30-hour battery life. Crystal clear sound quality with deep bass.",
    price: 299.99,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500",
    ],
    category: mockCategories[0],
    categoryId: "1",
    status: "published",
    stock: 45,
    sku: "WH-PRO-001",
    tags: [
      { id: "1", name: "Audio", slug: "audio", createdAt: "", updatedAt: "" },
      { id: "2", name: "Wireless", slug: "wireless", createdAt: "", updatedAt: "" },
    ],
    createdAt: new Date(2024, 0, 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Smart Watch Series X",
    description:
      "Advanced fitness tracking, heart rate monitor, GPS, and smartphone notifications. Water-resistant up to 50m.",
    price: 399.99,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500",
    ],
    category: mockCategories[0],
    categoryId: "1",
    status: "published",
    stock: 32,
    sku: "SW-SX-001",
    tags: [
      { id: "3", name: "Wearable", slug: "wearable", createdAt: "", updatedAt: "" },
      { id: "4", name: "Fitness", slug: "fitness", createdAt: "", updatedAt: "" },
    ],
    createdAt: new Date(2024, 1, 10).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "4K Ultra HD Camera",
    description:
      "Professional-grade camera with 4K video recording, image stabilization, and Wi-Fi connectivity. Perfect for content creators.",
    price: 1299.99,
    images: [
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
    ],
    category: mockCategories[0],
    categoryId: "1",
    status: "published",
    stock: 18,
    sku: "CAM-4K-001",
    tags: [
      { id: "5", name: "Photography", slug: "photography", createdAt: "", updatedAt: "" },
      { id: "6", name: "Professional", slug: "professional", createdAt: "", updatedAt: "" },
    ],
    createdAt: new Date(2024, 2, 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Premium Cotton T-Shirt",
    description:
      "Ultra-soft 100% organic cotton t-shirt. Available in multiple colors. Perfect for everyday wear.",
    price: 29.99,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    ],
    category: mockCategories[1],
    categoryId: "2",
    status: "published",
    stock: 156,
    sku: "TS-COT-001",
    tags: [
      { id: "7", name: "Casual", slug: "casual", createdAt: "", updatedAt: "" },
      { id: "8", name: "Organic", slug: "organic", createdAt: "", updatedAt: "" },
    ],
    createdAt: new Date(2024, 2, 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Designer Jeans",
    description:
      "Slim-fit designer jeans with premium denim fabric. Comfortable and stylish for any occasion.",
    price: 89.99,
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
    ],
    category: mockCategories[1],
    categoryId: "2",
    status: "published",
    stock: 78,
    sku: "JN-DES-001",
    tags: [
      { id: "7", name: "Casual", slug: "casual", createdAt: "", updatedAt: "" },
      { id: "9", name: "Denim", slug: "denim", createdAt: "", updatedAt: "" },
    ],
    createdAt: new Date(2024, 3, 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "The Art of Programming",
    description:
      "Comprehensive guide to modern programming practices. Covers algorithms, design patterns, and best practices.",
    price: 49.99,
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500",
    ],
    category: mockCategories[2],
    categoryId: "3",
    status: "published",
    stock: 234,
    sku: "BK-PROG-001",
    tags: [
      { id: "10", name: "Technology", slug: "technology", createdAt: "", updatedAt: "" },
      { id: "11", name: "Education", slug: "education", createdAt: "", updatedAt: "" },
    ],
    createdAt: new Date(2024, 4, 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Wireless Keyboard & Mouse",
    description:
      "Ergonomic wireless keyboard and mouse combo. Silent keys, long battery life, and comfortable design.",
    price: 79.99,
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
    ],
    category: mockCategories[0],
    categoryId: "1",
    status: "published",
    stock: 67,
    sku: "KM-WLS-001",
    tags: [
      { id: "2", name: "Wireless", slug: "wireless", createdAt: "", updatedAt: "" },
      { id: "12", name: "Accessories", slug: "accessories", createdAt: "", updatedAt: "" },
    ],
    createdAt: new Date(2024, 5, 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "LED Desk Lamp",
    description:
      "Modern LED desk lamp with adjustable brightness and color temperature. USB charging port included.",
    price: 45.99,
    images: [
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500",
    ],
    category: mockCategories[3],
    categoryId: "4",
    status: "published",
    stock: 92,
    sku: "LP-LED-001",
    tags: [
      { id: "13", name: "Lighting", slug: "lighting", createdAt: "", updatedAt: "" },
      { id: "14", name: "Office", slug: "office", createdAt: "", updatedAt: "" },
    ],
    createdAt: new Date(2024, 6, 18).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "9",
    name: "Yoga Mat Pro",
    description:
      "Extra thick yoga mat with superior grip and cushioning. Eco-friendly materials and carrying strap included.",
    price: 34.99,
    images: [
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500",
    ],
    category: mockCategories[4],
    categoryId: "5",
    status: "published",
    stock: 145,
    sku: "YG-MAT-001",
    tags: [
      { id: "4", name: "Fitness", slug: "fitness", createdAt: "", updatedAt: "" },
      { id: "15", name: "Yoga", slug: "yoga", createdAt: "", updatedAt: "" },
    ],
    createdAt: new Date(2024, 7, 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10",
    name: "Portable Bluetooth Speaker",
    description:
      "Compact waterproof speaker with 360-degree sound. 12-hour battery life and built-in microphone.",
    price: 59.99,
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
    ],
    category: mockCategories[0],
    categoryId: "1",
    status: "draft",
    stock: 0,
    sku: "SPK-BT-001",
    tags: [
      { id: "1", name: "Audio", slug: "audio", createdAt: "", updatedAt: "" },
      { id: "2", name: "Wireless", slug: "wireless", createdAt: "", updatedAt: "" },
    ],
    createdAt: new Date(2024, 8, 22).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Simulated API functions
export const getProductsPage = (
  page: number = 1,
  pageSize: number = 12,
  search: string = "",
  category?: string,
  status?: string,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) => {
  let filtered = [...mockProducts];

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower)
    );
  }

  // Apply category filter
  if (category && category !== "all") {
    filtered = filtered.filter((product) => product.categoryId === category);
  }

  // Apply status filter
  if (status && status !== "all") {
    filtered = filtered.filter((product) => product.status === status);
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aVal: any = a[sortBy as keyof Product];
    let bVal: any = b[sortBy as keyof Product];

    if (sortBy === "price") {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }

    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

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

export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find((product) => product.id === id);
};

export const createProduct = (product: Omit<Product, "id" | "createdAt" | "updatedAt">): Product => {
  const category = mockCategories.find(c => c.id === product.categoryId);
  const newProduct: Product = {
    ...product,
    category: category!,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockProducts.push(newProduct);
  return newProduct;
};

export const updateProduct = (id: string, updates: Partial<Product>): Product | undefined => {
  const index = mockProducts.findIndex((product) => product.id === id);
  if (index === -1) return undefined;

  mockProducts[index] = {
    ...mockProducts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return mockProducts[index];
};

export const deleteProduct = (id: string): boolean => {
  const index = mockProducts.findIndex((product) => product.id === id);
  if (index === -1) return false;

  mockProducts.splice(index, 1);
  return true;
};
