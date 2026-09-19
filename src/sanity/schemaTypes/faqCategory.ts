import { defineField, defineType } from 'sanity'

export const faqCategory = defineType({
  name: 'faqCategory',
  title: 'FAQ Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Category label shown to editors in the Studio sidebar. Not displayed on the public site today.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 64 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers appear first when FAQs are grouped by category.',
      validation: (rule) => rule.integer().min(0),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'order' },
    prepare: ({ title, subtitle }) => ({
      title,
      subtitle: subtitle != null ? `Order: ${subtitle}` : 'No order set',
    }),
  },
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
})
