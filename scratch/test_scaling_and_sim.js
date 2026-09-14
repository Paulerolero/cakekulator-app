const fs = require('fs');
const path = require('path');

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

let tmplCode = fs.readFileSync(path.join(__dirname, '../js/templates.js'), 'utf8');
tmplCode = tmplCode.replace(/const ([A-Z_0-9]+)\s*=/g, 'global.$1 =');
eval(tmplCode);
const dbCode = fs.readFileSync(path.join(__dirname, '../js/db.js'), 'utf8');
const wrappedCode = dbCode.replace('const DB =', 'global.DB =').replace('const Calculator =', 'global.Calculator =');
eval(wrappedCode);

console.log('--- Testing Calculator and DB ---');

// 1. Test Recipe Scaling
const sampleRecipe = {
  id: 'rec-test-1',
  name: 'Torta Selva Negra',
  type: 'cake',
  yieldPortions: 16,
  yieldUnits: 1,
  laborHours: 2.5,
  overheadCost: 2000,
  ingredients: [
    { ingredientId: 'ing-1', quantity: 400, unit: 'g' },
    { ingredientId: 'ing-2', quantity: 4, unit: 'u' },
    { ingredientId: 'ing-3', quantity: 250, unit: 'ml' }
  ],
  packaging: [
    { ingredientId: 'pkg-1', quantity: 1, unit: 'un' }
  ]
};

console.log('\n[Test 1] Scaling by Portions: 16 -> 30 portions');
const scaled30 = Calculator.scaleRecipe(sampleRecipe, { targetPortions: 30 });
console.log('Scale factor:', scaled30.scalingFactor, '(expected 30/16 = 1.875)');
console.log('Scaled name:', scaled30.recipe.name);
console.log('Scaled portions:', scaled30.recipe.yieldPortions);
console.log('Scaled flour (400g * 1.875):', scaled30.recipe.ingredients[0].quantity, 'g (expected 750)');
console.log('Scaled eggs (4u * 1.875):', scaled30.recipe.ingredients[1].quantity, 'u (expected 7.5)');
console.log('Scaled labor (2.5h * 1.875^0.75):', scaled30.recipe.laborHours, 'h');

console.log('\n[Test 2] Scaling by Diameter: 18cm -> 24cm mold');
const scaledDiameter = Calculator.scaleRecipe(sampleRecipe, {
  mode: 'diameter',
  targetPortions: 30, // Note: when targetPortions is passed together with targetDiameterCm
  baseDiameterCm: 18,
  targetDiameterCm: 24
});
console.log('Scale factor with targetPortions passed:', scaledDiameter.scalingFactor);
// Expected area ratio is (24/18)^2 = 1.777777...
const pureDiameterScale = Math.pow(24 / 18, 2);
console.log('Expected diameter ratio (24/18)^2 =', pureDiameterScale.toFixed(4));
console.log('Did diameter scaling actually apply?', Math.abs(scaledDiameter.scalingFactor - pureDiameterScale) < 0.01 ? 'YES' : 'NO (BUG: was overridden by targetPortions)');

console.log('\n[Test 3] Edge Cases in Scaling');
const scaledZero = Calculator.scaleRecipe(sampleRecipe, { targetPortions: 0 });
console.log('Scale with targetPortions=0:', scaledZero ? scaledZero.scalingFactor : 'null');
const scaledNegative = Calculator.scaleRecipe(sampleRecipe, { targetPortions: -5 });
console.log('Scale with targetPortions=-5:', scaledNegative ? scaledNegative.scalingFactor : 'null');

console.log('\n[Test 4] Simulator Selling Price Calculation');
const sim1 = Calculator.simulateSellingPrice(10000, 25000, 3.19);
console.log('Cost: 10.000, Price: 25.000, POS: 3.19%');
console.log('Commission amount:', sim1.commissionAmount, '(expected 25000 * 0.0319 = 797.5)');
console.log('Net Revenue:', sim1.netRevenue, '(expected 24202.5)');
console.log('Net Profit:', sim1.netProfit, '(expected 14202.5)');
console.log('Profit Margin %:', sim1.profitMargin.toFixed(2), '%');
console.log('Markup %:', sim1.markup.toFixed(2), '%');

console.log('\n[Test 5] Simulator Target Margin Formula');
// If cost = 10.000 and target margin = 40%:
// SellingPrice = cost / (1 - margin) = 10000 / 0.6 = 16666.67 -> roundUpTo 16700
const cost = 10000;
const margin = 40;
const suggestedPrice = Calculator.roundUpTo(cost / (1 - margin/100), 100);
console.log('Suggested price for 40% margin on 10.000 cost:', suggestedPrice);
const simSuggested = Calculator.simulateSellingPrice(cost, suggestedPrice, 0);
console.log('Resulting margin:', simSuggested.profitMargin.toFixed(2), '%');

console.log('\n[Test 6] Price below cost');
const simLoss = Calculator.simulateSellingPrice(10000, 8000, 0);
console.log('Cost: 10000, Price: 8000 -> Profit:', simLoss.netProfit, 'Margin:', simLoss.profitMargin.toFixed(1) + '%');
