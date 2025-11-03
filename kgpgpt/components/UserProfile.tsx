'use client'

import { useAuth } from '@/lib/auth-context'

export default function UserProfile() {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{user.email}</p>
        </div>
      </div>
      
      <button
        onClick={signOut}
        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
      >
        Sign Out
      </button>
    </div>
  )
}
