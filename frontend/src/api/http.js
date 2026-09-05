export const API_BASE = "http://localhost:8080/api";

/**
 * Unwraps a fetch response, turning any non-2xx into an Error carrying the
 * server's message so the UI can show what actually went wrong.
 */
export async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && body.message) message = body.message;
    } catch {
      // no JSON body on the response; keep the default message
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export function jsonRequest(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
