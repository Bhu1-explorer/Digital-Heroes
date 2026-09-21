export function calculateMonthlyContribution(
  planType: 'monthly' | 'yearly', 
  planPrice: number, // minor units (cents)
  charityPercent: number
): number {
  if (charityPercent < 10) charityPercent = 10;
  if (charityPercent > 100) charityPercent = 100;
  
  // Calculate the monthly equivalent price in minor units
  const equivalentMonthlyPrice = planType === 'yearly' ? planPrice / 12 : planPrice;
  
  // Calculate the contribution based on the percentage
  return Math.round(equivalentMonthlyPrice * (charityPercent / 100));
}

export function aggregateCharityTotals(
  subscriptions: { plan_type: 'monthly' | 'yearly', price: number, charity_percent: number }[],
  donations: { amount: number, status?: string }[]
): number {
  let total = 0;
  
  for (const sub of subscriptions) {
    total += calculateMonthlyContribution(sub.plan_type, sub.price, sub.charity_percent);
  }
  
  for (const donation of donations) {
    if (!donation.status || donation.status === 'completed') {
      total += donation.amount;
    }
  }
  
  return total;
}
