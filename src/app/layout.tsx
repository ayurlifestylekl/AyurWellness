import type { Metadata } from "next";
import { Montserrat, Lora, Playfair_Display, Tiro_Devanagari_Sanskrit, IM_Fell_English } from "next/font/google";
import { Toaster } from "sonner";
import { CartProvider } from "@/lib/cart/CartProvider";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const devanagari = Tiro_Devanagari_Sanskrit({
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const fell = IM_Fell_English({
  subsets: ["latin"],
  variable: "--font-fell",
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  // This decorative font has no Next.js fallback-metric data; disabling the
  // automatic adjustment silences the "Failed to find font override" warning.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ayurvedawellness.com.my"),
  title: {
    default:
      "Ayurvedic Wellness Centre | Authentic Ayurveda in Brickfields, KL",
    template: "%s | Ayurvedic Wellness Centre",
  },
  description:
    "Ayurvedic Wellness Centre in Brickfields, Kuala Lumpur offers authentic traditional Ayurveda therapies. Book a consultation with our Vaidyas, shop pure herbal formulas and discover Panchakarma, Abhyanga and Shirodhara treatments.",
  keywords: [
    "Ayurveda",
    "Traditional Ayurveda",
    "Brickfields",
    "Kuala Lumpur",
    "Panchakarma",
    "Abhyanga KL",
    "Shirodhara KL",
    "Holistic Healing Malaysia",
    "Ayurvedic products Malaysia",
    "Ayurvedic herbal oils",
    "Vaidya consultation Malaysia",
  ],
  authors: [{ name: "Ayurvedic Wellness Centre" }],
  creator: "Ayurvedic Wellness Centre",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: "https://ayurvedawellness.com.my",
    siteName: "Ayurvedic Wellness Centre",
    title:
      "Ayurvedic Wellness Centre | Authentic Ayurveda in Brickfields, KL",
    description:
      "Authentic traditional Ayurveda. Therapies, herbal products and consultations with our Vaidyas in the heart of Kuala Lumpur.",
    images: [
      {
        url: "/hero-tray.png",
        width: 1200,
        height: 630,
        alt: "Ayurvedic Wellness Centre — authentic herbs and therapies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ayurvedic Wellness Centre | Brickfields, KL",
    description:
      "Authentic traditional Ayurveda. Book a consultation with our Vaidyas.",
    images: ["/hero-tray.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${lora.variable} ${playfair.variable} ${devanagari.variable} ${fell.variable}`}>
      <body className="antialiased font-body bg-background text-foreground">
        <CartProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                border: '1px solid rgba(18, 55, 45,0.10)',
                color: '#12372D',
                fontFamily: 'var(--font-lora)',
                fontSize: '13px',
                boxShadow:
                  '0 1px 0 0 rgba(18, 55, 45,0.04), 0 12px 30px -16px rgba(18, 55, 45,0.18)',
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
