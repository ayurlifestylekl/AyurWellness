import { DocumentTextIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Journal Post',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'meta', title: 'Meta & SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required().max(110),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'meta',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description:
        'One or two sentences shown under the title and on the listing card. Used as the SEO description.',
      validation: (rule) => rule.max(220),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      description: 'Wide editorial photograph used as the article banner.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the photograph for screen readers.',
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      group: 'content',
      to: [{ type: 'author' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'meta',
      options: { layout: 'tags' },
      description:
        'Short topical tags (e.g. "Panchakarma", "Sleep", "Skin"). Shown above the title.',
    }),
    defineField({
      name: 'readingTimeMinutes',
      title: 'Reading time override (minutes)',
      type: 'number',
      group: 'meta',
      description:
        'Optional. Leave blank to auto-calculate from the body word count (~220 wpm).',
      validation: (rule) => rule.integer().min(1).max(120),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      description:
        'The article body. Paste rich text and drop in inline images. Headings, lists and quotes are styled automatically on the live site.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal',         value: 'normal' },
            { title: 'Heading 2',      value: 'h2' },
            { title: 'Heading 3',      value: 'h3' },
            { title: 'Pull quote',     value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet',  value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold',   value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (rule) =>
                      rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          name: 'inlineImage',
          title: 'Inline image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional italic caption shown below the image.',
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      authorName: 'author.name',
      media: 'heroImage',
      publishedAt: 'publishedAt',
    },
    prepare: ({ title, authorName, media, publishedAt }) => ({
      title,
      subtitle: [authorName, publishedAt?.slice(0, 10)].filter(Boolean).join(' · '),
      media,
    }),
  },
  orderings: [
    {
      title: 'Published, newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})
