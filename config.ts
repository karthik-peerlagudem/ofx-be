import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const config = {
    port: process.env.PORT || 3001,
    dbFileName: process.env.DB_FILE_NAME || 'file:ofx.db',
};
