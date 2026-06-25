import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import { axiosInstance } from '@/lib/axios';
import {
  AdminDashboard,
  AuthUser,
  CurrentSubscription,
  Diploma,
  Paginated,
  Plan,
  School,
  SchoolDashboard,
  Student,
  Subscription,
  TemplateDiploma,
  Training,
} from '@/types';

/** Unwraps the API's `{ success, data }` envelope. */
function unwrap<T>(response: { data: T }): T {
  return response.data;
}

interface AxiosQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  /** Request payload (alias `body` kept for fetchBaseQuery-style endpoints). */
  data?: unknown;
  body?: unknown;
  params?: AxiosRequestConfig['params'];
}

/**
 * RTK Query base built on the shared axios instance, so all endpoints benefit
 * from the cookie-based auth and the automatic token-refresh interceptor.
 */
const baseQuery: BaseQueryFn<string | AxiosQueryArgs, unknown, unknown> = async (arg) => {
  const { url, method, data, body, params } = typeof arg === 'string' ? { url: arg } : arg;
  try {
    const result = await axiosInstance({ url, method: method ?? 'GET', data: data ?? body, params });
    return { data: result.data };
  } catch (axiosError) {
    const err = axiosError as AxiosError;
    return { error: { status: err.response?.status, data: err.response?.data } };
  }
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Student', 'Training', 'Certifiable', 'School', 'Subscription', 'Plan', 'Billing', 'Template', 'Dashboard', 'Profile'],
  endpoints: (builder) => ({
    /* ----------------------------- Auth ----------------------------- */
    login: builder.mutation<{ user: AuthUser }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    register: builder.mutation<unknown, Record<string, string>>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    activate: builder.mutation<{ user: AuthUser }, { email: string; token: string; password?: string }>({
      query: (body) => ({ url: '/auth/activate', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    forgotPassword: builder.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<unknown, { email: string; token: string; password: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),

    /* --------------------------- Dashboard -------------------------- */
    getDashboard: builder.query<SchoolDashboard, void>({
      query: () => '/dashboard',
      transformResponse: unwrap,
      providesTags: ['Dashboard'],
    }),

    /* ---------------------------- Students -------------------------- */
    getStudents: builder.query<Paginated<Student>, { page?: number; search?: string; status?: string; training?: string }>({
      query: (params) => ({ url: '/students', params }),
      transformResponse: unwrap,
      providesTags: ['Student'],
    }),
    createStudent: builder.mutation<Student, Partial<Student>>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      invalidatesTags: ['Student', 'Dashboard', 'Certifiable'],
    }),
    updateStudent: builder.mutation<Student, { id: string; body: Partial<Student> }>({
      query: ({ id, body }) => ({ url: `/students/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Student', 'Dashboard', 'Certifiable'],
    }),
    deleteStudent: builder.mutation<void, string>({
      query: (id) => ({ url: `/students/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Student', 'Dashboard', 'Certifiable'],
    }),
    bulkDeleteStudents: builder.mutation<{ deleted: number }, string[]>({
      query: (ids) => ({ url: '/students/bulk-delete', method: 'POST', body: { ids } }),
      transformResponse: unwrap,
      invalidatesTags: ['Student', 'Dashboard', 'Certifiable'],
    }),
    importStudents: builder.mutation<{ created: number; updated: number; skipped: number }, FormData>({
      query: (formData) => ({ url: '/students/import', method: 'POST', body: formData }),
      transformResponse: unwrap,
      invalidatesTags: ['Student', 'Dashboard', 'Certifiable', 'Training'],
    }),

    /* ---------------------------- Trainings ------------------------- */
    getTrainings: builder.query<Paginated<Training>, { page?: number; search?: string }>({
      query: (params) => ({ url: '/trainings', params }),
      transformResponse: unwrap,
      providesTags: ['Training'],
    }),
    createTraining: builder.mutation<Training, Partial<Training>>({
      query: (body) => ({ url: '/trainings', method: 'POST', body }),
      invalidatesTags: ['Training'],
    }),
    updateTraining: builder.mutation<Training, { id: string; body: Partial<Training> }>({
      query: ({ id, body }) => ({ url: `/trainings/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Training'],
    }),
    deleteTraining: builder.mutation<void, string>({
      query: (id) => ({ url: `/trainings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Training'],
    }),

    /* -------------------------- Certifications ---------------------- */
    getCertifiable: builder.query<Student[], { training?: string }>({
      query: (params) => ({ url: '/certifications/students', params }),
      transformResponse: unwrap,
      providesTags: ['Certifiable'],
    }),
    previewDiploma: builder.query<{ html: string }, string>({
      query: (studentId) => `/certifications/preview/${studentId}`,
      transformResponse: unwrap,
    }),
    generateDiplomas: builder.mutation<{ generated: Diploma[]; skipped: unknown[] }, { studentIds: string[]; templateId?: string }>({
      query: (body) => ({ url: '/certifications/generate', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Certifiable', 'Student', 'Dashboard'],
    }),
    publishDiplomas: builder.mutation<{ published: number; sent: number }, { diplomaIds: string[]; send?: boolean }>({
      query: (body) => ({ url: '/certifications/publish', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Dashboard'],
    }),

    /* ----------------------------- Billing -------------------------- */
    getPlans: builder.query<Plan[], void>({
      query: () => '/billing/plans',
      transformResponse: unwrap,
      providesTags: ['Plan'],
    }),
    getMySubscription: builder.query<CurrentSubscription, void>({
      query: () => '/billing/subscription',
      transformResponse: unwrap,
      providesTags: ['Billing'],
    }),
    createCheckout: builder.mutation<{ url: string; mocked: boolean }, { planId: string }>({
      query: (body) => ({ url: '/billing/checkout', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Billing'],
    }),

    /* ----------------------------- Settings ------------------------- */
    getProfile: builder.query<{ user: AuthUser; school: School | null }, void>({
      query: () => '/settings/profile',
      transformResponse: unwrap,
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<unknown, Record<string, string>>({
      query: (body) => ({ url: '/settings/profile', method: 'PUT', body }),
      invalidatesTags: ['Profile'],
    }),
    changePassword: builder.mutation<unknown, { currentPassword: string; newPassword: string; confirmPassword: string }>({
      query: (body) => ({ url: '/settings/password', method: 'PUT', body }),
    }),

    /* ------------------------------ Admin --------------------------- */
    getAdminDashboard: builder.query<AdminDashboard, void>({
      query: () => '/admin/dashboard',
      transformResponse: unwrap,
      providesTags: ['Dashboard'],
    }),
    getSchools: builder.query<Paginated<School>, { page?: number; search?: string }>({
      query: (params) => ({ url: '/admin/schools', params }),
      transformResponse: unwrap,
      providesTags: ['School'],
    }),
    createSchool: builder.mutation<School, Record<string, string>>({
      query: (body) => ({ url: '/admin/schools', method: 'POST', body }),
      invalidatesTags: ['School', 'Dashboard'],
    }),
    updateSchool: builder.mutation<School, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/schools/${id}`, method: 'PUT', body }),
      invalidatesTags: ['School'],
    }),
    deleteSchool: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/schools/${id}`, method: 'DELETE' }),
      invalidatesTags: ['School', 'Dashboard'],
    }),
    getSubscriptions: builder.query<Paginated<Subscription>, { page?: number }>({
      query: (params) => ({ url: '/admin/subscriptions', params }),
      transformResponse: unwrap,
      providesTags: ['Subscription'],
    }),
    createSubscription: builder.mutation<Subscription, Partial<Subscription>>({
      query: (body) => ({ url: '/admin/subscriptions', method: 'POST', body }),
      invalidatesTags: ['Subscription', 'Dashboard'],
    }),
    updateSubscription: builder.mutation<Subscription, { id: string; body: Partial<Subscription> }>({
      query: ({ id, body }) => ({ url: `/admin/subscriptions/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Subscription'],
    }),
    deleteSubscription: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/subscriptions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Subscription', 'Dashboard'],
    }),
    getAdminPlans: builder.query<Plan[], void>({
      query: () => '/admin/plans',
      transformResponse: unwrap,
      providesTags: ['Plan'],
    }),
    createPlan: builder.mutation<Plan, Partial<Plan>>({
      query: (body) => ({ url: '/admin/plans', method: 'POST', body }),
      invalidatesTags: ['Plan'],
    }),
    updatePlan: builder.mutation<Plan, { id: string; body: Partial<Plan> }>({
      query: ({ id, body }) => ({ url: `/admin/plans/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Plan'],
    }),
    deletePlan: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/plans/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Plan'],
    }),
    getTemplates: builder.query<TemplateDiploma[], void>({
      query: () => '/admin/templates',
      transformResponse: unwrap,
      providesTags: ['Template'],
    }),
    createTemplate: builder.mutation<TemplateDiploma, Partial<TemplateDiploma>>({
      query: (body) => ({ url: '/admin/templates', method: 'POST', body }),
      invalidatesTags: ['Template'],
    }),
    updateTemplate: builder.mutation<TemplateDiploma, { id: string; body: Partial<TemplateDiploma> }>({
      query: ({ id, body }) => ({ url: `/admin/templates/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Template'],
    }),
    deleteTemplate: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Template'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useActivateMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetDashboardQuery,
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useBulkDeleteStudentsMutation,
  useImportStudentsMutation,
  useGetTrainingsQuery,
  useCreateTrainingMutation,
  useUpdateTrainingMutation,
  useDeleteTrainingMutation,
  useGetCertifiableQuery,
  usePreviewDiplomaQuery,
  useLazyPreviewDiplomaQuery,
  useGenerateDiplomasMutation,
  usePublishDiplomasMutation,
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useCreateCheckoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetAdminDashboardQuery,
  useGetSchoolsQuery,
  useCreateSchoolMutation,
  useUpdateSchoolMutation,
  useDeleteSchoolMutation,
  useGetSubscriptionsQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useGetAdminPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} = api;
