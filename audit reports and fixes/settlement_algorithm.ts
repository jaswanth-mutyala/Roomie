// Settlement Optimization Algorithm
// Minimizes number of transactions to settle all debts

interface Balance {
  userId: string;
  net: number; // positive = owed to them, negative = they owe
}

interface SettlementTransaction {
  from: string;
  to: string;
  amount: number;
}

/**
 * Optimizes settlements using greedy algorithm
 * Time: O(n log n), Space: O(n)
 */
export function optimizeSettlements(balances: Balance[]): SettlementTransaction[] {
  const transactions: SettlementTransaction[] = [];

  // Separate creditors and debtors, filter out negligible amounts
  const creditors = balances
    .filter(b => b.net > 0.01)
    .sort((a, b) => b.net - a.net);

  const debtors = balances
    .filter(b => b.net < -0.01)
    .sort((a, b) => a.net - b.net);

  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.net, Math.abs(debtor.net));

    if (amount > 0.01) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(amount * 100) / 100
      });
    }

    creditor.net -= amount;
    debtor.net += amount;

    if (creditor.net <= 0.01) i++;
    if (debtor.net >= -0.01) j++;
  }

  return transactions;
}

/**
 * Calculate net balances from bills and settlements
 */
export function calculateBalances(
  bills: { amount: number; payers: Record<string, number>; splitAmong: string[] }[],
  settlements: { from: string; to: string; amount: number }[],
  userIds: string[]
): Balance[] {
  const balances: Record<string, number> = {};

  // Initialize all users
  userIds.forEach(id => balances[id] = 0);

  // Process bills
  bills.forEach(bill => {
    const splitAmount = bill.amount / bill.splitAmong.length;

    // Add what each payer paid (credit)
    Object.entries(bill.payers).forEach(([userId, amount]) => {
      balances[userId] = (balances[userId] || 0) + amount;
    });

    // Subtract what each person owes (debit)
    bill.splitAmong.forEach(userId => {
      balances[userId] = (balances[userId] || 0) - splitAmount;
    });
  });

  // Process settlements
  settlements.forEach(s => {
    balances[s.from] = (balances[s.from] || 0) + s.amount;
    balances[s.to] = (balances[s.to] || 0) - s.amount;
  });

  return Object.entries(balances).map(([userId, net]) => ({
    userId,
    net: Math.round(net * 100) / 100
  }));
}
