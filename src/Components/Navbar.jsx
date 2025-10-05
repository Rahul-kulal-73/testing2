import { Calendar, User } from 'lucide-react'
import React from 'react'

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:py-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-800">VenueBooker</span>
            </div>

          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white">
                <span className="sr-only">User Profile</span>
                <User className="h-6 w-6" />

              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar