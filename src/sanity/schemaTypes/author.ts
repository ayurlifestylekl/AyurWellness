import { UserIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Full name as it should appear in the byline (e.g. "Vaidya [Full Name], B.A.M.S., M.D. (Ayu)").',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / credentials',
      type: 'string',
      description: 'Short credential line, e.g. "Vaidya · B.A.M.S".',
      initialValue: 'Vaidya · B.A.M.S',
    }),
    defineField({
      name: 'image',
      title: 'Portrait',
      type: 'image',
      options: { hotspot: true },
      description: 'Square or 4:5 portrait. Used in bylines and the bottom bio card.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'For screen readers — describe who is in the photo.',
        }),
      ],
    }),
    defineField({
      name: 'bio',
      title: 'Short biography',
      type: 'text',
      rows: 4,
      description:
        'Two or three sentences shown in the article footer. Speak in third person.',
      validation: (rule) => rule.max(420),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'image' },
  },
})
