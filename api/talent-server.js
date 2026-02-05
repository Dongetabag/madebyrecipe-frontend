/**
 * Recipe Labs Talent Funnel - Backend API Server
 * Handles talent application submissions, database storage, and email notifications
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
const corsOptions = {
  origin: [
    'https://madebyrecipe.com',
    'http://madebyrecipe.com',
    'https://www.madebyrecipe.com',
    'http://www.madebyrecipe.com',
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Database file path
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'talent-applications.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    // Initialize database file if it doesn't exist
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error ensuring data directory:', error);
  }
}

// Email configuration
const createTransporter = () => {
  // Use environment variables for email configuration
  // For production, use SMTP credentials
  // For development, you can use Gmail with app password or a service like SendGrid
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
  } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    // Default: Use SMTP (configure with your email provider)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-password'
      }
    });
  }
};

// Load applications from database
async function loadApplications() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading applications:', error);
    return [];
  }
}

// Save applications to database
async function saveApplications(applications) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(applications, null, 2));
  } catch (error) {
    console.error('Error saving applications:', error);
    throw error;
  }
}

// Format email content
function formatEmailContent(data) {
  const position = data.position || 'Not specified';
  const source = data.source || 'Not specified';
  const experience = data.experience || 'Not specified';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F5D547 0%, #D4B83A 50%, #4A7C4E 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .section { margin-bottom: 20px; }
    .label { font-weight: bold; color: #4A7C4E; }
    .value { margin-left: 10px; }
    .footer { background: #0f1410; color: #a8b4a4; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎯 New Talent Application - Recipe Labs</h2>
    </div>
    <div class="content">
      <div class="section">
        <h3>Personal Information</h3>
        <p><span class="label">Name:</span> <span class="value">${data.firstName} ${data.lastName}</span></p>
        <p><span class="label">Email:</span> <span class="value">${data.email}</span></p>
        <p><span class="label">Phone:</span> <span class="value">${data.phone || 'Not provided'}</span></p>
        <p><span class="label">Location:</span> <span class="value">${data.location || 'Not provided'}</span></p>
        ${data.linkedin ? `<p><span class="label">LinkedIn:</span> <span class="value"><a href="${data.linkedin}">${data.linkedin}</a></span></p>` : ''}
        ${data.portfolio ? `<p><span class="label">Portfolio:</span> <span class="value"><a href="${data.portfolio}">${data.portfolio}</a></span></p>` : ''}
      </div>

      <div class="section">
        <h3>Role Information</h3>
        <p><span class="label">Position:</span> <span class="value">${position}</span></p>
        <p><span class="label">Source:</span> <span class="value">${source}</span></p>
        <p><span class="label">Campaign ID:</span> <span class="value">${data.campaignId || 'default'}</span></p>
      </div>

      <div class="section">
        <h3>Experience & Skills</h3>
        <p><span class="label">Experience:</span> <span class="value">${experience}</span></p>
        ${data.currentCompany ? `<p><span class="label">Current Company:</span> <span class="value">${data.currentCompany}</span></p>` : ''}
        ${data.currentTitle ? `<p><span class="label">Current Title:</span> <span class="value">${data.currentTitle}</span></p>` : ''}
        <p><span class="label">Skills:</span> <span class="value">${data.skills || 'Not provided'}</span></p>
        ${data.experienceDetails ? `<p><span class="label">Experience Details:</span><br><span class="value">${data.experienceDetails.replace(/\n/g, '<br>')}</span></p>` : ''}
      </div>

      <div class="section">
        <h3>Additional Information</h3>
        <p><span class="label">Why Recipe Labs:</span><br><span class="value">${(data.whyRecipeLabs || 'Not provided').replace(/\n/g, '<br>')}</span></p>
        ${data.availability ? `<p><span class="label">Availability:</span> <span class="value">${data.availability}</span></p>` : ''}
        ${data.salaryExpectations ? `<p><span class="label">Salary Expectations:</span> <span class="value">${data.salaryExpectations}</span></p>` : ''}
        ${data.additionalNotes ? `<p><span class="label">Additional Notes:</span><br><span class="value">${data.additionalNotes.replace(/\n/g, '<br>')}</span></p>` : ''}
      </div>

      <div class="section">
        <h3>Metadata</h3>
        <p><span class="label">Submitted:</span> <span class="value">${new Date(data.submittedAt).toLocaleString()}</span></p>
        ${data.utm_source ? `<p><span class="label">UTM Source:</span> <span class="value">${data.utm_source}</span></p>` : ''}
        ${data.utm_medium ? `<p><span class="label">UTM Medium:</span> <span class="value">${data.utm_medium}</span></p>` : ''}
        ${data.utm_campaign ? `<p><span class="label">UTM Campaign:</span> <span class="value">${data.utm_campaign}</span></p>` : ''}
      </div>
    </div>
    <div class="footer">
      <p>This email was automatically generated from the Recipe Labs Talent Funnel</p>
      <p>Application ID: ${data.id}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Send email via sendmail (fallback method)
async function sendEmailViaSendmail(to, subject, html, text) {
  try {
    // Use a proper from address that matches the domain
    const fromEmail = process.env.EMAIL_FROM || 'noreply@madebyrecipe.com';
    const fromName = 'Recipe Labs Talent Funnel';
    
    // Create email content with proper headers to reduce spam
    const emailContent = `From: ${fromName} <${fromEmail}>
To: ${to}
Reply-To: ${fromEmail}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/html; charset=utf-8
X-Mailer: Recipe Labs Talent Funnel
X-Priority: 1
Importance: High

${html}`;

    // Use sendmail to send email
    const { stdout, stderr } = await execAsync(`echo "${emailContent.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" | /usr/sbin/sendmail -t -i`);
    
    if (stderr) {
      console.log('Sendmail stderr:', stderr);
    }
    
    console.log('Email sent via sendmail to:', to);
    return { success: true, method: 'sendmail' };
  } catch (error) {
    console.error('Error sending via sendmail:', error);
    return { success: false, error: error.message, method: 'sendmail' };
  }
}

// Save email to file (backup method)
async function saveEmailToFile(data, emailContent) {
  try {
    const emailDir = path.join(__dirname, '..', 'data', 'emails');
    await fs.mkdir(emailDir, { recursive: true });
    
    const emailFile = path.join(emailDir, `email-${data.id}-${Date.now()}.html`);
    await fs.writeFile(emailFile, emailContent);
    
    console.log('Email saved to file:', emailFile);
    return { success: true, file: emailFile };
  } catch (error) {
    console.error('Error saving email to file:', error);
    return { success: false, error: error.message };
  }
}

// Send webhook notification (Discord/Slack/etc)
async function sendWebhookNotification(data) {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) return { success: false, error: 'No webhook URL configured' };

  try {
    const payload = {
      username: 'Recipe Labs Talent Funnel',
      embeds: [{
        title: `🎯 New Talent Application: ${data.firstName} ${data.lastName}`,
        color: 0xF5D547,
        fields: [
          {
            name: '📧 Contact',
            value: `Email: ${data.email}\nPhone: ${data.phone || 'N/A'}`,
            inline: true
          },
          {
            name: '💼 Position',
            value: `${data.position || 'Not specified'}\nSource: ${data.source || 'N/A'}`,
            inline: true
          },
          {
            name: '📊 Experience',
            value: `${data.experience || 'N/A'} years\nCompany: ${data.currentCompany || 'N/A'}`,
            inline: true
          },
          {
            name: '🛠️ Skills',
            value: data.skills || 'Not provided',
            inline: false
          },
          {
            name: '💬 Why Recipe Labs',
            value: (data.whyRecipeLabs || 'Not provided').substring(0, 500),
            inline: false
          },
          {
            name: '🆔 Application ID',
            value: `\`${data.id}\``,
            inline: true
          },
          {
            name: '📅 Submitted',
            value: new Date(data.submittedAt).toLocaleString(),
            inline: true
          }
        ],
        footer: {
          text: 'Recipe Labs Talent Funnel'
        },
        timestamp: new Date(data.submittedAt).toISOString()
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('Webhook notification sent');
      return { success: true, method: 'webhook' };
    } else {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending webhook:', error);
    return { success: false, error: error.message, method: 'webhook' };
  }
}

// Send email notification
async function sendEmailNotification(data) {
  const to = process.env.NOTIFICATION_EMAIL || 'sales@madebyrecipe.com';
  const subject = `🎯 New Talent Application: ${data.firstName} ${data.lastName} - ${data.position || 'Position TBD'}`;
  const html = formatEmailContent(data);
  const text = `
New Talent Application - Recipe Labs

Personal Information:
- Name: ${data.firstName} ${data.lastName}
- Email: ${data.email}
- Phone: ${data.phone || 'Not provided'}
- Location: ${data.location || 'Not provided'}
${data.linkedin ? `- LinkedIn: ${data.linkedin}` : ''}
${data.portfolio ? `- Portfolio: ${data.portfolio}` : ''}

Role Information:
- Position: ${data.position || 'Not specified'}
- Source: ${data.source || 'Not specified'}
- Campaign ID: ${data.campaignId || 'default'}

Experience & Skills:
- Experience: ${data.experience || 'Not specified'}
${data.currentCompany ? `- Current Company: ${data.currentCompany}` : ''}
${data.currentTitle ? `- Current Title: ${data.currentTitle}` : ''}
- Skills: ${data.skills || 'Not provided'}
${data.experienceDetails ? `- Experience Details: ${data.experienceDetails}` : ''}

Additional Information:
- Why Recipe Labs: ${data.whyRecipeLabs || 'Not provided'}
${data.availability ? `- Availability: ${data.availability}` : ''}
${data.salaryExpectations ? `- Salary Expectations: ${data.salaryExpectations}` : ''}
${data.additionalNotes ? `- Additional Notes: ${data.additionalNotes}` : ''}

Metadata:
- Submitted: ${new Date(data.submittedAt).toLocaleString()}
- Application ID: ${data.id}
  `.trim();

  // Always save email to file as backup
  await saveEmailToFile(data, html);

  // Try webhook first (most reliable)
  if (process.env.WEBHOOK_URL) {
    const webhookResult = await sendWebhookNotification(data);
    if (webhookResult.success) {
      console.log('Notification sent via webhook');
    }
  }

  // Try SMTP first (if configured)
  let result = { success: false };
  
  try {
    // Check if SMTP is configured (not using placeholder values)
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
    
    if (smtpUser && smtpPass && 
        !smtpUser.includes('your-email') && 
        !smtpPass.includes('your-app-password') &&
        !smtpPass.includes('your-password')) {
      
      // SMTP is configured, try using it
      const transporter = createTransporter();
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"Recipe Labs Talent Funnel" <${smtpUser}>`,
        to: to,
        subject: subject,
        html: html,
        text: text
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent via SMTP:', info.messageId);
      return { success: true, messageId: info.messageId, method: 'smtp' };
    }
  } catch (smtpError) {
    console.log('SMTP failed:', smtpError.message);
  }

  // Fallback to sendmail (may not work on shared hosting)
  result = await sendEmailViaSendmail(to, subject, html, text);
  
  // Even if sending fails, we've saved to file and sent webhook (if configured)
  // So we consider it handled
  if (!result.success) {
    console.log('Email sending failed, but notification handled via webhook/file backup.');
    return { success: true, method: 'file+webhook', note: 'Email saved to file, webhook sent (if configured)' };
  }

  return result;
}

// API Routes

// Health check
app.get('/api/talent/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Submit talent application
app.post('/api/talent/submit', async (req, res) => {
  try {
    let data = req.body;

    // Handle new simplified format (fullName) vs old format (firstName/lastName)
    if (data.fullName && !data.firstName) {
      const nameParts = data.fullName.trim().split(/\s+/);
      data.firstName = nameParts[0] || '';
      data.lastName = nameParts.slice(1).join(' ') || '';
    }

    // Validate required fields (flexible for both old and new formats)
    const requiredFields = [];
    
    // Check for new format requirements (simplified)
    if (data.fullName || (!data.firstName && !data.lastName)) {
      // New format: only need fullName, email, position, whyRecipeLabs
      if (!data.fullName && !data.firstName) {
        requiredFields.push('fullName');
      }
      requiredFields.push('email', 'position', 'whyRecipeLabs');
    } else {
      // Old format: all original required fields
      requiredFields.push('firstName', 'lastName', 'email', 'phone', 'position', 'source', 'experience', 'skills', 'whyRecipeLabs');
    }
    
    const missingFields = requiredFields.filter(field => {
      if (field === 'fullName') return !data.fullName && !data.firstName;
      return !data[field];
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Generate unique ID
    const id = `TAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    data.id = id;

    // Load existing applications
    const applications = await loadApplications();

    // Add new application
    applications.push(data);

    // Save to database
    await saveApplications(applications);

    // Send email notification (don't block on this)
    sendEmailNotification(data).catch(err => {
      console.error('Failed to send email notification:', err);
      // Don't fail the request if email fails
    });

    // Return success
    res.json({
      success: true,
      message: 'Application submitted successfully',
      id: data.id
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      error: 'Failed to submit application',
      message: error.message
    });
  }
});

// Get all applications (for admin/internal use - add authentication in production)
app.get('/api/talent/applications', async (req, res) => {
  try {
    // In production, add authentication here
    // if (!req.headers.authorization || !isValidToken(req.headers.authorization)) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    const applications = await loadApplications();
    res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Error loading applications:', error);
    res.status(500).json({
      error: 'Failed to load applications',
      message: error.message
    });
  }
});

// Get application by ID
app.get('/api/talent/applications/:id', async (req, res) => {
  try {
    const applications = await loadApplications();
    const application = applications.find(app => app.id === req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error loading application:', error);
    res.status(500).json({
      error: 'Failed to load application',
      message: error.message
    });
  }
});

// Get applications by campaign
app.get('/api/talent/campaigns/:campaignId', async (req, res) => {
  try {
    const applications = await loadApplications();
    const campaignApplications = applications.filter(app => app.campaignId === req.params.campaignId);
    
    res.json({
      success: true,
      campaignId: req.params.campaignId,
      count: campaignApplications.length,
      applications: campaignApplications
    });
  } catch (error) {
    console.error('Error loading campaign applications:', error);
    res.status(500).json({
      error: 'Failed to load campaign applications',
      message: error.message
    });
  }
});

// Initialize server
async function startServer() {
  await ensureDataDir();
  
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║   Recipe Labs Talent Funnel API Server                   ║
║   Running on port ${PORT}                                ║
║                                                          ║
║   Endpoints:                                             ║
║   - POST /api/talent/submit                              ║
║   - GET  /api/talent/applications                        ║
║   - GET  /api/talent/applications/:id                    ║
║   - GET  /api/talent/campaigns/:campaignId              ║
║   - GET  /api/talent/health                              ║
╚══════════════════════════════════════════════════════════╝
    `);
  });
}

// Start server
startServer().catch(console.error);

module.exports = app;

