/**
 * Turkish error messages for PocketBase errors
 */

interface PocketBaseError {
  message: string;
  code?: number;
  status?: number;
  data?: {
    [key: string]: {
      code: number;
      message: string;
    };
  };
}

/**
 * Parse PocketBase error and return Turkish message
 */
export function getPocketBaseErrorMessage(error: unknown): string {
  // If error is already a string
  if (typeof error === 'string') {
    return error;
  }

  // If error has a message property
  const pbError = error as PocketBaseError;
  if (!pbError) {
    return 'Beklenmeyen bir hata oluştu.';
  }

  // Check for network/connection errors
  if (pbError.message?.includes('Failed to fetch') ||
      pbError.message?.includes('NetworkError') ||
      pbError.message?.includes('ECONNREFUSED') ||
      pbError.message?.includes('fetch failed')) {
    return 'Veritabanına bağlanılamadı. Lütfen PocketBase sunucusunun çalıştığından emin olun.';
  }

  // Check for timeout errors
  if (pbError.message?.includes('timeout') || pbError.message?.includes('timed out')) {
    return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }

  // Check for specific PocketBase error codes
  if (pbError.status) {
    switch (pbError.status) {
      case 400:
        return 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.';
      case 401:
        return 'E-posta veya şifre hatalı.';
      case 403:
        return 'Bu işlem için yetkiniz yok.';
      case 404:
        return 'İstenen kaynak bulunamadı.';
      case 409:
        return 'Bu e-posta adresi zaten kullanılıyor.';
      case 422:
        return 'Girdiğiniz bilgilerde hata var. Lütfen kontrol edin.';
      case 429:
        return 'Çok fazla istek gönderdiniz. Lütfen birkaç dakika bekleyin.';
      case 500:
        return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      case 503:
        return 'Hizmet geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
    }
  }

  // Check for validation errors (data field)
  if (pbError.data) {
    const firstField = Object.keys(pbError.data)[0];
    if (firstField && pbError.data[firstField]) {
      const fieldError = pbError.data[firstField];
      return `${firstField}: ${fieldError.message}`;
    }
  }

  // Check for common error messages
  const errorMessage = pbError.message?.toLowerCase() || '';
  if (errorMessage.includes('invalid')) {
    return 'Geçersiz bilgiler.';
  }
  if (errorMessage.includes('unauthorized') || errorMessage.includes('not authenticated')) {
    return 'Oturumunuz sonlandı. Lütfen tekrar giriş yapın.';
  }
  if (errorMessage.includes('forbidden')) {
    return 'Bu işlem için yetkiniz yok.';
  }
  if (errorMessage.includes('not found')) {
    return 'İstenen kaynak bulunamadı.';
  }

  // Return original message if no match found
  return pbError.message || 'Beklenmeyen bir hata oluştu.';
}

/**
 * Format error for toast/notification display
 */
export function formatError(error: unknown): string {
  const message = getPocketBaseErrorMessage(error);

  // Capitalize first letter
  return message.charAt(0).toUpperCase() + message.slice(1);
}
