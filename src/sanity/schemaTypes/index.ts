import type { SchemaTypeDefinition } from 'sanity'

import { aboutPage } from './aboutPage'
import { author } from './author'
import { faq } from './faq'
import { faqCategory } from './faqCategory'
import { post } from './post'
import { treatment } from './treatment'
import { treatmentCategory } from './treatmentCategory'

export const schemaTypes: SchemaTypeDefinition[] = [
  treatmentCategory,
  treatment,
  author,
  post,
  faqCategory,
  faq,
  aboutPage,
]
