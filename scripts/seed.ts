import { db } from '../src/index';
import { Payer, Recipient } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    try {
        // Sample Payers
        const payers = [
            {
                payerId: 'c96e4a58-cbf0-4ffb-8ec7-a3adbe4653e6',
                name: 'John Doe',
                transferReason: 'Invoice',
            },
            {
                payerId: uuidv4(),
                name: 'Alice Smith',
                transferReason: 'Business Payment',
            },
            {
                payerId: uuidv4(),
                name: 'Bob Johnson',
                transferReason: 'Investment',
            },
        ];

        // Sample Recipients
        const recipients = [
            {
                recipientId: uuidv4(),
                name: 'Maria Garcia',
                accountNumber: '1234567890',
                bankCode: 'HSBC123',
                bankName: 'HSBC Bank',
            },
            {
                recipientId: uuidv4(),
                name: 'James Wilson',
                accountNumber: '0987654321',
                bankCode: 'CITI456',
                bankName: 'Citibank',
            },
            {
                recipientId: uuidv4(),
                name: 'Emma Brown',
                accountNumber: '5432167890',
                bankCode: 'ANZ789',
                bankName: 'ANZ Bank',
            },
        ];

        // Insert Payers
        await db.insert(Payer).values(payers);
        console.log('Payers seeded successfully');

        // Insert Recipients
        await db.insert(Recipient).values(recipients);
        console.log('Recipients seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        process.exit(0);
    }
}

seed();
