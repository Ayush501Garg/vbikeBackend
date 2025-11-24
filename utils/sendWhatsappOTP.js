const twilio = require("twilio");

console.log("🔍 SID:", process.env.TWILIO_SID);
console.log("🔍 TOKEN:", process.env.TWILIO_AUTH);

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

module.exports = async function sendWhatsappOTP(phone, otp) {

  const message = 
`*VBike Verification*

To complete your verification, please use the One-Time Password (OTP) below:

🔐 *Your OTP:* ${otp}

⏳ This OTP is valid for the next *5 minutes.*

⚠️ For your safety, do NOT share this code with anyone.

VBike – Smarter. Cleaner. Faster.`;

  return await client.messages.create({
    from: "whatsapp:+14155238886",
    to: `whatsapp:${phone}`,
    body: message,
  });
};
