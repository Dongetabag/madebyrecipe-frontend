# Environment Variables Setup

Copy this content to create your `.env` file:

```env
# Recipe Labs Talent Funnel - Environment Variables

# Server Configuration
PORT=3001

# Email Configuration
# Choose one: 'gmail', 'sendgrid', or 'smtp'
EMAIL_SERVICE=smtp

# For Gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# For SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# For SMTP (generic)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Email Settings
EMAIL_FROM="Recipe Labs Talent Funnel <noreply@madebyrecipe.com>"
NOTIFICATION_EMAIL=sales@madebyrecipe.com
```

## Quick Setup

1. Create a `.env` file in the `api/` directory
2. Copy the content above
3. Replace the placeholder values with your actual credentials
4. Save the file

## Gmail Setup

To use Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password) in `EMAIL_PASSWORD`

## SendGrid Setup

1. Sign up at https://sendgrid.com
2. Create an API key
3. Use the API key in `SENDGRID_API_KEY`

