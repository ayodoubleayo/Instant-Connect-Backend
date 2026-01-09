import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import cloudinary from "../lib/cloudinary";

function generateReference() {
  return `PAY-MF-${Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase()}`;
}

/**
 * CREATE PAYMENT
 * - payer = logged-in user
 * - beneficiary = optional (partner or self)
 */
/**
 * CREATE PAYMENT (SECURE + POLICY-DRIVEN)
 * - payer = logged-in user
 * - paymentScope = SELF | BOTH
 * - beneficiary is derived from match (NEVER frontend)
 */
export const createPayment = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const payerId = req.user.id;
  const { matchId, amount, paymentScope } = req.body;

  if (!matchId || !amount || !paymentScope) {
    return res.status(400).json({
      message: "matchId, amount and paymentScope are required",
    });
  }

  if (!["SELF", "BOTH"].includes(paymentScope)) {
    return res.status(400).json({ message: "Invalid paymentScope" });
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    return res.status(404).json({ message: "Match not found" });
  }

  if (match.userAId !== payerId && match.userBId !== payerId) {
    return res.status(403).json({ message: "Access denied" });
  }

  const expectedAmount =
    paymentScope === "BOTH"
      ? match.price * 2
      : match.price;

  if (amount !== expectedAmount) {
    return res.status(400).json({ message: "Invalid payment amount" });
  }

  const existing = await prisma.payment.findFirst({
    where: {
      userId: payerId,
      matchId,
      status: "PENDING",
    },
  });

  if (existing) {
    return res.status(200).json(existing);
  }

  const payment = await prisma.payment.create({
    data: {
      userId: payerId,            // payer
      beneficiaryId: payerId,     // always payer
      matchId,
      amount: expectedAmount,
      benefitScope: paymentScope, // SELF | BOTH
      status: "PENDING",
      reference: generateReference(),
    },
  });

  return res.status(201).json(payment);
};


/**
 * GET PAYMENT BY MATCH
 * - returns the latest payment related to this match
 * - works whether user paid or partner paid
 */
export const getPaymentByMatch = async (req: Request, res: Response) => {
  const matchId = req.query.matchId as string;

  if (!matchId) {
    return res.status(400).json({ message: "matchId is required" });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      matchId,
      status: {
        in: ["PENDING", "APPROVED"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!payment) {
    return res.json({ status: "NONE" });
  }

  res.json({
    status: payment.status,
    amount: payment.amount,
    paidBy: payment.userId,
    paidFor: payment.beneficiaryId,
    reference: payment.reference,
  });
};

/**
 * UPLOAD PAYMENT PROOF
 * - only payer can upload proof
 */
export const uploadPaymentProof = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const paymentId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ message: "Proof image is required" });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
      status: "PENDING",
    },
  });

  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  const uploadResult = await cloudinary.uploader.upload(
    `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
    {
      folder: "payments/proofs",
    }
  );

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      proofUrl: uploadResult.secure_url,
    },
  });

  res.json({
    message: "Proof uploaded successfully",
    proofUrl: uploadResult.secure_url,
  });
};
