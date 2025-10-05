import { Calendar, User, CircleUserRound } from 'lucide-react'

const Navbar = () => {
  const userName = "Elon Musk"
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="w-full px-4 md:px-12">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">VenueBooker</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className='font-bold text-lg hidden md:block'>{userName}</span>
            <div className="w-12 h-12 bg-violet-500 rounded-full  flex items-center justify-center">
              <CircleUserRound strokeWidth={1.5} className='text-white h-12 w-12' />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar