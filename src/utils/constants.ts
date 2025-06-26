
export const CURRENCIES = [
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'CRC', name: 'Colón Costarricense', symbol: '₡' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
  { code: 'CAD', name: 'Dólar Canadiense', symbol: 'C$' },
];

export const COUNTRIES = [
  { code: 'US', name: 'Estados Unidos' },
  { code: 'MX', name: 'México' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CA', name: 'Canadá' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'FR', name: 'Francia' },
  { code: 'DE', name: 'Alemania' },
  { code: 'ES', name: 'España' },
];

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

export const getCountryName = (countryCode: string): string => {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country?.name || countryCode;
};
