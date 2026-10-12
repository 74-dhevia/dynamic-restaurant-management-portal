import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __waFilename = fileURLToPath(import.meta.url);
const __waDirname = path.dirname(__waFilename);

dotenv.config({ path: path.resolve(__waDirname, '../.env') });
dotenv.config({ path: path.resolve(__waDirname, '../../.env') });
dotenv.config();

/**
 * WhatsApp Messaging Service for ZESTRO.
 * Supports Twilio WhatsApp API, Meta WhatsApp Cloud API, and development fallback simulation.
 */

export const sendWhatsAppOtp = async ({ to, name = 'Customer', otp }) => {
  try {
    // Sanitize phone number (strip whitespace, dashes, parens)
    let cleanPhone = to.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone.startsWith('+')) {
      // Default to India (+91) if 10 digits
      if (cleanPhone.length === 10) {
        cleanPhone = `+91${cleanPhone}`;
      } else {
        cleanPhone = `+${cleanPhone}`;
      }
    }

    const messageText = `🍽️ *ZESTRO Security*\n\nHello ${name},\nYour password reset verification OTP is: *${otp}*\n\n⏱️ This code expires in 10 minutes.\n🔒 Do not share this code with anyone.`;
    let lastProviderError = null;

    // 1. Check if Twilio is configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      try {
        const twilioModule = await import('twilio');
        const twilio = twilioModule.default;
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        let twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER.trim();
        if (twilioFrom.startsWith('whatsapp:')) {
          twilioFrom = twilioFrom.replace('whatsapp:', '');
        }
        if (!twilioFrom.startsWith('+')) {
          twilioFrom = `+${twilioFrom}`;
        }

        const msgOptions = {
          from: `whatsapp:${twilioFrom}`,
          to: `whatsapp:${cleanPhone}`,
        };

        if (process.env.TWILIO_CONTENT_SID) {
          msgOptions.contentSid = process.env.TWILIO_CONTENT_SID;
          msgOptions.contentVariables = JSON.stringify({
            '1': String(otp),
            '2': '10 minutes',
          });
        } else {
          msgOptions.body = messageText;
        }

        const response = await client.messages.create(msgOptions);

        console.log(`✅ WhatsApp OTP sent via Twilio to ${cleanPhone} (SID: ${response.sid})`);
        return {
          success: true,
          provider: 'twilio',
          messageId: response.sid,
        };
      } catch (twilioErr) {
        console.error('❌ Twilio WhatsApp dispatch error:', twilioErr.message);
        lastProviderError = twilioErr.message;
      }
    }

    // 2. Check if Meta WhatsApp Cloud API is configured
    if (process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_TOKEN}`,
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: cleanPhone.replace('+', ''),
              type: 'text',
              text: { body: messageText },
            }),
          }
        );
        const metaData = await metaRes.json();
        if (metaRes.ok) {
          console.log(`✅ WhatsApp OTP sent via Meta Cloud API to ${cleanPhone}`);
          return {
            success: true,
            provider: 'meta',
            messageId: metaData.messages?.[0]?.id,
          };
        }
        console.error('❌ Meta WhatsApp dispatch error:', metaData);
      } catch (metaErr) {
        console.error('❌ Meta WhatsApp Cloud API error:', metaErr.message);
      }
    }

    // 3. Fallback / Dev simulation mode:
    // Generate a direct wa.me link for testing
    const waMeUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(messageText)}`;
    console.warn(`📱 [WhatsApp OTP Simulation] Phone: ${cleanPhone} | Name: ${name} | OTP: ${otp}`);
    console.log(`📱 Direct test link: ${waMeUrl}`);

    return {
      success: true,
      simulated: true,
      phone: cleanPhone,
      otp,
      waMeUrl,
      error: lastProviderError || undefined,
      message: lastProviderError
        ? `WhatsApp dispatch notice: ${lastProviderError}. (Dev fallback OTP logged)`
        : 'WhatsApp credentials not yet configured in backend/.env. Simulated OTP logged.',
    };
  } catch (error) {
    console.error('❌ Failed to dispatch WhatsApp OTP:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
