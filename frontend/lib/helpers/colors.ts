export interface CategoryColors {
  background: string;
  foreground: string;
}

function hexToRgba(hexColor: string, alpha: number): string {
  const hex = hexColor.replace("#", "");
  const red = parseInt(hex.substring(0, 2), 16);
  const green = parseInt(hex.substring(2, 4), 16);
  const blue = parseInt(hex.substring(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function createCategoryColors(background: string): CategoryColors {
  return {
    background,
    foreground: hexToRgba(background, 0.18),
  };
}

export const DEFAULT_CATEGORY_COLORS: CategoryColors = {
  background: "#9E9E9E",
  foreground: hexToRgba("#9E9E9E", 0.18),
};
