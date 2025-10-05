import './App.css'
import VenueBookingSystem from './Components/VenueBookingSystem'
import Navbar from './Components/Navbar'

function App() {
  return (
    <>
      <Navbar />
      {/* <div className='w-full h-screen '> */}
        <VenueBookingSystem />
      {/* </div> */}
    </>
  )
}

export default App