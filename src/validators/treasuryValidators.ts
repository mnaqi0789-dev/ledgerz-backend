export function validateTreasuryInput(
  assetName: unknown,
  quantity: unknown,
  price: unknown,
): string | null {
  if (
    !assetName ||
    typeof assetName !== "string" ||
    assetName.trim().length === 0
  ) {
    return "Asset name is required";
  }

  if (typeof quantity !== "number" || quantity <= 0) {
    return "Quantity must be a positive number";
  }

  if (typeof price !== "number" || price <= 0) {
    return "Price must be a positive number";
  }

  return null;
}
