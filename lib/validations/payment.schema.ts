import { z } from 'zod';

/**
 * Payment Form Validation Schema
 */
export const paymentSchema = z.object({
  agencyId: z.string().min(1, 'Agency is required'),
  shopId: z.string().min(1, 'Shop is required'),
  invoiceId: z.string().optional(),
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .max(10000000, 'Amount cannot exceed 1 crore'),
  paymentType: z.enum(['online', 'offline'], {
    required_error: 'Payment type is required',
    invalid_type_error: 'Invalid payment type',
  }),
  referenceNumber: z
    .string()
    .max(100, 'Reference number must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  transactionId: z
    .string()
    .max(100, 'Transaction ID must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
