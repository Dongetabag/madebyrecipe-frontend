# Recipe Labs Talent Funnel - Backend API

Backend API server for handling talent application submissions, database storage, and email notifications.

## Features

- ✅ RESTful API endpoints
- ✅ JSON database storage
- ✅ Email notifications to sales@madebyrecipe.com
- ✅ Campaign tracking support
- ✅ UTM parameter tracking
- ✅ Application management endpoints

## Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your email settings:

```env
PORT=3001
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
NOTIFICATION_EMAIL=sales@madebyrecipe.com
```

### 3. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Endpoints

### POST /api/talent/submit
Submit a new talent application.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "position": "Sales Development Representative",
  "source": "LinkedIn",
  "experience": "2-3",
  "skills": "Sales, Marketing, CRM",
  "whyRecipeLabs": "I'm excited about..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "id": "TAL-1234567890-abc123"
}
```

### GET /api/talent/applications
Get all applications (add authentication in production).

**Response:**
```json
{
  "success": true,
  "count": 10,
  "applications": [...]
}
```

### GET /api/talent/applications/:id
Get a specific application by ID.

### GET /api/talent/campaigns/:campaignId
Get all applications for a specific campaign.

### GET /api/talent/health
Health check endpoint.

## Database

Applications are stored in `data/talent-applications.json` as JSON.

**Schema:**
```json
{
  "id": "TAL-1234567890-abc123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "location": "Boston, MA",
  "linkedin": "https://linkedin.com/in/johndoe",
  "portfolio": "https://johndoe.com",
  "position": "Sales Development Representative",
  "source": "LinkedIn",
  "experience": "2-3",
  "currentCompany": "ABC Corp",
  "currentTitle": "Sales Rep",
  "skills": "Sales, Marketing, CRM",
  "experienceDetails": "...",
  "whyRecipeLabs": "...",
  "availability": "2-weeks",
  "salaryExpectations": "$50,000 - $70,000",
  "additionalNotes": "...",
  "submittedAt": "2026-01-15T10:30:00.000Z",
  "campaignId": "linkedin-sdr-2026",
  "utm_source": "linkedin",
  "utm_medium": "social",
  "utm_campaign": "sdr-hiring"
}
```

## Email Configuration

The system supports multiple email providers:

### Gmail
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### SendGrid
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
```

### SMTP (Generic)
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

## Campaign Tracking

The funnel supports campaign tracking via URL parameters:

```
https://madebyrecipe.com/talent.html?campaign=linkedin-sdr-2026&utm_source=linkedin&utm_medium=social&utm_campaign=sdr-hiring
```

All UTM parameters and campaign IDs are automatically captured and stored with each application.

## Production Deployment

### Security Considerations

1. **Add Authentication** to `/api/talent/applications` endpoint
2. **Use Environment Variables** for all sensitive data
3. **Enable HTTPS** for all API calls
4. **Rate Limiting** - Add rate limiting to prevent abuse
5. **Input Validation** - Additional validation on server side
6. **Database Migration** - Consider migrating to a proper database (PostgreSQL, MongoDB) for production

### Recommended Database Migration

For production, consider migrating to a proper database:

**PostgreSQL Example:**
```sql
CREATE TABLE talent_applications (
  id VARCHAR(50) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL,
  experience VARCHAR(20),
  skills TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  campaign_id VARCHAR(100),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  data JSONB
);
```

## File Structure

```
api/
├── talent-server.js      # Main server file
├── package.json          # Dependencies
├── .env.example         # Environment template
├── README.md            # This file
└── ../data/             # Database directory (created automatically)
    └── talent-applications.json
```

## Support

For issues or questions, contact: sales@madebyrecipe.com

