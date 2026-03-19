import paypal from 'paypal-rest-sdk';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, payments, wallets } from '../db/schema.js';
import { ok, fail, unprocessable, forbidden } from '../middlewares/error-handler.js';
import { ensureWallet, addBalance } from '../utils/economy.js';

paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

/**
 * Creates a PayPal payment and returns approval URL
 */
export async function createPayPalPayment({ userId, amount }) {
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) return unprocessable('invalid_amount');

    const credits = val; // 1$ = 1 TQN

    const paymentData = {
        intent: 'sale',
        payer: { payment_method: 'paypal' },
        redirect_urls: {
            return_url: `${process.env.APP_URL || 'http://localhost:3002'}/app/billing?status=success`,
            cancel_url: `${process.env.APP_URL || 'http://localhost:3002'}/app/billing?status=cancel`
        },
        transactions: [{
            amount: {
                currency: process.env.PAYPAL_CURRENCY || "USD",
                total: val.toFixed(2)
            },
            description: `Purchase of ${credits} Torqen tokens.`
        }]
    };

    return new Promise((resolve) => {
        paypal.payment.create(paymentData, async (error, payment) => {
            if (error) {
                console.error('PayPal create error detailed:', JSON.stringify(error.response, null, 2));
                return resolve(fail('paypal_create_failed', 500));
            }

            if (!payment.links) {
                console.error('PayPal payment response missing links:', payment);
                return resolve(fail('paypal_invalid_response', 500));
            }

            const approvalUrl = payment.links.find(link => link.rel === 'approval_url')?.href;
            if (!approvalUrl) {
                console.error('PayPal approval_url not found in response:', payment.links);
                return resolve(fail('paypal_no_approval_url', 500));
            }
            
            // Store payment as pending
            await db.insert(payments).values({
                id: payment.id,
                userId,
                amount: val,
                credits,
                status: 'pending',
                provider: 'paypal'
            });

            resolve(ok({ approvalUrl, paymentId: payment.id }));
        });
    });
}

/**
 * Executes/Captures a PayPal payment
 */
export async function executePayPalPayment({ paymentId, payerId, userId }) {
    const execute_payment_json = {
        payer_id: payerId
    };

    console.log("Executing PayPal Payment:", { paymentId, payerId, userId });

    return new Promise((resolve) => {
        paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
            if (error) {
                console.error('PayPal execute error detailed:', JSON.stringify(error.response, null, 2));
                await db.update(payments).set({ status: 'failed' }).where(eq(payments.id, paymentId));
                return resolve(fail('paypal_execute_failed', 500));
            }

            console.log("PayPal Execute Response state:", payment.state);

            if (payment.state === 'approved') {
                try {
                    // Extract transaction ID if available
                    const relatedRes = payment.transactions?.[0]?.related_resources?.[0];
                    const saleId = relatedRes?.sale?.id || relatedRes?.authorization?.id || null;

                    // Update payment status
                    await db.update(payments).set({ 
                        status: 'completed',
                        providerId: saleId,
                        updatedAt: new Date()
                    }).where(eq(payments.id, paymentId));

                    // Get payment info to add credits
                    const rows = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
                    if (rows.length > 0) {
                        const { credits } = rows[0];
                        console.log(`Adding ${credits} credits to user ${userId}`);
                        await addBalance(userId, credits);
                    }

                    return resolve(ok({ success: true }));
                } catch (dbError) {
                    console.error("Database update error after PayPal success:", dbError);
                    return resolve(fail('db_update_failed', 500));
                }
            }

            console.warn("Payment execution returned non-approved state:", payment.state);
            resolve(fail('payment_not_approved', 400));
        });
    });
}

/**
 * Lists payments for a user
 */
export async function getPayments(userId) {
    const items = await db.select().from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(payments.createdAt, 'desc');
    return ok({ payments: items });
}

/**
 * Gets a specific payment/invoice
 */
export async function getPayment(userId, paymentId) {
    const rows = await db.select().from(payments)
        .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
        .limit(1);
    
    if (rows.length === 0) return fail('not_found', 404);
    return ok({ payment: rows[0] });
}

/**
 * Creates a UPI payment intent
 */
export async function createUPIPayment({ userId, amount }) {
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) return unprocessable('invalid_amount');

    const conversionRate = Number(process.env.INR_CONVERSION_RATE || 85);
    const feePercentage = Number(process.env.UPI_FEE_PERCENTAGE || 5);
    
    const inrValue = val * conversionRate;
    const feeInr = (inrValue * feePercentage) / 100;
    const totalInr = inrValue + feeInr;

    // Use a simpler ID for UPI manually-checked payments
    const paymentId = `UPI-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    await db.insert(payments).values({
        id: paymentId,
        userId,
        amount: val,
        credits: val, // 1$ = 1 TQN
        fee: (val * feePercentage) / 100,
        localAmount: totalInr.toFixed(2),
        localCurrency: 'INR',
        status: 'pending',
        provider: 'upi'
    });

    return ok({ 
        paymentId, 
        inrAmount: totalInr.toFixed(2),
        qrcode: '/src/assets/qrcode.png'
    });
}

/**
 * Submits UTR (providerId) for a UPI payment
 */
export async function submitUPIUTR({ userId, paymentId, utr }) {
    if (!utr) return unprocessable('utr_required');

    const rows = await db.select().from(payments)
        .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
        .limit(1);
    
    if (rows.length === 0) return fail('not_found', 404);

    if (rows[0].provider !== 'upi') return unprocessable('invalid_provider');

    await db.update(payments).set({ 
        providerId: utr,
        updatedAt: new Date()
    }).where(eq(payments.id, paymentId));

    return ok({ success: true });
}

/**
 * Admin: List all payments
 */
export async function adminGetAllPayments() {
    // Fetch items
    const items = await db.select().from(payments)
        .orderBy(payments.createdAt, 'desc');
    
    // Fetch users to map userIds to usernames
    const usersList = await db.select().from(users);
    const userMap = Object.fromEntries(usersList.map(u => [u.id, u.username]));

    const result = items.map(p => ({
        ...p,
        username: userMap[p.userId] || `User ${p.userId}`
    }));

    return ok({ payments: result });
}

/**
 * Admin: Process (Approve/Disapprove) a payment
 */
export async function adminProcessPayment({ paymentId, action }) {
    const rows = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (rows.length === 0) return fail('not_found', 404);
    
    const payment = rows[0];
    if (payment.status !== 'pending') return unprocessable('already_processed');

    if (action === 'approve') {
        await db.update(payments).set({ 
            status: 'completed',
            updatedAt: new Date()
        }).where(eq(payments.id, paymentId));

        // Add credits
        await addBalance(payment.userId, payment.credits);

        return ok({ success: true, status: 'completed' });
    } else if (action === 'disapprove') {
        await db.update(payments).set({ 
            status: 'failed',
            updatedAt: new Date()
        }).where(eq(payments.id, paymentId));

        return ok({ success: true, status: 'failed' });
    }

    return unprocessable('invalid_action');
}
