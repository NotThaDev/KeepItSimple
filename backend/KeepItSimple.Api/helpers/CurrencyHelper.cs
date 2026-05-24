using System.Globalization;

namespace KeepItSimple.Api.Helpers;

public class CurrencyHelper
{
    private static List<string> Currencies
    {
        get => [.. CultureInfo.GetCultures(CultureTypes.SpecificCultures)
                .Select(c => new RegionInfo(c.Name).ISOCurrencySymbol)
                .Distinct()
                .OrderBy(c => c)];
    }

    public static bool ValidateString(string currencyCode)
    {
        return Currencies.Contains(currencyCode);
    }
}