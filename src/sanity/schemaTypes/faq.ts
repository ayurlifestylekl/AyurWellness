import { HelpCircleIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

const SURFACE_OPTIONS = [
  { title: 'Home page', value: 'home' },
  { title: 'Contact page', value: 'contact' },
  { title: 'About page', value: 'about' },
] as const

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (rule) => rule.required().max(180),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 5,
      description: 'Plain-text answer shown inside the accordion on the live site.',
      validation: (rule) => rule.required().max(1200),
    }),
    defineField({
      name: 'surface',
      title: 'Show on',
      type: 'string',
      description: 'Which page this FAQ appears on. Pick one — the same question can be duplicated across surfaces if needed.',
      options: {
        list: SURFACE_OPTIONS.map(({ title, value }) => ({ title, value })),
        layout: 'radio',
      },
      initialValue: 'home',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'faqCategory' }],
      description: 'Optional — helps organise long FAQ lists in the Studio.',
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers appear first. Leave blank to fall back to alphabetical.',
      validation: (rule) => rule.integer().min(0),
    }),
  ],
  preview: {
    select: {
      title: 'question',
      surface: 'surface',
      categoryTitle: 'category.title',
    },
    prepare: ({ title, surface, categoryTitle }) => {
      const surfaceLabel =
        SURFACE_OPTIONS.find((opt) => opt.value === surface)?.title ?? surface
      return {
        title,
        subtitle: [surfaceLabel, categoryTitle].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [
        { field: 'surface', direction: 'asc' },
        { field: 'order', direction: 'asc' },
      ],
    },
  ],
})
