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
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
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

  // Some successful responses (for example DELETE 204) have no body.
  if (response.status === 204) {
    return {
      status: response.status,
    };
  }

  const responseText = await response.text();
  if (!responseText.trim()) {
    return {
      status: response.status,
    };
  }

  const content = JSON.parse(responseText) as T;
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
