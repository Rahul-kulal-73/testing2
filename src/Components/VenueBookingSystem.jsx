import React, { useState } from 'react';
import { Calendar, Clock, X, User, AlertCircle, CheckCircle, Sun, CloudSun, Moon, Star } from 'lucide-react';

const VenueBookingSystem = () => {
  // Set initial state to the current date.
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedVenue, setSelectedVenue] = useState('Hall 1');
  const [eventName, setEventName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showBookingPanel, setShowBookingPanel] = useState(false);

  // Store bookings: { date: { venue: { slot: eventName } } }
  const [bookings, setBookings] = useState({
    '2025-09-15': { 'Hall 1': { 'Morning': 'Wedding' } },
    '2025-09-20': { 'ABR': { 'Full Day': 'Meeting' } }
  });

  const venues = ['Hall 1', 'Hall 2'];
  const slots = [
    { name: 'Morning', icon: <Sun className="w-5 h-5" /> },
    { name: 'Afternoon', icon: <CloudSun className="w-5 h-5" /> },
    { name: 'Evening', icon: <Moon className="w-5 h-5" /> },
    { name: 'Full Day', icon: <Star className="w-5 h-5" /> },
  ];
  const eventTypes = ['Wedding', 'Ceremony', 'Birthday', 'Anniversary', 'Meeting'];

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
    if (!bookings[dateKey] || !bookings[dateKey][venue]) {
      return { available: true };
    }

    const venueBookings = bookings[dateKey][venue];

    // Check if Full Day is booked
    if (venueBookings['Full Day']) {
      return {
        available: false,
        message: 'The venue is booked for the full day.',
        bookedBy: venueBookings['Full Day']
      };
    }

    // If trying to book Full Day, check if any slot is booked
    if (slot === 'Full Day') {
      const bookedSlots = Object.keys(venueBookings);
      if (bookedSlots.length > 0) {
        return {
          available: false,
          message: 'Some time slots are already booked. Cannot book full day.',
          bookedBy: Object.values(venueBookings)[0]
        };
      }
    }

    // Check if specific slot is booked
    if (venueBookings[slot]) {
      return {
        available: false,
        message: 'This time slot is already booked.',
        bookedBy: venueBookings[slot]
      };
    }

    return { available: true };
  };

  const handleBooking = () => {
    if (!eventName) {
      showNotification('Please select an event type', 'error');
      return;
    }
    if (!selectedSlot) {
      showNotification('Please select a time slot', 'error');
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

    showNotification(`Successfully booked for ${eventName} at ${selectedVenue}!`, 'success');
    setEventName('');
    setSelectedSlot(null);
    setShowBookingPanel(false); // Close modal on successful booking
  };

  const handleDateSelect = (day) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setSelectedSlot(null); // Reset slot selection when date changes
    setShowBookingPanel(true); // Open the booking panel/modal
  };

  const getBookedSlotsForDay = (date, venue) => {
    const dateKey = formatDate(date);
    if (bookings[dateKey] && bookings[dateKey][venue]) {
      return Object.keys(bookings[dateKey][venue]);
    }
    return [];
  };

  const renderCalendar = () => {
    const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const bookedSlots = getBookedSlotsForDay(date, selectedVenue);
      const isFullDay = bookedSlots.includes('Full Day');
      const isPartial = bookedSlots.length > 0 && !isFullDay;
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      let bgClass = 'bg-white';
      if (isFullDay) bgClass = 'bg-red-100';
      if (isPartial) bgClass = 'bg-yellow-100';

      days.push(
        <div
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`h-16 md:h-20 p-2 cursor-pointer transition-all text-gray-700 flex flex-col relative 
            ${bgClass}
            ${isSelected ? 'ring-2 ring-blue-600 shadow-lg z-20' : 'hover:shadow-md hover:z-10'}
          `}
        >
          <div className={`font-semibold ${isSelected ? 'text-blue-600' : ''}`}>{day}</div>
          <div className="flex-grow"></div>
          {isFullDay && (
            <div className="text-right md:text-xs text-[8px] font-bold text-red-700">Full Booked</div>
          )}
          {isPartial && (
            <div className="text-right md:text-xs text-[8px] font-bold text-yellow-800">Partial Booked</div>
          )}
        </div>
      );
    }

    const totalGridCells = firstDay + daysInMonth;
    const remainingCells = (7 - (totalGridCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`remaining-${i}`} className="bg-gray-50"></div>);
    }

    return <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg  border border-gray-200">{days}</div>;
  };

  const bookedSlotsForSelectedDate = React.useMemo(() => {
    const dateKey = formatDate(selectedDate);
    return bookings[dateKey]?.[selectedVenue] || {};
  }, [selectedDate, selectedVenue, bookings]);

  const isAnySlotBookedOnSelectedDate = Object.keys(bookedSlotsForSelectedDate).length > 0;
  const isFullDayBookedOnSelectedDate = 'Full Day' in bookedSlotsForSelectedDate;

  const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
  const prevMonthName = prevMonthDate.toLocaleString('default', { month: 'short' });

  const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
  const nextMonthName = nextMonthDate.toLocaleString('default', { month: 'short' });

  const isBookingDisabled = !eventName || !selectedSlot;

  const renderBookingPanel = () => (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-blue-600 text-white rounded-lg p-3 flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 shadow-lg">
          <span className="text-3xl md:text-4xl font-bold leading-none">{selectedDate?.getDate()}</span>
          <span className="font-semibold text-xs md:text-sm uppercase">{selectedDate?.toLocaleString('default', { month: 'short' })}</span>
        </div>
        <div>
          <p className="font-bold text-lg md:text-xl text-gray-800">{selectedVenue}</p>
          <p className="text-gray-500 font-medium">{selectedDate?.toLocaleDateString('en-US', { weekday: 'long' })}</p>
        </div>
      </div>

      <div className="my-6 md:my-8">
        <h3 className="font-bold text-gray-700 mb-3 text-base md:text-lg">Select Venue</h3>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {venues.map(venue => (
            <button
              key={venue}
              onClick={() => setSelectedVenue(venue)}
              className={`px-3 py-2 md:px-4 rounded-lg border transition-all duration-200 font-semibold text-sm transform hover:-translate-y-px hover:shadow-md
                    ${selectedVenue === venue
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-gray-300 hover:border-blue-400 text-gray-600'}`}
            >
              {venue}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Event Type
          </label>
          <select
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition bg-white text-sm sm:text-base"
          >
            <option value="" disabled>Select an event</option>
            {eventTypes.map(event => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Select Time Slot
          </label>
          <div className="grid grid-cols-2 gap-3">
            {slots.map(slot => {
              const isThisSlotBooked = slot.name in bookedSlotsForSelectedDate;
              const isDisabled =
                isThisSlotBooked ||
                isFullDayBookedOnSelectedDate ||
                (selectedSlot?.name === 'Full Day' && slot.name !== 'Full Day') ||
                (slot.name === 'Full Day' && isAnySlotBookedOnSelectedDate && !isFullDayBookedOnSelectedDate);

              return (
                <button
                  key={slot.name}
                  onClick={() => !isDisabled && setSelectedSlot(slot)}
                  disabled={isDisabled}
                  className={`p-3 rounded-lg border transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 h-16 transform
                        ${isDisabled
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : selectedSlot?.name === slot.name
                        ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-inner'
                        : 'border-gray-300 hover:border-blue-400 text-gray-700 bg-white hover:shadow-md hover:-translate-y-px'
                    }`}
                >
                  {isThisSlotBooked ? (
                    <div className="text-center leading-tight">
                      <span className="font-semibold text-gray-600 text-xs sm:text-sm">{slot.name}</span>
                      <span className="text-xs block text-gray-500 mt-1">
                        Event: {bookedSlotsForSelectedDate[slot.name]}
                      </span>
                    </div>
                  ) : (slot.name === 'Full Day' && isAnySlotBookedOnSelectedDate && !isFullDayBookedOnSelectedDate) ? (
                    <div className="text-center leading-tight">
                      <span className="font-semibold text-gray-600 text-xs sm:text-sm">{slot.name}</span>
                      <span className="text-xs block text-gray-500 mt-1">
                        Slots Taken
                      </span>
                    </div>
                  ) : (
                    <>
                      {slot.icon}
                      <span className="text-xs sm:text-sm">{slot.name}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleBooking}
          disabled={isBookingDisabled}
          className={`w-full px-4 py-3 rounded-lg transition font-semibold text-white transform hover:scale-105
              ${isBookingDisabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-md'
            }`}
        >
          Confirm Booking
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen fixed w-full bg-gray-100 p-2 sm:p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        {notification.show && (
          <div className={`fixed top-5 right-5 z-50 px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-xl flex items-center gap-3 animate-bounce
            ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {notification.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="font-semibold text-sm md:text-base">{notification.message}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 ">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Book Venue</h1>
              <span className="text-2xl sm:text-3xl font-light text-gray-500 mt-2 sm:mt-0">{currentDate.getFullYear()}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm font-medium"
              >
                &lt; {prevMonthName}
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 text-center">
                {currentDate.toLocaleString('default', { month: 'long' })}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm font-medium"
              >
                {nextMonthName} &gt;
              </button>
            </div>
            <div className="grid grid-cols-7 text-center font-semibold text-xs sm:text-sm text-gray-500 mb-2 px-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => <div key={day}>{day}</div>)}
            </div>
            {renderCalendar()}
          </div>

          {/* Right Section (Desktop) */}
          <div className="hidden lg:block bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-200">
            {renderBookingPanel()}
          </div>
        </div>

        {/* Modal (Mobile) */}
        {showBookingPanel && (
          <div className="lg:hidden fixed inset-0 bg-[#000000c0] bg-opacity-40 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200 w-full max-w-sm relative shadow-2xl">
              <button
                onClick={() => setShowBookingPanel(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full bg-white/50 hover:bg-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
              {renderBookingPanel()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueBookingSystem;

