// ==========================================
// Cakekulator - Capa de Datos y Cálculos Base
// ==========================================

const DB_KEYS = {
  SETTINGS: 'cakekulator_settings',
  INGREDIENTS: 'cakekulator_ingredients',
  RECIPES: 'cakekulator_recipes',
  QUOTES: 'cakekulator_quotes'
};

const LEGACY_DB_KEYS = {
  SETTINGS: 'dulcecalculo_settings',
  INGREDIENTS: 'dulcecalculo_ingredients',
  RECIPES: 'dulcecalculo_recipes',
  QUOTES: 'dulcecalculo_quotes'
};

const DB = {
  // Inicialización
  init() {
    // Migración transparente de datos anteriores
    Object.keys(DB_KEYS).forEach(k => {
      const legacyKey = LEGACY_DB_KEYS[k];
      const newKey = DB_KEYS[k];
      if (!localStorage.getItem(newKey) && localStorage.getItem(legacyKey)) {
        localStorage.setItem(newKey, localStorage.getItem(legacyKey));
      }
    });

    if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
      this.saveSettings(DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(DB_KEYS.INGREDIENTS)) {
      this.saveIngredients(DEFAULT_INGREDIENTS);
    }
    if (!localStorage.getItem(DB_KEYS.RECIPES)) {
      this.saveRecipes(DEFAULT_RECIPES);
    }
    if (!localStorage.getItem(DB_KEYS.QUOTES)) {
      this.saveQuotes(DEFAULT_QUOTES);
    }
  },

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(DB_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      console.error('Error al cargar settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Insumos / Ingredientes
  getIngredients() {
    try {
      const data = localStorage.getItem(DB_KEYS.INGREDIENTS);
      return data ? JSON.parse(data) : DEFAULT_INGREDIENTS;
    } catch (e) {
      console.error('Error al cargar ingredientes:', e);
      return [];
    }
  },

  getIngredientById(id) {
    const list = this.getIngredients();
    return list.find(item => item.id === id) || null;
  },

  saveIngredients(ingredients) {
    localStorage.setItem(DB_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  },

  addIngredient(ingredient) {
    const list = this.getIngredients();
    if (!ingredient.id) {
      ingredient.id = 'ing_' + Date.now();
    }
    list.unshift(ingredient);
    this.saveIngredients(list);
    return ingredient;
  },

  updateIngredient(id, updatedData) {
    const list = this.getIngredients();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData };
      this.saveIngredients(list);
      return list[index];
    }
    return null;
  },

  deleteIngredient(id) {
    let list = this.getIngredients();
    list = list.filter(item => item.id !== id);
    this.saveIngredients(list);
  },

  // Recetas / Fichas Técnicas
  getRecipes() {
    try {
      const data = localStorage.getItem(DB_KEYS.RECIPES);
      return data ? JSON.parse(data) : DEFAULT_RECIPES;
    } catch (e) {
      console.error('Error al cargar recetas:', e);
      return [];
    }
  },

  getRecipeById(id) {
    const list = this.getRecipes();
    return list.find(item => item.id === id) || null;
  },

  saveRecipes(recipes) {
    localStorage.setItem(DB_KEYS.RECIPES, JSON.stringify(recipes));
  },

  addRecipe(recipe) {
    const list = this.getRecipes();
    if (!recipe.id) {
      recipe.id = 'rec_' + Date.now();
    }
    list.unshift(recipe);
    this.saveRecipes(list);
    return recipe;
  },

  updateRecipe(id, updatedData) {
    const list = this.getRecipes();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData };
      this.saveRecipes(list);
      return list[index];
    }
    return null;
  },

  deleteRecipe(id) {
    let list = this.getRecipes();
    list = list.filter(item => item.id !== id);
    this.saveRecipes(list);
  },

  duplicateRecipe(id) {
    const original = this.getRecipeById(id);
    if (!original) return null;
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = 'rec_' + Date.now();
    copy.name = `${original.name} (Copia)`;
    return this.addRecipe(copy);
  },

  // Cotizaciones / Presupuestos
  getQuotes() {
    try {
      const data = localStorage.getItem(DB_KEYS.QUOTES);
      return data ? JSON.parse(data) : DEFAULT_QUOTES;
    } catch (e) {
      console.error('Error al cargar cotizaciones:', e);
      return [];
    }
  },

  getQuoteById(id) {
    const list = this.getQuotes();
    return list.find(item => item.id === id) || null;
  },

  saveQuotes(quotes) {
    localStorage.setItem(DB_KEYS.QUOTES, JSON.stringify(quotes));
  },

  addQuote(quote) {
    const list = this.getQuotes();
    if (!quote.id) {
      quote.id = 'quote_' + Date.now();
    }
    if (!quote.code) {
      quote.code = 'COT-' + String(list.length + 1).padStart(3, '0');
    }
    if (!quote.createdAt) {
      quote.createdAt = new Date().toISOString();
    }
    list.unshift(quote);
    this.saveQuotes(list);
    return quote;
  },

  updateQuote(id, updatedData) {
    const list = this.getQuotes();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData };
      this.saveQuotes(list);
      return list[index];
    }
    return null;
  },

  deleteQuote(id) {
    let list = this.getQuotes();
    list = list.filter(item => item.id !== id);
    this.saveQuotes(list);
  },

  // Exportar / Importar / Reset
  exportAllData() {
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      ingredients: this.getIngredients(),
      recipes: this.getRecipes(),
      quotes: this.getQuotes()
    }, null, 2);
  },

  importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.ingredients) this.saveIngredients(data.ingredients);
      if (data.recipes) this.saveRecipes(data.recipes);
      if (data.quotes) this.saveQuotes(data.quotes);
      return true;
    } catch (e) {
      console.error('Error importando datos:', e);
      return false;
    }
  },

  resetAllData() {
    localStorage.removeItem(DB_KEYS.SETTINGS);
    localStorage.removeItem(DB_KEYS.INGREDIENTS);
    localStorage.removeItem(DB_KEYS.RECIPES);
    localStorage.removeItem(DB_KEYS.QUOTES);
    this.init();
  }
};

// ==========================================
// Motor de Cálculos y Conversiones de Unidades
// ==========================================

const Calculator = {
  // Factores de conversión a unidad estándar base (g, ml, u)
  unitFactors: {
    // Masa -> base: g
    'g': { base: 'g', factor: 1 },
    'kg': { base: 'g', factor: 1000 },
    'mg': { base: 'g', factor: 0.001 },
    'oz': { base: 'g', factor: 28.3495 },
    'lb': { base: 'g', factor: 453.592 },

    // Volumen -> base: ml
    'ml': { base: 'ml', factor: 1 },
    'cc': { base: 'ml', factor: 1 },
    'l': { base: 'ml', factor: 1000 },
    'L': { base: 'ml', factor: 1000 },
    'tbsp': { base: 'ml', factor: 15 },    // Cucharada
    'cda': { base: 'ml', factor: 15 },
    'tsp': { base: 'ml', factor: 5 },      // Cucharadita
    'cdta': { base: 'ml', factor: 5 },
    'cup': { base: 'ml', factor: 240 },    // Taza repostera
    'taza': { base: 'ml', factor: 240 },

    // Unidades / Conteo -> base: u
    'u': { base: 'u', factor: 1 },
    'un': { base: 'u', factor: 1 },
    'unidad': { base: 'u', factor: 1 },
    'docena': { base: 'u', factor: 12 },
    'par': { base: 'u', factor: 2 }
  },

  // Conversión entre unidades compatibles
  convertQuantity(qty, fromUnit, toUnit) {
    if (!qty || isNaN(qty)) return 0;
    if (fromUnit === toUnit) return Number(qty);

    const fromMeta = this.unitFactors[fromUnit] || { base: fromUnit, factor: 1 };
    const toMeta = this.unitFactors[toUnit] || { base: toUnit, factor: 1 };

    // Si pertenecen a la misma familia base (ej: g y kg, o ml y L)
    if (fromMeta.base === toMeta.base) {
      const baseValue = Number(qty) * fromMeta.factor;
      return baseValue / toMeta.factor;
    }

    // Si no son directamente convertibles (ej. g a ml sin densidad), asumimos densidad agua 1g = 1ml para líquidos/harinas comunes
    if ((fromMeta.base === 'g' && toMeta.base === 'ml') || (fromMeta.base === 'ml' && toMeta.base === 'g')) {
      const baseValue = Number(qty) * fromMeta.factor;
      return baseValue / toMeta.factor;
    }

    return Number(qty);
  },

  // Calcula el costo de un insumo según cantidad y unidad requerida
  getIngredientItemCost(ingredient, requiredQty, requiredUnit) {
    if (!ingredient || !ingredient.packagePrice || !ingredient.packageQty) return 0;

    const waste = Number(ingredient.yieldWastePercent || 0);
    const effectivePackageQty = Number(ingredient.packageQty) * (1 - waste / 100);

    if (effectivePackageQty <= 0) return 0;

    // Convertir cantidad requerida a la unidad en que se compró el insumo
    const convertedReqQty = this.convertQuantity(requiredQty, requiredUnit, ingredient.packageUnit);
    
    const costPerPurchaseUnit = Number(ingredient.packagePrice) / effectivePackageQty;
    return convertedReqQty * costPerPurchaseUnit;
  },

  // Calcula el costo por unidad base (por gramo, por ml, por unidad)
  getIngredientBaseUnitCost(ingredient) {
    if (!ingredient || !ingredient.packagePrice || !ingredient.packageQty) return { unitCost: 0, baseUnit: 'g' };
    const waste = Number(ingredient.yieldWastePercent || 0);
    const effectivePackageQty = Number(ingredient.packageQty) * (1 - waste / 100);
    const unitMeta = this.unitFactors[ingredient.packageUnit] || { base: ingredient.packageUnit, factor: 1 };
    
    const totalBaseQty = effectivePackageQty * unitMeta.factor;
    const costPerBase = totalBaseQty > 0 ? Number(ingredient.packagePrice) / totalBaseQty : 0;

    return {
      costPerBase,
      baseUnit: unitMeta.base,
      packageUnitCost: effectivePackageQty > 0 ? Number(ingredient.packagePrice) / effectivePackageQty : 0
    };
  },

  // Calcula el desglose completo de costos de una receta
  calculateRecipeFullCosts(recipe, allIngredientsMap = null) {
    if (!recipe) return null;

    if (!allIngredientsMap) {
      const ingredients = DB.getIngredients();
      allIngredientsMap = new Map(ingredients.map(i => [i.id, i]));
    }

    // 1. Costo Insumos / Ingredientes
    let ingredientsCost = 0;
    const detailedIngredients = (recipe.ingredients || []).map(item => {
      const ing = allIngredientsMap.get(item.ingredientId);
      const cost = ing ? this.getIngredientItemCost(ing, item.quantity, item.unit) : 0;
      ingredientsCost += cost;
      return {
        ...item,
        name: ing ? ing.name : 'Insumo no encontrado',
        packagePrice: ing ? ing.packagePrice : 0,
        packageUnit: ing ? ing.packageUnit : '',
        cost
      };
    });

    // 2. Costo Empaque
    let packagingCost = 0;
    const detailedPackaging = (recipe.packaging || []).map(item => {
      const ing = allIngredientsMap.get(item.ingredientId);
      const cost = ing ? this.getIngredientItemCost(ing, item.quantity, item.unit) : 0;
      packagingCost += cost;
      return {
        ...item,
        name: ing ? ing.name : 'Empaque no encontrado',
        packagePrice: ing ? ing.packagePrice : 0,
        packageUnit: ing ? ing.packageUnit : '',
        cost
      };
    });

    // 3. Costo Mano de Obra
    const laborHours = Number(recipe.laborHours || 0);
    const laborRate = Number(recipe.laborRatePerHour || DB.getSettings().defaultHourlyRate || 4000);
    const laborCost = laborHours * laborRate;

    // 4. Costos Indirectos / Servicios (Gas, luz, agua, arriendo prorrateado)
    const overheadCost = Number(recipe.overheadCost || 0);

    // 5. Costo Total de Producción (Lote Completo)
    const totalBatchCost = ingredientsCost + packagingCost + laborCost + overheadCost;

    // 6. Rendimiento
    const yieldUnits = Math.max(1, Number(recipe.yieldUnits || 1));
    const yieldPortions = Math.max(1, Number(recipe.yieldPortions || yieldUnits));

    // 7. Costos Unitarios
    const costPerUnit = totalBatchCost / yieldUnits;
    const costPerPortion = totalBatchCost / yieldPortions;

    // Insumos + empaque base unitarios (costo primo directo)
    const directCostPerUnit = (ingredientsCost + packagingCost) / yieldUnits;
    const directCostPerPortion = (ingredientsCost + packagingCost) / yieldPortions;

    // 8. Precios Sugeridos por Margen deseado
    const targetMargin = Number(recipe.suggestedMargin || DB.getSettings().defaultTargetMargin || 40);
    const marginFraction = targetMargin >= 100 ? 0.99 : targetMargin / 100;
    
    // Precio de venta = Costo / (1 - Margen)
    const suggestedBatchPrice = marginFraction < 1 ? totalBatchCost / (1 - marginFraction) : totalBatchCost * 2;
    const suggestedUnitPrice = marginFraction < 1 ? costPerUnit / (1 - marginFraction) : costPerUnit * 2;
    const suggestedPortionPrice = marginFraction < 1 ? costPerPortion / (1 - marginFraction) : costPerPortion * 2;

    // Markup equivalente (% sobre el costo): (Precio - Costo) / Costo * 100
    const suggestedMarkup = totalBatchCost > 0 ? ((suggestedBatchPrice - totalBatchCost) / totalBatchCost) * 100 : 0;

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeType: recipe.type || 'units',
      yieldUnits,
      yieldPortions,
      unitName: recipe.unitName || 'unidad',
      
      // Costos totales lote
      ingredientsCost,
      packagingCost,
      laborCost,
      overheadCost,
      totalBatchCost,

      // Costos unitarios
      costPerUnit,
      costPerPortion,
      directCostPerUnit,
      directCostPerPortion,

      // Precios y márgenes recomendados
      targetMargin,
      suggestedMarkup,
      suggestedBatchPrice,
      suggestedUnitPrice,
      suggestedPortionPrice,

      // Listas con subtotales calculados
      detailedIngredients,
      detailedPackaging,

      // Porcentajes de incidencia sobre el costo total
      breakdownPercents: {
        ingredients: totalBatchCost > 0 ? (ingredientsCost / totalBatchCost) * 100 : 0,
        packaging: totalBatchCost > 0 ? (packagingCost / totalBatchCost) * 100 : 0,
        labor: totalBatchCost > 0 ? (laborCost / totalBatchCost) * 100 : 0,
        overhead: totalBatchCost > 0 ? (overheadCost / totalBatchCost) * 100 : 0
      }
    };
  },

  // Simulación de rentabilidad dado un precio de venta manual
  simulateSellingPrice(totalCost, sellingPrice, paymentCommissionPercent = 0) {
    const cost = Number(totalCost || 0);
    const price = Number(sellingPrice || 0);
    const commRate = Number(paymentCommissionPercent || 0) / 100;

    const commissionAmount = price * commRate;
    const netRevenue = price - commissionAmount;
    const netProfit = netRevenue - cost;

    // Margen sobre venta: (Ganancia / Precio) * 100
    const profitMargin = price > 0 ? (netProfit / price) * 100 : 0;

    // Markup sobre costo: (Ganancia / Costo) * 100
    const markup = cost > 0 ? (netProfit / cost) * 100 : 0;

    // Multiplicador de costo (ej: 2.5x)
    const costMultiplier = cost > 0 ? price / cost : 0;

    // Punto de equilibrio en unidades (si hay costos fijos)
    const breakEvenMultiplier = netProfit > 0 ? price / netProfit : 0;

    return {
      cost,
      sellingPrice: price,
      commissionPercent: paymentCommissionPercent,
      commissionAmount,
      netRevenue,
      netProfit,
      profitMargin,
      markup,
      costMultiplier,
      isProfitable: netProfit > 0,
      breakEvenMultiplier
    };
  },

  // Formato de moneda
  formatCurrency(value, customSymbol = null) {
    const symbol = customSymbol || (DB.getSettings ? DB.getSettings().currencySymbol : '$');
    const num = Math.round(Number(value) || 0);
    return `${symbol} ${num.toLocaleString('es-CL')}`;
  },

  // Formato decimal con unidad
  formatDecimal(value, decimals = 1) {
    const num = Number(value) || 0;
    return num.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  }
};
