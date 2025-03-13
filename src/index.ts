import dotenv from 'dotenv';
import app from './server';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { config as projectConfig } from '../config';

dotenv.config();

// create database connection
const client = createClient({ url: projectConfig.dbFileName });
export const db = drizzle(client);

if (!process.env.PORT) {
    throw new Error('PORT is not defined in .env file');
}

const PORT = process.env.PORT || 3001;

// server runs on port specified in .env file
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
