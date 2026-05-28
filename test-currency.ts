import { formatCurrency } from './src/utils/format';

const testCurrencies = ['EGP', 'USD', 'SAR', 'AED', 'KWD', 'QAR', 'EUR', 'GBP', 'XYZ', null, undefined];

console.log('--- Currency Formatting Test ---');
testCurrencies.forEach(code => {
    console.log(`${code}: ${formatCurrency(code)}`);
});
