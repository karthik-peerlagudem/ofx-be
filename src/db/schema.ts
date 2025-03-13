import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

/**
 * Quotes table - Stores currency exchange quotes
 * @typedef {Object} Quote
 * @property {string} quoteId - Unique identifier for the quote
 * @property {string} sellCurrency - Currency being sold (e.g., 'AUD', 'USD')
 * @property {string} buyCurrency - Currency being purchased
 * @property {number} amount - Amount in sell currency
 * @property {number} ofxRate - Exchange rate with OFX markup
 * @property {number} inverseOfxRate - Inverse of the OFX rate
 * @property {number} convertedAmount - Amount in buy currency
 */
export const Quotes = sqliteTable('quotes', {
    quoteId: text('quote_id').primaryKey(),
    sellCurrency: text('sell_currency').notNull(),
    buyCurrency: text('buy_currency').notNull(),
    amount: real('amount').notNull(),
    ofxRate: real('ofx_rate').notNull(),
    inverseOfxRate: real('inverse_ofx_rate').notNull(),
    convertedAmount: real('converted_amount').notNull(),
});

/**
 * Payer table - Stores information about the person sending money
 * @typedef {Object} Payer
 * @property {string} payerId - Unique identifier for the payer
 * @property {string} name - Full name of the payer
 * @property {string} transferReason - Reason for the transfer (e.g., 'Business', 'Personal')
 */
export const Payer = sqliteTable('payer', {
    payerId: text('payer_id').primaryKey(),
    name: text('name').notNull(),
    transferReason: text('transfer_reason').notNull(),
});

/**
 * Recipient table - Stores information about the person receiving money
 * @typedef {Object} Recipient
 * @property {string} recipientId - Unique identifier for the recipient
 * @property {string} name - Full name of the recipient
 * @property {string} accountNumber - Bank account number
 * @property {string} bankCode - Bank identifier code
 * @property {string} bankName - Name of the recipient's bank
 */
export const Recipient = sqliteTable('recipient', {
    recipientId: text('recipient_id').primaryKey(),
    name: text('name').notNull(),
    accountNumber: text('account_number').notNull(),
    bankCode: text('bank_code').notNull(),
    bankName: text('bank_name').notNull(),
});

/**
 * Transfers table - Stores money transfer transactions
 * @typedef {Object} Transfer
 * @property {string} transferId - Unique identifier for the transfer
 * @property {string} quoteId - Reference to the associated quote
 * @property {string} payerId - Reference to the payer
 * @property {string} recipientId - Reference to the recipient
 * @property {('Created'|'Processing'|'Processed'|'Failed')} status - Current status of the transfer
 * @property {string} estimatedDeliveryDate - Expected date of transfer completion
 * @references Quotes.quoteId
 * @references Payer.payerId
 * @references Recipient.recipientId
 */
export const Transfers = sqliteTable('transfers', {
    transferId: text('transfer_id').primaryKey(),
    quoteId: text('quote_id')
        .notNull()
        .references(() => Quotes.quoteId),
    payerId: text('payer_id')
        .notNull()
        .references(() => Payer.payerId),
    recipientId: text('recipient_id')
        .notNull()
        .references(() => Recipient.recipientId),
    status: text('status', {
        enum: ['Created', 'Processing', 'Processed', 'Failed'],
    })
        .notNull()
        .default('Created'),
    estimatedDeliveryDate: text('estimated_delivery_date').notNull(),
});
