using System.Globalization;

namespace KeepItSimple.Api.Helpers;

public static class CurrencyHelper
{
    private static List<string> Currencies
    {
        get => [.. CultureInfo.GetCultures(CultureTypes.SpecificCultures)
                .Select(c => new RegionInfo(c.Name).ISOCurrencySymbol)
                .Distinct()
                .Order()];
    }

    public static bool ValidateString(string currencyCode)
    {
        return Currencies.Contains(currencyCode);
    }
}