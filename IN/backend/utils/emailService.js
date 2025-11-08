const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send notification email
const sendNotificationEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const errorMsg = 'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in backend/.env file';
      console.error('❌ EMAIL ERROR:', errorMsg);
      console.error('📝 To fix: Add these lines to backend/.env:');
      console.error('   EMAIL_HOST=smtp.gmail.com');
      console.error('   EMAIL_PORT=587');
      console.error('   EMAIL_USER=your-email@gmail.com');
      console.error('   EMAIL_PASS=your-app-password');
      return { success: false, message: errorMsg };
    }

    if (!process.env.EMAIL_HOST) {
      console.warn('⚠️  EMAIL_HOST not configured. Using default smtp.gmail.com');
    }

    const transporter = createTransporter();
    
    // Verify connection (optional - might fail but email could still work)
    try {
      await transporter.verify();
      console.log('Email server connection verified');
    } catch (verifyError) {
      console.warn('Email server verification failed, but will attempt to send:', verifyError.message);
    }
    
    const mailOptions = {
      from: `"Schedulo" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    console.log('Sending email to:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully. Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return { success: false, error: error.message, details: error };
  }
};

// Send allocation notification to faculty
const sendAllocationEmail = async (faculty, allocation) => {
  const subject = 'New Invigilation Duty Assigned - Schedulo';
  
  // Generate login URL (adjust based on your deployment)
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const dashboardUrl = `${loginUrl}/faculty/dashboard`;
  const requestsUrl = `${loginUrl}/faculty/requests`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
        .duty-card { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .duty-card h3 { margin-top: 0; color: #667eea; }
        .duty-info { margin: 10px 0; }
        .duty-info strong { color: #555; }
        .button-container { text-align: center; margin: 30px 0 20px 0; }
        .btn { display: inline-block; padding: 12px 30px; margin: 5px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .btn-secondary { background: #f59e0b; color: white; }
        .btn:hover { opacity: 0.9; }
        .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .alert-box strong { color: #92400e; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
        .footer p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Schedulo - Invigilation Duty Assigned</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${faculty.name}</strong>,</p>
          <p>You have been assigned a new invigilation duty. Please review the details below:</p>
          
          <div class="duty-card">
            <h3>📝 ${allocation.exam.examName || allocation.exam.subject}</h3>
            <div class="duty-info">
              <p><strong>📅 Date:</strong> ${new Date(allocation.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>🕐 Time:</strong> ${allocation.startTime} - ${allocation.endTime}</p>
              <p><strong>🏢 Block:</strong> ${allocation.campus || allocation.exam.campus || 'Not specified'}</p>
              <p><strong>🚪 Room:</strong> ${allocation.room}</p>
              <p><strong>📚 Subject:</strong> ${allocation.exam.subject}</p>
              <p><strong>🏫 Department:</strong> ${faculty.department || 'Not specified'}</p>
            </div>
          </div>

          <div class="alert-box">
            <strong>⚠️ Unable to attend?</strong>
            <p style="margin: 10px 0 0 0;">If you have a conflict or cannot attend this duty, you can request a replacement through the system.</p>
          </div>

          <div class="button-container">
            <a href="${dashboardUrl}" class="btn btn-primary">
              📊 View My Dashboard
            </a>
            <a href="${requestsUrl}" class="btn btn-secondary">
              🔄 Request Replacement
            </a>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>How to request a replacement:</strong><br>
            1. Click the "Request Replacement" button above<br>
            2. Select the duty you want to change<br>
            3. Provide a reason for the request<br>
            4. Optionally suggest a replacement faculty member<br>
            5. Submit your request for admin approval
          </p>

          <p style="margin-top: 20px;">
            Please log in to your Schedulo account to view all your duties and manage your schedule.
          </p>
        </div>
        <div class="footer">
          <p><strong>Schedulo - Invigilation Management System</strong></p>
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>For support, contact your department administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendNotificationEmail(faculty.email, subject, html);
};

module.exports = { sendNotificationEmail, sendAllocationEmail };

