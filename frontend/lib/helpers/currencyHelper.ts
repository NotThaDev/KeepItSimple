export function getCurrencySymbolFromCode(currencyCode: string): string {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find((part) => part.type === "currency");
    return symbolPart ? symbolPart.value : currencyCode;
  } catch (error) {
    console.error(
      `Error getting currency symbol for code "${currencyCode}":`,
      error,
    );
    return currencyCode; // Fallback to the currency code if there's an error
  }
}
