import { z } from 'zod';

/**
 * Shopkeeper Form Validation Schema
 */
export const shopkeeperSchema = z.object({
  amAgencyId: z.string().optional(),
  amAgencyName: z.string().optional(),
  pmAgencyId: z.string().optional(),
  pmAgencyName: z.string().optional(),
  ownerName: z
    .string()
    .min(1, 'Owner name is required')
    .min(2, 'Owner name must be at least 2 characters')
    .max(100, 'Owner name must not exceed 100 characters'),
  shopName: z
    .string()
    .min(1, 'Shop name is required')
    .min(2, 'Shop name must be at least 2 characters')
    .max(255, 'Shop name must not exceed 255 characters'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  address: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional().or(z.literal('')),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z
      .string()
      .min(1, 'Pincode is required')
      .regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    country: z.string().optional().or(z.literal('')),
  }),
  area: z
    .string()
    .min(1, 'Area is required')
    .max(100, 'Area must not exceed 100 characters'),
  zone: z.string().max(50, 'Zone must not exceed 50 characters').optional().or(z.literal('')),
  routeId: z.string().optional(),
  openingBalance: z
    .number()
    .min(0, 'Opening balance cannot be negative')
    .optional()
    .default(0),
}).refine(
  (data) => data.amAgencyId || data.pmAgencyId,
  {
    message: 'At least one agency (AM or PM) must be selected',
    path: ['amAgencyId'],
  }
);

export type ShopkeeperFormData = z.infer<typeof shopkeeperSchema>;
