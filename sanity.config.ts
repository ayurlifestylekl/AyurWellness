import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import { apiVersion, dataset, projectId } from './src/sanity/env'
import { schemaTypes } from './src/sanity/schemaTypes'

/**
 * Sanity Studio config — embedded inside the Next.js app at /studio.
 * The studio reads project credentials from .env.local.
 */
export default defineConfig({
  name: 'ayurvedic-wellness-studio',
  title: 'Ayurvedic Wellness Centre — Content',
  basePath: '/studio',

  projectId,
  dataset,

  schema: { types: schemaTypes },

  plugins: [
    structureTool(),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
})
