"use client"

import React, { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Video } from "lucide-react"
import { useSelector } from "react-redux"

import { RootState } from "@/redux/store"

interface LatestUser {
  _id: string
  name?: string
  videoKycRoomId?: string
}

interface ZegoInstance {
  destroy?: () => void
  joinRoom: (config: {
    container: HTMLDivElement
    scenario: {
      mode: unknown
    }
    showScreenSharingButton: boolean
    showPreJoinView: boolean
    turnOnMicrophoneWhenJoining: boolean
    turnOnCameraWhenJoining: boolean
    onLeaveRoom: () => void
  }) => void
}

export default function PartnerKycRoom() {
  const containerRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  const userData = useSelector(
    (state: RootState) => state.user.userData
  )

  useEffect(() => {
    if (!userData) {
      router.push("/")
      return
    }

    let intervalId: NodeJS.Timeout | null = null
    let zpRef: ZegoInstance | null = null

    const initZego = async (
      roomID: string,
      latestUser: LatestUser
    ) => {
      const { ZegoUIKitPrebuilt } = await import(
        "@zegocloud/zego-uikit-prebuilt"
      )

      if (!containerRef.current) return

      const appId = Number(
        process.env.NEXT_PUBLIC_ZEGO_APP_ID
      )

      const serverSecret =
        process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || ""

      const userID = String(latestUser._id)

      const userName = latestUser.name || "Partner"

      const kitToken =
        ZegoUIKitPrebuilt.generateKitTokenForTest(
          appId,
          serverSecret,
          roomID,
          userID,
          userName
        )

      const zp = ZegoUIKitPrebuilt.create(
        kitToken
      ) as ZegoInstance

      zpRef = zp

      zp.joinRoom({
        container: containerRef.current,

        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },

        showScreenSharingButton: false,
        showPreJoinView: true,
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,

        onLeaveRoom: () => {
          router.push("/")
        },
      })
    }

    const tryJoin = async () => {
      const fetchLatest = async (): Promise<LatestUser | null> => {
        try {
          const res = await fetch("/api/auth/user/me", { credentials: 'include' })

          if (!res.ok) return null

          const jd = await res.json()

          return jd?.user ?? null
        } catch (err) {
          console.error(
            "Error fetching latest user:",
            err
          )

          return null
        }
      }

      const latest = await fetchLatest()

      if (latest?.videoKycRoomId) {
        await initZego(
          latest.videoKycRoomId,
          latest
        )

        return
      }

      intervalId = setInterval(async () => {
        const latestPoll = await fetchLatest()

        if (latestPoll?.videoKycRoomId) {
          if (intervalId) {
            clearInterval(intervalId)
          }

          intervalId = null

          await initZego(
            latestPoll.videoKycRoomId,
            latestPoll
          )
        }
      }, 3000)
    }

    tryJoin()

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }

      if (
        zpRef &&
        typeof zpRef.destroy === "function"
      ) {
        zpRef.destroy()
      }
    }
  }, [userData, router])

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#080808] text-white flex-col relative">
      <header className="absolute top-0 left-0 w-full z-50 p-5 flex items-center gap-4">
        <button onClick={() => router.push("/")}>
          <ArrowLeft />
        </button>

        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Video className="w-5 h-5" />
          Video KYC Interview
        </h1>
      </header>

      <div className="flex-1">
        <div
          ref={containerRef}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}