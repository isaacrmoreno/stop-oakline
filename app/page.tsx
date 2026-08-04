import { ArrowUpRight, MapPin } from 'lucide-react'

import RepresentativeFinder from './representative-finder'

const sourceLinks = [
  {
    href: 'https://www.cityofsalem.net/Home/Components/News/News/2169/15',
    label: 'City Project Updates'
  },
  {
    href: 'https://forms.cloud.microsoft/pages/responsepage.aspx?id=tfaUCHR920mw4_ro-ciRk91Guac3-xZIpfQfKWSH7l5URVZNS1NaTDNRVjBNTE8yVU1YMjA2OFo3Vi4u&route=shorturl',
    label: 'Submit City Feedback'
  },
  {
    href: 'https://www.cityofsalem.net/government/city-council-mayor/about-city-council/find-a-ward-map',
    label: 'Find Your Ward On Salem’s Map'
  },
  {
    href: 'https://www.youtube.com/channel/UCoFd-GCEenK6yZ6rcFJYcZA',
    label: 'Watch City Council Meetings'
  },
  {
    href: 'https://www.cityofsalem.net/government/city-council-mayor/city-council-meetings/city-council-meeting-agendas-and-minutes',
    label: 'View Council Agendas And Minutes'
  },
  {
    href: 'https://www.cityofsalem.net/government/city-council-mayor/city-council-meetings/public-meeting-calendar/-selcat-114/-toggle-next30days',
    label: 'See The Next Council Meeting'
  },
  {
    href: 'https://www.cityofsalem.net/comment-at-council',
    label: 'Attend Or Comment At Council'
  },
  {
    href: 'https://oaklineatmillcreek.com/',
    label: 'Oakline Project Website'
  },
  {
    href: 'https://www.verrusdata.com/',
    label: 'Verrus Company Website'
  }
] as const

const siteAddress = '4610 Mill Creek Drive SE, Salem, OR 97317'
function QuickLink({
  href,
  label,
  external = true
}: {
  href: string
  label: string
  external?: boolean
}) {
  return (
    <a
      className='group rounded-[1.25rem] border border-[color:rgba(31,61,43,0.08)] bg-[var(--paper)] p-4 transition hover:border-[color:rgba(31,61,43,0.18)] hover:bg-white'
      href={href}
      rel={external ? 'noreferrer' : undefined}
      target={external ? '_blank' : undefined}>
      <div className='flex items-center justify-between gap-4'>
        <span className='text-sm font-medium text-[var(--ink)]'>{label}</span>
        <ArrowUpRight className='size-4 shrink-0 text-[var(--pine)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
      </div>
    </a>
  )
}

function mapHref(address: string, provider: 'google' | 'apple') {
  const encoded = encodeURIComponent(address)

  if (provider === 'apple') {
    return `https://maps.apple.com/?q=${encoded}`
  }

  return `https://www.google.com/maps/search/?api=1&query=${encoded}`
}

export default function Home() {
  return (
    <main className='relative flex-1 overflow-hidden bg-[var(--page-bg)] text-[var(--ink)]' id='top'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(235,127,44,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(31,61,43,0.12),transparent_34%)]' />

      <div className='relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-3 py-8 sm:gap-16 sm:px-10 sm:py-10 lg:px-12 lg:py-16'>
        <section className='grid scroll-mt-24 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,38rem)] lg:items-start' id='about'>
          <div className='max-w-2xl'>
            <h1 className='mt-5 max-w-3xl text-4xl font-semibold leading-none tracking-[-0.04em] text-balance sm:text-6xl'>
              Stop Oakline At Mill Creek
            </h1>

            <p className='mt-5 max-w-2xl text-base leading-7 text-[color:rgba(29,37,35,0.76)]'>
              <a
                className='font-medium text-[var(--pine)] underline decoration-[color:rgba(31,61,43,0.28)] underline-offset-4'
                href='https://oaklineatmillcreek.com/'
                rel='noreferrer'
                target='_blank'>
                Oakline at Mill Creek
              </a>
              {' '}is a proposed three-building data center campus by
              <a
                className='mx-1 font-medium text-[var(--pine)] underline decoration-[color:rgba(31,61,43,0.28)] underline-offset-4'
                href='https://www.verrusdata.com/'
                rel='noreferrer'
                target='_blank'>
                Verrus
              </a>
              {' '}in southeast Salem. This site was made to help Salem residents find the information they need quickly.
            </p>

            <div className='mt-6 w-full'>
              <div className='rounded-[1.25rem] border border-white/70 bg-white/84 px-4 py-4 shadow-[0_10px_24px_rgba(8,29,23,0.05)]'>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]'>Proposed address</p>
                <p className='mt-2 flex items-center gap-2 text-sm font-medium text-[color:rgba(29,37,35,0.82)]'>
                  <MapPin className='size-4 text-[var(--pine)]' />
                  4610 Mill Creek Drive SE
                </p>
                <div className='mt-3 flex flex-wrap gap-3'>
                  <a
                    className='inline-flex items-center gap-2 rounded-full bg-[var(--mist)] px-4 py-2 text-sm font-medium text-[var(--pine)] transition hover:bg-[var(--pine)] hover:text-white'
                    href={mapHref(siteAddress, 'google')}
                    rel='noreferrer'
                    target='_blank'>
                    Open In Google Maps
                    <ArrowUpRight className='size-4' />
                  </a>
                  <a
                    className='inline-flex items-center gap-2 rounded-full bg-[var(--mist)] px-4 py-2 text-sm font-medium text-[var(--pine)] transition hover:bg-[var(--pine)] hover:text-white'
                    href={mapHref(siteAddress, 'apple')}
                    rel='noreferrer'
                    target='_blank'>
                    Open In Apple Maps
                    <ArrowUpRight className='size-4' />
                  </a>
                </div>
              </div>
            </div>

            <div className='mt-6 max-w-2xl space-y-2'>
              <p className='text-sm leading-6 text-[color:rgba(29,37,35,0.74)] sm:text-base sm:leading-7'>
                Regular City Council meetings are held on the second and fourth Monday of each month
                at 6 p.m. at{' '}
                <span className='mx-1 font-medium text-[var(--pine)]'>
                  Loucks Auditorium at Salem Public Library, 585 Liberty St. SE
                </span>
                .
              </p>
              <p className='text-sm leading-6 text-[color:rgba(29,37,35,0.74)] sm:text-base sm:leading-7'>
                Watch live on the{' '}
                <a
                  className='font-medium text-[var(--pine)] underline decoration-[color:rgba(31,61,43,0.28)] underline-offset-4'
                  href='https://www.youtube.com/channel/UCoFd-GCEenK6yZ6rcFJYcZA'
                  rel='noreferrer'
                  target='_blank'>
                  City Council YouTube channel
                </a>
                . Agenda comments can be emailed by 5 p.m. on meeting days to{' '}
                <a
                  className='font-medium text-[var(--pine)] underline decoration-[color:rgba(31,61,43,0.28)] underline-offset-4'
                  href='mailto:cityrecorder@cityofsalem.net'>
                  cityrecorder@cityofsalem.net
                </a>
                .
              </p>
              <p className='text-sm leading-6 text-[color:rgba(29,37,35,0.74)] sm:text-base sm:leading-7'>
                You can{' '}
                <a
                  className='font-medium text-[var(--pine)] underline decoration-[color:rgba(31,61,43,0.28)] underline-offset-4'
                  href='https://www.cityofsalem.net/government/city-council-mayor/city-council-meetings/public-meeting-calendar/-selcat-114/-toggle-next30days'
                  rel='noreferrer'
                  target='_blank'>
                  see the next Council meeting here
                </a>
                , and remote speakers can use the City&apos;s{' '}
                <a
                  className='font-medium text-[var(--pine)] underline decoration-[color:rgba(31,61,43,0.28)] underline-offset-4'
                  href='https://www.cityofsalem.net/comment-at-council'
                  rel='noreferrer'
                  target='_blank'>
                  Council comment page
                </a>
                .
              </p>
            </div>
          </div>

          <div className='rounded-[1.75rem] border border-white/70 bg-white/84 p-4 shadow-[0_24px_60px_rgba(8,29,23,0.1)] backdrop-blur sm:p-6'>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-[var(--clay)]'>Quick links</p>
            <div className='mt-4 grid gap-3'>
              {sourceLinks.map((link) => (
                <QuickLink key={link.label} href={link.href} label={link.label} />
              ))}
              <QuickLink href='#lookup' label='Find Your Representative On This Page' external={false} />
            </div>
          </div>
        </section>

        <RepresentativeFinder />
      </div>
    </main>
  )
}
