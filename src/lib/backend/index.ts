import { MockBackendClient } from '../mock/client';
import { LocalBackendClient } from './local/client';
import type { BackendClient } from './client';

function isMockMode(): boolean {
  return process.env.BACKEND_MODE === 'mock';
}

export function createBackendClient(userId?: string): BackendClient {
  if (isMockMode()) {
    return new MockBackendClient();
  }
  return new LocalBackendClient(userId ?? null);
}
