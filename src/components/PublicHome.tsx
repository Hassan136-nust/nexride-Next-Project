'use client'
import React from 'react'
import HeroSection from './HeroSection'
import VehicleSection from './VehicleSection'

type Props = {
  onAuthRequired: () => void
}

function PublicHome({ onAuthRequired }: Props) {
  return (
    <>
      <HeroSection onAuthRequired={onAuthRequired} />
      <VehicleSection />
    </>
  )
}

export default PublicHome
