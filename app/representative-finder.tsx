'use client'

import { startTransition, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { LoaderCircle, Mail, MapPinHouse, Phone, Send, ShieldCheck } from 'lucide-react'

type LookupSuccess = {
  address: string
  councilor: string
  email: string
  neighborhood: string
  phone: string
  ward: string
}

type LookupError = {
  error?: string
}

type GooglePlaceResult = {
  formattedAddress?: string
  name?: string
  displayName?: string
  location?: {
    lat?: () => number
    lng?: () => number
  }
  fetchFields?: (options: { fields: string[] }) => Promise<void>
}

type GooglePlacePrediction = {
  toPlace?: () => GooglePlaceResult
}

type GooglePlaceSelectEvent = Event & {
  placePrediction?: GooglePlacePrediction
}

type GooglePlaceAutocompleteElement = HTMLElement & {
  includedPrimaryTypes?: string[]
  includedRegionCodes?: string[]
}

declare global {
  interface Window {
    __googleMapsPlacesLoader?: Promise<void>
    __initGoogleMapsPlaces?: () => void
    google?: {
      maps?: {
        places?: {
          PlaceAutocompleteElement?: new () => GooglePlaceAutocompleteElement
        }
      }
    }
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

function buildDraft(result: LookupSuccess) {
  const subject = `Please oppose Oakline at Mill Creek in Ward ${result.ward}`
  const body = [
    `Dear Councilor ${result.councilor},`,
    '',
    `I live in Ward ${result.ward} and I am writing to urge you to oppose Oakline at Mill Creek.`,
    '',
    'I am concerned about the impact this project could have on the neighborhood, nearby residents, and the future of this area of Salem.',
    '',
    'Please help protect this part of our community and speak out against Oakline at Mill Creek.',
    '',
    'Thank you for your time and public service.',
    '',
    'Sincerely,',
    '[Your name]',
    '[Your Salem neighborhood or address, optional]'
  ].join('\n')

  return { subject, body }
}

export default function RepresentativeFinder() {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState<LookupSuccess | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [draftVisible, setDraftVisible] = useState(false)
  const [autocompleteReady, setAutocompleteReady] = useState(false)
  const [isPending, startLookup] = useTransition()
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const widgetHostRef = useRef<HTMLDivElement | null>(null)

  const mailtoHref = useMemo(() => {
    if (!result || !draftVisible) {
      return '#'
    }

    const params = new URLSearchParams({
      subject,
      body
    })

    return `mailto:${result.email}?${params.toString()}`
  }, [body, draftVisible, result, subject])

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !widgetHostRef.current) {
      return
    }

    let cancelled = false

    loadGooglePlacesLibrary(GOOGLE_MAPS_API_KEY)
      .then(() => {
        const host = widgetHostRef.current
        const PlaceAutocompleteElement = window.google?.maps?.places?.PlaceAutocompleteElement

        if (cancelled || !host || !PlaceAutocompleteElement) {
          return
        }

        host.innerHTML = ''

        const autocomplete = new PlaceAutocompleteElement()
        autocomplete.className = 'google-place-autocomplete'
        autocomplete.includedPrimaryTypes = ['street_address']
        autocomplete.includedRegionCodes = ['us']
        autocomplete.setAttribute('aria-label', 'Salem address')

        const handleSelect = async (event: Event) => {
          const placePrediction = (event as GooglePlaceSelectEvent).placePrediction
          const place = placePrediction?.toPlace?.()

          if (!place?.fetchFields) {
            return
          }

          await place.fetchFields({
            fields: ['formattedAddress', 'displayName', 'location']
          })

          const nextAddress = place.formattedAddress ?? place.displayName ?? ''
          setAddress(nextAddress)
          setSelectedCoordinates(
            typeof place.location?.lat === 'function' && typeof place.location?.lng === 'function'
              ? {
                  lat: place.location.lat(),
                  lng: place.location.lng()
                }
              : null
          )
        }

        autocomplete.addEventListener('gmp-select', handleSelect)
        host.appendChild(autocomplete)
        setAutocompleteReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setAutocompleteReady(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedAddress = address.trim()

    if (!trimmedAddress || !selectedCoordinates) {
      setError('Choose your address from the dropdown to find your representative.')
      return
    }

    startLookup(async () => {
      setError(null)

      try {
        const params = new URLSearchParams({
          address: trimmedAddress
        })

        if (selectedCoordinates) {
          params.set('lat', String(selectedCoordinates.lat))
          params.set('lng', String(selectedCoordinates.lng))
        }

        const response = await fetch(`/api/representative?${params.toString()}`)
        const payload = (await response.json()) as LookupSuccess | LookupError

        if (!response.ok || !('ward' in payload)) {
          const message =
            'error' in payload && typeof payload.error === 'string'
              ? payload.error
              : 'We could not find a matching Salem ward for that address.'

          throw new Error(message)
        }

        startTransition(() => {
          setResult(payload)
          const draft = buildDraft(payload)
          setSubject(draft.subject)
          setBody(draft.body)
          setDraftVisible(false)
        })
      } catch (submissionError) {
        startTransition(() => {
          setResult(null)
          setDraftVisible(false)
          setError(
            submissionError instanceof Error
              ? submissionError.message
              : 'Something went wrong while looking up that address.'
          )
        })
      }
    })
  }

  function handleGenerateDraft() {
    if (!result) {
      return
    }

    const draft = buildDraft(result)
    setSubject(draft.subject)
    setBody(draft.body)
    setDraftVisible(true)
  }

  return (
    <section className='w-full max-w-xl shrink-0 rounded-[2rem] border border-white/60 bg-white/88 p-6 shadow-[0_26px_80px_rgba(8,29,23,0.14)] backdrop-blur sm:p-8'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-sm font-semibold uppercase tracking-[0.24em] text-[var(--clay)]'>Start here</p>
          <h2 className='mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]'>Enter your address</h2>
          <p className='mt-3 max-w-md text-sm leading-6 text-[color:rgba(29,37,35,0.72)]'>
            We&apos;ll match it to your Salem ward and show the right person to contact.
          </p>
        </div>
        <div className='rounded-2xl bg-[var(--cream)] p-3 text-[var(--pine)]'>
          <MapPinHouse className='size-6' />
        </div>
      </div>

      <form className='mt-8 space-y-4' onSubmit={handleSubmit}>
        <div className='rounded-[1.75rem] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'>
          <div className='flex flex-col gap-3'>
            <div className='min-w-0 w-full' ref={widgetHostRef} />
            <button
              className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pine)] px-5 py-4 text-base font-semibold text-white transition hover:bg-[var(--pine-deep)] disabled:cursor-not-allowed disabled:bg-[color:rgba(33,94,78,0.55)]'
              disabled={isPending || !autocompleteReady}
              type='submit'
            >
              {isPending ? (
                <LoaderCircle className='size-5 animate-spin' />
              ) : (
                <MapPinHouse className='size-5' />
              )}
              {isPending ? 'Looking up...' : 'Find my representative'}
            </button>
          </div>
        </div>
      </form>

      <div className='mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--mist)] px-3 py-2 text-xs text-[color:rgba(29,37,35,0.75)]'>
        <ShieldCheck className='size-4 text-[var(--pine)]' />
        We do not store your address or contact details.
      </div>

      {error ? (
        <div className='mt-6 rounded-2xl border border-[color:rgba(189,65,47,0.18)] bg-[color:rgba(189,65,47,0.08)] px-4 py-3 text-sm leading-6 text-[var(--redwood)]'>
          {error}
        </div>
      ) : null}

      {result ? (
        <div className='mt-8 space-y-6'>
          <div className='rounded-[1.75rem] border border-[var(--line)] bg-[var(--paper)] p-6'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <p className='text-sm font-semibold uppercase tracking-[0.24em] text-[var(--clay)]'>
                  Ward {result.ward}
                </p>
                <h3 className='mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]'>
                  {result.councilor}
                </h3>
                <p className='mt-2 max-w-md text-sm leading-6 text-[color:rgba(29,37,35,0.8)]'>
                  Neighborhood association: {result.neighborhood}
                </p>
              </div>
              <div className='w-full rounded-2xl bg-[var(--cream)] px-4 py-3 text-left sm:w-auto sm:max-w-[14rem] sm:text-right'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[var(--clay)]'>
                  Matched address
                </p>
                <p className='mt-1 text-sm leading-5 text-[var(--ink)]'>{result.address}</p>
              </div>
            </div>

            <div className='mt-6 grid gap-3'>
              <a
                className='inline-flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--clay)]'
                href={`mailto:${result.email}`}
              >
                <Mail className='size-4 text-[var(--pine)]' />
                {result.email}
              </a>
              <a
                className='inline-flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--clay)]'
                href={`tel:${result.phone}`}
              >
                <Phone className='size-4 text-[var(--pine)]' />
                {result.phone}
              </a>
            </div>

            <button
              className='mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--clay)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--clay-deep)]'
              onClick={handleGenerateDraft}
              type='button'
            >
              <Send className='size-4' />
              Generate email draft
            </button>
          </div>

          {draftVisible ? (
            <div className='rounded-[1.75rem] border border-[var(--line)] bg-white p-6'>
              <p className='text-sm font-semibold uppercase tracking-[0.24em] text-[var(--clay)]'>
                Write a message
              </p>

              <label className='mt-5 block'>
                <span className='mb-2 block text-sm font-medium text-[var(--ink)]'>Subject</span>
                <input
                  className='w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-base text-[var(--ink)] outline-none transition focus:border-[var(--clay)] focus:ring-4 focus:ring-[color:rgba(235,127,44,0.14)]'
                  onChange={(event) => setSubject(event.target.value)}
                  value={subject}
                />
              </label>

              <label className='mt-4 block'>
                <span className='mb-2 block text-sm font-medium text-[var(--ink)]'>Message</span>
                <textarea
                  className='min-h-64 w-full rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] px-4 py-4 text-base leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--clay)] focus:ring-4 focus:ring-[color:rgba(235,127,44,0.14)]'
                  onChange={(event) => setBody(event.target.value)}
                  value={body}
                />
              </label>

              <a
                className='mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--pine)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)]'
                href={mailtoHref}
              >
                <Mail className='size-4' />
                Open email app
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function loadGooglePlacesLibrary(apiKey: string) {
  if (window.google?.maps?.places?.PlaceAutocompleteElement) {
    return Promise.resolve()
  }

  if (window.__googleMapsPlacesLoader) {
    return window.__googleMapsPlacesLoader
  }

  window.__googleMapsPlacesLoader = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-google-maps-places="true"]'
    ) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load')), {
        once: true
      })
      return
    }

    const callbackName = '__initGoogleMapsPlaces'
    window[callbackName] = () => {
      resolve()
      delete window[callbackName]
    }

    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.dataset.googleMapsPlaces = 'true'
    script.onerror = () => {
      reject(new Error('Google Maps failed to load'))
      delete window[callbackName]
    }
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      '&libraries=places&loading=async&callback=__initGoogleMapsPlaces'

    document.head.appendChild(script)
  })

  return window.__googleMapsPlacesLoader
}
