import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/Modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import { getCurrentUserRole } from "../utils/rbac";
import "../calendar-custom.css"; // Import custom CSS for calendar styling

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    clientId?: number;
    clientName?: string;
  };
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isTherapist, setIsTherapist] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const calendarsEvents = {
    First: "danger",
    Repeated: "success",
    Constant: "primary",
    Hard: "warning",
  };

  useEffect(() => {
    // Check if user is a therapist
    const userRole = getCurrentUserRole();
    setIsTherapist(userRole === 'Therapist');
    
    // Initialize with some events
    setEvents([
      {
        id: "1",
        title: "Event Conf.",
        start: new Date().toISOString().split("T")[0],
        extendedProps: { calendar: "Danger" },
      },
      {
        id: "2",
        title: "Meeting",
        start: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        extendedProps: { calendar: "Success" },
      },
      {
        id: "3",
        title: "Workshop",
        start: new Date(Date.now() + 172800000).toISOString().split("T")[0],
        end: new Date(Date.now() + 259200000).toISOString().split("T")[0],
        extendedProps: { calendar: "Primary" },
      },
    ]);

    // Fetch clients if user is a therapist
    if (userRole === 'Therapist') {
      fetchClients();
    }
  }, []);

  // Function to fetch clients for therapist
  const fetchClients = async () => {
    setIsLoadingClients(true);
    setClientsError(null);
    
    try {
      const response = await fetch('https://api.akesomind.com/api/therapist/clients', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract the client data based on the response structure
        if (data.list && Array.isArray(data.list)) {
          setClients(data.list);
        } else if (Array.isArray(data)) {
          setClients(data);
        }
      } else {
        // Try with state parameter if simple request failed
        const stateOnlyUrl = new URL("https://api.akesomind.com/api/therapist/clients");
        stateOnlyUrl.searchParams.append("state", "all");
        
        const stateOnlyResponse = await fetch(stateOnlyUrl.toString(), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
        
        if (stateOnlyResponse.ok) {
          const data = await stateOnlyResponse.json();
          if (data.list && Array.isArray(data.list)) {
            setClients(data.list);
          } else if (Array.isArray(data)) {
            setClients(data);
          }
        } else {
          setClientsError('Failed to fetch clients. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClientsError('An error occurred while fetching clients.');
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    
    // Extract time from event start if available
    if (event.start) {
      const hours = event.start.getHours().toString().padStart(2, '0');
      const minutes = event.start.getMinutes().toString().padStart(2, '0');
      setEventStartTime(`${hours}:${minutes}`);
    }
    
    // Extract time from event end if available
    if (event.end) {
      setEventEndDate(event.end.toISOString().split("T")[0] || "");
      const hours = event.end.getHours().toString().padStart(2, '0');
      const minutes = event.end.getMinutes().toString().padStart(2, '0');
      setEventEndTime(`${hours}:${minutes}`);
    } else {
      setEventEndDate(event.start?.toISOString().split("T")[0] || "");
    }
    
    setEventLevel(event.extendedProps.calendar);
    
    // Set selected client if available
    if (event.extendedProps.clientId) {
      setSelectedClientId(event.extendedProps.clientId);
    }
    
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    // Validate required fields
    if (!eventTitle.trim()) {
      alert("Please enter a session title");
      return;
    }
    
    if (!eventStartDate) {
      alert("Please select a start date");
      return;
    }
    
    if (!eventEndDate) {
      alert("Please select an end date");
      return;
    }
    
    if (isTherapist && !selectedClientId) {
      alert("Please select a client for the session");
      return;
    }
    
    // Combine date and time
    const startDateTime = new Date(`${eventStartDate}T${eventStartTime}`);
    const endDateTime = new Date(`${eventEndDate}T${eventEndTime}`);
    
    // Get selected client name
    let clientName = "";
    if (selectedClientId) {
      const selectedClient = clients.find(client => client.id === selectedClientId);
      if (selectedClient) {
        clientName = `${selectedClient.firstName} ${selectedClient.lastName}`;
      }
    }
    
    if (selectedEvent) {
      // Update existing event
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
              ...event,
              title: eventTitle,
              start: startDateTime,
              end: endDateTime,
              extendedProps: { 
                calendar: eventLevel,
                clientId: selectedClientId || undefined,
                clientName: clientName || undefined
              },
            }
            : event
        )
      );
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        extendedProps: { 
          calendar: eventLevel,
          clientId: selectedClientId || undefined,
          clientName: clientName || undefined
        },
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }
    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventStartTime("09:00");
    setEventEndDate("");
    setEventEndTime("10:00");
    setEventLevel("");
    setSelectedClientId(null);
    setSelectedEvent(null);
  };

  return (
    <>
      <PageMeta
        title="React.js Calendar Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Calendar Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: isTherapist ? "prev,next addSessionButton" : "prev,next",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            editable={true}
            selectable={true}
            eventDurationEditable={true}
            eventStartEditable={true}
            select={handleDateSelect}
            eventOverlap={false}
            longPressDelay={1000}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addSessionButton: {
                text: "New Session +",
                click: openModal,
              },
            }}
          />
        </div>
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Session" : "New Session"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedEvent 
                  ? "Update the details of your therapy session" 
                  : "Schedule a new therapy session with your client"}
              </p>
            </div>
            <div className="mt-8 space-y-6">
              {/* Session Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Session Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Enter session title"
                />
              </div>
              
              {/* Client Selection - Only for Therapists */}
              {isTherapist && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Select Client
                  </label>
                  {isLoadingClients ? (
                    <div className="flex items-center justify-center h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  ) : clientsError ? (
                    <div className="text-error-500 text-sm">{clientsError}</div>
                  ) : (
                    <select
                      value={selectedClientId || ""}
                      onChange={(e) => setSelectedClientId(Number(e.target.value) || null)}
                      className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.firstName} {client.lastName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              {/* Session Type */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Session Type
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div
                        className={`form-check form-check-${value} form-check-inline`}
                      >
                        <label
                          className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() => setEventLevel(key)}
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                              <span className="w-2 h-2 bg-white rounded-full dark:bg-transparent"></span>
                            </span>
                          </span>
                          {key}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Date and Time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      id="event-start-date"
                      type="date"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Start Time
                  </label>
                  <div className="relative">
                    <input
                      id="event-start-time"
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>

              {/* End Date and Time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      id="event-end-date"
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    End Time
                  </label>
                  <div className="relative">
                    <input
                      id="event-end-time"
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-8 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 sm:w-auto"
              >
                {selectedEvent ? "Update Session" : "Create Session"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  const clientName = eventInfo.event.extendedProps.clientName;
  
  return (
    <div
      className={`event-fc-color flex flex-col fc-event-main ${colorClass} p-1 rounded`}
    >
      <div className="flex items-center">
        <div className="fc-daygrid-event-dot"></div>
        <div className="fc-event-time">{eventInfo.timeText}</div>
        <div className="fc-event-title">{eventInfo.event.title}</div>
      </div>
      {clientName && (
        <div className="text-xs italic ml-2 mt-0.5">
          Client: {clientName}
        </div>
      )}
    </div>
  );
};

export default Calendar;
