import { Router } from 'express';
import {
    createQuote,
    retrieveQuote,
    createTransfer,
    retrieveTransfer,
} from './handlers/transfers';

const router = Router();

// Quotes endpoints
router.post('/transfers/quote', createQuote);
router.get('/transfers/quote/:quoteId', retrieveQuote);

// Transfers endpoints
router.post('/transfers', createTransfer);
router.get('/transfers/:transferId([0-9a-f-]{36})', retrieveTransfer);

export default router;
