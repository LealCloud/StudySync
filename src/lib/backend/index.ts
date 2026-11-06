import { MockBackendClient, MockPublicBackendClient } from '../mock/client';
import { LocalBackendClient } from './local/client';
import type { BackendClient, PublicBackendClient } from './client';

function isMockMode(): boolean {
  return process.env.BACKEND_MODE === 'mock';
}

export function createBackendClient(userId?: string): BackendClient {
  if (isMockMode()) {
    return new MockBackendClient();
  }
  return new LocalBackendClient(userId ?? null);
}

export function createPublicBackendClient(): PublicBackendClient {
  if (isMockMode()) {
    return new MockPublicBackendClient();
  }

  // TODO(phase-c6): implementar LocalPublicBackendClient. Hasta entonces,
  // los route handlers del sitio público fallan en modo local. En modo mock
  // funcionan (pnpm mock:test sigue pasando 59/59).
  throw new Error(
    'createPublicBackendClient is not implemented in local mode until C.6',
  );
}
