import { HomeIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Singleton document for the /about page.
 *
 * Only the editable prose lives here. Layout, icons, animations and pillar
 * cards (Philosophy, Difference, Wellness Focus, Medical Authority)
 * stay in code for now — those carry Lucide icons and structural decisions
 * that aren't appropriate for CMS editing.
 *
 * We treat this as a soft singleton: the seed script creates exactly one
 * document with the fixed id `aboutPage` and the About page query reads
 * the first document of this type.
 */
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  icon: HomeIcon,
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'founder', title: "Founder's Story" },
    { name: 'commitment', title: 'Commitment CTA' },
  ],
  fields: [
    /* ── HERO ──────────────────────────────────────────── */
    defineField({
      name: 'heroEyebrow',
      title: 'Hero eyebrow',
      type: 'string',
      group: 'hero',
      description: 'The small uppercased label above the hero headline.',
      initialValue: 'About Ayurvedic Wellness Centre',
    }),
    defineField({
      name: 'heroHeadlineLead',
      title: 'Hero headline — lead',
      type: 'string',
      group: 'hero',
      description: 'The main heading text, e.g. "A Sanctuary for Authentic".',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'heroHeadlineAccent',
      title: 'Hero headline — accent (italic gold)',
      type: 'string',
      group: 'hero',
      description: 'The italicised gold word at the end of the headline, e.g. "Healing".',
      validation: (rule) => rule.max(30),
    }),
    defineField({
      name: 'heroSubheading',
      title: 'Hero sub-heading',
      type: 'text',
      rows: 3,
      group: 'hero',
      description: 'Short paragraph shown under the headline.',
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'heroStats',
      title: 'Hero stats',
      type: 'array',
      group: 'hero',
      description: 'Three key numbers shown in the bottom bar (e.g. "17+ Years in Brickfields").',
      validation: (rule) => rule.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'heroStat',
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              validation: (rule) => rule.required().max(10),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required().max(40),
            }),
          ],
          preview: {
            select: { title: 'value', subtitle: 'label' },
          },
        }),
      ],
    }),

    /* ── FOUNDER'S STORY ──────────────────────────────── */
    defineField({
      name: 'founderEyebrow',
      title: 'Founder eyebrow',
      type: 'string',
      group: 'founder',
      initialValue: 'Our Story',
    }),
    defineField({
      name: 'founderHeadlineLead',
      title: 'Founder headline — lead',
      type: 'string',
      group: 'founder',
      description: 'The main heading, e.g. "Bringing ancient wisdom".',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'founderHeadlineAccent',
      title: 'Founder headline — accent (italic gold)',
      type: 'string',
      group: 'founder',
      description: 'The italicised word at the end, e.g. "home.".',
      validation: (rule) => rule.max(30),
    }),
    defineField({
      name: 'founderParagraphs',
      title: 'Founder paragraphs',
      type: 'array',
      group: 'founder',
      description: 'Body copy, paragraph-by-paragraph. 2–4 short paragraphs work best.',
      of: [defineArrayMember({ type: 'text', rows: 4 })],
      validation: (rule) => rule.min(1).max(6),
    }),
    defineField({
      name: 'founderPullQuote',
      title: 'Founder pull quote',
      type: 'text',
      rows: 3,
      group: 'founder',
      description: 'Emphasised italic quote shown in a gold-bordered block.',
      validation: (rule) => rule.max(280),
    }),
    defineField({
      name: 'founderName',
      title: 'Founder name',
      type: 'string',
      group: 'founder',
      initialValue: '[FOUNDER / LEAD PRACTITIONER NAME]',
    }),
    defineField({
      name: 'founderRole',
      title: 'Founder role',
      type: 'string',
      group: 'founder',
      initialValue: 'Founder',
    }),

    /* ── COMMITMENT CTA ───────────────────────────────── */
    defineField({
      name: 'commitmentEyebrow',
      title: 'Commitment eyebrow',
      type: 'string',
      group: 'commitment',
      initialValue: 'Our Commitment to You',
    }),
    defineField({
      name: 'commitmentHeadlineLead',
      title: 'Commitment headline — lead',
      type: 'string',
      group: 'commitment',
      description: 'E.g. "Your Partner in".',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'commitmentHeadlineAccent',
      title: 'Commitment headline — accent (gold)',
      type: 'string',
      group: 'commitment',
      description: 'The gold word, e.g. "health.".',
      validation: (rule) => rule.max(30),
    }),
    defineField({
      name: 'commitmentBody',
      title: 'Commitment body',
      type: 'text',
      rows: 5,
      group: 'commitment',
      validation: (rule) => rule.max(500),
    }),
    defineField({
      name: 'commitmentClosingLine',
      title: 'Commitment closing line (italic)',
      type: 'string',
      group: 'commitment',
      description: 'A short italic sign-off shown below the body.',
      validation: (rule) => rule.max(140),
    }),
    defineField({
      name: 'commitmentPrimaryLabel',
      title: 'Primary CTA label',
      type: 'string',
      group: 'commitment',
      initialValue: 'Book a Consultation',
    }),
    defineField({
      name: 'commitmentPrimaryHref',
      title: 'Primary CTA URL',
      type: 'url',
      group: 'commitment',
      validation: (rule) =>
        rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }),
    }),
    defineField({
      name: 'commitmentSecondaryLabel',
      title: 'Secondary CTA label',
      type: 'string',
      group: 'commitment',
      initialValue: 'WhatsApp Us',
    }),
    defineField({
      name: 'commitmentSecondaryHref',
      title: 'Secondary CTA URL',
      type: 'url',
      group: 'commitment',
      validation: (rule) =>
        rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }),
    }),
    defineField({
      name: 'commitmentTrustPills',
      title: 'Trust row pills',
      type: 'array',
      group: 'commitment',
      description: 'Small uppercased tokens shown below the CTAs (e.g. "Brickfields, KL").',
      of: [defineArrayMember({ type: 'string' })],
      validation: (rule) => rule.max(6),
    }),
  ],
  preview: {
    select: {
      title: 'heroHeadlineLead',
      subtitle: 'heroEyebrow',
    },
    prepare: ({ title, subtitle }) => ({
      title: title || 'About Page',
      subtitle: subtitle || 'Singleton — /about page content',
    }),
  },
})
