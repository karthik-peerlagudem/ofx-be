/**
 * Interface for caching exchange rates
 * @interface ExchangeRateCache
 * @property {Record<string, number>} rates - Map of currency pairs to exchange rates
 * @property {Date} lastUpdated - Timestamp of last cache update
 */
interface ExchangeRateCache {
    rates: Record<string, number>;
    lastUpdated: Date;
}

/**
 * Response structure from the exchange rate API */
interface ExchangeRateResponse {
    id: string;
    sellCurrency: string;
    buyCurrency: string;
    indicative: boolean;
    retailRate: number;
    wholesaleRate: number;
    createdAt: Date;
    validUntil: Date;
}

/** Base URL for the exchange rate API */
const API_URL = 'https://rates.staging.api.paytron.com/rate/public';

/**
 * Service for fetching and caching exchange rates
 * @class ExchangeRateService
 * @implements {Singleton Pattern}
 */
class ExchangeRateService {
    private static instance: ExchangeRateService;
    private cache: ExchangeRateCache = {
        rates: {},
        lastUpdated: new Date(0),
    };

    /** Cache time-to-live in milliseconds (1 hour) */
    private readonly CACHE_TTL = 1000 * 60 * 60;

    private constructor() {}

    /**
     * Gets the singleton instance of ExchangeRateService
     * @returns {ExchangeRateService} The singleton instance
     */
    public static getInstance(): ExchangeRateService {
        if (!ExchangeRateService.instance) {
            ExchangeRateService.instance = new ExchangeRateService();
        }
        return ExchangeRateService.instance;
    }

    /**
     * Retrieves the exchange rate for a currency pair from cache, if not by calling API
     * @param {string} sellCurrency - Currency to sell (e.g., 'AUD', 'USD')
     * @param {string} buyCurrency - Currency to buy
     * @returns {Promise<number>} Exchange rate or 0 if not available
     * @throws {Error} When API request fails
     */
    public async getRates(
        sellCurrency: string,
        buyCurrency: string
    ): Promise<number> {
        const rateKey = `${sellCurrency}-${buyCurrency}`;

        if (!this.cache.rates[rateKey])
            await this.fetchRates(sellCurrency, buyCurrency);

        return this.cache.rates[rateKey] || 0;
    }

    /**
     * Fetches fresh exchange rates from the API
     * @param {string} sellCurrency - Currency to sell
     * @param {string} buyCurrency - Currency to buy
     * @returns {Promise<void>}
     * @private
     */
    private async fetchRates(
        sellCurrency: string,
        buyCurrency: string
    ): Promise<void> {
        try {
            const response = await fetch(
                `${API_URL}?sellCurrency=${sellCurrency}&buyCurrency=${buyCurrency}`
            );
            const data = (await response.json()) as ExchangeRateResponse;

            this.cache.rates = this.formatRates(data);
            this.cache.lastUpdated = new Date();
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
        }
    }

    /**
     * Formats API response into cached rate format
     * @param {ExchangeRateResponse} data - Raw API response
     * @returns {Record<string, number>} Formatted rates
     * @private
     */
    private formatRates(data: ExchangeRateResponse): Record<string, number> {
        const formattedRates: Record<string, number> = {};

        if (data.sellCurrency !== data.buyCurrency) {
            const key = `${data.sellCurrency}-${data.buyCurrency}`;
            formattedRates[key] = data.retailRate;
        }

        return formattedRates;
    }
}

export default ExchangeRateService;
