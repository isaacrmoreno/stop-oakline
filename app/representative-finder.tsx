'use client'

import { startTransition, useEffect, useRef, useState, useTransition } from 'react'
import { LoaderCircle, Mail, MapPinHouse, Phone } from 'lucide-react'

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

function formatDisplayName(value: string) {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

function buildDraft(result: LookupSuccess) {
  const councilorName = formatDisplayName(result.councilor)
  const subject = `Please oppose Oakline at Mill Creek in Ward ${result.ward}`
  const body = [
    `Dear Councilor ${councilorName},`,
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
  const [autocompleteReady, setAutocompleteReady] = useState(false)
  const [isPending, startLookup] = useTransition()
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const widgetHostRef = useRef<HTMLDivElement | null>(null)

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
        autocomplete.noInputIcon = true
        autocomplete.setAttribute('aria-label', 'Salem address')

        const scrollAutocompleteIntoView = () => {
          host.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }

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

        autocomplete.addEventListener('focusin', scrollAutocompleteIntoView)
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
        })
      } catch (submissionError) {
        startTransition(() => {
          setResult(null)
          setError(
            submissionError instanceof Error
              ? submissionError.message
              : 'Something went wrong while looking up that address.'
          )
        })
      }
    })
  }

  return (
    <section
      className='w-full max-w-none shrink-0 scroll-mt-24 rounded-[1.75rem] border border-white/60 bg-white/88 p-4 shadow-[0_26px_80px_rgba(8,29,23,0.14)] backdrop-blur sm:rounded-[2rem] sm:p-6'
      id='lookup'>
      <div className='flex items-center justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className='text-[2rem] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-3xl'>
            Enter your address
          </h2>
          <p className='mt-1 text-sm leading-6 text-[color:rgba(29,37,35,0.68)]'>
            Find your Salem City Council representative.
          </p>
        </div>
        <div className='rounded-2xl bg-[var(--cream)] p-2 text-[var(--pine)] sm:p-3'>
          <MapPinHouse className='size-4 sm:size-6' />
        </div>
      </div>

      <form className='mt-2 space-y-3 sm:mt-3' onSubmit={handleSubmit}>
          <div className='flex flex-col gap-2.5'>
            <div className='relative z-20 min-h-[3.25rem] min-w-0 w-full rounded-2xl border border-[var(--line)] bg-white' ref={widgetHostRef} />
          <button
            className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pine)] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[var(--pine-deep)] disabled:cursor-not-allowed disabled:bg-[color:rgba(33,94,78,0.55)]'
            disabled={isPending || !autocompleteReady}
            type='submit'>
            {isPending ? (
              <LoaderCircle className='hidden size-5 animate-spin sm:block' />
            ) : (
              <MapPinHouse className='hidden size-5 sm:block' />
            )}
            {isPending ? 'Looking up...' : 'Find my representative'}
          </button>
        </div>
      </form>

      {error ? (
        <div className='mt-4 rounded-2xl border border-[color:rgba(189,65,47,0.18)] bg-[color:rgba(189,65,47,0.08)] px-4 py-3 text-sm leading-6 text-[var(--redwood)]'>
          {error}
        </div>
      ) : null}

      {result ? (
        <div className='mt-5 space-y-4'>
          <div className='flex flex-col gap-3'>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-semibold uppercase tracking-[0.24em] text-[var(--clay)]'>
                Ward {result.ward}
              </p>
              <h3 className='mt-2 break-words text-[1.75rem] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-2xl'>
                {formatDisplayName(result.councilor)}
              </h3>
              <div className='mt-3 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[var(--clay)]'>Matched Address</p>
                <p className='mt-1.5 break-words text-sm leading-6 text-[var(--ink)]'>{result.address}</p>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row'>
            <a
              className='inline-flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--clay)] sm:flex-1'
              href={`mailto:${result.email}?subject=${encodeMailtoValue(`Ward ${result.ward} constituent reaching out about Oakline at Mill Creek`)}`}>
              <Mail className='size-4 text-[var(--pine)]' />
              <span className='min-w-0 break-all'>{result.email}</span>
            </a>
            <a
              className='inline-flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--clay)] sm:flex-1'
              href={`tel:${result.phone}`}>
              <Phone className='size-4 text-[var(--pine)]' />
              {result.phone}
            </a>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function encodeMailtoValue(value: string) {
  return encodeURIComponent(value).replace(/%20/g, '%20')
}

function loadGooglePlacesLibrary(apiKey: string) {
  if (window.google?.maps?.places?.PlaceAutocompleteElement) {
    return Promise.resolve()
  }

  if (window.__googleMapsPlacesLoader) {
    return window.__googleMapsPlacesLoader
  }

  window.__googleMapsPlacesLoader = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps-places="true"]') as HTMLScriptElement | null

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
