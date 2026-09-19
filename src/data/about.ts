import {
  Award,
  UserCheck,
  HeartHandshake,
  Compass,
  Sprout,
  UserCog,
  Flower2,
  Bone,
  Brain,
  Sparkles,
  Droplets,
  Baby,
  Users,
  HeartPulse,
  Briefcase,
  type LucideIcon,
} from 'lucide-react'
import type { FAQ } from '@/data/faqs'

export interface AboutPillar {
  id: string
  title: string
  body: string
  icon: LucideIcon
  kicker?: string
}

export interface WellnessFocusArea {
  id: string
  label: string
  icon: LucideIcon
  highlighted?: boolean
  /** Sanskrit \u00b7 English pairing shown as the editorial kicker above the title. */
  kicker: string
  /** One-line description (\u226414 words). */
  body: string
  /** Signature treatments \u2014 shown as gold-hairline pills in the Atelier panel. */
  techniques: string[]
}

/* Section 3 — Our Philosophy */
export const philosophyPillars: AboutPillar[] = [
  {
    id: 'authenticity',
    title: 'Authenticity',
    kicker: 'Satyam \u00b7 Truth',
    body: 'Every therapy reflects the true essence of Ayurveda\u2019s 5,000-year-old healing science.',
    icon: Award,
  },
  {
    id: 'personalization',
    title: 'Personalization',
    kicker: 'Vyakti \u00b7 The Individual',
    body: 'We design each protocol around your unique constitution, history, and goals.',
    icon: UserCheck,
  },
  {
    id: 'holistic',
    title: 'Holistic Healing',
    kicker: 'Samagra \u00b7 The Whole',
    body: 'We treat the root cause \u2014 restoring balance, not just easing symptoms.',
    icon: HeartHandshake,
  },
]

/* Section 5 — The Ayurvedic Wellness Centre Difference */
export const kalsDifferences: AboutPillar[] = [
  {
    id: 'lineage',
    title: 'Expert Lineage',
    kicker: 'Parampar\u0101 \u00b7 Lineage',
    body: 'Experienced therapists using time-tested techniques passed down through generations.',
    icon: Compass,
  },
  {
    id: 'purity',
    title: 'Natural Purity',
    kicker: '\u015Auddhi \u00b7 Purity',
    body: 'Only high-quality herbal oils and formulations \u2014 no fillers, no shortcuts.',
    icon: Sprout,
  },
  {
    id: 'customised',
    title: 'Customised Care',
    kicker: 'Prak\u1E5Bti \u00b7 Your Nature',
    body: 'Every therapy tailored to your dosha, history, and personal goals.',
    icon: UserCog,
  },
  {
    id: 'environment',
    title: 'Healing Environment',
    kicker: '\u0100laya \u00b7 Sanctuary',
    body: 'A calm, welcoming space designed to slow your nervous system the moment you arrive.',
    icon: Flower2,
  },
]

/* Section 6 — Wellness Focus pills */
export const wellnessFocusAreas: WellnessFocusArea[] = [
  {
    id: 'joint-spine',
    label: 'Joint & Spine Care',
    icon: Bone,
    kicker: 'Sandhi \u00b7 Joints',
    body: 'Kati Vasti, Greeva Vasti, Janu Vasti, and Medicated Herbal Oil Therapies for Stiffness, Pain Relief, and Posture Correction.',
    techniques: ['Kati Vasti', 'Greeva Vasti', 'Janu Vasti'],
  },
  {
    id: 'stress-relief',
    label: 'Stress Relief & Relaxation',
    icon: Brain,
    kicker: 'Shanti \u00b7 Calm',
    body: 'Shirodhara and abhyanga rituals to quiet an over-worked nervous system.',
    techniques: ['Shirodhara', 'Abhyanga', 'Thalapothichil'],
  },
  {
    id: 'skin-beauty',
    label: 'Skin & Beauty Therapies',
    icon: Sparkles,
    kicker: 'Saundarya \u00b7 Radiance',
    body: 'Herbal facials, ubtan scrubs, and lepa masks for luminous, even skin.',
    techniques: ['Mukha Lepa', 'Ubtan Ritual', 'Herbal Facial'],
  },
  {
    id: 'detox',
    label: 'Detox & Rejuvenation',
    icon: Droplets,
    kicker: 'Panchakarma \u00b7 Cleansing',
    body: 'Five-action detox protocols that reset digestion, energy, and clarity.',
    techniques: ['Panchakarma', 'Virechana', 'Vasti'],
  },
  {
    id: 'post-delivery',
    label: 'Post-Delivery Care',
    icon: Baby,
    kicker: 'Sutika \u00b7 Nurture',
    body: 'A 42-day mother-care ritual to restore strength after childbirth.',
    techniques: ['42-Day Sutika', 'Yoni Pichu', 'Udwartana'],
  },
  {
    id: 'elderly',
    label: 'Elderly Wellness & Long-Term Care',
    icon: Users,
    kicker: 'Rasayana \u00b7 Longevity',
    body: 'Gentle, slow-paced protocols for mobility, sleep, and vitality.',
    techniques: ['Rasayana', 'Njavarakizhi', 'Nasya'],
  },
  {
    id: 'kids',
    label: 'Kids Wellness',
    icon: HeartPulse,
    kicker: 'Bala \u00b7 Vitality',
    body: 'Soft oil rituals and herbal tonics for growing bodies and minds.',
    techniques: ['Bala Abhyanga', 'Suvarnaprashana', 'Herbal Tonics'],
  },
  {
    id: 'occupational',
    label: 'Occupational Wellness',
    icon: Briefcase,
    highlighted: true,
    kicker: 'Karma \u00b7 For The Working Professional',
    body: 'Flexible programmes for burnout, screen fatigue, and broken sleep \u2014 built around your schedule, not ours.',
    techniques: ['Flexi Scheduling', 'Screen-Fatigue Care', 'Sleep Protocol'],
  },
]

/* Section 7 — About-specific FAQs */
export const aboutFaqs: FAQ[] = [
  {
    id: 'who-is-vaidya',
    question: 'Who are your Vaidyas?',
    answer:
      'Our Vaidyas hold a Bachelor of Ayurvedic Medicine and Surgery (B.A.M.S.) degree and an M.D. in Ayurveda, with years of clinical experience. They are registered with the National Council of Indian System of Medicine (NCISM) and recognised in Malaysia under the Ministry of Health (KKM) as Traditional & Complementary Medicine (T&CM) Ayurveda Practitioners. Every consultation at Ayurvedic Wellness Centre begins with one of them personally.',
  },
  {
    id: 'what-is-kkm',
    question: 'What is KKM and why does it matter?',
    answer:
      'KKM stands for Kementerian Kesihatan Malaysia \u2014 the Ministry of Health. KKM recognition means that our practitioners and therapists meet Malaysia\u2019s medical regulatory standards for traditional and complementary medicine. It is the official assurance that you are in qualified, accountable hands.',
  },
  {
    id: 'therapist-qualifications',
    question: 'Are your therapists formally qualified?',
    answer:
      'Yes \u2014 every therapist holds a formal Ayurvedic therapy qualification, has more than 8 years of experience, and is registered with KKM in Malaysia.',
  },
  {
    id: 'kids-elderly',
    question: 'Do you treat children and the elderly?',
    answer:
      'Absolutely. We offer dedicated kids wellness therapies and long-term elder care protocols alongside our adult treatments. Each one is gentler, slower-paced, and adjusted to the specific needs of that life stage.',
  },
  {
    id: 'working-professional',
    question: 'I\u2019m a working professional with chronic stress \u2014 can you help?',
    answer:
      'Yes \u2014 this is one of our core specialities. Our occupational wellness programmes are designed specifically for working professionals dealing with day-to-day stress, fatigue, poor sleep, and lifestyle-related concerns. We build a protocol that fits around your work schedule, not the other way around.',
  },
]
