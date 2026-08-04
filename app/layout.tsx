import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stop Oakline At Mill Creek | Salem, Oregon',
  description:
    'Quick links, council meeting info, ward lookup, and official resources for Salem residents following the proposed Oakline at Mill Creek data center.'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className='h-full antialiased'>
      <body className='min-h-full flex flex-col'>
        <header className='sticky top-0 z-20 border-b border-[color:rgba(31,61,43,0.12)] bg-[color:rgba(246,244,238,0.94)] backdrop-blur'>
          <div className='mx-auto flex w-full max-w-6xl items-center px-4 py-4 sm:px-10 lg:px-12'>
            <a className='text-sm font-semibold uppercase tracking-[0.18em] text-[var(--pine)]' href='#top'>
              Stop Oakline
            </a>
          </div>
        </header>
        {children}
        <footer className='bg-[#1F3D2B] px-4 py-6 text-sm text-[color:rgba(246,244,238,0.78)] sm:px-10 lg:px-12'>
          <div className='mx-auto flex w-full max-w-6xl items-center justify-center gap-3 sm:justify-start'>
            <p>Made for the people of Salem. ❤️</p>
          </div>
        </footer>
      </body>
      <Analytics />
    </html>
  )
}
