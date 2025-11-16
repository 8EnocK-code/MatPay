// backend/src/controllers/paymentsController.ts

import { Request, Response } from "express";
import prisma from "../prismaClient";
import { PaymentStatus, TripStatus } from "@prisma/client";
import { initiateMpesaPayment } from "../services/mpesaService";
import { normalizePhoneNumber, validateKenyanPhone } from "../utils/phoneUtils";

/**
 * POST /api/pay/initiate
 * Body: { tripId: string, phoneNumber: string }
 */
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { tripId, phoneNumber } = req.body;

    // Validate required fields
    if (!tripId || !phoneNumber) {
      return res.status(400).json({ error: "tripId and phoneNumber are required" });
    }

    // Validate phone number
    if (!validateKenyanPhone(phoneNumber)) {
      return res.status(400).json({ error: "Invalid Kenyan phone number format" });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Find trip
    const trip = await prisma.trip.findUnique({ 
      where: { id: tripId },
      include: { payments: { where: { status: PaymentStatus.received } } }
    });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Check if trip is already paid
    if (trip.payments && trip.payments.length > 0) {
      return res.status(400).json({ error: "Trip has already been paid" });
    }

    const amount = Number(trip.totalAmount ?? 0);
    if (amount <= 0) {
      return res.status(400).json({ error: "Invalid trip amount" });
    }

    const reference = `trip-${tripId}-${Date.now()}`;

    // Check for duplicate pending payment for this trip
    const existingPayment = await prisma.payment.findFirst({
      where: {
        tripId,
        phoneNumber: normalizedPhone,
        status: PaymentStatus.pending,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
        },
      },
    });

    if (existingPayment) {
      return res.status(409).json({ 
        error: "A payment request is already pending for this trip. Please wait or check your phone.",
        paymentId: existingPayment.id,
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        tripId,
        amount: Math.round(amount),
        phoneNumber: normalizedPhone,
        status: PaymentStatus.pending,
      },
    });

    // Initiate STK Push via mpesaService (uses Africa's Talking)
    const resp = await initiateMpesaPayment({
      phoneNumber: normalizedPhone,
      amount: Math.round(amount),
      reference,
    });

    if (resp.success === false) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.failed },
      });
      return res.status(400).json({ error: resp.error });
    }

    // Save provider info
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: resp.transactionId || resp.providerResp?.transactionReference || resp.providerResp?.transactionId || reference,
        checkoutRequest: resp.checkoutRequestId || resp.providerResp?.checkoutRequestId || null,
        mpesaRequestId: resp.checkoutRequestId || resp.providerResp?.checkoutRequestId || null,
      },
    });

    return res.json({ 
      ok: true, 
      paymentId: payment.id,
      checkoutRequestId: resp.checkoutRequestId,
      message: "Payment request sent. Please check your phone to complete the payment.",
      providerResp: resp.providerResp 
    });
  } catch (err: any) {
    console.error("initiatePayment error:", err);
    return res.status(500).json({ error: err?.message || "Failed to initiate payment" });
  }
};

/**
 * POST /api/pay/callback
 * Africa's Talking will POST transactions here; configure PUBLIC_BASE_URL + /api/pay/callback in AT dashboard.
 * 
 * Security: In production, verify the callback is from Africa's Talking by:
 * - Checking IP whitelist
 * - Verifying signature if AT provides one
 * - Using webhook secret if available
 */
export const mpesaCallback = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] AT CALLBACK RECEIVED:`, JSON.stringify(body).slice(0, 500));

    // Always acknowledge receipt immediately (AT expects quick response)
    // Process asynchronously if needed
    res.status(200).json({ ok: true, message: "Callback received" });

    // Process callback asynchronously
    processCallback(body).catch(err => {
      console.error("Error processing callback:", err);
    });
  } catch (err: any) {
    console.error("mpesaCallback error:", err);
    // Still acknowledge to prevent retries
    return res.status(200).json({ ok: true, error: "Processing error" });
  }
};

async function processCallback(body: any) {
  try {
    // Map typical AT fields; be tolerant of different response formats
    const providerRef = body?.providerReference || 
                       body?.providerRefId || 
                       body?.transactionId || 
                       body?.providerReferenceId ||
                       body?.transactionReference;

    const checkoutRequestId = body?.checkoutRequestId || 
                              body?.requestId || 
                              body?.checkoutRequest;

    const metadataRef = body?.metadata?.reference || 
                       body?.metadata?.referenceId || 
                       body?.reference;

    const statusRaw = (body?.status || 
                      body?.transactionStatus || 
                      body?.resultCode || 
                      "").toString().toLowerCase();

    // Determine payment status
    let status: PaymentStatus = PaymentStatus.pending;
    if (statusRaw.includes("success") || statusRaw === "0" || statusRaw === "success") {
      status = PaymentStatus.received;
    } else if (statusRaw.includes("failed") || statusRaw.includes("error") || statusRaw.includes("cancel")) {
      status = PaymentStatus.failed;
    }

    // Find payment by multiple methods
    let payment = null;

    // Try providerRef first
    if (providerRef) {
      payment = await prisma.payment.findFirst({ 
        where: { 
          OR: [
            { providerRef },
            { mpesaRequestId: providerRef },
          ]
        } 
      });
    }

    // Try checkoutRequestId
    if (!payment && checkoutRequestId) {
      payment = await prisma.payment.findFirst({ 
        where: { 
          OR: [
            { checkoutRequest: checkoutRequestId },
            { mpesaRequestId: checkoutRequestId },
          ]
        } 
      });
    }

    // Try metadata reference (extract tripId)
    if (!payment && metadataRef) {
      const match = metadataRef.match(/trip-([^-]+)-/);
      if (match) {
        const tripId = match[1];
        payment = await prisma.payment.findFirst({ 
          where: { 
            tripId, 
            status: PaymentStatus.pending,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    }

    if (!payment) {
      console.warn("AT callback: no matching payment found", { 
        providerRef, 
        checkoutRequestId, 
        metadataRef,
        bodyKeys: Object.keys(body)
      });
      return;
    }

    // Update payment status
    const updateData: any = {
      status,
      providerRaw: body,
      callbackData: body,
      confirmedAt: new Date(),
    };

    // Update providerRef if we have it and it's not set
    if (providerRef && !payment.providerRef) {
      updateData.providerRef = providerRef;
    }

    // Update checkoutRequest if we have it and it's not set
    if (checkoutRequestId && !payment.checkoutRequest) {
      updateData.checkoutRequest = checkoutRequestId;
    }

    // Extract receipt number if available
    if (body?.receiptNumber || body?.mpesaReceiptNumber) {
      updateData.mpesaReceipt = body.receiptNumber || body.mpesaReceiptNumber;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    console.log(`Payment ${payment.id} updated to status: ${status}`);

    // If payment received, mark trip as completed
    if (status === PaymentStatus.received) {
      await prisma.trip.update({ 
        where: { id: payment.tripId }, 
        data: { status: TripStatus.completed }
      });
      console.log(`Trip ${payment.tripId} marked as completed`);
    }
  } catch (err: any) {
    console.error("processCallback error:", err);
    throw err;
  }
}

/**
 * GET /api/pay/status/:paymentId
 * Check payment status by payment ID
 */
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({ error: "paymentId is required" });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        trip: {
          include: {
            route: true,
            matatu: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    return res.json(payment);
  } catch (err: any) {
    console.error("getPaymentStatus error:", err);
    return res.status(500).json({ error: err?.message || "Failed to get payment status" });
  }
};

