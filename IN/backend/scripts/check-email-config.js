// Email Configuration Checker
// Run this to verify your email settings

require('dotenv').config();

console.log('\n========================================');
console.log('📧 EMAIL CONFIGURATION CHECK');
console.log('========================================\n');

const checks = {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : undefined
};

let allGood = true;

console.log('Current Configuration:\n');

for (const [key, value] of Object.entries(checks)) {
  const status = value ? '✅' : '❌';
  const displayValue = value || 'NOT SET';
  console.log(`${status} ${key}: ${displayValue}`);
  
  if (!value) {
    allGood = false;
  }
}

console.log('\n========================================');

if (!allGood) {
  console.log('❌ EMAIL CONFIGURATION INCOMPLETE!\n');
  console.log('To fix, add these lines to backend/.env:\n');
  console.log('EMAIL_HOST=smtp.gmail.com');
  console.log('EMAIL_PORT=587');
  console.log('EMAIL_USER=your-email@gmail.com');
  console.log('EMAIL_PASS=your-16-char-app-password\n');
  console.log('📖 See EMAIL_CONFIGURATION_STEPS.md for detailed instructions');
  console.log('🔗 Gmail App Password: https://myaccount.google.com/apppasswords\n');
} else {
  console.log('✅ EMAIL CONFIGURATION COMPLETE!\n');
  console.log('Testing email connection...\n');
  
  // Test email connection
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  transporter.verify()
    .then(() => {
      console.log('✅ EMAIL SERVER CONNECTION SUCCESSFUL!');
      console.log('🎉 You can now send emails to faculty!\n');
    })
    .catch((error) => {
      console.log('❌ EMAIL SERVER CONNECTION FAILED!');
      console.log('Error:', error.message);
      console.log('\nPossible issues:');
      console.log('1. Wrong email or password');
      console.log('2. Need to use App Password (not regular password)');
      console.log('3. 2FA not enabled on Gmail');
      console.log('4. Network/firewall blocking SMTP\n');
      console.log('📖 See EMAIL_CONFIGURATION_STEPS.md for troubleshooting\n');
    });
}

console.log('========================================\n');
