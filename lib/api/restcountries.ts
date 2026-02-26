interface CountryApiResponse {
  name: { common: string; official?: string };
  currencies?: Record<string, { name: string; symbol: string }>;
}

let cachedCountries: CountryApiResponse[] | null = null;

async function fetchCountries(): Promise<CountryApiResponse[]> {
  if (cachedCountries) return cachedCountries;
  const res = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
  if (!res.ok) throw new Error('Failed to fetch countries');
  cachedCountries = (await res.json()) as CountryApiResponse[];
  return cachedCountries;
}

/**
 * Get default currency code for a country by name.
 * Uses restcountries.com API.
 */
export async function getCurrencyForCountry(countryName: string): Promise<string> {
  const countries = await fetchCountries();
  const normalized = countryName.trim().toLowerCase();
  const country = countries.find((c) => c.name.common.toLowerCase() === normalized);
  if (!country?.currencies || Object.keys(country.currencies).length === 0) {
    throw new Error('Invalid country selection');
  }
  const currencyCode = Object.keys(country.currencies)[0];
  return currencyCode;
}
