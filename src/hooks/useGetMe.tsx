'use client'

import { setUserData } from '@/redux/userSlice'
import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

function useGetMe(enabled: boolean) {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!enabled) return

    const getMe = async () => {
      try {
        const { data } = await axios.get("/api/auth/user/me")
        dispatch(setUserData(data.user))
      } catch (err) {
        console.error("Failed to fetch user:", err)
      }
    }

    getMe()
  }, [enabled])
}

export default useGetMe
