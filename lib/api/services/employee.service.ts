import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Employee,
  EmployeeAssignment,
  AgencyAssignment,
  DeliveryAssignment,
  ShopShiftEntry,
  CollectorAssignment,
  CollectionsTodayStats,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from '@/lib/types';

// Normalize backend employee document to frontend Employee type
// Backend uses: _id, status (enum), no assignedShopCount
// Frontend uses: id, isActive (boolean), assignedShopCount
function normalizeEmployee(raw: any): Employee {
  return {
    id: raw._id || raw.id,
    tenantId: raw.tenantId || '',
    userId: raw.userId || raw._id || raw.id || '',
    name: raw.name || '',
    phone: raw.phone || '',
    email: raw.email || undefined,
    employeeRole: raw.employeeRole || 'collector',
    assignedShopCount: raw.assignedShopCount ?? 0,
    agencyIds: (raw.agencyIds || []).map((id: any) => String(id)),
    collectorAgencyIds: (raw.collectorAgencyIds || []).map((id: any) => String(id)),
    assignedDeliveryShopCount: raw.assignedDeliveryShopCount ?? 0,
    isActive: raw.isActive ?? (raw.status === 'active'),
    photoUrl: raw.photoUrl ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// The assignment endpoints return { agencyIds, shops }. The UI only needs the
// set of assigned shop ids (it already has full shop objects loaded), so
// collapse shops → shopIds here. Shared by the delivery and collector flows.
function normalizeAgencyAssignment(raw: any): AgencyAssignment {
  const shopShifts: Record<string, Array<'AM' | 'PM'>> = {};
  for (const s of raw?.shops || []) {
    if (Array.isArray(s.deliveryShifts)) shopShifts[String(s._id || s.id)] = s.deliveryShifts;
  }
  return {
    agencyIds: (raw?.agencyIds || []).map((id: any) => String(id)),
    shopIds: (raw?.shops || []).map((s: any) => String(s._id || s.id)),
    shopShifts,
    skipped: typeof raw?.skipped === 'number' ? raw.skipped : undefined,
    heldByOthers: Array.isArray(raw?.heldByOthers)
      ? raw.heldByOthers.map((h: any) => ({
          shopId: String(h.shopId),
          shift: h.shift,
          agencyId: String(h.agencyId),
          employeeId: String(h.employeeId),
          employeeName: String(h.employeeName ?? 'another driver'),
        }))
      : [],
  };
}

// Map frontend query params to backend query params
function toBackendParams(params?: any): any {
  if (!params) return undefined;
  const { pageSize, isActive, employeeRole, ...rest } = params;
  const mapped: any = { ...rest };
  if (pageSize !== undefined) mapped.limit = pageSize;
  if (employeeRole) mapped.role = employeeRole;
  if (isActive === true) mapped.status = 'active';
  else if (isActive === false) mapped.status = 'inactive';
  return mapped;
}

export const employeeService = {
  async getEmployees(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Employee>>> {
    const { data } = await apiClient.get<{ employees: any[]; pagination: any }>(
      '/employees',
      { params: toBackendParams(params) }
    );
    const pag = data.pagination || {};
    return {
      success: true,
      data: {
        data: (data.employees || []).map(normalizeEmployee),
        total: pag.total ?? 0,
        page: pag.page ?? 1,
        pageSize: pag.pageSize ?? pag.limit ?? 10,
        totalPages: pag.totalPages ?? 1,
      },
      message: 'Employees fetched successfully',
    };
  },

  async getEmployeeById(id: string): Promise<ApiResponse<Employee>> {
    const { data } = await apiClient.get<any>(`/employees/${id}`);
    return {
      success: true,
      data: normalizeEmployee(data),
      message: 'Employee fetched successfully',
    };
  },

  async createEmployee(input: CreateEmployeeInput): Promise<ApiResponse<Employee>> {
    const { data } = await apiClient.post<any>('/employees', input);
    return {
      success: true,
      data: normalizeEmployee(data),
      message: 'Employee created successfully',
    };
  },

  async updateEmployee(id: string, input: UpdateEmployeeInput): Promise<ApiResponse<Employee>> {
    const { data } = await apiClient.patch<any>(
      `/employees/${id}`,
      input
    );
    return {
      success: true,
      data: normalizeEmployee(data),
      message: 'Employee updated successfully',
    };
  },

  async updateEmployeeStatus(
    id: string,
    isActive: boolean,
  ): Promise<ApiResponse<Employee>> {
    const status = isActive ? 'active' : 'inactive';
    const { data } = await apiClient.patch<any>(
      `/employees/${id}/status`,
      { status },
    );
    return {
      success: true,
      data: normalizeEmployee(data),
      message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  },

  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    await apiClient.delete(`/employees/${id}`);
    return {
      success: true,
      message: 'Employee deleted successfully',
    };
  },

  async getEmployeeAssignments(
    id: string
  ): Promise<ApiResponse<EmployeeAssignment[]>> {
    const { data } = await apiClient.get<EmployeeAssignment[]>(
      `/employees/${id}/assignments`
    );
    return {
      success: true,
      data,
      message: 'Employee assignments fetched successfully',
    };
  },

  async assignShops(
    id: string,
    shopIds: string[]
  ): Promise<ApiResponse<EmployeeAssignment[]>> {
    const { data } = await apiClient.post<EmployeeAssignment[]>(
      `/employees/${id}/assignments`,
      { shopIds }
    );
    return {
      success: true,
      data,
      message: 'Shops assigned successfully',
    };
  },

  async unassignShops(
    id: string,
    shopIds: string[]
  ): Promise<ApiResponse<void>> {
    await apiClient.delete(
      `/employees/${id}/assignments`,
      { data: { shopIds } }
    );
    return {
      success: true,
      message: 'Shops unassigned successfully',
    };
  },

  // --- Delivery-person assignment (agencies + per-store split) ---

  async getDeliveryAssignment(id: string): Promise<ApiResponse<DeliveryAssignment>> {
    const { data } = await apiClient.get<any>(`/employees/${id}/delivery-assignment`);
    return {
      success: true,
      data: normalizeAgencyAssignment(data),
      message: 'Delivery assignment fetched successfully',
    };
  },

  // Assign agencies to a delivery person. The backend default-fills every shop
  // of each agency to this person.
  async assignDeliveryAgencies(
    id: string,
    agencyIds: string[]
  ): Promise<ApiResponse<DeliveryAssignment>> {
    const { data } = await apiClient.post<any>(
      `/employees/${id}/delivery-agencies`,
      { agencyIds }
    );
    return {
      success: true,
      data: normalizeAgencyAssignment(data),
      message: 'Agencies assigned successfully',
    };
  },

  async unassignDeliveryAgencies(
    id: string,
    agencyIds: string[]
  ): Promise<ApiResponse<DeliveryAssignment>> {
    const { data } = await apiClient.delete<any>(
      `/employees/${id}/delivery-agencies`,
      { data: { agencyIds } }
    );
    return {
      success: true,
      data: normalizeAgencyAssignment(data),
      message: 'Agencies unassigned successfully',
    };
  },

  // Re-point specific stores to this delivery person (the per-store split).
  // Per-shift split: each entry is one (store, AM|PM) pair.
  async assignDeliveryShops(
    id: string,
    entries: ShopShiftEntry[]
  ): Promise<ApiResponse<DeliveryAssignment>> {
    const { data } = await apiClient.post<any>(
      `/employees/${id}/delivery-shops`,
      { entries }
    );
    return {
      success: true,
      data: normalizeAgencyAssignment(data),
      message: 'Stores assigned successfully',
    };
  },

  async unassignDeliveryShops(
    id: string,
    entries: ShopShiftEntry[]
  ): Promise<ApiResponse<DeliveryAssignment>> {
    const { data } = await apiClient.delete<any>(
      `/employees/${id}/delivery-shops`,
      { data: { entries } }
    );
    return {
      success: true,
      data: normalizeAgencyAssignment(data),
      message: 'Stores unassigned successfully',
    };
  },

  // --- Collector assignment (agencies + per-store split) ---
  // The per-store split reuses assignShops / unassignShops above
  // (assignedEmployeeId); these manage the agency membership + default-fill.

  async getCollectorAssignment(id: string): Promise<ApiResponse<CollectorAssignment>> {
    const { data } = await apiClient.get<any>(`/employees/${id}/collector-assignment`);
    return {
      success: true,
      data: normalizeAgencyAssignment(data),
      message: 'Collector assignment fetched successfully',
    };
  },

  async assignCollectorAgencies(
    id: string,
    agencyIds: string[]
  ): Promise<ApiResponse<CollectorAssignment>> {
    const { data } = await apiClient.post<any>(
      `/employees/${id}/collector-agencies`,
      { agencyIds }
    );
    return {
      success: true,
      data: normalizeAgencyAssignment(data),
      message: 'Agencies assigned successfully',
    };
  },

  async unassignCollectorAgencies(
    id: string,
    agencyIds: string[]
  ): Promise<ApiResponse<CollectorAssignment>> {
    const { data } = await apiClient.delete<any>(
      `/employees/${id}/collector-agencies`,
      { data: { agencyIds } }
    );
    return {
      success: true,
      data: normalizeAgencyAssignment(data),
      message: 'Agencies unassigned successfully',
    };
  },

  // Today's collection totals for this employee (their recorded payments).
  async getCollectionsToday(
    id: string,
    date?: string
  ): Promise<ApiResponse<CollectionsTodayStats>> {
    const { data } = await apiClient.get<any>(
      `/employees/${id}/collections-today`,
      { params: date ? { date } : undefined }
    );
    return {
      success: true,
      data: {
        clearedToday: data?.clearedToday ?? 0,
        cashAmount: data?.cashAmount ?? 0,
        onlineAmount: data?.onlineAmount ?? 0,
        chequeAmount: data?.chequeAmount ?? 0,
        walletWithdraw: data?.walletWithdraw ?? 0,
        walletDeposit: data?.walletDeposit ?? 0,
      },
      message: 'Collections fetched successfully',
    };
  },
};
