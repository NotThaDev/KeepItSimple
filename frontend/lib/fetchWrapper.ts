export interface FetchWrapperResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function fetch<T>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<FetchWrapperResponse<T>> {
  const baseUrl = process.env.API_BASE_URL || "";
  const fullUrl = `${baseUrl}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await globalThis.fetch(fullUrl, options);
  if (!response.ok) {
    return {
      error: `Request failed with status ${response.status}`,
      status: response.status,
    };
  }
  const content = await response.json();
  return {
    data: content,
    status: response.status,
  };
}

export function get<T>(endpoint: string) {
  return fetch<T>("GET", endpoint);
}

export function post<T>(endpoint: string, body: unknown) {
  return fetch<T>("POST", endpoint, body);
}

export function put<T>(endpoint: string, body: unknown) {
  return fetch<T>("PUT", endpoint, body);
}

export function del<T>(endpoint: string) {
  return fetch<T>("DELETE", endpoint);
}
