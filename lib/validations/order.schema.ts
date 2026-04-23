import { z } from 'zod';

/**
 * Order Item Schema
 */
const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(10000, 'Quantity cannot exceed 10,000'),
});

/**
 * Order Form Validation Schema
 */
export const orderSchema = z.object({
  agencyId: z.string().min(1, 'Agency is required'),
  shopId: z.string().min(1, 'Shop is required'),
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one product is required')
    .max(50, 'Cannot add more than 50 products'),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

export type OrderFormData = z.infer<typeof orderSchema>;
export type OrderItemFormData = z.infer<typeof orderItemSchema>;
