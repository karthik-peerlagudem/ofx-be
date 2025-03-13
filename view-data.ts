import { db } from './src/index';
import { Quotes, Payer, Recipient, Transfers } from './src/db/schema';

async function viewData() {
    try {
        const quotes = await db.select().from(Quotes);
        const payers = await db.select().from(Payer);
        const recipients = await db.select().from(Recipient);
        const transfers = await db.select().from(Transfers);

        console.log('Quotes:', JSON.stringify(quotes, null, 2));
        console.log('Payers:', JSON.stringify(payers, null, 2));
        console.log('Recipients:', JSON.stringify(recipients, null, 2));
        console.log('Transfers:', JSON.stringify(transfers, null, 2));
    } catch (error) {
        console.error('Error viewing data:', error);
    }
}

viewData();
