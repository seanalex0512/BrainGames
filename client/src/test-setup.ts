import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// RTL auto-cleanup requires afterEach to be a global.
// Since globals: false, we register it explicitly.
afterEach(cleanup);
