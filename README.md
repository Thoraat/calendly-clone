# Calendly Clone - Full-Stack Scheduling Application

A production-ready, full-stack scheduling web application similar to Calendly, built with React and Node.js.

## Features

### Admin Dashboard
- **Event Types Management**: Create, edit, delete, and list event types with custom durations, descriptions, and colors
- **Availability Settings**: Configure weekly availability by selecting days of the week and time ranges with timezone support
- **Meetings Management**: View upcoming and past meetings, cancel meetings, and see detailed booking information

### Public Booking Page
- **Unique URL per Event Type**: Each event type has a unique slug-based URL (e.g., `/book/30-min-meeting`)
- **Monthly Calendar View**: Interactive calendar for selecting available dates
- **Available Time Slots**: Real-time display of available time slots for the selected date
- **Booking Form**: Simple form to collect invitee name and email
- **Booking Confirmation**: Beautiful confirmation page with meeting details

### Technical Features
- **Double Booking Prevention**: Ensures no overlapping bookings for the same event type
- **Timezone Support**: Full timezone handling throughout the application
- **Responsive Design**: Mobile, tablet, and desktop optimized UI
- **Calendly-like UI/UX**: Clean, modern interface inspired by Calendly

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios for API calls
- Moment.js & Moment Timezone for date/time handling
- Vite for build tooling

### Backend
- Node.js with Express
- MySQL database
- Moment Timezone for timezone conversions
- Connection pooling for database performance

## Project Structure

```
scaler/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection configuration
│   ├── database/
│   │   └── schema.sql            # Database schema
│   ├── routes/
│   │   ├── eventTypes.js         # Event types CRUD endpoints
│   │   ├── availability.js      # Availability management endpoints
│   │   ├── meetings.js           # Meetings listing and cancellation
│   │   └── booking.js            # Public booking and slot generation
│   └── server.js                 # Express server setup
│
├── frontend/
│   ├── src/
│   │   ├── api/                  # API client functions
│   │   ├── components/
│   │   │   ├── admin/            # Admin dashboard components
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── BookingPage.jsx   # Public booking page
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Database Setup

1. **Create the database:**
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```
   Or manually run the SQL file in your MySQL client.

2. **Configure database connection:**
   Create a `.env` file in the `backend` directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=calendly_clone
   DB_PORT=3306
   PORT=3001
   ```

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

   The backend server will run on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Event Types

#### Get All Event Types
```
GET /event-types
```
Response: Array of event type objects

#### Get Event Type by ID
```
GET /event-types/:id
```

#### Get Event Type by Slug
```
GET /event-types/slug/:slug
```

#### Create Event Type
```
POST /event-types
Body: {
  name: string (required),
  slug: string (required, unique),
  duration_minutes: number (required),
  description: string (optional),
  color: string (optional, hex color)
}
```

#### Update Event Type
```
PUT /event-types/:id
Body: { name?, slug?, duration_minutes?, description?, color? }
```

#### Delete Event Type
```
DELETE /event-types/:id
```

### Availability

#### Get Availability for Event Type
```
GET /availability/:eventTypeId
```

#### Save Availability
```
POST /availability
Body: {
  eventTypeId: number (required),
  availability: [
    {
      dayOfWeek: number (0-6, required),
      startTime: string (HH:mm:ss, required),
      endTime: string (HH:mm:ss, required),
      timezone: string (required)
    }
  ]
}
```

#### Delete Availability
```
DELETE /availability/:eventTypeId
```

### Meetings

#### Get Meetings
```
GET /meetings?status=scheduled&upcoming=true
Query Parameters:
  - status: 'scheduled' | 'cancelled' | 'completed' (optional)
  - upcoming: 'true' | 'false' (optional)
```

#### Get Meeting by ID
```
GET /meetings/:id
```

#### Cancel Meeting
```
PATCH /meetings/:id/cancel
```

### Booking (Public)

#### Get Available Slots
```
GET /booking/slots/:eventSlug?date=2024-01-15&timezone=America/New_York
Query Parameters:
  - date: YYYY-MM-DD (required)
  - timezone: IANA timezone (optional, defaults to UTC)
```

#### Create Booking
```
POST /booking
Body: {
  eventSlug: string (required),
  inviteeName: string (required),
  inviteeEmail: string (required),
  startTime: string (ISO 8601, required),
  timezone: string (required)
}
```

## Database Schema

### Tables

1. **event_types**: Stores event type definitions
   - id, name, slug (unique), duration_minutes, description, color

2. **availability**: Stores recurring availability patterns
   - id, event_type_id, day_of_week (0-6), start_time, end_time, timezone

3. **meetings**: Stores booked meetings
   - id, event_type_id, invitee_name, invitee_email, start_time (UTC), end_time (UTC), timezone, status

4. **availability_overrides**: Optional table for date-specific overrides
   - id, event_type_id, override_date, is_available, start_time, end_time

### Relationships
- `availability.event_type_id` → `event_types.id` (CASCADE DELETE)
- `meetings.event_type_id` → `event_types.id` (CASCADE DELETE)
- `availability_overrides.event_type_id` → `event_types.id` (CASCADE DELETE)

## Design Decisions

### Timezone Handling
- All times are stored in UTC in the database
- Timezone conversions are handled using `moment-timezone`
- Users can select their timezone when viewing/booking
- Availability is configured in a specific timezone but converted to UTC for storage

### Slot Generation
- Slots are generated dynamically based on:
  - Event type duration
  - Availability settings for the day of week
  - Existing bookings (to prevent double booking)
  - Date-specific overrides (if configured)
- Past slots are automatically filtered out
- Slots respect timezone boundaries

### Double Booking Prevention
- Database-level uniqueness constraints
- Application-level conflict checking before booking creation
- Overlap detection algorithm checks for any time intersection

### No Authentication
- As per requirements, no authentication is implemented
- Admin dashboard is accessible to anyone
- In production, you would add authentication middleware

## Usage Examples

### Creating an Event Type
1. Go to Admin Dashboard → Event Types
2. Click "Create Event Type"
3. Fill in name, slug, duration, and optional description
4. Save

### Setting Availability
1. Go to Admin Dashboard → Availability
2. Select an event type
3. Select timezone
4. Check days of week and set time ranges
5. Click "Save Availability"

### Booking a Meeting
1. Navigate to `/book/{event-slug}`
2. Select a date from the calendar
3. Choose an available time slot
4. Enter name and email
5. Confirm booking

## Production Considerations

1. **Environment Variables**: Use environment variables for all sensitive configuration
2. **Error Handling**: Add comprehensive error logging and monitoring
3. **Rate Limiting**: Implement rate limiting on booking endpoints
4. **Email Notifications**: Add email sending for booking confirmations
5. **Database Indexing**: Ensure proper indexes on frequently queried columns
6. **Caching**: Consider caching availability and slot data
7. **Security**: Add input validation, SQL injection prevention (already using parameterized queries), and CORS configuration
8. **Authentication**: Add user authentication and authorization
9. **Testing**: Add unit and integration tests
10. **Deployment**: Use process managers (PM2) and reverse proxies (Nginx)

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `.env` file has correct credentials
- Ensure database exists and schema is created

### Port Already in Use
- Change `PORT` in backend `.env` file
- Update frontend `vite.config.js` proxy target if needed

### Timezone Issues
- Ensure `moment-timezone` is installed in both frontend and backend
- Verify timezone strings are valid IANA timezone identifiers

## License

This project is provided as-is for educational and demonstration purposes.

## Contributing

This is a demonstration project. For production use, consider:
- Adding comprehensive tests
- Implementing proper authentication
- Adding email notifications
- Improving error handling and logging
- Adding analytics and monitoring
