import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import VenueBookingSystem from './Components/VenueBookingSystem'
import Navbar from './Components/Navbar'



function App() {
 

  return (
    <>
    <Navbar/>
     <div className='w-full h-screen '>
    <VenueBookingSystem/>
     </div>
    </>
  )
}

export default App
