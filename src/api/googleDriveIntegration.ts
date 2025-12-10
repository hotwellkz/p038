import { getAuthToken } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface GoogleDriveIntegrationStatus {
  connected: boolean;
  email?: string;
}

/**
 * Получает статус Google Drive интеграции
 */
export async function getGoogleDriveStatus(): Promise<GoogleDriveIntegrationStatus> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE}/api/google-drive-integration/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to get status");
  }

  return response.json();
}

/**
 * Получает URL для авторизации Google OAuth
 */
export async function getGoogleDriveAuthUrl(): Promise<{ authUrl: string }> {
  const token = await getAuthToken();
  const url = `${API_BASE}/api/google-drive-integration/oauth/url`;
  
  console.log("[GoogleDriveIntegration] Requesting auth URL:", url);
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log("[GoogleDriveIntegration] Response status:", response.status, response.statusText);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: "Unknown error",
      message: `HTTP ${response.status}: ${response.statusText}`
    }));
    
    console.error("[GoogleDriveIntegration] Error response:", errorData);
    
    // Если это 404, возвращаем специальную ошибку
    if (response.status === 404) {
      const error = new Error("FAILED_TO_GENERATE_AUTH_URL: Маршрут не найден. Убедитесь, что backend сервер запущен и маршруты подключены.");
      (error as any).code = "ROUTE_NOT_FOUND";
      throw error;
    }
    
    const error = new Error(errorData.error || errorData.message || "Failed to get auth URL");
    (error as any).code = errorData.error || "FAILED_TO_GENERATE_AUTH_URL";
    throw error;
  }

  const data = await response.json();
  console.log("[GoogleDriveIntegration] Auth URL received, length:", data.authUrl?.length || 0);
  
  return data;
}

/**
 * Обрабатывает callback от Google OAuth
 */
export async function confirmGoogleDriveCode(code: string): Promise<GoogleDriveIntegrationStatus> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE}/api/google-drive-integration/oauth/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ code })
  });

  const responseData = await response.json().catch(() => ({ error: "Unknown error" }));

  if (!response.ok) {
    const errorCode = responseData.error || "FAILED_TO_CONNECT";
    const errorMessage = responseData.message || errorCode;
    const error = new Error(errorMessage);
    (error as any).code = errorCode;
    throw error;
  }

  return responseData;
}

/**
 * Отключает Google Drive интеграцию
 */
export async function disconnectGoogleDrive(): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE}/api/google-drive-integration/disconnect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to disconnect");
  }

  return response.json();
}

