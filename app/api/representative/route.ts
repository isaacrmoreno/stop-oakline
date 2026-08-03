import { NextRequest } from 'next/server'

const GEOCODER_URL =
  'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates'
const SALEM_LAYER_URL =
  'https://services.arcgis.com/kIA6yS9KDGqZL7U3/arcgis/rest/services/Wards_Neighborhood_Combined/FeatureServer/0/query'

type GeocodeResponse = {
  candidates?: Array<{
    address?: string
    location?: {
      x?: number
      y?: number
    }
  }>
}

type WardResponse = {
  features?: Array<{
    attributes?: {
      COUNCILOR?: string
      EMAIL?: string
      NEIGHBORHOOD_NAME?: string
      PHONE?: string
      WARD?: number | string
    }
  }>
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')?.trim()
  const latitudeParam = request.nextUrl.searchParams.get('lat')
  const longitudeParam = request.nextUrl.searchParams.get('lng')
  const latitude = latitudeParam ? Number(latitudeParam) : null
  const longitude = longitudeParam ? Number(longitudeParam) : null

  if (!address && (latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude))) {
    return Response.json({ error: 'An address or map coordinates are required.' }, { status: 400 })
  }

  try {
    const location =
      latitude !== null && longitude !== null && !Number.isNaN(latitude) && !Number.isNaN(longitude)
        ? {
            latitude,
            longitude,
            matchedAddress: address ?? 'Selected Salem address'
          }
        : await geocodeAddress(address!)

    if (!location) {
      return Response.json(
        { error: 'We could not match that address. Try entering a full Salem street address.' },
        { status: 404 }
      )
    }

    const match = await lookupWard(location.longitude, location.latitude)

    if (!match) {
      return Response.json(
        { error: 'That address did not return a Salem ward. Double-check the address and try again.' },
        { status: 404 }
      )
    }

    return Response.json({
      address: location.matchedAddress,
      councilor: match.councilor,
      email: match.email,
      neighborhood: match.neighborhood,
      phone: match.phone,
      ward: match.ward
    })
  } catch {
    return Response.json(
      { error: 'The city lookup service is temporarily unavailable. Please try again in a moment.' },
      { status: 502 }
    )
  }
}

async function geocodeAddress(address: string) {
  const params = new URLSearchParams({
    SingleLine: address,
    outFields: 'Match_addr',
    f: 'json',
    maxLocations: '1'
  })

  const response = await fetch(`${GEOCODER_URL}?${params.toString()}`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error('Geocoder request failed')
  }

  const data = (await response.json()) as GeocodeResponse
  const candidate = data.candidates?.[0]
  const longitude = candidate?.location?.x
  const latitude = candidate?.location?.y

  if (typeof longitude !== 'number' || typeof latitude !== 'number' || !candidate?.address) {
    return null
  }

  return {
    latitude,
    longitude,
    matchedAddress: candidate.address
  }
}

async function lookupWard(longitude: number, latitude: number) {
  const params = new URLSearchParams({
    geometry: `${longitude},${latitude}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'WARD,COUNCILOR,EMAIL,PHONE,NEIGHBORHOOD_NAME',
    returnGeometry: 'false',
    f: 'json'
  })

  const response = await fetch(`${SALEM_LAYER_URL}?${params.toString()}`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error('Ward lookup request failed')
  }

  const data = (await response.json()) as WardResponse
  const attributes = data.features?.[0]?.attributes

  if (
    !attributes?.WARD ||
    !attributes.COUNCILOR ||
    !attributes.EMAIL ||
    !attributes.PHONE ||
    !attributes.NEIGHBORHOOD_NAME
  ) {
    return null
  }

  return {
    councilor: attributes.COUNCILOR,
    email: attributes.EMAIL,
    neighborhood: attributes.NEIGHBORHOOD_NAME,
    phone: attributes.PHONE,
    ward: String(attributes.WARD)
  }
}
