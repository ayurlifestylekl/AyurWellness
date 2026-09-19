import { defineCliConfig } from 'sanity/cli'

import { dataset, projectId } from './src/sanity/env'

/**
 * Used by the `sanity` CLI for things like `sanity deploy`, `sanity dataset`,
 * `sanity graphql deploy`, etc.
 */
export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: 'ayurvedic-wellness',
  autoUpdates: true,
})
