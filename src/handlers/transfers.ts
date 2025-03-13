import { Request, Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../index';
import { Payer, Quotes, Recipient, Transfers } from '../db/schema';

import ExchangeRateService from '../services/exchange-rate-service';

/** Supported currency pair combinations */
const exchangeRates = [
    'AUD-USD',
    'AUD-INR',
    'AUD-PHP',
    'USD-INR',
    'USD-PHP',
    'EUR-USD',
    'EUR-INR',
    'EUR-PHP',
];

/** OFX markup percentage applied to exchange rates */
const OFX_MARKUP_PERCENTAGE = 0.5;

/**
 * Creates a new currency exchange quote
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {object} req.body - Request body
 * @returns {Promise<Response>} Quote creation response
 * @throws {Error} When exchange rate service fails
 */
export const createQuote: any = async (req: Request, res: Response) => {
    const { sellCurrency, buyCurrency, amount } = req.body;

    if (!sellCurrency || !buyCurrency || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    if (sellCurrency === buyCurrency) {
        return res
            .status(400)
            .json({ error: 'Sell and Buy currency must be different' });
    }

    const rateKey = `${sellCurrency}-${buyCurrency}`;

    if (!exchangeRates.includes(rateKey)) {
        return res.status(400).json({ error: 'Invalid currency pair' });
    }

    const exchangeService = ExchangeRateService.getInstance();
    const exchangeRate = await exchangeService.getRates(
        sellCurrency,
        buyCurrency
    );

    if (!exchangeRate) {
        return res.status(400).json({ error: 'Failed to get exchange rate' });
    }

    const markupAdjustment = exchangeRate * (OFX_MARKUP_PERCENTAGE / 100);
    const ofxRate = exchangeRate - markupAdjustment;

    const inverseOfxRate = 1 / ofxRate;
    const convertedAmount = Number((amount * ofxRate).toFixed(2));

    const quote = await db
        .insert(Quotes)
        .values({
            quoteId: uuidv4(),
            sellCurrency: sellCurrency,
            buyCurrency: buyCurrency,
            amount: amount,
            ofxRate: Number(ofxRate.toFixed(5)),
            inverseOfxRate: Number(inverseOfxRate.toFixed(5)),
            convertedAmount: convertedAmount,
        })
        .returning();

    const formatResponse = {
        quoteId: quote[0].quoteId,
        ofxRate: quote[0].ofxRate,
        inverseOfxRate: quote[0].inverseOfxRate,
        convertedAmount: quote[0].convertedAmount,
    };

    res.status(201).json(formatResponse);
};

/**
 * Retrieves an existing quote by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {string} req.params.quoteId - Quote identifier
 * @returns {Promise<Response>} Quote details
 */
export const retrieveQuote: any = async (req: Request, res: Response) => {
    const quoteId = req.params.quoteId;

    if (!quoteId) {
        return res.status(400).json({ error: 'QuoteId is required' });
    }

    const quote = (
        await db.select().from(Quotes).where(eq(Quotes.quoteId, quoteId))
    )[0];

    if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
    }

    const formatResponse = {
        quoteId: quote.quoteId,
        ofxRate: quote.ofxRate,
        inverseOfxRate: quote.inverseOfxRate,
        convertedAmount: quote.convertedAmount,
    };

    res.json(formatResponse);
};

/**
 * Creates a new money transfer
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {object} req.body - Request body
 * @returns {Promise<Response>} Transfer creation response
 */
export const createTransfer: any = async (req: Request, res: Response) => {
    const { quoteId, payer, recipient } = req.body;

    if (!quoteId || !payer || !recipient) {
        return res
            .status(400)
            .json({ error: 'QuoteId, payer and recipient are required' });
    }

    if (!payer.id || !payer.name || !payer.transferReason) {
        return res.status(400).json({
            error: 'Payer must include id, name and reason',
        });
    }

    if (
        !recipient.name ||
        !recipient.accountNumber ||
        !recipient.bankCode ||
        !recipient.bankName
    ) {
        return res.status(400).json({
            error: 'Recipient must include name, accountNumber, bankCode and bankName',
        });
    }

    const quoteData = await db
        .select()
        .from(Quotes)
        .where(eq(Quotes.quoteId, quoteId));

    if (!quoteData) {
        return res.status(404).json({ error: 'Quote not found' });
    }

    const payerData = await db
        .select()
        .from(Payer)
        .where(eq(Payer.payerId, payer.id));

    if (!payerData) {
        return res.status(404).json({ error: 'Payer not found' });
    }

    const RecipientData = await db
        .select()
        .from(Recipient)
        .where(
            and(
                eq(Recipient.accountNumber, recipient.accountNumber),
                eq(Recipient.bankCode, recipient.bankCode),
                eq(Recipient.bankName, recipient.bankName)
            )
        );

    if (!RecipientData) {
        return res.status(404).json({ error: 'Receipt not found' });
    }

    const estDeliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const transfer = await db
        .insert(Transfers)
        .values({
            transferId: uuidv4(),
            quoteId: quoteId,
            payerId: payerData[0].payerId,
            recipientId: RecipientData[0].recipientId,
            estimatedDeliveryDate: estDeliveryDate.toISOString(),
        })
        .returning();

    const formattedResponse = {
        transferId: transfer[0].transferId,
        status: transfer[0].status,
        transferDetails: {
            quoteId: transfer[0].quoteId,
            payer: {
                id: payerData[0].payerId,
                name: payerData[0].name,
                transferReason: payerData[0].transferReason,
            },
            recipient: {
                name: RecipientData[0].name,
                accountNumber: RecipientData[0].accountNumber,
                bankCode: RecipientData[0].bankCode,
                bankName: RecipientData[0].bankName,
            },
        },
        estimatedDeliveryDate: transfer[0].estimatedDeliveryDate,
    };

    res.status(201).json(formattedResponse);
};

/**
 * Retrieves transfer details by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {string} req.params.transferId - Transfer identifier
 * @returns {Promise<Response>} Transfer details with associated payer and recipient information
 */
export const retrieveTransfer: any = async (req: Request, res: Response) => {
    const transferId = req.params.transferId;

    if (!transferId) {
        return res.status(404).json({ error: 'TransferId is required' });
    }

    const transfer = (
        await db
            .select()
            .from(Transfers)
            .leftJoin(Payer, eq(Transfers.payerId, Payer.payerId))
            .leftJoin(
                Recipient,
                eq(Transfers.recipientId, Recipient.recipientId)
            )
            .where(eq(Transfers.transferId, transferId))
    )[0];

    if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found' });
    }

    const formattedResponse = {
        transferId: transfer.transfers.transferId,
        status: transfer.transfers.status,
        transferDetails: {
            quoteId: transfer.transfers.quoteId,
            payer: {
                id: transfer.payer.payerId,
                name: transfer.payer.name,
                transferReason: transfer.payer.transferReason,
            },
            recipient: {
                name: transfer.recipient.name,
                accountNumber: transfer.recipient.accountNumber,
                bankCode: transfer.recipient.bankCode,
                bankName: transfer.recipient.bankName,
            },
        },
        estimatedDeliveryDate: transfer.transfers.estimatedDeliveryDate,
    };

    res.json(formattedResponse);
};
