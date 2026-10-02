import Razorpay from 'razorpay';
import crypto from 'crypto';

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_apnaSchoolDemoKey';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_apnaSchoolDemoSecret';

let razorpayClient = null;

export const isRealRazorpay = () => {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes('Demo')
  );
};

if (isRealRazorpay()) {
  try {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  } catch (err) {
    console.warn('Failed to initialize real Razorpay instance:', err.message);
  }
}

export const getPublicPaymentKey = () => keyId;

// Create Razorpay Order
export const createPaymentOrder = async ({ amount, receipt, notes = {} }) => {
  const amountInPaise = Math.round(Number(amount) * 100);

  if (isRealRazorpay() && razorpayClient) {
    const order = await razorpayClient.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt || `rec_${Date.now()}`,
      notes
    });
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      isLive: true
    };
  }

  // Simulated / Development Razorpay Order
  const simulatedOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
  return {
    orderId: simulatedOrderId,
    amount: amountInPaise,
    currency: 'INR',
    keyId,
    isLive: false
  };
};

// Verify payment signature
export const verifyPaymentSignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  if (!razorpay_order_id || !razorpay_payment_id) return false;

  if (isRealRazorpay()) {
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    return generatedSignature === razorpay_signature;
  }

  // In test mode, allow verification
  return true;
};
