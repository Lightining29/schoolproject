// ==============================================================================
// WhatsApp Messaging Service for School Management & Fee Reminders
// Supports:
// 1. WhatsApp Cloud API (Meta Official - WHATSAPP_API_TOKEN & WHATSAPP_PHONE_NUMBER_ID)
// 2. Generic Webhook / Gateway (WHATSAPP_GATEWAY_URL & WHATSAPP_GATEWAY_API_KEY)
// 3. Fallback direct wa.me link generation for instant 1-click WhatsApp messaging
// ==============================================================================

/**
 * Clean & format phone numbers to international E.164-compatible format
 * e.g. "9876543210" -> "919876543210" (defaulting to India country code 91 if 10 digits)
 * @param {string} phone 
 * @returns {string} digits only with country code
 */
export function formatPhoneNumberForWhatsApp(phone = '') {
  if (!phone) return '';
  // Strip all non-digit characters
  let digits = String(phone).replace(/\D/g, '');
  
  // If 10 digits (standard Indian mobile number), prepend default 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // 09876543210 -> 919876543210
    digits = `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Generate standard, personalized Fee Reminder message copy for WhatsApp
 * @param {Object} options
 * @param {string} options.studentName
 * @param {string} options.studentId
 * @param {string} options.studentClass
 * @param {string} options.parentName
 * @param {number} options.amount
 * @param {string} options.dueDate
 * @param {string} options.reminderType - 'upcoming' | 'due_today' | 'overdue' | 'custom'
 * @param {number} options.daysDiff - days until due (positive) or days overdue (negative)
 * @param {string} options.schoolName
 * @returns {string} Formatted WhatsApp text with emojis and clear breakdown
 */
export function buildWhatsAppFeeMessage({
  studentName = 'Student',
  studentId = '',
  studentClass = '',
  parentName = 'Parent',
  amount = 0,
  dueDate = '',
  reminderType = 'due_today',
  daysDiff = 0,
  schoolName = 'Landmark School'
}) {
  const formattedAmount = `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  let greeting = `Dear ${parentName || 'Parent'},`;
  let header = `*FEE PAYMENT REMINDER - ${schoolName.toUpperCase()}* 🏫`;
  let statusBanner = '';

  if (reminderType === 'upcoming') {
    statusBanner = `⏳ *Upcoming Fee Due Notice* (${daysDiff > 0 ? `Due in ${daysDiff} day${daysDiff === 1 ? '' : 's'}` : 'Approaching Soon'})`;
  } else if (reminderType === 'due_today') {
    statusBanner = `⚠️ *Fee Due Today* (Deadline: ${formattedDueDate})`;
  } else if (reminderType === 'overdue') {
    const overdueDays = Math.abs(daysDiff) || 1;
    statusBanner = `🚨 *Payment Overdue Alert* (${overdueDays} day${overdueDays === 1 ? '' : 's'} past due date)`;
  } else {
    statusBanner = `📢 *Fee Notice*`;
  }

  const messageText = 
`${header}

${statusBanner}

${greeting}

This is a reminder regarding the pending school fees for your ward:

👤 *Student Name:* ${studentName}
🆔 *Student ID:* ${studentId || 'N/A'}
🎒 *Class/Grade:* ${studentClass || 'N/A'}
💰 *Outstanding Amount:* ${formattedAmount}
📅 *Due Date:* ${formattedDueDate}

Please settle the outstanding balance at the school cash desk or online via the Parent Portal. If you have already made the payment, kindly ignore this message.

For queries or assistance, please reach out to the school accounts department.

_Warm Regards,_
*Accounts & Administration*
*${schoolName}*`;

  return messageText;
}

/**
 * Generate a direct WhatsApp Web / App Click-to-Chat URL
 * Useful for 1-click admin dispatch or parent contact
 */
export function generateDirectWhatsAppLink(phone, message) {
  const formattedPhone = formatPhoneNumberForWhatsApp(phone);
  const encodedText = encodeURIComponent(message || '');
  if (!formattedPhone) return '';
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

/**
 * Send WhatsApp message using configured API gateway
 * Priority:
 * 1. Meta WhatsApp Cloud API (if WHATSAPP_API_TOKEN & WHATSAPP_PHONE_NUMBER_ID are set)
 * 2. Custom/Third-party HTTP Gateway (if WHATSAPP_GATEWAY_URL is set)
 * 3. Simulation Mode (logs message and marks DELIVERED with direct wa.me link)
 * 
 * @param {Object} params
 * @param {string} params.toPhone - Parent's phone number
 * @param {string} params.message - Message body
 * @returns {Promise<{success: boolean, provider: string, response: string, directLink: string, error?: string}>}
 */
export async function sendWhatsAppMessage({ toPhone, message }) {
  const cleanPhone = formatPhoneNumberForWhatsApp(toPhone);
  const directLink = generateDirectWhatsAppLink(cleanPhone, message);

  if (!cleanPhone || cleanPhone.length < 8) {
    return {
      success: false,
      provider: 'none',
      response: 'Invalid recipient phone number',
      directLink: '',
      error: 'Invalid or missing phone number'
    };
  }

  // 1. Official Meta WhatsApp Cloud API
  const metaToken = process.env.WHATSAPP_API_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (metaToken && metaPhoneId) {
    try {
      const url = `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        })
      });

      const data = await response.json();
      if (response.ok && data?.messages?.[0]?.id) {
        return {
          success: true,
          provider: 'Meta WhatsApp Cloud API',
          response: `Message sent via Meta Cloud API (ID: ${data.messages[0].id})`,
          directLink
        };
      } else {
        const errMsg = data?.error?.message || 'Meta WhatsApp API request failed';
        console.warn('Meta WhatsApp API error response:', data);
        return {
          success: false,
          provider: 'Meta WhatsApp Cloud API',
          response: `Meta API Error: ${errMsg}`,
          directLink,
          error: errMsg
        };
      }
    } catch (apiErr) {
      console.error('Meta WhatsApp fetch error:', apiErr);
      return {
        success: false,
        provider: 'Meta WhatsApp Cloud API',
        response: `Gateway connection failed: ${apiErr.message}`,
        directLink,
        error: apiErr.message
      };
    }
  }

  // 2. Custom / Third-Party WhatsApp Gateway (e.g. Twilio, Gupshup, UltraMsg, WATI, etc.)
  const customGatewayUrl = process.env.WHATSAPP_GATEWAY_URL;
  const customGatewayKey = process.env.WHATSAPP_GATEWAY_API_KEY || '';

  if (customGatewayUrl) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (customGatewayKey) {
        headers['Authorization'] = `Bearer ${customGatewayKey}`;
        headers['x-api-key'] = customGatewayKey;
      }

      const response = await fetch(customGatewayUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone: cleanPhone,
          to: cleanPhone,
          message: message,
          body: message
        })
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        return {
          success: true,
          provider: 'Custom WhatsApp Gateway',
          response: `Delivered via WhatsApp Gateway (${response.status})`,
          directLink
        };
      } else {
        return {
          success: false,
          provider: 'Custom WhatsApp Gateway',
          response: `Gateway failed with HTTP ${response.status}`,
          directLink,
          error: result?.message || `HTTP ${response.status}`
        };
      }
    } catch (gwErr) {
      console.error('Custom WhatsApp gateway error:', gwErr);
      return {
        success: false,
        provider: 'Custom WhatsApp Gateway',
        response: gwErr.message,
        directLink,
        error: gwErr.message
      };
    }
  }

  // 3. Fallback / Simulation Mode
  // If no external credentials configured, log and return success with ready directLink so admin can also 1-click open WhatsApp Web/App
  console.log(`[WhatsApp Service] Dispatched simulated reminder to +${cleanPhone}:`);
  console.log(message.substring(0, 140) + '...');

  return {
    success: true,
    provider: 'Simulated WhatsApp Service (Direct Link Ready)',
    response: `Processed for +${cleanPhone}. Ready for automated transmission or 1-click WhatsApp Web launch.`,
    directLink
  };
}
