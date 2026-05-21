// ============================================================
// BeatMitra - React Query Hooks Barrel Exports
// ============================================================

// Authentication hooks
export {
  useLogin,
  useRegister,
  useLogout,
  useCurrentUser,
  useRefreshToken,
  authKeys,
} from './use-auth';

// Product hooks
export {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  productKeys,
} from './use-products';

// Agency hooks
export {
  useAgencies,
  useAgency,
  useCreateAgency,
  useUpdateAgency,
  useDeleteAgency,
  useToggleAcceptingOrders,
  agencyKeys,
} from './use-agencies';

// Tenant hooks
export * from './use-tenants';

// User hooks
export * from './use-users';

// Order hooks
export * from './use-orders';

// Shopkeeper hooks
export * from './use-shopkeepers';

// Employee hooks
export * from './use-employees';

// Invoice hooks
export * from './use-invoices';

// Payment hooks
export * from './use-payments';

// Delivery hooks
export * from './use-deliveries';

// Purchase hooks
export * from './use-purchases';

// Report hooks
export * from './use-reports';

// Settings hooks
export * from './use-settings';

// Notification hooks
export * from './use-notifications';

// Dashboard hooks
export * from './use-dashboard';

// Planning Studio hooks
export * from './use-planning-studio';

// Feature flag hooks
export * from './use-feature';

// Re-export all query key factories for easy access
export { orderKeys } from './use-orders';
export { tenantKeys } from './use-tenants';
export { userKeys } from './use-users';
export { shopkeeperKeys } from './use-shopkeepers';
export { employeeKeys } from './use-employees';
export { invoiceKeys } from './use-invoices';
export { paymentKeys } from './use-payments';
export { deliveryKeys } from './use-deliveries';
export { purchaseKeys } from './use-purchases';
export { reportKeys } from './use-reports';
export { settingsKeys } from './use-settings';
export { notificationKeys } from './use-notifications';
export { dashboardKeys } from './use-dashboard';
export { planningStudioKeys } from './use-planning-studio';
