export interface FAQ {
  id: string
  question: string
  answer: string
}

export const faqs: FAQ[] = [
  {
    id: 'what-is-ayurveda',
    question: 'What exactly is traditional Ayurveda — and how is it different?',
    answer:
      'traditional Ayurveda is the southern, ocean-influenced lineage of Ayurveda known for its emphasis on classical Panchakarma, oil-based therapies and personalised herbal protocols. Every treatment we offer is rooted in this 5,000-year-old tradition and adapted for modern bodies dealing with stress, inactivity and processed food.',
  },
  {
    id: 'do-i-need-consultation',
    question: 'Do I need a consultation before booking a therapy?',
    answer:
      'Yes — we ask every first-time guest to start with a 30-minute consultation with our Vaidyas. He assesses your dosha, listens to your history and prescribes the right therapy, oil blend and duration. This is what separates a real Ayurvedic protocol from a generic spa treatment.',
  },
  {
    id: 'same-gender-policy',
    question: 'Are therapies performed by same-gender therapists?',
    answer:
      'Always. traditional Ayurveda is strictly same-gender — male therapists work with male guests and female therapists with female guests. This is non-negotiable and is part of how we keep the practice respectful, safe and authentic.',
  },
  {
    id: 'cancellation',
    question: 'What is your cancellation and refund policy?',
    answer:
      'We require at least 48 hours notice for cancellations or rescheduling. Advance payments made to secure a treatment slot are non-refundable, but they can be transferred to another date or another guest with sufficient notice.',
  },
  {
    id: 'products-authentic',
    question: 'Are your products authentic and how are they sourced?',
    answer:
      'Every product in our apothecary is hand-blended in small batches using herbs and oils sourced directly from trusted Ayurvedic suppliers. There are no fillers, parabens or synthetic fragrances — what you see on the label is what is in the bottle.',
  },
  {
    id: 'shipping-payment',
    question: 'How do shipping and payments work?',
    answer:
      'We ship across Malaysia, with free delivery on all orders above RM150. Payments are processed securely through Billplz, supporting credit/debit cards and Malaysian online banking. Orders typically reach you within 2–4 working days.',
  },
  {
    id: 'clinic-location',
    question: 'Where is Ayurvedic Wellness Centre located?',
    answer:
      'Ayurvedic Wellness Centre is located in Brickfields, Kuala Lumpur — the cultural heart of KL. We proudly serve the Klang Valley community with authentic traditional Ayurveda treatments. Walk-ins are welcome, but we recommend booking a consultation in advance via WhatsApp.',
  },
]
