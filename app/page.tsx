import RepresentativeFinder from './representative-finder'

export default function Home() {
  return (
    <main className='relative flex-1 overflow-hidden bg-[var(--page-bg)] text-[var(--ink)]'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(235,127,44,0.2),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(33,94,78,0.16),transparent_34%)]' />
      <div className='relative mx-auto flex min-h-full w-full max-w-6xl flex-col gap-12 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:gap-16 lg:px-12 lg:py-16'>
        <section className='flex w-full max-w-2xl flex-col justify-center gap-6'>
          <div className='inline-flex w-fit items-center gap-2 rounded-full border border-white/60 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--pine)] shadow-[0_12px_30px_rgba(8,29,23,0.08)] backdrop-blur'>
            Stop Oakline at Mill Creek
          </div>

          <div className='space-y-4'>
            <h1 className='max-w-xl text-5xl font-semibold leading-none tracking-[-0.04em] text-balance sm:text-6xl'>
              Find your Salem City Council representative.
            </h1>
          </div>

          <p className='max-w-lg text-sm leading-7 text-[color:rgba(29,37,35,0.72)]'>
            Powered by the City of Salem&apos;s ward data. We do not store names, addresses, or
            email accounts.
          </p>
        </section>

        <RepresentativeFinder />
      </div>
    </main>
  )
}
