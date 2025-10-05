import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, X, AlertCircle, CheckCircle, Sun, CloudSun, Moon, Star } from 'lucide-react';

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

  const isAnySlotBookedOnSelectedDate = Object.keys(bookedSlotsForSelectedDate).length > 0;
  const isFullDayBookedOnSelectedDate = 'Full Day' in bookedSlotsForSelectedDate;

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

      let isFullDay = false;
      let isPartial = false;

      if (calendarView === 'Both') {
          const h1Bookings = dayBookings['Hall 1'] || {};
          const h2Bookings = dayBookings['Hall 2'] || {};
          isFullDay = h1Bookings['Full Day'] && h2Bookings['Full Day'];
          isPartial = !isFullDay && (Object.keys(h1Bookings).length > 0 || Object.keys(h2Bookings).length > 0);
      } else {
          const venueBookings = dayBookings[calendarView] || {};
          isFullDay = 'Full Day' in venueBookings;
          isPartial = Object.keys(venueBookings).length > 0 && !isFullDay;
      }
      
      const classNames = [
        'h-16 md:h-20 p-2 text-gray-700 flex flex-col relative transition-all duration-200',
        isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer',
      ];
      
      if (!isPast) {
        if (isFullDay) classNames.push('bg-red-100 hover:bg-red-200');
        else if (isPartial) classNames.push('bg-yellow-100 hover:bg-yellow-200');
        else classNames.push('bg-white hover:bg-gray-50');
      }
      
      if (isSelected) classNames.push('ring-2 ring-blue-600 shadow-lg z-10');
      else if (isToday) classNames.push('ring-2 ring-green-500');

      days.push(
        <div key={day} onClick={() => !isPast && handleDateSelect(day)} className={classNames.join(' ')}>
          <div className={`font-semibold ${isSelected ? 'text-blue-600' : ''} ${isToday && !isSelected ? 'text-green-700' : ''}`}>{day}</div>
          <div className="flex-grow"></div>
          {isFullDay && <div className="text-right md:text-xs text-[8px] font-bold text-red-700">Booked</div>}
          {isPartial && <div className="text-right md:text-xs text-[8px] font-bold text-yellow-800">Partial</div>}
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg border border-gray-200">{days}</div>;
  };

  const renderBookingPanel = () => (
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

      {/* <div className="my-6">
        <h3 className="font-bold text-gray-700 mb-3">Select Venue</h3>
        <div className="flex flex-wrap gap-2">
          {venues.map(venue => (
            <button
              key={venue} onClick={() => { setSelectedVenue(venue); setCalendarView(venue); }}
              className={`px-3 py-2 rounded-lg border transition-all duration-200 font-semibold text-sm transform hover:-translate-y-px hover:shadow-md ${selectedVenue === venue ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-300 hover:border-blue-400 text-gray-600'}`}
            >{venue}</button>
          ))}
        </div>
      </div> */}

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
        
        {eventName && !selectedSlot && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                 <p className="text-sm text-gray-600">Please select a time slot to see the final price.</p>
            </div>
        )}

        {calculatedPrice > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center transition-all duration-300">
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
              const isDisabled = isThisSlotBooked || isFullDayBookedOnSelectedDate || (slot.name === 'Full Day' && isAnySlotBookedOnSelectedDate);
              return (
                <button
                  key={slot.name} onClick={() => !isDisabled && setSelectedSlot(slot)} disabled={isDisabled}
                  className={`p-3 rounded-lg border transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 h-16 transform ${isDisabled ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : selectedSlot?.name === slot.name ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-inner' : 'border-gray-300 hover:border-blue-400 text-gray-700 bg-white hover:shadow-md hover:-translate-y-px'}`}
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
    </>
  );

  // --- MAIN COMPONENT JSX ---
  return (
    <div className="min-h-screen w-full bg-gray-100 p-2 sm:p-4 font-sans">
      <style>{`
        @keyframes slide-in-down { 0% { transform: translateY(-100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-slide-in-down { animation: slide-in-down 0.5s ease-out forwards; }
      `}</style>

      <div className="w-full max-w-6xl mx-auto">
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
            
            {/* Calendar View Controls */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
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
                    Both (H1 & H2)
                </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm font-medium"
              >&lt; Prev</button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 text-center">
                {currentDate.toLocaleString('default', { month: 'long' })}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm font-medium"
              >Next &gt;</button>
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

