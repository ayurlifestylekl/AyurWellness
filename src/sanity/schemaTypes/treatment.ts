import { defineField, defineType } from 'sanity'

export const treatment = defineType({
  name: 'treatment',
  title: 'Treatment',
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
        'Auto-generated from the title. Used in the public URL: /treatments/<category>/<slug>.',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'treatmentCategory' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display order within category',
      type: 'number',
      description:
        'Lower numbers appear first in the category grid and switcher. ' +
        'Drives the roman-numeral ordering.',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'Free-text duration label, e.g. "1 Hour 30 min".',
    }),
    defineField({
      name: 'price',
      title: 'Price (RM)',
      type: 'number',
      description:
        'Standard price in Malaysian Ringgit. Leave empty for consultation- or enquiry-only therapies (use Price label instead).',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'priceLabel',
      title: 'Price label (override)',
      type: 'string',
      description:
        'Optional display override shown instead of the numeric price, e.g. "From RM50", "On consultation", "Enquiry only". When set, this is shown verbatim.',
    }),
    defineField({
      name: 'bookingType',
      title: 'Booking type',
      type: 'string',
      description:
        'Controls how this therapy is booked. Direct = pay & book online. Consultation = a practitioner consultation is required first. Enquiry = cannot be booked online, enquiry only.',
      options: {
        list: [
          { title: 'Direct (bookable online)', value: 'direct' },
          { title: 'Consultation required first', value: 'consultation' },
          { title: 'Enquiry only (offline)', value: 'enquiry' },
        ],
        layout: 'radio',
      },
      initialValue: 'direct',
    }),
    defineField({
      name: 'bookingLeadTimeHours',
      title: 'Booking lead time (hours)',
      type: 'number',
      description:
        'Minimum advance notice required before the appointment, in hours (e.g. 24 = "book 1 day before", 48 = "book 2 days before"). Leave empty for same-day bookable.',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'description',
      title: 'Short description (dek)',
      description: 'Shown on the therapy card and as the detail-page dek. 1–3 short sentences.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'requiresConsultation',
      title: 'Requires practitioner consultation',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      description:
        'Strongly recommended. If absent, the page renders a brand-matched fallback panel until a photo is added.',
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
      name: 'gallery',
      title: 'Gallery (3–6 images)',
      type: 'array',
      of: [
        {
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
        },
      ],
      validation: (rule) => rule.min(0).max(6),
    }),
    defineField({
      name: 'body',
      title: 'Long-form overview',
      description: 'Portable Text. Multiple paragraphs about the therapy.',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'benefits',
      title: 'Benefits',
      description: 'Short bullet points. 4–8 recommended.',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (rule) => rule.max(12),
    }),
    defineField({
      name: 'procedureSteps',
      title: 'What to expect (procedure steps)',
      description: 'Numbered session flow.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Step title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Step description',
              type: 'text',
              rows: 2,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'description' } },
        },
      ],
      validation: (rule) => rule.max(10),
    }),
    defineField({
      name: 'sessionsRecommended',
      title: 'Sessions recommended',
      description: 'Free-text label, e.g. "3–7 sessions" or "Single session".',
      type: 'string',
    }),
    defineField({
      name: 'contraindications',
      title: 'Not suitable for',
      description: 'Free-text disclaimer paragraph.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'origin',
      title: 'Origin (marginalia)',
      description: 'Short note for the left margin, e.g. "Classical Ayurvedic tradition, c. 12th century".',
      type: 'string',
    }),
    defineField({
      name: 'sanskritName',
      title: 'Sanskrit name (marginalia)',
      description: 'Devanagari + transliteration, e.g. "मुख लेपम् · Mukha-lepam".',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'duration',
      categoryTitle: 'category.title',
      price: 'price',
      priceLabel: 'priceLabel',
    },
    prepare: ({ title, subtitle, categoryTitle, price, priceLabel }) => {
      const priceText = priceLabel || (typeof price === 'number' ? `RM${price}` : null)
      return {
        title,
        subtitle: [categoryTitle, subtitle, priceText].filter(Boolean).join(' · '),
      }
    },
  },
})
