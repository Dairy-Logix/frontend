import { z } from 'zod';

/**
 * Product Form Validation Schema
 */
export const productSchema = z.object({
  productCode: z
    .string()
    .min(1, 'Product code is required')
    .max(50, 'Product code must not exceed 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Product code must contain only uppercase letters, numbers, and hyphens'),
  name: z
    .string()
    .min(1, 'Product name is required')
    .min(3, 'Product name must be at least 3 characters')
    .max(255, 'Product name must not exceed 255 characters'),
  shortName: z
    .string()
    .min(1, 'Short name is required')
    .max(100, 'Short name must not exceed 100 characters'),
  category: z.enum(['Crate', 'Piece'], {
    required_error: 'Category is required',
    invalid_type_error: 'Category must be either Crate or Piece',
  }),
  quantityPerUnit: z
    .number({
      required_error: 'Quantity per unit is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(1000, 'Quantity cannot exceed 1000'),
  purchasePricePerUnit: z
    .number({
      required_error: 'Purchase price is required',
      invalid_type_error: 'Price must be a number',
    })
    .positive('Purchase price must be greater than 0')
    .max(100000, 'Purchase price cannot exceed 100,000'),
  sellingPricePerUnit: z
    .number({
      required_error: 'Selling price is required',
      invalid_type_error: 'Price must be a number',
    })
    .positive('Selling price must be greater than 0')
    .max(100000, 'Selling price cannot exceed 100,000'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => data.sellingPricePerUnit >= data.purchasePricePerUnit,
  {
    message: 'Selling price must be greater than or equal to purchase price',
    path: ['sellingPricePerUnit'],
  }
);

export type ProductFormData = z.infer<typeof productSchema>;
