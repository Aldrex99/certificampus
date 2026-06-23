import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Shared axios instance. `withCredentials` ensures the httpOnly auth cookies
 * (accessToken / refreshToken) are sent with every request and that the
 * Set-Cookie from /auth/refresh is stored by the browser.
 */
export const axiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

/** Called when refreshing fails — wired to the Redux logout from main.tsx. */
let onAuthFailure: () => void = () => {};
export function setOnAuthFailure(cb: () => void): void {
  onAuthFailure = cb;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Single-flight refresh: concurrent 401s wait for one refresh call.
let isRefreshing = false;
let waiters: { resolve: () => void; reject: (e: unknown) => void }[] = [];

function flushWaiters(error: unknown): void {
  waiters.forEach((w) => (error ? w.reject(error) : w.resolve()));
  waiters = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes('/auth/');

    // Only attempt a refresh once per request, and never for auth endpoints
    // (login/refresh/logout) to avoid infinite loops.
    if (status !== 401 || !original || original._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // Wait for the in-flight refresh, then replay this request.
      await new Promise<void>((resolve, reject) => waiters.push({ resolve, reject }));
      return axiosInstance(original);
    }

    isRefreshing = true;
    try {
      await axiosInstance.post('/auth/refresh');
      flushWaiters(null);
      return axiosInstance(original);
    } catch (refreshError) {
      flushWaiters(refreshError);
      onAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
