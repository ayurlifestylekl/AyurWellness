export interface CountryCode {
  iso2: string
  name: string
  dial: string
  flag: string
}

/**
 * Dial codes for a country picker on the booking phone field. Malaysia is
 * pinned first (the clinic's home market), followed by the countries whose
 * travellers most commonly book (Southeast/East Asia, then everywhere else
 * alphabetically). Not an exhaustive ISO list — "Other" below covers the rest.
 */
export const COUNTRY_CODES: CountryCode[] = [
  { iso2: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { iso2: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { iso2: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { iso2: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { iso2: 'BN', name: 'Brunei', dial: '+673', flag: '🇧🇳' },
  { iso2: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { iso2: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  { iso2: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { iso2: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { iso2: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { iso2: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
  { iso2: 'MO', name: 'Macau', dial: '+853', flag: '🇲🇴' },
  { iso2: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼' },
  { iso2: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { iso2: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { iso2: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { iso2: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { iso2: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵' },
  { iso2: 'MM', name: 'Myanmar', dial: '+95', flag: '🇲🇲' },
  { iso2: 'KH', name: 'Cambodia', dial: '+855', flag: '🇰🇭' },
  { iso2: 'LA', name: 'Laos', dial: '+856', flag: '🇱🇦' },
  { iso2: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { iso2: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { iso2: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { iso2: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { iso2: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
  { iso2: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲' },
  { iso2: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱' },
  { iso2: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { iso2: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { iso2: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { iso2: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { iso2: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { iso2: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { iso2: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { iso2: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { iso2: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { iso2: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { iso2: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { iso2: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { iso2: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { iso2: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { iso2: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { iso2: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { iso2: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { iso2: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { iso2: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { iso2: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { iso2: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { iso2: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { iso2: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
  { iso2: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { iso2: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { iso2: 'US', name: 'United States / Canada', dial: '+1', flag: '🇺🇸' },
  { iso2: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { iso2: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { iso2: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { iso2: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { iso2: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { iso2: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪' },
]

export const OTHER_CODE = 'OTHER'
