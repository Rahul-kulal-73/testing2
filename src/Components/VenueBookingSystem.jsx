import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, X, AlertCircle, CheckCircle, Sun, CloudSun, Moon, Star, ArrowLeft, ArrowRight } from 'lucide-react';

// Main component for the Venue Booking System
const VenueBookingSystem = () => {
  // --- STATE MANAGEMENT ---
  const [currentDate, setCurrentDate] = useState(new Date('2025-10-05'));
  const [selectedDate, setSelectedDate] = useState(new Date('2025-10-05'));
  const [selectedVenue, setSelectedVenue] = useState('Hall 1');
  const [eventName, setEventName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [calendarView, setCalendarView] = useState('Hall 1');

  // Initial bookings are loaded from localStorage, with a fallback to default data.
  const [bookings, setBookings] = useState(() => {
    try {
      const savedBookings = localStorage.getItem('venueBookings');
      if (savedBookings) {
        return JSON.parse(savedBookings);
      }
    } catch (error) {
      console.error("Error reading bookings from localStorage", error);
    }
    // Return default bookings if nothing in localStorage or if there was an error
    return {
      '2025-10-10': { 'Hall 2': { 'Full Day': 'Corporate Conference' } },
      '2025-10-15': {
        'Hall 1': { 'Morning': 'Wedding Ceremony' },
        'Hall 2': { 'Evening': 'Anniversary Party' }
      },
      '2025-10-25': { 'Hall 1': { 'Afternoon': 'Birthday Party' } },
      '2025-11-05': { 'Hall 1': { 'Full Day': 'Tech Meetup' } },
      '2025-11-10': { 'Hall 1': { 'Full Day': 'Workshop' }, 'Hall 2': { 'Full Day': 'Exhibition' } },
    };
  });

  // --- LOCALSTORAGE PERSISTENCE ---
  // This effect runs whenever the 'bookings' state changes, saving it to localStorage.
  useEffect(() => {
    try {
      localStorage.setItem('venueBookings', JSON.stringify(bookings));
    } catch (error) {
      console.error("Error saving bookings to localStorage", error);
    }
  }, [bookings]);


  // --- STATIC DATA ---
  const venues = ['Hall 1', 'Hall 2'];
  const slots = [
    { name: 'Morning', icon: <Sun className="w-5 h-5" /> },
    { name: 'Afternoon', icon: <CloudSun className="w-5 h-5" /> },
    { name: 'Evening', icon: <Moon className="w-5 h-5" /> },
    { name: 'Full Day', icon: <Star className="w-5 h-5" /> },
  ];
  const eventTypes = ['Wedding', 'Ceremony', 'Birthday', 'Anniversary', 'Meeting', 'Conference', 'Party'];

  // Pricing structure in INR
  const pricing = {
    base: {
      'Wedding': 50000,
      'Ceremony': 25000,
      'Birthday': 20000,
      'Anniversary': 22000,
      'Meeting': 15000,
      'Conference': 40000,
      'Party': 25000,
    },
    slotMultiplier: {
      'Morning': 1,
      'Afternoon': 1,
      'Evening': 1.2,
      'Full Day': 3,
    },
    defaultBase: 20000
  };


  // --- HELPER FUNCTIONS ---

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const formatDate = (date) => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const checkSlotAvailability = (date, venue, slot) => {
    const dateKey = formatDate(date);
    const venueBookings = bookings[dateKey]?.[venue];

    if (!venueBookings) return { available: true };
    if (venueBookings['Full Day']) return { available: false, message: 'The venue is booked for the full day.' };
    if (slot === 'Full Day' && Object.keys(venueBookings).length > 0) return { available: false, message: 'Some time slots are already booked.' };
    if (venueBookings[slot]) return { available: false, message: 'This time slot is already booked.' };
    return { available: true };
  };

  // --- EVENT HANDLERS ---

  const handleBooking = () => {
    if (!eventName || !selectedSlot) {
      showNotification('Please select an event type and a time slot', 'error');
      return;
    }

    const availability = checkSlotAvailability(selectedDate, selectedVenue, selectedSlot.name);
    if (!availability.available) {
      showNotification(availability.message || 'This slot is no longer available.', 'error');
      return;
    }

    const dateKey = formatDate(selectedDate);
    const newBookings = { ...bookings };
    if (!newBookings[dateKey]) newBookings[dateKey] = {};
    if (!newBookings[dateKey][selectedVenue]) newBookings[dateKey][selectedVenue] = {};
    newBookings[dateKey][selectedVenue][selectedSlot.name] = eventName;
    setBookings(newBookings);

    const finalPrice = calculatedPrice.toLocaleString('en-IN');
    showNotification(`Booked ${selectedVenue} for ₹${finalPrice}!`, 'success');
    setEventName('');
    setSelectedSlot(null);
    setShowBookingPanel(false);
  };

  const handleDateSelect = (day) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setSelectedSlot(null);
    setEventName('');
    setShowBookingPanel(true);
  };

  // Handles changing the calendar view
  const handleViewChange = (view) => {
    setCalendarView(view);
    if (view !== 'Both') {
      setSelectedVenue(view);
    }
  };

  // --- MEMOIZED VALUES ---
  const bookedSlotsForSelectedDate = useMemo(() => {
    const dateKey = formatDate(selectedDate);
    return bookings[dateKey]?.[selectedVenue] || {};
  }, [selectedDate, selectedVenue, bookings]);

  const calculatedPrice = useMemo(() => {
    if (!eventName || !selectedSlot) {
      return 0;
    }
    const basePrice = pricing.base[eventName] || pricing.defaultBase;
    const multiplier = pricing.slotMultiplier[selectedSlot.name] || 1;
    return basePrice * multiplier;
  }, [eventName, selectedSlot, pricing]);

  // --- RENDER FUNCTIONS ---

  const renderCalendar = () => {
    const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
    const days = [];
    const today = new Date('2025-10-05');
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      date.setHours(0, 0, 0, 0);

      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
      const dateKey = formatDate(date);
      const dayBookings = bookings[dateKey] || {};

      const baseClasses = `h-16 md:h-20 relative flex flex-col transition-all duration-200 ${!isPast ? 'cursor-pointer' : 'bg-gray-100 text-gray-400'}`;
      const borderClasses = isSelected ? 'ring-2 ring-blue-500 shadow-lg z-10' : isToday ? 'ring-2 ring-green-500' : '';

      if (calendarView === 'Both') {
        days.push(
          <div key={day} onClick={() => !isPast && handleDateSelect(day)} className={`${baseClasses} p-2 ${borderClasses} bg-white ${!isPast ? 'hover:bg-gray-50' : ''}`}>
            <div className={`font-semibold ${isSelected ? 'text-blue-600' : ''}`}>{day}</div>
            {!isPast && (
              <div className="mt-1.5 space-y-1">
                {venues.map(venue => {
                  const venueBookings = dayBookings[venue] || {};
                  const bookedSlotKeys = Object.keys(venueBookings);
                  const isBooked = bookedSlotKeys.length > 0;
                  
                  if (!isBooked) {
                    return null; // Don't show anything if available
                  }

                  let statusText = '';
                  let statusClass = '';

                  if (venueBookings['Full Day']) {
                    statusText = 'FD';
                    statusClass = 'bg-red-100 text-red-800';
                  } else {
                    statusText = bookedSlotKeys.map(slot => slot.charAt(0)).join(',');
                    statusClass = 'bg-yellow-100 text-yellow-800';
                  }

                  return (
                    <div key={venue} className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold text-center ${statusClass}`}>
                      {venue.replace(' ', '')}:{statusText}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      } else {
        const venueBookings = dayBookings[calendarView] || {};
        const isFullDay = 'Full Day' in venueBookings;
        const isPartial = Object.keys(venueBookings).length > 0 && !isFullDay;
        const bgClass = isPast ? '' : isFullDay ? 'bg-red-50 hover:bg-red-100' : isPartial ? 'bg-yellow-50 hover:bg-yellow-100' : 'bg-white hover:bg-gray-50';
        
        days.push(
          <div key={day} onClick={() => !isPast && handleDateSelect(day)} className={`${baseClasses} p-2 ${bgClass} ${borderClasses}`}>
            <div className={`font-semibold ${isSelected ? 'text-blue-600' : ''}`}>{day}</div>
            <div className="flex-grow"></div>
            {!isPast && isFullDay && <div className="text-right text-[9px] font-bold text-red-700">Full Day</div>}
            {!isPast && isPartial && (
              <div className="text-right text-[9px] font-bold text-yellow-700 space-y-0.5">
                {Object.keys(venueBookings).map(slot => <div key={slot}>{slot}</div>)}
              </div>
            )}
          </div>
        );
      }
    }

    return <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg border border-gray-200 overflow-hidden">{days}</div>;
  };

  const renderBookingPanel = () => {
    const isBothView = calendarView === 'Both';

    return (
      <>
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-600 text-white rounded-lg p-3 flex flex-col items-center justify-center w-16 h-16 shadow-lg">
            <span className="text-3xl font-bold leading-none">{selectedDate?.getDate()}</span>
            <span className="font-semibold text-xs uppercase">{selectedDate?.toLocaleString('default', { month: 'short' })}</span>
          </div>
          <div>
            <p className="font-bold text-lg text-gray-800">{selectedDate?.toLocaleDateString('en-US', { weekday: 'long' })}</p>
            <p className="text-gray-500 font-medium">{selectedDate?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {isBothView ? (
          <div className="space-y-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-800 text-center text-md mb-3">Daily Booking Summary</h3>
            {venues.map(venue => {
              const venueBookings = bookings[formatDate(selectedDate)]?.[venue] || {};
              const slotsBooked = Object.entries(venueBookings);
              return (
                <div key={venue}>
                  <p className="font-semibold text-gray-700">{venue}:</p>
                  {slotsBooked.length > 0 ? (
                    <ul className="list-disc list-inside pl-2 text-sm text-gray-600">
                      {slotsBooked.map(([slot, event]) => (
                        <li key={slot}><strong>{slot}:</strong> {event}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-700 font-medium pl-2">All slots available</p>
                  )}
                </div>
              );
            })}
             {/* <p className="text-center text-xs text-gray-500 mt-4">Select an individual venue view to make a new booking.</p> */}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" />Event Type</label>
              <select required value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition bg-white text-sm">
                <option value="" disabled>Select an event</option>
                {eventTypes.map(event => (
                  <option key={event} value={event}>
                    {event} - ₹{(pricing.base[event] || pricing.defaultBase).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                Select Venue
              </label>
             <div className='flex gap-5'>
               {venues.map(venue => (
                    <button
                      key={venue}
                      onClick={() => handleViewChange(venue)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all duration-200 ${calendarView === venue ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                    >
                      {venue}
                    </button>
                  ))}

             </div>
            </div>

            {calculatedPrice > 0 && (
              <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg transition-all duration-300">
                <p className="text-sm font-semibold text-gray-600">Final Estimated Price</p>
                <p className="text-2xl font-bold text-blue-800">
                  ₹{calculatedPrice.toLocaleString('en-IN')}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2"><Clock className="w-4 h-4" />Select Time Slot</label>
              <div className="grid grid-cols-2 gap-3">
                {slots.map(slot => {
                  const isThisSlotBooked = slot.name in bookedSlotsForSelectedDate;
                  const isDisabled = isThisSlotBooked || bookedSlotsForSelectedDate['Full Day'] || (slot.name === 'Full Day' && Object.keys(bookedSlotsForSelectedDate).length > 0);
                  return (
                    <button
                      key={slot.name} onClick={() => !isDisabled && setSelectedSlot(slot)} disabled={isDisabled}
                      className={`p-3 rounded-lg border transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 h-16 transform ${isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : selectedSlot?.name === slot.name ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-inner' : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md hover:-translate-y-px'}`}
                    >
                      {isThisSlotBooked ? (
                        <div className="text-center leading-tight">
                          <span className="font-semibold text-gray-600 text-xs">{slot.name}</span>
                          <span className="text-xs block text-red-600 mt-1">Booked</span>
                        </div>
                      ) : (<> {slot.icon} <span className="text-xs sm:text-sm">{slot.name}</span> </>)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleBooking} disabled={!eventName || !selectedSlot}
              className={`w-full px-4 py-3 rounded-lg transition font-semibold text-white transform hover:scale-105 ${!eventName || !selectedSlot ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
            >Confirm Booking</button>
          </div>
        )}
      </>
    );
  }


  // --- MAIN COMPONENT JSX ---
  return (
    <div className="min-h-screen w-full bg-gray-100 p-2 sm:p-4 font-sans">
      <style>{`
        @keyframes slide-in-down { 0% { transform: translateY(-100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-slide-in-down { animation: slide-in-down 0.5s ease-out forwards; }
      `}</style>

      <div className="w-full max-w-7xl mx-auto">
        {notification.show && (
          <div className={`fixed top-5 right-5 z-50 px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-xl flex items-center gap-3 animate-slide-in-down ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {notification.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="font-semibold text-sm md:text-base">{notification.message}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Book Your Venue</h1>
              <span className="text-2xl sm:text-3xl font-light text-gray-500 mt-2 sm:mt-0">{currentDate.getFullYear()}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                {/* Calendar View Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">View:</span>
                  {venues.map(venue => (
                    <button
                      key={venue}
                      onClick={() => handleViewChange(venue)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all duration-200 ${calendarView === venue ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                    >
                      {venue}
                    </button>
                  ))}
                  <button
                    onClick={() => handleViewChange('Both')}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all duration-200 ${calendarView === 'Both' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                  >
                    Both
                  </button>
                </div>
                 {/* Legend */}
                {calendarView === 'Both' && (
                    <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 p-2 rounded-lg bg-gray-50 border">
                        <span className="font-bold">Legend:</span>
                        <div className="flex items-center gap-1.5"><span className="font-bold text-yellow-800">M</span><span>Morning</span></div>
                        <div className="flex items-center gap-1.5"><span className="font-bold text-yellow-800">A</span><span>Afternoon</span></div>
                        <div className="flex items-center gap-1.5"><span className="font-bold text-yellow-800">E</span><span>Evening</span></div>
                        <div className="flex items-center gap-1.5"><span className="font-bold text-red-800">FD</span><span>Full Day</span></div>
                    </div>
                )}
            </div>


            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 rounded-lg bg-white hover:bg-gray-100 border transition"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 text-center">
                {currentDate.toLocaleString('default', { month: 'long' })}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 rounded-lg bg-white hover:bg-gray-100 border transition"><ArrowRight className="w-5 h-5 text-gray-600" /></button>
            </div>
            <div className="grid grid-cols-7 text-center font-semibold text-xs sm:text-sm text-gray-500 mb-2 px-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => <div key={day}>{day}</div>)}
            </div>
            {renderCalendar()}
          </div>

          {/* Desktop Booking Panel */}
          <div className="hidden lg:block bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-200">
            {renderBookingPanel()}
          </div>
        </div>

        {/* Mobile Booking Panel (Modal) */}
        {showBookingPanel && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 border w-full max-w-sm relative shadow-2xl">
              <button
                onClick={() => setShowBookingPanel(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full bg-gray-100 hover:bg-gray-200"
              ><X className="h-6 w-6" /></button>
              {renderBookingPanel()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueBookingSystem;

