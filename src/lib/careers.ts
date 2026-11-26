/**
 * Job vacancy shown on the website: the "We're hiring" strip at the top of
 * every page, the home page section, the footer link and /careers.
 *
 * To take it all down when the post is filled, set HIRING_OPEN to false (the
 * Careers page then says there are no vacancies right now). Change the
 * details here only; every place that shows the vacancy reads this file.
 */

export const HIRING_OPEN = true

export const VACANCY = {
  title: 'Admin Assistant',
  /** Shown in the strip and home section. */
  short: 'We are hiring an Admin Assistant',
  location: 'Brickfields, Kuala Lumpur (5 minutes’ walk from KL Sentral / NU Sentral)',
  salary: 'Basic salary RM2,500 – RM3,000 (based on experience), plus attractive performance-based commissions',
  salaryMin: 2500,
  salaryMax: 3000,
  /** Where applicants send their resume. */
  applyEmail: 'ayurvedicwellness2026@gmail.com',
  datePosted: '2026-11-26',
  poster: '/careers/admin-assistant-hiring-v2.jpg',
  duties: [
    'Provide administrative support to ensure smooth office operations',
    'Assist in documentation, filing and data entry',
    'Coordinate with internal teams and external parties',
    'Handle ad-hoc assignments',
    'Be part of a supportive and friendly team',
  ],
  perks: ['Friendly work environment', 'Learn and grow your skills', 'Career development opportunities', 'Supportive management team'],
} as const

/** Opens a new email to the centre, with the subject and a short opening line filled in. */
export function applyMailto(): string {
  const subject = encodeURIComponent(`Application: ${VACANCY.title}`)
  const body = encodeURIComponent(`Hi, I would like to apply for the ${VACANCY.title} position. My resume is attached.\n\nName:\nPhone:\n`)
  return `mailto:${VACANCY.applyEmail}?subject=${subject}&body=${body}`
}
