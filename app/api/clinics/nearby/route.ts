/**
 * Nearby Partner Clinics API
 * GET /api/clinics/nearby?lat=X&lng=Y
 * 
 * Find nearby partner clinics based on staff location using Haversine formula
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Haversine formula to calculate distance between two points on Earth
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return distance
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)

    if (isNaN(userLat) || isNaN(userLng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    // Fetch all active partner clinics
    const clinics = await prisma.partnerClinic.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    // Calculate distance for each clinic
    const clinicsWithDistance = clinics.map(clinic => {
      const distance = calculateDistance(
        userLat,
        userLng,
        parseFloat(clinic.latitude.toString()),
        parseFloat(clinic.longitude.toString())
      )

      return {
        ...clinic,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        latitude: parseFloat(clinic.latitude.toString()),
        longitude: parseFloat(clinic.longitude.toString())
      }
    })

    // Filter clinics within 50km radius and sort by distance
    const nearbyClinics = clinicsWithDistance
      .filter(clinic => clinic.distance <= 50)
      .sort((a, b) => a.distance - b.distance)

    console.log(`✅ [CLINICS] Found ${nearbyClinics.length} nearby clinics for location: ${userLat}, ${userLng}`)

    return NextResponse.json({
      success: true,
      clinics: nearbyClinics,
      count: nearbyClinics.length
    })
  } catch (error) {
    console.error('❌ Error fetching nearby clinics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nearby clinics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

