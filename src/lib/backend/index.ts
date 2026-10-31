import { MockBackendClient, MockPublicBackendClient } from '../mock/client';
import type { BackendClient, PublicBackendClient } from './client';
import {
  createRestBackendClient,
  readBackendErrorCode,
  RestBackendClient,
  RestBackendNotConfiguredError,
  RestBackendUnavailableError,
} from './rest/client';

export type { RestBackendResponse } from './rest/client';
export {
  createRestBackendClient,
  readBackendErrorCode,
  RestBackendClient,
  RestBackendNotConfiguredError,
  RestBackendUnavailableError,
};

function isMockMode(): boolean {
  return process.env.BACKEND_MODE === 'mock';
}

export function createBackendClient(accessToken?: string): BackendClient {
  if (isMockMode()) {
    return new MockBackendClient();
  }

  return createRestBackendClient(accessToken);
}

export function createPublicBackendClient(): PublicBackendClient {
  if (isMockMode()) {
    return new MockPublicBackendClient();
  }

  return createRestBackendClient();
}
