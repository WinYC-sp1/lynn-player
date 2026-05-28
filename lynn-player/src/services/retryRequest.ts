export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, options: RetryOptions): number {
  const { initialDelay = 1000, maxDelay = 10000, backoffFactor = 2 } = options;
  const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

function isRetryable(error: any, options: RetryOptions): boolean {
  const { retryableStatuses = [408, 429, 500, 502, 503, 504] } = options;
  if (error.status && retryableStatuses.includes(error.status)) {
    return true;
  }
  if (error.name === 'AbortError') {
    return false;
  }
  if (typeof error === 'string') {
    return error.includes('network') || error.includes('timeout');
  }
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  return false;
}

export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...defaultOptions, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries!; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt === config.maxRetries || !isRetryable(error, config)) {
        break;
      }
      const waitTime = calculateDelay(attempt, config);
      await delay(waitTime);
    }
  }

  throw lastError;
}
