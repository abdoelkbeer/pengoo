/**
 * Formats a currency code into its display symbol or name.
 * Specifically converts "EGP" (case-insensitive) to "جنيه".
 * 
 * @param currency The currency code to format (e.g., "EGP", "USD")
 * @returns The formatted currency string
 */
export function formatCurrency(currency: string | undefined | null): string {
    if (!currency) return '';

    const upperCurrency = currency.toUpperCase();

    const currencyMap: { [key: string]: string } = {
        'EGP': 'جنيه',
        'USD': 'دولار أمريكي',
        'SAR': '⃁', // Modern Saudi Riyal symbol (U+20C1)
        'AED': 'د.إ',
        'KWD': 'د.ك',
        'QAR': 'ر.ق',
        'EUR': 'يورو',
        'GBP': 'جنيه إسترليني'
    };

    return currencyMap[upperCurrency] || upperCurrency;
}
