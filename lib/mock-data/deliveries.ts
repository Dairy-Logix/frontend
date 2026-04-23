import type { Delivery, DeliveryTracking } from '@/lib/types';

// ============================================================
// Mock Deliveries for Tenant "Shree Krishna Dairy" (tenant-1)
// ============================================================
// References:
//   Orders: order-1 to order-20 (from orders.ts)
//   Employees: emp-1 to emp-10 (from employees.ts)
//   Shops: shop-1 to shop-15 (from shopkeepers.ts)
//   Agencies: agency-1 to agency-3 (from agencies.ts)
// ============================================================

export const mockDeliveries: Delivery[] = [
  // --- Delivery 1: Delivered (Ahmedabad) ---
  {
    id: 'delivery-1',
    tenantId: 'tenant-1',
    agencyId: 'agency-1',
    orderId: 'order-1',
    employeeId: 'emp-1',
    status: 'delivered',
    scheduledDate: '2026-02-03T06:00:00.000Z',
    deliveredAt: '2026-02-03T09:45:00.000Z',
    photoProof: '/uploads/proof/delivery-1.jpg',
    trackingHistory: [
      {
        id: 'track-1-1',
        deliveryId: 'delivery-1',
        latitude: 23.0225,
        longitude: 72.5714,
        timestamp: '2026-02-03T06:30:00.000Z',
        status: 'dispatched',
        notes: 'Left warehouse with goods',
      },
      {
        id: 'track-1-2',
        deliveryId: 'delivery-1',
        latitude: 23.0128,
        longitude: 72.5635,
        timestamp: '2026-02-03T07:15:00.000Z',
        status: 'in_transit',
        notes: 'Crossed Maninagar bridge',
      },
      {
        id: 'track-1-3',
        deliveryId: 'delivery-1',
        latitude: 23.0045,
        longitude: 72.5560,
        timestamp: '2026-02-03T08:30:00.000Z',
        status: 'in_transit',
        notes: 'Delivered to first shop, heading to second',
      },
      {
        id: 'track-1-4',
        deliveryId: 'delivery-1',
        latitude: 22.9980,
        longitude: 72.5490,
        timestamp: '2026-02-03T09:45:00.000Z',
        status: 'delivered',
        notes: 'All deliveries completed',
      },
    ],
    routeShops: [
      { shopId: 'shop-1', sequence: 1 },
      { shopId: 'shop-2', sequence: 2 },
      { shopId: 'shop-3', sequence: 3 },
    ],
    createdAt: '2026-02-02T18:00:00.000Z',
    updatedAt: '2026-02-03T09:45:00.000Z',
  },

  // --- Delivery 2: Delivered (Rajkot) ---
  {
    id: 'delivery-2',
    tenantId: 'tenant-1',
    agencyId: 'agency-2',
    orderId: 'order-5',
    employeeId: 'emp-4',
    status: 'delivered',
    scheduledDate: '2026-02-04T06:00:00.000Z',
    deliveredAt: '2026-02-04T10:20:00.000Z',
    photoProof: '/uploads/proof/delivery-2.jpg',
    trackingHistory: [
      {
        id: 'track-2-1',
        deliveryId: 'delivery-2',
        latitude: 22.3039,
        longitude: 70.8022,
        timestamp: '2026-02-04T06:15:00.000Z',
        status: 'dispatched',
        notes: 'Departed from Rajkot warehouse',
      },
      {
        id: 'track-2-2',
        deliveryId: 'delivery-2',
        latitude: 22.2950,
        longitude: 70.7935,
        timestamp: '2026-02-04T07:30:00.000Z',
        status: 'in_transit',
        notes: 'On Kalawad Road approaching first stop',
      },
      {
        id: 'track-2-3',
        deliveryId: 'delivery-2',
        latitude: 22.2870,
        longitude: 70.7860,
        timestamp: '2026-02-04T10:20:00.000Z',
        status: 'delivered',
        notes: 'Delivery completed at all stops',
      },
    ],
    routeShops: [
      { shopId: 'shop-7', sequence: 1 },
      { shopId: 'shop-8', sequence: 2 },
    ],
    createdAt: '2026-02-03T17:00:00.000Z',
    updatedAt: '2026-02-04T10:20:00.000Z',
  },

  // --- Delivery 3: Delivered (Surat) ---
  {
    id: 'delivery-3',
    tenantId: 'tenant-1',
    agencyId: 'agency-3',
    orderId: 'order-7',
    employeeId: 'emp-7',
    status: 'delivered',
    scheduledDate: '2026-02-05T06:00:00.000Z',
    deliveredAt: '2026-02-05T10:00:00.000Z',
    trackingHistory: [
      {
        id: 'track-3-1',
        deliveryId: 'delivery-3',
        latitude: 21.1702,
        longitude: 72.8311,
        timestamp: '2026-02-05T06:20:00.000Z',
        status: 'dispatched',
        notes: 'Started route from Surat depot',
      },
      {
        id: 'track-3-2',
        deliveryId: 'delivery-3',
        latitude: 21.1780,
        longitude: 72.8215,
        timestamp: '2026-02-05T08:00:00.000Z',
        status: 'in_transit',
        notes: 'Completed first delivery at Varachha',
      },
      {
        id: 'track-3-3',
        deliveryId: 'delivery-3',
        latitude: 21.1850,
        longitude: 72.8130,
        timestamp: '2026-02-05T10:00:00.000Z',
        status: 'delivered',
        notes: 'All items delivered successfully',
      },
    ],
    routeShops: [
      { shopId: 'shop-12', sequence: 1 },
      { shopId: 'shop-13', sequence: 2 },
      { shopId: 'shop-14', sequence: 3 },
    ],
    createdAt: '2026-02-04T18:00:00.000Z',
    updatedAt: '2026-02-05T10:00:00.000Z',
  },

  // --- Delivery 4: Delivered (Ahmedabad) ---
  {
    id: 'delivery-4',
    tenantId: 'tenant-1',
    agencyId: 'agency-1',
    orderId: 'order-19',
    employeeId: 'emp-2',
    status: 'delivered',
    scheduledDate: '2026-02-06T06:00:00.000Z',
    deliveredAt: '2026-02-06T10:30:00.000Z',
    photoProof: '/uploads/proof/delivery-4.jpg',
    trackingHistory: [
      {
        id: 'track-4-1',
        deliveryId: 'delivery-4',
        latitude: 23.0225,
        longitude: 72.5714,
        timestamp: '2026-02-06T06:15:00.000Z',
        status: 'dispatched',
        notes: 'Goods loaded, heading to Navrangpura',
      },
      {
        id: 'track-4-2',
        deliveryId: 'delivery-4',
        latitude: 23.0350,
        longitude: 72.5600,
        timestamp: '2026-02-06T07:45:00.000Z',
        status: 'in_transit',
        notes: 'Delivered to Mehta Dairy Fresh',
      },
      {
        id: 'track-4-3',
        deliveryId: 'delivery-4',
        latitude: 23.0290,
        longitude: 72.5530,
        timestamp: '2026-02-06T10:30:00.000Z',
        status: 'delivered',
        notes: 'Completed. Photo proof uploaded.',
      },
    ],
    routeShops: [
      { shopId: 'shop-4', sequence: 1 },
      { shopId: 'shop-2', sequence: 2 },
    ],
    createdAt: '2026-02-05T17:30:00.000Z',
    updatedAt: '2026-02-06T10:30:00.000Z',
  },

  // --- Delivery 5: Failed (Rajkot) ---
  {
    id: 'delivery-5',
    tenantId: 'tenant-1',
    agencyId: 'agency-2',
    orderId: 'order-6',
    employeeId: 'emp-5',
    status: 'failed',
    scheduledDate: '2026-02-07T06:00:00.000Z',
    trackingHistory: [
      {
        id: 'track-5-1',
        deliveryId: 'delivery-5',
        latitude: 22.3039,
        longitude: 70.8022,
        timestamp: '2026-02-07T06:30:00.000Z',
        status: 'dispatched',
        notes: 'Departed from warehouse',
      },
      {
        id: 'track-5-2',
        deliveryId: 'delivery-5',
        latitude: 22.2980,
        longitude: 70.7970,
        timestamp: '2026-02-07T07:45:00.000Z',
        status: 'in_transit',
        notes: 'En route to University Road',
      },
      {
        id: 'track-5-3',
        deliveryId: 'delivery-5',
        latitude: 22.2950,
        longitude: 70.7935,
        timestamp: '2026-02-07T08:30:00.000Z',
        status: 'failed',
        notes: 'Shop closed. Owner not available. Returning to warehouse.',
      },
    ],
    routeShops: [
      { shopId: 'shop-8', sequence: 1 },
      { shopId: 'shop-9', sequence: 2 },
    ],
    notes: 'Failed: Shop-8 was closed, shop-9 owner refused due to quality complaint.',
    createdAt: '2026-02-06T18:00:00.000Z',
    updatedAt: '2026-02-07T08:30:00.000Z',
  },

  // --- Delivery 6: Dispatched (Ahmedabad) ---
  {
    id: 'delivery-6',
    tenantId: 'tenant-1',
    agencyId: 'agency-1',
    orderId: 'order-9',
    employeeId: 'emp-2',
    status: 'dispatched',
    scheduledDate: '2026-02-10T06:00:00.000Z',
    trackingHistory: [
      {
        id: 'track-6-1',
        deliveryId: 'delivery-6',
        latitude: 23.0225,
        longitude: 72.5714,
        timestamp: '2026-02-10T06:20:00.000Z',
        status: 'dispatched',
        notes: 'Vehicle loaded. Starting morning route.',
      },
    ],
    routeShops: [
      { shopId: 'shop-3', sequence: 1 },
      { shopId: 'shop-5', sequence: 2 },
      { shopId: 'shop-1', sequence: 3 },
    ],
    createdAt: '2026-02-09T18:00:00.000Z',
    updatedAt: '2026-02-10T06:20:00.000Z',
  },

  // --- Delivery 7: Dispatched (Rajkot) ---
  {
    id: 'delivery-7',
    tenantId: 'tenant-1',
    agencyId: 'agency-2',
    orderId: 'order-10',
    employeeId: 'emp-4',
    status: 'dispatched',
    scheduledDate: '2026-02-10T06:00:00.000Z',
    trackingHistory: [
      {
        id: 'track-7-1',
        deliveryId: 'delivery-7',
        latitude: 22.3039,
        longitude: 70.8022,
        timestamp: '2026-02-10T06:10:00.000Z',
        status: 'dispatched',
        notes: 'Left Rajkot depot for morning deliveries',
      },
    ],
    routeShops: [
      { shopId: 'shop-9', sequence: 1 },
      { shopId: 'shop-10', sequence: 2 },
    ],
    createdAt: '2026-02-09T17:00:00.000Z',
    updatedAt: '2026-02-10T06:10:00.000Z',
  },

  // --- Delivery 8: Dispatched (Surat) ---
  {
    id: 'delivery-8',
    tenantId: 'tenant-1',
    agencyId: 'agency-3',
    orderId: 'order-8',
    employeeId: 'emp-8',
    status: 'dispatched',
    scheduledDate: '2026-02-10T06:00:00.000Z',
    trackingHistory: [
      {
        id: 'track-8-1',
        deliveryId: 'delivery-8',
        latitude: 21.1702,
        longitude: 72.8311,
        timestamp: '2026-02-10T06:25:00.000Z',
        status: 'dispatched',
        notes: 'Departed Surat depot. Heavy traffic expected on Ring Road.',
      },
    ],
    routeShops: [
      { shopId: 'shop-14', sequence: 1 },
      { shopId: 'shop-15', sequence: 2 },
      { shopId: 'shop-12', sequence: 3 },
    ],
    createdAt: '2026-02-09T18:30:00.000Z',
    updatedAt: '2026-02-10T06:25:00.000Z',
  },

  // --- Delivery 9: In Transit (Ahmedabad) ---
  {
    id: 'delivery-9',
    tenantId: 'tenant-1',
    agencyId: 'agency-1',
    orderId: 'order-17',
    employeeId: 'emp-1',
    status: 'in_transit',
    scheduledDate: '2026-02-10T06:00:00.000Z',
    trackingHistory: [
      {
        id: 'track-9-1',
        deliveryId: 'delivery-9',
        latitude: 23.0225,
        longitude: 72.5714,
        timestamp: '2026-02-10T05:50:00.000Z',
        status: 'dispatched',
        notes: 'Early departure for CG Road route',
      },
      {
        id: 'track-9-2',
        deliveryId: 'delivery-9',
        latitude: 23.0310,
        longitude: 72.5620,
        timestamp: '2026-02-10T06:40:00.000Z',
        status: 'in_transit',
        notes: 'First delivery completed at Vora Super Bazaar',
      },
      {
        id: 'track-9-3',
        deliveryId: 'delivery-9',
        latitude: 23.0370,
        longitude: 72.5550,
        timestamp: '2026-02-10T07:20:00.000Z',
        status: 'in_transit',
        notes: 'Heading to Satellite Road for last stop',
      },
    ],
    routeShops: [
      { shopId: 'shop-5', sequence: 1 },
      { shopId: 'shop-6', sequence: 2 },
      { shopId: 'shop-4', sequence: 3 },
    ],
    createdAt: '2026-02-09T17:00:00.000Z',
    updatedAt: '2026-02-10T07:20:00.000Z',
  },

  // --- Delivery 10: In Transit (Surat) ---
  {
    id: 'delivery-10',
    tenantId: 'tenant-1',
    agencyId: 'agency-3',
    orderId: 'order-16',
    employeeId: 'emp-7',
    status: 'in_transit',
    scheduledDate: '2026-02-10T06:00:00.000Z',
    trackingHistory: [
      {
        id: 'track-10-1',
        deliveryId: 'delivery-10',
        latitude: 21.1702,
        longitude: 72.8311,
        timestamp: '2026-02-10T06:00:00.000Z',
        status: 'dispatched',
        notes: 'Route started from Surat depot',
      },
      {
        id: 'track-10-2',
        deliveryId: 'delivery-10',
        latitude: 21.1820,
        longitude: 72.8190,
        timestamp: '2026-02-10T07:00:00.000Z',
        status: 'in_transit',
        notes: 'Delivered at Naik Superstore, moving to Varachha',
      },
    ],
    routeShops: [
      { shopId: 'shop-15', sequence: 1 },
      { shopId: 'shop-12', sequence: 2 },
      { shopId: 'shop-13', sequence: 3 },
    ],
    createdAt: '2026-02-09T18:00:00.000Z',
    updatedAt: '2026-02-10T07:00:00.000Z',
  },

  // --- Delivery 11: Pending (Ahmedabad) ---
  {
    id: 'delivery-11',
    tenantId: 'tenant-1',
    agencyId: 'agency-1',
    orderId: 'order-11',
    employeeId: 'emp-9',
    status: 'pending',
    scheduledDate: '2026-02-10T06:00:00.000Z',
    trackingHistory: [],
    routeShops: [
      { shopId: 'shop-1', sequence: 1 },
      { shopId: 'shop-4', sequence: 2 },
    ],
    notes: 'Morning delivery batch - pending vehicle assignment',
    createdAt: '2026-02-09T20:00:00.000Z',
    updatedAt: '2026-02-09T20:00:00.000Z',
  },

  // --- Delivery 12: Pending (Rajkot) ---
  {
    id: 'delivery-12',
    tenantId: 'tenant-1',
    agencyId: 'agency-2',
    orderId: 'order-12',
    employeeId: 'emp-5',
    status: 'pending',
    scheduledDate: '2026-02-11T06:00:00.000Z',
    trackingHistory: [],
    routeShops: [
      { shopId: 'shop-10', sequence: 1 },
      { shopId: 'shop-11', sequence: 2 },
      { shopId: 'shop-7', sequence: 3 },
    ],
    createdAt: '2026-02-10T05:00:00.000Z',
    updatedAt: '2026-02-10T05:00:00.000Z',
  },

  // --- Delivery 13: Pending (Surat) ---
  {
    id: 'delivery-13',
    tenantId: 'tenant-1',
    agencyId: 'agency-3',
    orderId: 'order-14',
    employeeId: 'emp-8',
    status: 'pending',
    scheduledDate: '2026-02-11T06:00:00.000Z',
    trackingHistory: [],
    routeShops: [
      { shopId: 'shop-13', sequence: 1 },
      { shopId: 'shop-14', sequence: 2 },
    ],
    notes: 'Schedule for tomorrow morning',
    createdAt: '2026-02-10T06:30:00.000Z',
    updatedAt: '2026-02-10T06:30:00.000Z',
  },
];
