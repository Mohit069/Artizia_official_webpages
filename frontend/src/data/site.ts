/* Ported verbatim from assets/js/data.js — window.SITE */
export const SITE = {
  phone: '+91 89528 15800',
  phoneRaw: '+918952815800',
  email: 'sales@artizia.co.in',
  address:
    'Plot No. PA-008-020-023, Mahindra World City Jaipur, Bhambhoriya Sanganer, Jaipur — 302037, Rajasthan',
  mapUrl: 'https://maps.google.com/?q=Mahindra+World+City+Jaipur',
  mapQuery: 'Mahindra World City Jaipur',
  mapZoom: 14,
  hours: [
    ['Monday – Friday', '9:00 AM – 6:00 PM'],
    ['Saturday', '10:00 AM – 4:00 PM'],
    ['Sunday', 'Closed'],
  ] as [string, string][],
  social: {
    instagram: 'https://www.instagram.com/artizia_by_marudhar/',
    facebook: '',
    linkedin: 'https://www.linkedin.com/company/artizia-by-marudhar/',
  },
}

export type SiteData = typeof SITE
