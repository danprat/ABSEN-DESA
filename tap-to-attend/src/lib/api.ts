import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const TOKEN_KEY = 'auth_token';

export const authToken = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  remove: (): void => localStorage.removeItem(TOKEN_KEY),
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authToken.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      authToken.remove();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Backend response types (matching actual backend schemas)
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Backend Employee response
export interface BackendEmployee {
  id: number;
  nip: string | null;
  name: string;
  position: string;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  is_active: boolean;
  face_count: number;
  created_at: string;
  updated_at: string;
}

// Backend attendance today item
export interface BackendAttendanceTodayItem {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_position: string;
  employee_photo: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  status: 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alfa';
}

export interface BackendAttendanceTodayResponse {
  items: BackendAttendanceTodayItem[];
  total: number;
}

// Backend recognize response
export interface BackendRecognizeResponse {
  employee: {
    id: number;
    name: string;
    position: string;
    photo: string | null;
  };
  attendance: {
    id: number;
    status: string;
    check_in_at: string | null;
    check_out_at: string | null;
  } | null;  // Optional: null when just recognizing face
  message: string;
  confidence: number;
  attendance_status?: 'belum_absen' | 'sudah_check_in' | 'sudah_lengkap';
}

// Backend employee list response
export interface BackendEmployeeListResponse {
  items: BackendEmployee[];
  total: number;
  page: number;
  page_size: number;
}

// Backend work settings
export interface BackendWorkSettings {
  id: number;
  village_name: string;
  officer_name: string | null;
  logo_url: string | null;
  check_in_start: string;
  check_in_end: string;
  late_threshold_minutes: number;
  check_out_start: string;
  min_work_hours: number;
  face_similarity_threshold: number;
  updated_at: string;
}

// Backend daily schedule
export interface BackendDailySchedule {
  id: number;
  day_of_week: number;  // 0=Monday, 6=Sunday
  is_workday: boolean;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
  updated_at: string;
}

// Backend holiday
export interface BackendHoliday {
  id: number;
  date: string;
  name: string;
  is_auto: boolean;
  is_cuti: boolean;
  created_at: string;
}

export interface BackendHolidaySyncResponse {
  added: number;
  updated: number;
  skipped: number;
  message: string;
}

export interface BackendHolidayListResponse {
  items: BackendHoliday[];
  total: number;
}

// Backend audit log
export interface BackendAuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  performed_by: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface BackendAuditLogListResponse {
  items: BackendAuditLog[];
  total: number;
  page: number;
  page_size: number;
}

// Backend monthly report
export interface BackendMonthlyReportItem {
  employee_id: number;
  employee_name: string;
  employee_nip: string | null;
  employee_position: string;
  total_days: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  leave_days: number;
  sick_days: number;
  checkout_days: number;
  attendance_percentage: number;
}

export interface BackendMonthlyReportResponse {
  month: number;
  year: number;
  items: BackendMonthlyReportItem[];
  total_employees: number;
}

// Backend attendance admin today
export interface BackendAttendanceSummary {
  total_employees: number;
  present: number;
  late: number;
  absent: number;
  on_leave: number;
  sick: number;
}

export interface BackendAttendanceTodayAdminResponse {
  items: BackendAttendanceTodayItem[];
  summary: BackendAttendanceSummary;
}

// Face embedding types
export interface BackendFaceEmbedding {
  id: number;
  employee_id: number;
  photo_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface BackendFaceUploadResponse {
  id: number;
  photo_url: string;
  message: string;
}

// Public settings types
export interface PublicTodaySchedule {
  is_workday: boolean;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
}

export interface PublicSettingsResponse {
  village_name: string;
  officer_name: string | null;
  logo_url: string | null;
  today_schedule: PublicTodaySchedule | null;
}

export const api = {
  auth: {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response.data;
    },

    setup: async (): Promise<{ message: string; username: string; password: string }> => {
      const response = await apiClient.post('/api/v1/auth/setup');
      return response.data;
    },

    logout: (): void => {
      authToken.remove();
    },

    isAuthenticated: (): boolean => {
      return authToken.get() !== null;
    },

    changePassword: async (data: { current_password: string; new_password: string; confirm_password: string }): Promise<{ message: string }> => {
      const response = await apiClient.patch('/api/v1/auth/change-password', data);
      return response.data;
    },
  },

  employees: {
    list: async (params?: { search?: string; page?: number; page_size?: number; is_active?: boolean }): Promise<BackendEmployeeListResponse> => {
      const response = await apiClient.get<BackendEmployeeListResponse>('/api/v1/employees', { params });
      return response.data;
    },

    get: async (id: number): Promise<BackendEmployee> => {
      const response = await apiClient.get<BackendEmployee>(`/api/v1/employees/${id}`);
      return response.data;
    },

    create: async (data: { name: string; position: string; nip?: string; phone?: string; email?: string }): Promise<BackendEmployee> => {
      const response = await apiClient.post<BackendEmployee>('/api/v1/employees', data);
      return response.data;
    },

    update: async (id: number, data: Partial<{ name: string; position: string; nip: string; phone: string; email: string; is_active: boolean }>): Promise<BackendEmployee> => {
      const response = await apiClient.patch<BackendEmployee>(`/api/v1/employees/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/api/v1/employees/${id}`);
    },

    // Face enrollment
    face: {
      list: async (employeeId: number): Promise<BackendFaceEmbedding[]> => {
        const response = await apiClient.get<BackendFaceEmbedding[]>(`/api/v1/employees/${employeeId}/face`);
        return response.data;
      },

      upload: async (employeeId: number, file: File): Promise<BackendFaceUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<BackendFaceUploadResponse>(
          `/api/v1/employees/${employeeId}/face`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
      },

      delete: async (employeeId: number, faceId: number): Promise<void> => {
        await apiClient.delete(`/api/v1/employees/${employeeId}/face/${faceId}`);
      },
    },
  },

  public: {
    settings: async (): Promise<PublicSettingsResponse> => {
      const response = await apiClient.get<PublicSettingsResponse>('/api/v1/public/settings');
      return response.data;
    },
  },

  attendance: {
    recognize: async (imageFile?: File, imageBase64?: string): Promise<BackendRecognizeResponse> => {
      const formData = new FormData();

      if (imageFile) {
        formData.append('file', imageFile);
      } else if (imageBase64) {
        formData.append('image_base64', imageBase64);
      } else {
        throw new Error('Either imageFile or imageBase64 must be provided');
      }

      const response = await apiClient.post<BackendRecognizeResponse>(
        '/api/v1/attendance/recognize',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },

    confirm: async (employeeId: number, confidence: number): Promise<BackendRecognizeResponse> => {
      const formData = new FormData();
      formData.append('employee_id', employeeId.toString());
      formData.append('confidence', confidence.toString());

      const response = await apiClient.post<BackendRecognizeResponse>(
        '/api/v1/attendance/confirm',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },

    today: async (): Promise<BackendAttendanceTodayResponse> => {
      const response = await apiClient.get<BackendAttendanceTodayResponse>('/api/v1/attendance/today');
      return response.data;
    },
  },

  admin: {
    attendance: {
      list: async (params?: { employee_id?: number; start_date?: string; end_date?: string; status?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get('/api/v1/admin/attendance', { params });
        return response.data;
      },

      correct: async (id: number, data: { status?: string; check_in_at?: string; check_out_at?: string; correction_notes?: string }) => {
        const response = await apiClient.patch(`/api/v1/admin/attendance/${id}`, data);
        return response.data;
      },

      today: async (): Promise<BackendAttendanceTodayAdminResponse> => {
        const response = await apiClient.get<BackendAttendanceTodayAdminResponse>('/api/v1/admin/attendance/today');
        return response.data;
      },
    },

    reports: {
      monthly: async (params: { month: number; year: number }): Promise<BackendMonthlyReportResponse> => {
        const response = await apiClient.get<BackendMonthlyReportResponse>('/api/v1/admin/reports/monthly', { params });
        return response.data;
      },

      export: async (params: { month: number; year: number }): Promise<Blob> => {
        const response = await apiClient.get('/api/v1/admin/reports/export', {
          params,
          responseType: 'blob',
        });
        return response.data;
      },
    },

    settings: {
      get: async (): Promise<BackendWorkSettings> => {
        const response = await apiClient.get<BackendWorkSettings>('/api/v1/admin/settings');
        return response.data;
      },

      update: async (data: Partial<{
        village_name: string;
        officer_name: string;
        logo_url: string;
        check_in_start: string;
        check_in_end: string;
        late_threshold_minutes: number;
        check_out_start: string;
        min_work_hours: number;
        face_similarity_threshold: number;
      }>): Promise<BackendWorkSettings> => {
        const response = await apiClient.patch<BackendWorkSettings>('/api/v1/admin/settings', data);
        return response.data;
      },

      uploadLogo: async (file: File): Promise<{ message: string; logo_url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/api/v1/admin/settings/logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      },

      deleteLogo: async (): Promise<{ message: string }> => {
        const response = await apiClient.delete('/api/v1/admin/settings/logo');
        return response.data;
      },

      holidays: {
        list: async (params?: { year?: number }): Promise<BackendHolidayListResponse> => {
          const response = await apiClient.get<BackendHolidayListResponse>('/api/v1/admin/settings/holidays', { params });
          return response.data;
        },

        listExcluded: async (params?: { year?: number }): Promise<BackendHolidayListResponse> => {
          const response = await apiClient.get<BackendHolidayListResponse>('/api/v1/admin/settings/holidays/excluded', { params });
          return response.data;
        },

        create: async (data: { date: string; name: string }): Promise<BackendHoliday> => {
          const response = await apiClient.post<BackendHoliday>('/api/v1/admin/settings/holidays', data);
          return response.data;
        },

        delete: async (id: number): Promise<void> => {
          await apiClient.delete(`/api/v1/admin/settings/holidays/${id}`);
        },

        restore: async (id: number): Promise<BackendHoliday> => {
          const response = await apiClient.post<BackendHoliday>(`/api/v1/admin/settings/holidays/${id}/restore`);
          return response.data;
        },

        sync: async (year?: number): Promise<BackendHolidaySyncResponse> => {
          const response = await apiClient.post<BackendHolidaySyncResponse>('/api/v1/admin/settings/holidays/sync', null, { params: { year } });
          return response.data;
        },
      },

      schedules: {
        list: async (): Promise<BackendDailySchedule[]> => {
          const response = await apiClient.get<BackendDailySchedule[]>('/api/v1/admin/settings/schedules');
          return response.data;
        },

        update: async (schedules: Array<{
          day_of_week: number;
          is_workday: boolean;
          check_in_start: string;
          check_in_end: string;
          check_out_start: string;
        }>): Promise<BackendDailySchedule[]> => {
          const response = await apiClient.patch<BackendDailySchedule[]>('/api/v1/admin/settings/schedules', { schedules });
          return response.data;
        },
      },
    },

    auditLogs: {
      list: async (params?: {
        action?: string;
        entity_type?: string;
        search?: string;
        start_date?: string;
        end_date?: string;
        page?: number;
        page_size?: number
      }): Promise<BackendAuditLogListResponse> => {
        const response = await apiClient.get<BackendAuditLogListResponse>('/api/v1/admin/audit-logs', { params });
        return response.data;
      },
    },
  },
};

export default api;
