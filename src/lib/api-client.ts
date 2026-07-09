import { getKernelHeaders, getKernelBaseHeaders } from '@/lib/kernel-auth';

const BACKEND_URL = process.env.BACKEND_URL || 'https://kernel-core.yowyob.com';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1500;
const RETRYABLE_STATUS_CODES = [502, 503, 504, 429];
const RETRYABLE_ERROR_CODES = [
  'ORGANIZATION_SERVICE_QUOTA_UNAVAILABLE',
  'UND_ERR_CONNECT_TIMEOUT',
];

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function backendFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ success: boolean; data?: T; message?: string; errorCode?: string }> {
  const { params, headers, ...restOptions } = options;

  // Build URL with query parameters
  const url = new URL(`${BACKEND_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, String(val));
      }
    });
  }

  // Check if caller provided Authorization header
  const authHeaderKey = Object.keys(headers || {}).find(k => k.toLowerCase() === 'authorization');
  const hasAuth = !!authHeaderKey;

  let baseHeaders: Record<string, string> = {};
  
  if (hasAuth) {
    // Caller provided auth, just get base headers (X-Client-Id, etc.) without logging in
    baseHeaders = getKernelBaseHeaders();
  } else {
    // No auth provided, attempt to get system token
    try {
      baseHeaders = await getKernelHeaders();
    } catch (authError: any) {
      console.error('[API Client] Authentication error:', authError.message);
      return {
        success: false,
        message: authError.message || 'Erreur d\'authentification avec le kernel.',
        errorCode: 'AUTH_ERROR',
      };
    }
  }

  const mergedHeaders: Record<string, string> = {
    ...baseHeaders,
    ...(headers as Record<string, string>), // caller overrides
  };

  if (restOptions.body && typeof restOptions.body === 'string' && !Object.keys(mergedHeaders).some(k => k.toLowerCase() === 'content-type')) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`[API Client] Retry ${attempt}/${MAX_RETRIES} après ${delay}ms...`);
      await sleep(delay);
    }

    try {
      console.log(`[API Client] Fetching ${restOptions.method || 'GET'} ${url.toString()}${attempt > 0 ? ` (tentative ${attempt + 1})` : ''}`);
      const response = await fetch(url.toString(), {
        cache: 'no-store', // Prevent Next.js from caching the external API responses
        ...restOptions,
        headers: mergedHeaders,
      });

      const contentType = response.headers.get('content-type');
      let responseData: any;

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        try {
          responseData = text ? JSON.parse(text) : {};
        } catch {
          responseData = { text };
        }
      }

      // Check for retryable HTTP status codes
      if (RETRYABLE_STATUS_CODES.includes(response.status) && attempt < MAX_RETRIES) {
        const errorCode = responseData?.errorCode || '';
        if (RETRYABLE_ERROR_CODES.includes(errorCode) || response.status === 503) {
          console.warn(`[API Client] Status ${response.status} (${errorCode}) — réessai...`);
          lastError = { responseData, status: response.status };
          continue;
        }
      }

      if (!response.ok) {
        console.error(`[API Client] Error: ${response.status} ${response.statusText}`, responseData);
        return {
          success: false,
          message: responseData.message || response.statusText || 'Une erreur est survenue lors de la communication avec le serveur.',
          errorCode: responseData.errorCode || String(response.status),
        };
      }

      // Standardize response format
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        return responseData;
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error: any) {
      console.error(`[API Client] Connection error (tentative ${attempt + 1}):`, error.message || error);
      lastError = error;

      // Retry on connection/timeout errors
      if (attempt < MAX_RETRIES) {
        continue;
      }

      return {
        success: false,
        message: error.message || 'Impossible de se connecter au serveur backend.',
        errorCode: 'CONNECTION_ERROR',
      };
    }
  }

  // All retries exhausted
  const msg = lastError?.responseData?.message || lastError?.message || 'Le serveur est temporairement indisponible.';
  const code = lastError?.responseData?.errorCode || lastError?.status?.toString() || 'SERVICE_UNAVAILABLE';
  console.error(`[API Client] Toutes les tentatives échouées pour ${endpoint}`);
  return {
    success: false,
    message: msg,
    errorCode: code,
  };
}
