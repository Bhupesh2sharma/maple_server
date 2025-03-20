const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: "travelwithmaple2023@gmail.com",
    pass: "nnsa xbkc fecy jzgu", // Your working App Password
  },
});

const sendBookingEmail = async (booking) => {
  try {
    console.log('Attempting to send emails for booking:', booking._id);

    // Customer Email Template (keeping your existing working template)
    const customerEmailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f45201; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Maple Tours and Travels</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
          <h2 style="color: #333;">Thank You for Your Booking!</h2>
          
          <p>Dear Customer,</p>
          
          <p>Thank you for choosing Maple Tours and Travels. Your booking has been received with the following details:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Booking ID:</strong> ${booking._id}</p>
            <p><strong>Package:</strong> ${booking.package.title}</p>
            <p><strong>Travel Date:</strong> ${new Date(
              booking.startDate
            ).toLocaleDateString()}</p>
            <p><strong>Number of Travelers:</strong> ${
              booking.numberOfPeople.adults
            } Adults, ${booking.numberOfPeople.children} Children</p>
            <p><strong>Total Amount:</strong> ₹${booking.totalAmount.toLocaleString()}</p>
          </div>
          
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="color: #e65100; margin: 0;">
              <strong>Important:</strong> Your booking is currently pending. To confirm your reservation, please complete the payment.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="https://www.mapleleaftourstravels.com/booking/${
              booking._id
            }/payment" 
               style="background-color: #f45201; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Complete Payment
            </a>
          </div>
        </div>
      </div>
    `;








    // Updated Admin Email Template with complete contact details
    const adminEmailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f45201; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Booking Alert!</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
          <h2 style="color: #333;">New Booking Details</h2>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Booking ID:</strong> ${booking._id}</p>
            <p><strong>Package:</strong> ${booking.package.title}</p>
            <p><strong>Travel Date:</strong> ${new Date(
              booking.startDate
            ).toLocaleDateString()}</p>
            <p><strong>Number of Travelers:</strong> ${
              booking.numberOfPeople.adults
            } Adults, ${booking.numberOfPeople.children} Children</p>
            <p><strong>Total Amount:</strong> ₹${booking.totalAmount.toLocaleString()}</p>
          </div>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #333; margin-top: 0;">Customer Contact Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Primary Phone:</strong></td>
                <td style="padding: 8px 0;">${booking.contactDetails.phone}</td>
              </tr>
              ${
                booking.contactDetails.alternatePhone
                  ? `
                <tr>
                  <td style="padding: 8px 0;"><strong>Alternate Phone:</strong></td>
                  <td style="padding: 8px 0;">${booking.contactDetails.alternatePhone}</td>
                </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding: 8px 0;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;">${booking.contactDetails.email}</td>
              </tr>
            </table>
          </div>

          ${
            booking.specialRequirements
              ? `
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #333; margin-top: 0;">Special Requirements</h3>
              <p style="margin: 0;">${booking.specialRequirements}</p>
            </div>
          `
              : ""
          }

          <div style="text-align: center; margin-top: 20px;">
            <a href="https://maple-admin-ncu7-git-main-techbhupesh-gmailcoms-projects.vercel.app/admin/bookings" 
               style="background-color: #f45201; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View in Admin Panel
            </a>
          </div>
        </div>
      </div>
    `;

    // Send both emails
    console.log('Sending emails for booking:', booking._id);
    console.log('Customer phone:', booking.contactDetails.phone);

    // Send email to customer
    console.log('Sending email to customer:', booking.contactDetails.email);
    const customerInfo = await transporter.sendMail({
      from: '"Maple Tours" <travelwithmaple2023@gmail.com>',
      to: booking.contactDetails.email,
      subject: "Complete Your Booking Payment - Maple Tours and Travels",
      html: customerEmailTemplate,
    });
    console.log('Customer email sent successfully:', customerInfo.messageId);

    // Send email to admin with updated template
    const adminInfo = await transporter.sendMail({
      from: '"Maple Tours System" <travelwithmaple2023@gmail.com>',
      to: "travelwithmaple2023@gmail.com",
      subject: `New Booking Alert - ${booking.package.title}`,
      html: adminEmailTemplate,
    });
    console.log('Admin email sent successfully:', adminInfo.messageId);

    console.log('Both emails sent successfully');
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Keeping your existing test function
const testEmail = async (toEmail) => {
  try {
    const info = await transporter.sendMail({
      from: '"Maple Tours" <travelwithmaple2023@gmail.com>',
      to: toEmail,
      subject: "Test Email",
      text: "This is a test email from Maple Tours",
    });
    console.log('Test email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Test email error:', error);
    return false;
  }
};
// Add this new function to your existing emailService.js
const sendPaymentConfirmationEmail = async (booking) => {
  try {
    console.log('Sending payment confirmation emails for booking:', booking._id);

    // Customer Payment Confirmation Email
    const customerPaymentTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f45201; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Confirmed!</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
          <h2 style="color: #333;">Booking Confirmed Successfully</h2>
          
          <p>Dear Customer,</p>
          
          <p>Great news! Your payment has been received and your booking is now confirmed.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #333; margin-top: 0;">Booking Details:</h3>
            <p><strong>Booking ID:</strong> ${booking._id}</p>
            <p><strong>Package:</strong> ${booking.package.title}</p>
            <p><strong>Travel Date:</strong> ${new Date(
              booking.startDate
            ).toLocaleDateString()}</p>
            <p><strong>Number of Travelers:</strong> ${
              booking.numberOfPeople.adults
            } Adults, ${booking.numberOfPeople.children} Children</p>
            <p><strong>Total Amount Paid:</strong> ₹${booking.totalAmount.toLocaleString()}</p>
          </div>

          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #2e7d32; margin-top: 0;">Payment Details:</h3>
            <p><strong>Payment Status:</strong> Completed</p>
            <p><strong>Payment ID:</strong> ${
              booking.paymentDetails.razorpayPaymentId
            }</p>
            <p><strong>Transaction Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #e65100; margin-top: 0;">Important Information:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Please keep this email for your records</li>
              <li>Carry a printed copy or show this email during check-in</li>
              <li>Government-issued ID proof is mandatory for all travelers</li>
            </ul>
          </div>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #333; margin-top: 0;">Need Help?</h3>
            <p>If you have any questions or need assistance, please contact us:</p>
            <p>📞 Phone: +91 7001895132</p>
            <p>📧 Email: travelwithmaple2023@gmail.com</p>
          </div>
        </div>
      </div>
    `;

    // Admin Payment Notification Email
    const adminPaymentTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f45201; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Received!</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
          <h2 style="color: #333;">Payment Confirmation</h2>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #333; margin-top: 0;">Booking & Payment Details:</h3>
            <p><strong>Booking ID:</strong> ${booking._id}</p>
            <p><strong>Package:</strong> ${booking.package.title}</p>
            <p><strong>Amount Received:</strong> ₹${booking.totalAmount.toLocaleString()}</p>
            <p><strong>Payment ID:</strong> ${
              booking.paymentDetails.razorpayPaymentId
            }</p>
            <p><strong>Transaction Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #333; margin-top: 0;">Customer Details:</h3>
            <p><strong>Phone:</strong> ${booking.contactDetails.phone}</p>
            <p><strong>Email:</strong> ${booking.contactDetails.email}</p>
            ${
              booking.contactDetails.alternatePhone
                ? `<p><strong>Alternate Phone:</strong> ${booking.contactDetails.alternatePhone}</p>`
                : ""
            }
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="https://maple-admin-ncu7-git-main-techbhupesh-gmailcoms-projects.vercel.app/admin/bookings/${
              booking._id
            }" 
               style="background-color: #f45201; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Booking Details
            </a>
          </div>
        </div>
      </div>
    `;

    // Send payment confirmation to customer
    const customerInfo = await transporter.sendMail({
      from: '"Maple Tours" <travelwithmaple2023@gmail.com>',
      to: booking.contactDetails.email,
      subject: "Payment Confirmed - Your Booking is Confirmed! - Maple Tours",
      html: customerPaymentTemplate,
    });
    console.log('Customer payment confirmation email sent:', customerInfo.messageId);

    // Send payment notification to admin
    const adminInfo = await transporter.sendMail({
      from: '"Maple Tours System" < travelwithmaple2023@gmail.com>',
      to: " travelwithmaple2023@gmail.com",
      subject: `Payment Received - Booking ${booking._id}`,
      html: adminPaymentTemplate,
    });
    console.log('Admin payment notification email sent:', adminInfo.messageId);

    return true;
  } catch (error) {
    console.error('Payment confirmation email error:', error);
    return false;
  }
};

// Add this to your exports
module.exports = {
  sendBookingEmail,
  testEmail,
  sendPaymentConfirmationEmail  // Add this line
};
