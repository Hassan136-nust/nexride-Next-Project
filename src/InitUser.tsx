'use client'
import React from 'react'
import { useSession } from 'next-auth/react'
import { useSelector } from 'react-redux'
import useGetMe from './hooks/useGetMe'
import GeoUpdater from './components/GeoUpdater'
import { RootState } from './redux/store'

function InitUser() {
  const { status } = useSession()
  useGetMe(status === 'authenticated')
  const userData = useSelector((state: RootState) => state.user.userData)

  if (!userData?._id) return null

  return (
    <GeoUpdater
      userId={userData._id.toString()}
      trackLocation={userData.role === 'partner'}
    />
  )
}

export default InitUser
