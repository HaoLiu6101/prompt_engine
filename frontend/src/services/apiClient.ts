interface RequestOptions extends RequestInit {
  token?: string | null;
}

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async request<T>(path: string, options: RequestOptions): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (options.token) {
      headers.set('Authorization', `Bearer ${options.token}`);
    }

    const response = await fetch(this.baseUrl + path, {
      ...options,
      headers
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`API ${response.status}: ${message}`);
    }

    return response.json() as Promise<T>;
  }
}

const defaultBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const apiClient = new ApiClient(defaultBase);
