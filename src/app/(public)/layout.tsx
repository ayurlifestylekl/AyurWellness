import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import WelcomeLeadPopup from '@/components/WelcomeLeadPopup'
import { memberAccountsOpen } from '@/lib/auth/accounts'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AnnouncementBanner />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppWidget />
      <WelcomeLeadPopup accountsOpen={memberAccountsOpen()} />
    </>
  )
}
