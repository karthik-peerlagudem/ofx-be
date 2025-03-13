import request from 'supertest';
import app from '../src/server';
import { db } from '../src/index';
import { v4 as uuidv4 } from 'uuid';
import { Payer, Quotes, Recipient, Transfers } from '../src/db/schema';
import ExchangeRateService from '../src/services/exchange-rate-service';

describe('Transfer API Endpoints', () => {
    beforeEach(async () => {
        // Clear test database
        // await db.delete(Transfers);
        // await db.delete(Quotes);
        // await db.delete(Payer);
        // await db.delete(Recipient);

        // Mock the exchange rate service
        jest.mock('../src/services/exchange-rate-service', () => {
            const mockService = {
                getInstance: jest.fn().mockReturnValue({
                    getRates: jest.fn().mockImplementation((from, to) => {
                        const supportedPairs = {
                            'AUD-INR': 55.5,
                            'AUD-USD': 0.65,
                            'USD-INR': 83.0,
                        };
                        const pair = `${from}-${to}`;
                        return Promise.resolve(supportedPairs[pair] || null);
                    }),
                }),
            };

            return {
                ExchangeRateService: mockService,
                default: mockService,
            };
        });
    });

    describe('POST /transfers/quote', () => {
        it('should create a new quote', async () => {
            const response = await request(app)
                .post('/api/transfers/quote')
                .send({
                    sellCurrency: 'AUD',
                    buyCurrency: 'INR',
                    amount: 1000,
                });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                quoteId: expect.any(String),
                ofxRate: expect.any(Number),
                inverseOfxRate: expect.any(Number),
                convertedAmount: expect.any(Number),
            });
        });

        it('should return 400 for invalid currency pair', async () => {
            const response = await request(app)
                .post('/api/transfers/quote')
                .send({
                    sellCurrency: 'AUD',
                    buyCurrency: 'JPY',
                    amount: 1000,
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty(
                'error',
                'Invalid currency pair'
            );
        });
    });

    describe('GET /transfers/quote/:quoteId', () => {
        it('should retrieve an existing quote', async () => {
            // First create a quote
            const createResponse = await request(app)
                .post('/api/transfers/quote')
                .send({
                    sellCurrency: 'AUD',
                    buyCurrency: 'INR',
                    amount: 1000,
                });

            const quoteId = createResponse.body.quoteId;

            // Then retrieve it
            const response = await request(app).get(
                `/api/transfers/quote/${quoteId}`
            );

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                quoteId,
                ofxRate: expect.any(Number),
                inverseOfxRate: expect.any(Number),
                convertedAmount: expect.any(Number),
            });
        });

        it('should return 404 for non-existent quote', async () => {
            const response = await request(app).get(
                `/api/transfers/quote/${uuidv4()}`
            );

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Quote not found');
        });
    });

    describe('POST /transfers', () => {
        let quoteId: string;
        let payerId: string;
        let recipientId: string;

        beforeEach(async () => {
            // Create test data
            const quoteResponse = await request(app)
                .post('/api/transfers/quote')
                .send({
                    sellCurrency: 'AUD',
                    buyCurrency: 'INR',
                    amount: 1000,
                });
            quoteId = quoteResponse.body.quoteId;

            // Insert test payer and recipient
            const payer = await db
                .insert(Payer)
                .values({
                    payerId: uuidv4(),
                    name: 'Test Payer',
                    transferReason: 'Test',
                })
                .returning();
            payerId = payer[0].payerId;

            const recipient = await db
                .insert(Recipient)
                .values({
                    recipientId: uuidv4(),
                    name: 'Test Recipient',
                    accountNumber: '123456',
                    bankCode: 'TESTBANK',
                    bankName: 'Test Bank',
                })
                .returning();
            recipientId = recipient[0].recipientId;
        });

        it('should create a new transfer', async () => {
            const response = await request(app)
                .post('/api/transfers')
                .send({
                    quoteId,
                    payer: {
                        id: payerId,
                        name: 'Test Payer',
                        transferReason: 'Test',
                    },
                    recipient: {
                        name: 'Test Recipient',
                        accountNumber: '123456',
                        bankCode: 'TESTBANK',
                        bankName: 'Test Bank',
                    },
                });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                transferId: expect.any(String),
                status: 'Created',
                transferDetails: {
                    quoteId,
                    payer: {
                        id: payerId,
                        name: 'Test Payer',
                        transferReason: 'Test',
                    },
                    recipient: {
                        name: 'Test Recipient',
                        accountNumber: '123456',
                        bankCode: 'TESTBANK',
                        bankName: 'Test Bank',
                    },
                },
            });
        });
    });

    describe('GET /transfers/:transferId', () => {
        let quoteId: string;
        let payerId: string;
        let recipientId: string;
        let transferId: string;

        beforeEach(async () => {
            // Create test data
            const quoteResponse = await request(app)
                .post('/api/transfers/quote')
                .send({
                    sellCurrency: 'AUD',
                    buyCurrency: 'INR',
                    amount: 1000,
                });
            quoteId = quoteResponse.body.quoteId;

            // Insert test payer and recipient
            const payer = await db
                .insert(Payer)
                .values({
                    payerId: uuidv4(),
                    name: 'Test Payer',
                    transferReason: 'Test',
                })
                .returning();
            payerId = payer[0].payerId;

            const recipient = await db
                .insert(Recipient)
                .values({
                    recipientId: uuidv4(),
                    name: 'Test Recipient',
                    accountNumber: '123456',
                    bankCode: 'TESTBANK',
                    bankName: 'Test Bank',
                })
                .returning();
            recipientId = recipient[0].recipientId;

            const transferResponse = await request(app)
                .post('/api/transfers')
                .send({
                    quoteId,
                    payer: {
                        id: payerId,
                        name: 'Test Payer',
                        transferReason: 'Test',
                    },
                    recipient: {
                        name: 'Test Recipient',
                        accountNumber: '123456',
                        bankCode: 'TESTBANK',
                        bankName: 'Test Bank',
                    },
                });

            transferId = transferResponse.body.transferId;
        });

        it('should retrieve an existing transfer', async () => {
            const response = await request(app).get(
                `/api/transfers/${transferId}`
            );

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                transferId: expect.any(String),
                status: 'Created',
                transferDetails: {
                    quoteId,
                    payer: {
                        id: payerId,
                        name: 'Test Payer',
                        transferReason: 'Test',
                    },
                    recipient: {
                        name: 'Test Recipient',
                        accountNumber: '123456',
                        bankCode: 'TESTBANK',
                        bankName: 'Test Bank',
                    },
                },
            });
        });

        it('should return 404 for non-existent transfer', async () => {
            const response = await request(app).get(
                `/api/transfers/${uuidv4()}`
            );

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Transfer not found');
        });
    });
});
