import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Employee,
  EmployeeAssignment,
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
    isActive: raw.isActive ?? (raw.status === 'active'),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
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
};
