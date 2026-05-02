// Equal Split with Remainder Handling
// Ensures total always equals original amount

/**
 * Splits an amount equally among N people
 * Uses largest remainder method to handle rounding
 * Time: O(n), Space: O(n)
 */
export function splitEqual(amount: number, count: number): number[] {
  if (count <= 0) throw new Error("Count must be positive");
  if (amount < 0) throw new Error("Amount must be non-negative");

  // Calculate base amount (floor to 2 decimal places)
  const baseAmount = Math.floor((amount / count) * 100) / 100;

  // Calculate remainder in paise (cents)
  const totalBase = baseAmount * count;
  const remainderPaise = Math.round((amount - totalBase) * 100);

  const shares: number[] = [];
  for (let i = 0; i < count; i++) {
    // First 'remainderPaise' people get +0.01
    shares.push(baseAmount + (i < remainderPaise ? 0.01 : 0));
  }

  // Verify sum equals original amount
  const sum = shares.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - amount) > 0.01) {
    throw new Error(`Split sum ${sum} does not equal amount ${amount}`);
  }

  return shares;
}

/**
 * Percentage split with validation
 */
export function splitByPercentage(
  amount: number, 
  percentages: Record<string, number>
): Record<string, number> {
  const totalPercentage = Object.values(percentages).reduce((a, b) => a + b, 0);

  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100%, got ${totalPercentage}%`);
  }

  const shares: Record<string, number> = {};
  let runningTotal = 0;

  const entries = Object.entries(percentages);
  entries.forEach(([userId, pct], index) => {
    if (index === entries.length - 1) {
      // Last person gets remainder to ensure exact total
      shares[userId] = Math.round((amount - runningTotal) * 100) / 100;
    } else {
      const share = Math.floor((amount * (pct / 100)) * 100) / 100;
      shares[userId] = share;
      runningTotal += share;
    }
  });

  return shares;
}
