// src/lib/currency.js
//
// Multi-currency rates, country-to-currency mapping, and formatting engine.
// Base currency stored in the backend is USD ($).

export const CURRENCIES = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    rate: 1.0,
    decimals: 2,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    flag: '🇮🇳',
    rate: 86.5,
    decimals: 0,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    rate: 0.92,
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    rate: 0.79,
    decimals: 2,
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    rate: 1.38,
    decimals: 2,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    rate: 1.55,
    decimals: 2,
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham',
    flag: '🇦🇪',
    rate: 3.67,
    decimals: 2,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    flag: '🇯🇵',
    rate: 154.0,
    decimals: 0,
  },
};

/**
 * Detect default currency code based on user's country or city name.
 */
export function detectCurrencyFromCountry(countryOrCity = '') {
  if (!countryOrCity) return 'USD';
  const str = String(countryOrCity).toLowerCase();

  if (
    str.includes('india') ||
    str.includes('ind') ||
    str.includes('delhi') ||
    str.includes('bengaluru') ||
    str.includes('bangalore') ||
    str.includes('mumbai') ||
    str.includes('pune') ||
    str.includes('chennai') ||
    str.includes('hyderabad') ||
    str.includes('kolkata') ||
    str.includes('karnataka')
  ) {
    return 'INR';
  }
  if (str.includes('uk') || str.includes('united kingdom') || str.includes('britain') || str.includes('england') || str.includes('london')) {
    return 'GBP';
  }
  if (str.includes('germany') || str.includes('france') || str.includes('italy') || str.includes('spain') || str.includes('europe') || str.includes('rome') || str.includes('paris') || str.includes('berlin')) {
    return 'EUR';
  }
  if (str.includes('canada') || str.includes('toronto') || str.includes('vancouver')) {
    return 'CAD';
  }
  if (str.includes('australia') || str.includes('sydney') || str.includes('melbourne')) {
    return 'AUD';
  }
  if (str.includes('dubai') || str.includes('uae') || str.includes('emirates') || str.includes('abu dhabi')) {
    return 'AED';
  }
  if (str.includes('japan') || str.includes('tokyo')) {
    return 'JPY';
  }
  return 'USD';
}

/**
 * Convert USD price into target currency and format with appropriate symbol and commas.
 */
export function formatCurrencyPrice(usdAmount, currencyCode = 'USD') {
  const num = Number(usdAmount);
  if (isNaN(num)) return '$0';

  const info = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const converted = num * info.rate;

  let formattedValue;
  if (info.decimals === 0) {
    formattedValue = Math.round(converted).toLocaleString('en-US');
  } else {
    formattedValue = converted.toLocaleString('en-US', {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    });
  }

  return `${info.symbol}${formattedValue}`;
}
