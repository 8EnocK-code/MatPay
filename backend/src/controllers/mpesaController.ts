import { Request, Response } from 'express';
import { initiateMpesaPayment } from '../services/mpesaService';
import prisma from '../prismaClient';
import { PaymentStatus } from '@prisma/client';
import { normalizePhoneNumber, validateKenyanPhone } from '../utils/phoneUtils';

/**
 * Legacy endpoint - redirects to new paymentsController
 * Kept for backward compatibility
 */
export async function initiatePayment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { tripId, phoneNumber, amount } = req.body;

    if (!tripId || !phoneNumber) {
      res.status(400).json({ error: 'tripId and phoneNumber are required' });
      return;
    }

    // Validate phone number
    if (!validateKenyanPhone(phoneNumber)) {
      res.status(400).json({ error: 'Invalid Kenyan phone number format' });
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Get trip to get amount if not provided
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    const paymentAmount = amount || trip.totalAmount;
    if (!paymentAmount || paymentAmount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    // Use new Africa's Talking service
    const reference = `trip-${tripId}-${Date.now()}`;
    const result = await initiateMpesaPayment({
      phoneNumber: normalizedPhone,
      amount: paymentAmount,
      reference,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Create payment record for backward compatibility
    const payment = await prisma.payment.create({
      data: {
        tripId,
        amount: Math.round(paymentAmount),
        phoneNumber: normalizedPhone,
        status: PaymentStatus.pending,
        providerRef: result.transactionId || result.providerResp?.transactionReference || reference,
        checkoutRequest: result.checkoutRequestId || result.providerResp?.checkoutRequestId || null,
        mpesaRequestId: result.checkoutRequestId || result.providerResp?.checkoutRequestId || null,
      },
    });

    res.json({
      checkoutRequestId: result.checkoutRequestId || payment.id,
      responseCode: '0',
      customerMessage: 'Request accepted for processing',
      paymentId: payment.id,
    });
  } catch (error: any) {
    console.error('Legacy initiatePayment error:', error);
    res.status(400).json({ error: error.message || 'Failed to initiate payment' });
  }
}

export async function paymentCallback(req: Request, res: Response): Promise<void> {
  try {
    // Callback is now handled by paymentsController.mpesaCallback
    // This endpoint is kept for backward compatibility but should redirect to new handler
    // For now, just acknowledge
    console.log('Legacy callback received (use /api/pay/callback instead):', req.body);
    res.json({
      ResultCode: 0,
      ResultDesc: 'Callback processed successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      ResultCode: 1,
      ResultDesc: error.message,
    });
  }
}

export async function getPaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { mpesaRequestId } = req.params;

    if (!mpesaRequestId) {
      res.status(400).json({ error: 'MPesa request ID is required' });
      return;
    }

    // Find payment by checkoutRequest or providerRef
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { checkoutRequest: mpesaRequestId },
          { providerRef: mpesaRequestId },
          { mpesaRequestId: mpesaRequestId }, // backward compatibility
        ],
      },
      include: {
        trip: true,
      },
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    res.json(payment);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
}

