import { vi } from 'vitest'

// `server-only` must be a no-op in the Node test environment so that
// server-only modules can still be imported and unit-tested.
vi.mock('server-only', () => ({}))
