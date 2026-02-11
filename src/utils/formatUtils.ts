/**
 * Formats a number for display in the stats section.
 * Removes decimals if they are zero.
 * @param value The number to format
 * @param decimals Maximum number of decimals (default: 2)
 * @returns Formatted string
 */
export const formatStatValue = (value: number, decimals: number = 2): string => {
    // Use Number.toFixed to round to the desired decimals, 
    // then cast back to Number to drop trailing zeros,
    // then toLocaleString for pretty printing.
    return Number(value.toFixed(decimals)).toLocaleString(undefined, {
        maximumFractionDigits: decimals
    });
};
