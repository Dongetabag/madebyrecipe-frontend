// Email fallback using server's mail command
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function sendEmailFallback(to, subject, html, text) {
  // Save email to file for manual sending
  const emailDir = path.join(__dirname, '..', 'data', 'emails');
  await fs.mkdir(emailDir, { recursive: true });
  
  const emailFile = path.join(emailDir, `email-${Date.now()}.txt`);
  const emailContent = `To: ${to}
Subject: ${subject}
Content-Type: text/html; charset=utf-8

${html}`;
  
  await fs.writeFile(emailFile, emailContent);
  
  // Try to send via sendmail if available
  return new Promise((resolve) => {
    exec(`echo ${text} | mail -s ${subject} ${to} 2>&1`, (error, stdout, stderr) => {
      if (error) {
        console.log('Email saved to file (sendmail not available):', emailFile);
        resolve({ success: false, saved: true, file: emailFile });
      } else {
        console.log('Email sent via sendmail');
        resolve({ success: true, sent: true });
      }
    });
  });
}

module.exports = { sendEmailFallback };
