import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  getGoogleDriveStatus,
  getGoogleDriveAuthUrl,
  disconnectGoogleDrive,
  type GoogleDriveIntegrationStatus
} from "../api/googleDriveIntegration";

const GoogleDriveIntegration = () => {
  const [status, setStatus] = useState<GoogleDriveIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const currentStatus = await getGoogleDriveStatus();
      setStatus(currentStatus);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить статус");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      
      const { authUrl } = await getGoogleDriveAuthUrl();
      
      // Перенаправляем пользователя на страницу авторизации Google
      window.location.href = authUrl;
    } catch (err: any) {
      console.error("[GoogleDriveIntegration] Error connecting:", err);
      
      // Обрабатываем разные типы ошибок
      let errorMsg = err.message || "Не удалось получить URL авторизации";
      
      if (err.code === "ROUTE_NOT_FOUND" || err.message?.includes("404")) {
        errorMsg = "FAILED_TO_GENERATE_AUTH_URL: Маршрут не найден на сервере. Убедитесь, что backend сервер запущен.";
      } else if (err.code === "FAILED_TO_GENERATE_AUTH_URL" || err.message?.includes("FAILED_TO_GENERATE_AUTH_URL")) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Вы уверены, что хотите отключить Google Drive?")) {
      return;
    }

    try {
      setDisconnecting(true);
      setError(null);
      await disconnectGoogleDrive();
      await loadStatus();
    } catch (err: any) {
      setError(err.message || "Не удалось отключить Google Drive");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-200">
        <Loader2 className="h-5 w-5 animate-spin text-brand-light" />
        Загрузка статуса Google Drive...
      </div>
    );
  }

  const currentStatus = status?.connected ? "connected" : "not_connected";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Google Drive интеграция</h2>
        <p className="mt-2 text-sm text-slate-400">
          Подключите свой Google Drive для автоматической загрузки видео
        </p>
      </div>

      {/* Статус */}
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-4">
        {currentStatus === "connected" && (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div className="flex-1">
              <div className="font-medium text-white">
                ✅ Подключён к Google Drive
              </div>
              {status?.email && (
                <div className="mt-1 text-sm text-slate-400">
                  {status.email}
                </div>
              )}
            </div>
          </>
        )}
        {currentStatus === "not_connected" && (
          <>
            <XCircle className="h-5 w-5 text-slate-400" />
            <div className="font-medium text-white">❌ Google Drive не подключён</div>
          </>
        )}
      </div>

      {/* Ошибки */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-900/20 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
          <div className="flex-1 text-sm text-red-300">{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Действия */}
      <div className="flex gap-3">
        {currentStatus === "not_connected" && (
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Подключение...
              </>
            ) : (
              "Подключить Google Drive"
            )}
          </button>
        )}

        {currentStatus === "connected" && (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disconnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Отключение...
              </>
            ) : (
              "Отключить Google Drive"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleDriveIntegration;

