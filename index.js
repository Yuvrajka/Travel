const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your HTML frontend to talk to this backend

// Initialize Razorpay with the keys from your dashboard
const razorpay = new Razorpay({
    key_id: 'rzp_test_TEzOspe3uDdV0Z',
    key_secret: 'xSaDzjoIH6FoyKVbaE3bW8JZ'
});

// STEP 1: Backend endpoint to create an order
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, currency } = req.body;

        const options = {
            amount: amount * 100, // Razorpay expects amount in paise (e.g., ₹100 = 10000 paise)
            currency: currency || 'INR',
            receipt: `receipt_order_${Date.now()}`,
            // International compliance setup for travel payments
            payment_capture: 1, 
            notes: {
                purpose_code: 'P0301' // Mandatory travel/tourism purpose code
            }
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Something went wrong while creating the order" });
    }
});

// STEP 3: Backend endpoint to verify payment signature after checkout
app.post('/api/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Generate the expected signature using your secret key
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", 'xSaDzjoIH6FoyKVbaE3bW8JZ')
            .update(sign.toString())
            .digest("hex");

        // Verify if signatures match
        if (razorpay_signature === expectedSign) {
            return res.status(200).json({ status: "success", message: "Payment verified successfully" });
        } else {
            return res.status(400).json({ status: "failure", message: "Invalid signature verification failed" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ message: "Internal server error during verification" });
    }
});

// Start the server on port 5000
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));