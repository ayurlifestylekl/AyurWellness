export interface Review {
  id: string
  name: string
  location: string
  rating: number
  text: string
  treatment?: string
  date: string
}

/**
 * Placeholder reviews — replace with real customer testimonials.
 * Each review references actual treatments and the clinic's doctor
 * for SEO and authenticity.
 */
export const reviews: Review[] = [
  {
    id: 'r1',
    name: 'Priya Menon',
    location: 'Petaling Jaya, KL',
    rating: 5,
    text: 'I had been struggling with chronic back pain for years. After just three Abhyanga sessions with our certified Vaidyas, the relief was incredible. The therapists are so skilled — you can tell they have real, authentic training.',
    treatment: 'Abhyanga',
    date: 'February 2026',
  },
  {
    id: 'r2',
    name: 'Rajesh Kumar',
    location: 'Bangsar, KL',
    rating: 5,
    text: 'The Shirodhara session was unlike anything I have experienced. Within 20 minutes the mental chatter just stopped. I slept better that night than I had in months. Truly authentic Ayurveda in Brickfields.',
    treatment: 'Shirodhara',
    date: 'January 2026',
  },
  {
    id: 'r3',
    name: 'Siti Aminah',
    location: 'Subang Jaya, Selangor',
    rating: 5,
    text: 'I did the full Panchakarma detox programme over five days. The personalised dosha assessment from our certified Vaidyas was very thorough. I felt lighter, clearer, and more energised than I have in years.',
    treatment: 'Panchakarma',
    date: 'March 2026',
  },
  {
    id: 'r4',
    name: 'David Tan',
    location: 'Mont Kiara, KL',
    rating: 5,
    text: 'As someone who sits at a desk 10 hours a day, the joint care therapy here has been life-changing. The herbal oils they use are clearly high quality — nothing like what you get at a regular spa.',
    treatment: 'Abhyanga',
    date: 'December 2025',
  },
  {
    id: 'r5',
    name: 'Anitha Rajan',
    location: 'Cheras, KL',
    rating: 5,
    text: 'I brought my mother here for elderly wellness care. The team was so gentle and attentive. Our certified Vaidyas took time to explain every step of the treatment plan. We have been coming back every month since.',
    treatment: 'Consultation',
    date: 'January 2026',
  },
  {
    id: 'r6',
    name: 'Muhammad Faizal',
    location: 'Sri Petaling, KL',
    rating: 5,
    text: 'The stress relief programme is exactly what working professionals need. After my first session I understood why traditional Ayurveda is different from a normal massage. This is genuine healing, not just relaxation.',
    treatment: 'Shirodhara',
    date: 'February 2026',
  },
]
