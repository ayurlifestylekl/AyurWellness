import { defineField, defineType } from 'sanity'

export const treatmentCategory = defineType({
  name: 'treatmentCategory',
  title: 'Treatment Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      description:
        'Auto-generated from the title. Used in the public URL: /treatments/<slug>.',
      options: { source: 'title', maxLength: 64 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Category image',
      description:
        'Shown in the image panel of the category box on /treatments. ' +
        'If absent, a brand-coloured fallback panel is rendered.',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (rule) =>
            rule.custom((alt, ctx) => {
              const parent = ctx.parent as { asset?: unknown } | undefined
              if (!parent?.asset) return true
              return alt ? true : 'Alt text is required when an image is set'
            }),
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Short description',
      description:
        'One-sentence teaser. Used on the category box and as the category page dek. ' +
        'Keep under 140 characters.',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(140),
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Controls category order on /treatments. Lower numbers appear first.',
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
