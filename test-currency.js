// Simple test for ESM
function formatCurrency(currency) {
    if (!currency) return '';
    const upperCurrency = currency.toUpperCase();
    const currencyMap = {
        'EGP': 'جنيه',
        'USD': 'دولار أمريكي',
        'SAR': '⃁',
        'AED': 'د.إ',
        'KWD': 'د.ك',
        'QAR': 'ر.ق',
        'EUR': 'يورو',
        'GBP': 'جنيه إسترليني'
    };
    return currencyMap[upperCurrency] || upperCurrency;
}

const testCurrencies = ['EGP', 'USD', 'SAR', 'AED', 'KWD', 'QAR', 'EUR', 'GBP', 'XYZ', null, undefined];

console.log('--- Currency Formatting Test ---');
testCurrencies.forEach(code => {
    console.log(`${code}: ${formatCurrency(code)}`);
});
