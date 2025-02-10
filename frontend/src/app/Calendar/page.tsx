'use client';
import Navbar from "@/components/Navbar";

import React, { useEffect, useState } from 'react';
import { Badge, Calendar, Popover, Button, message, Form } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
interface EventData {
  _id: string;
  date: string;
  event: string;
}

const App: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]); // Store events
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null); // Selected date
  const [popoverVisible, setPopoverVisible] = useState<boolean>(false); // Popover visibility
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // Position for popover
  const [showForm, setShowForm] = useState<boolean>(false); // Show form state
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null); // Selected event for edit
  const [form] = Form.useForm(); // Ant Design form instance

  // Global message configuration for toast notifications
  message.config({
    duration: 3, // Duration of the toast message in seconds
    maxCount: 3, // Only show 3 messages at once
    top: 50, // Position from the top of the screen
  });

  // Fetch events from the backend when the component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/calender/getAllData');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // Parse the JSON response
        if (data.success) {
          setEvents(data.data); // Store events
        } else {
          message.error('Failed to fetch events.');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        message.error('Error fetching events.');
      }
    };

    fetchEvents();
  }, []);

  // Handle event click (edit an event)
  const handleEventClick = (event: EventData) => {
    setSelectedEvent(event); // Set the selected event to edit
    setSelectedDate(dayjs(event.date)); // Set the selected date based on the event's date
    setShowForm(true); // Show the form to edit
    setPopoverVisible(true); // Open the popover
  };

  // Handle form submission
  const handleFormSubmit = async (values: { title: string }) => {
    if (!selectedDate) return;

    try {
      if (selectedEvent) {
        // Editing an existing event (PUT request)
        const response = await fetch(
          `http://localhost:8000/api/v1/calender/updateData/${selectedEvent._id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: values.title }),
          }
        );

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.success) {
          message.success('Event updated successfully.');
          // Update the event in local state
          setEvents((prev) =>
            prev.map((ev) =>
              ev._id === selectedEvent._id ? { ...ev, event: values.title } : ev
            )
          );
          setPopoverVisible(false); // Close the popover
          form.resetFields(); // Reset the form
          setSelectedEvent(null); // Clear the selected event
        } else {
          message.error('Failed to update event.');
        }
      } else if (selectedDate) {
        // Creating a new event (POST request)
        const response = await fetch('http://localhost:8000/api/v1/calender/createData', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: values.title,
            date: selectedDate.format('YYYY-MM-DD'), // Ensure the correct date is passed
          }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.success) {
          message.success('Event created successfully.');
          // Add the new event to local state
          setEvents((prev) => [...prev, data.data]);
          setPopoverVisible(false); // Close the popover
          form.resetFields(); // Reset the form
        } else {
          message.error('Failed to create event.');
        }
      }
    } catch (error) {
      console.error('Error handling event:', error);
      message.error('Error handling event.');
    }
  };

  // Helper function to get events for a specific day
  const getListData = (value: Dayjs) => {
    return events.filter((event) => value.isSame(event.date, 'day'));
  };

  // Render events in a date cell
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li
            key={item._id}
            className="event-item"
            onClick={() => handleEventClick(item)} // Trigger the event edit on click
            style={{ cursor: 'pointer' }} // Change the cursor to a pointer to indicate it's clickable
          >
            <Badge status="success" text={item.event} />
          </li>
        ))}
      </ul>
    );
  };

  // Handle date cell click and calculate position
  const handleCellClick = (date: Dayjs, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverPosition({ x: rect.left + window.scrollX, y: rect.top + rect.height + window.scrollY });
    setSelectedDate(date); // Set the selected date
    setPopoverVisible(true); // Show the popover
    setShowForm(false); // Reset the form state
  };

  // Handle event deletion
  const handleEventDelete = async (event: EventData) => {
    try {
      // Ask for confirmation before deletion
      const isConfirmed = window.confirm("Are you sure you want to delete this event?");
      if (!isConfirmed) return;

      const response = await fetch(
        'http://localhost:8000/api/v1/calender/deleteData',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: event._id }), // Send the event's ID to delete
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        message.success('Event deleted successfully.');
        // Remove the deleted event from local state
        setEvents((prev) => prev.filter((ev) => ev._id !== event._id));
      } else {
        message.error('Failed to delete event.');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      message.error('Error deleting event.');
    }
  };

  // Popover content: Show form with selected event's data if editing
  const popoverContent = showForm ? (
    <Form form={form} layout="vertical" onFinish={handleFormSubmit} initialValues={{ title: selectedEvent ? selectedEvent.event : '' }}>
      <Form.Item name="title" label="Event Title" rules={[{ required: true, message: 'Please enter the event title' }]}>
        <textarea rows={3} cols={50} placeholder="Enter event title" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          {selectedEvent ? 'Update Event' : 'Schedule Event'}
        </Button>
      </Form.Item>
    </Form>
  ) : (
    <div>
      <Button type="link" onClick={() => setShowForm(true)}>
        Notes
      </Button>
      <Button type="link" onClick={() => handleEventDelete(selectedEvent!)}> {/* Safe-guarding with non-null assertion */}
        Completed
      </Button>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
    <Navbar />
    <Calendar
        cellRender={(date) => (
          <div onClick={(e) => handleCellClick(date, e)} style={{ height: '70%' }}>
            {dateCellRender(date)}
          </div>
        )}
        style={{ marginTop: '100px' }} // Add your desired margin-top value here
      />
      {selectedDate && popoverVisible && (
        <Popover
          content={popoverContent}
          title={showForm ? `Edit Meeting for ${selectedDate.format('YYYY-MM-DD')}` : `Actions for ${selectedDate.format('YYYY-MM-DD')}`}
          open={popoverVisible}
          onOpenChange={(visible) => setPopoverVisible(visible)}
          trigger="click"
          getPopupContainer={() => document.body}
        >
          <div
            style={{
              position: 'absolute',
              left: `${popoverPosition.x}px`,
              top: `${popoverPosition.y}px`,
              width: '5px',
              height: '5px',
            }}
          />
        </Popover>
      )}
    </div>
  );
};

export default App;
