import type { FAQ } from './faqs'

/**
 * FAQs curated specifically for visitors who land on /contact.
 * Tuned to the questions our receptionist answers most often:
 * appointments, shipping time, safety, payment, walk-ins.
 */
export const contactFaqs: FAQ[] = [
  {
    id: 'appointment-needed',
    question: 'Do I need an appointment for a consultation?',
    answer:
      'Yes — all first-time consultations with our Vaidyas are by appointment so they can dedicate proper time to your case history. Walk-ins are welcome for the Ayur-Store any time during opening hours. You can book via WhatsApp, the form on this page, or the main Treatments page.',
  },
  {
    id: 'shipping-time',
    question: 'How long does shipping take for Ayur-Store products?',
    answer:
      'Within Klang Valley: 1–2 working days. West Malaysia: 2–4 working days. East Malaysia (Sabah/Sarawak): 4–7 working days. You will receive a tracking number by WhatsApp the moment your order is dispatched.',
  },
  {
    id: 'pregnancy-safety',
    question: 'Are Ayurvedic treatments suitable during pregnancy?',
    answer:
      'Some treatments (specific oil therapies and prenatal Garbhini Paricharya) are safe and genuinely beneficial during pregnancy. Others are contraindicated. Please mention your trimester in the form or on WhatsApp — our Vaidyas will personally advise what is appropriate for your stage.',
  },
  {
    id: 'payment-methods',
    question: 'What payment methods do you accept?',
    answer:
      'For treatments: FPX online banking, DuitNow QR, major credit and debit cards, and cash at the clinic. Online store: Billplz (FPX + cards). All pricing is in Malaysian Ringgit (RM). Advance deposits for treatment bookings are required to secure your slot and are non-refundable per our 48-hour cancellation policy.',
  },
  {
    id: 'walk-in',
    question: 'Can I walk in without booking ahead?',
    answer:
      'For the Ayur-Store and over-the-counter enquiries, yes — you are welcome during opening hours. For consultations and therapies, please book in advance. Walk-in treatment requests are only accepted when the therapist schedule allows and are not guaranteed.',
  },
]
