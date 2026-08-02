export const SCHEMA_VERSION = 1;

export const COMMON_UNITS = [
  '顆',
  '克',
  '公斤',
  '毫升',
  '公升',
  '杯',
  '大匙',
  '小匙',
  '片',
  '根',
  '把',
  '包',
  '罐',
  '盒',
  '份',
  '瓣',
  '朵',
  '條',
  '碗',
  '少許',
];

export const SCALE_TYPES = [
  { id: 'regular', label: '一般食材', factor: 1 },
  { id: 'salty', label: '鹹味調味', factor: 0.75 },
  { id: 'strong-spice', label: '強烈香料', factor: 0.5 },
  { id: 'aromatic', label: '辛香料', factor: 0.85 },
  { id: 'oil', label: '油脂/潤鍋', factor: 0.5 },
  { id: 'liquid', label: '湯汁/水分', factor: 0.85 },
];

export const INGREDIENT_CATEGORIES = [
  '主食澱粉',
  '蛋白質',
  '蔬菜菇果',
  '辛香調味',
  '油脂液體',
  '其他',
];

export const DISH_ROLES = [
  { id: 'main', label: '主菜' },
  { id: 'staple', label: '主食' },
  { id: 'vegetable', label: '青菜蔬果' },
  { id: 'soup', label: '湯' },
  { id: 'dessert', label: '甜點' },
  { id: 'drink', label: '飲料' },
  { id: 'side', label: '小菜' },
];

export const MEAL_TEMPLATES = [
  {
    id: 'standard-set',
    name: '標準套餐',
    slots: [
      { role: 'main', label: '主菜', min: 1, max: 2 },
      { role: 'staple', label: '主食', min: 1, max: 1 },
      { role: 'vegetable', label: '青菜蔬果', min: 3, max: 4 },
      { role: 'soup', label: '湯', min: 1, max: 1 },
      { role: 'dessert', label: '甜點', min: 1, max: 1 },
      { role: 'drink', label: '飲料', min: 1, max: 1 },
    ],
  },
];

export const MAX_PEOPLE = 50;
export const BULK_COOKING_NOTICE_THRESHOLD = 20;

const CHARACTER_FIXES = new Map([
  ['鷄', '雞'],
  ['鸡', '雞'],
  ['葱', '蔥'],
  ['姜', '薑'],
  ['蕃', '番'],
]);

const STARTER_INGREDIENTS = [
  { id: 'egg', name: '雞蛋', aliases: ['蛋', '雞卵'], defaultUnit: '顆', units: ['顆'], category: '蛋白質', scaleType: 'regular' },
  { id: 'green-onion', name: '青蔥', aliases: ['蔥', '香蔥'], defaultUnit: '根', units: ['根', '克'], category: '辛香調味', scaleType: 'aromatic' },
  { id: 'garlic', name: '蒜頭', aliases: ['大蒜', '蒜'], defaultUnit: '瓣', units: ['瓣', '克'], category: '辛香調味', scaleType: 'aromatic' },
  { id: 'ginger', name: '薑', aliases: ['老薑', '嫩薑'], defaultUnit: '片', units: ['片', '克'], category: '辛香調味', scaleType: 'aromatic' },
  { id: 'cabbage', name: '高麗菜', aliases: ['甘藍菜'], defaultUnit: '克', units: ['克', '公斤'], category: '蔬菜菇果', scaleType: 'regular' },
  { id: 'shiitake', name: '香菇', aliases: ['菇'], defaultUnit: '朵', units: ['朵', '克'], category: '蔬菜菇果', scaleType: 'regular' },
  { id: 'rice', name: '白飯', aliases: ['飯', '米飯'], defaultUnit: '碗', units: ['碗', '克'], category: '主食澱粉', scaleType: 'regular' },
  { id: 'soy-sauce', name: '醬油', aliases: ['壺底油'], defaultUnit: '大匙', units: ['大匙', '小匙', '毫升'], category: '辛香調味', scaleType: 'salty' },
  { id: 'salt', name: '鹽', aliases: ['食鹽'], defaultUnit: '小匙', units: ['小匙', '克', '少許'], category: '辛香調味', scaleType: 'salty' },
  { id: 'pepper', name: '白胡椒', aliases: ['胡椒粉'], defaultUnit: '小匙', units: ['小匙', '克', '少許'], category: '辛香調味', scaleType: 'strong-spice' },
];

const STARTER_DISHES = [
  {
    id: 'dish-scrambled-eggs',
    name: '炒蛋',
    servings: 1,
    roles: ['main'],
    items: [
      { ingredientId: 'egg', quantity: 3, unit: '顆' },
      { ingredientId: 'green-onion', quantity: 1, unit: '根' },
      { ingredientId: 'salt', quantity: 0.25, unit: '小匙' },
    ],
    source: 'local',
  },
  {
    id: 'dish-cabbage',
    name: '蒜炒高麗菜',
    servings: 2,
    roles: ['vegetable'],
    items: [
      { ingredientId: 'cabbage', quantity: 300, unit: '克' },
      { ingredientId: 'garlic', quantity: 3, unit: '瓣' },
      { ingredientId: 'salt', quantity: 0.5, unit: '小匙' },
    ],
    source: 'local',
  },
  {
    id: 'dish-rice',
    name: '白飯',
    servings: 1,
    roles: ['staple'],
    items: [
      { ingredientId: 'rice', quantity: 1, unit: '碗' },
    ],
    source: 'local',
  },
];

export function createInitialState() {
  return {
    version: SCHEMA_VERSION,
    ingredients: structuredCloneSafe(STARTER_INGREDIENTS),
    dishes: structuredCloneSafe(STARTER_DISHES),
    plans: [],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeIngredientName(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .split('')
    .map((character) => CHARACTER_FIXES.get(character) ?? character)
    .join('');
}

export function normalizeIngredientCategory(value, allowCustom = false) {
  const category = String(value ?? '').trim();

  if (INGREDIENT_CATEGORIES.includes(category)) return category;

  const legacyMap = new Map([
    ['主食', '主食澱粉'],
    ['澱粉', '主食澱粉'],
    ['蛋類', '蛋白質'],
    ['肉類', '蛋白質'],
    ['海鮮', '蛋白質'],
    ['豆製品', '蛋白質'],
    ['蔬菜', '蔬菜菇果'],
    ['菇類', '蔬菜菇果'],
    ['水果', '蔬菜菇果'],
    ['辛香料', '辛香調味'],
    ['香料', '辛香調味'],
    ['調味料', '辛香調味'],
    ['油脂', '油脂液體'],
    ['液體', '油脂液體'],
    ['乳製品', '油脂液體'],
    ['未分類', '其他'],
  ]);

  if (legacyMap.has(category)) return legacyMap.get(category);
  if (allowCustom && category) return category;

  return '其他';
}

export function findIngredientMatch(ingredients, rawName) {
  const normalized = normalizeIngredientName(rawName);

  if (!normalized) {
    return { type: 'none', ingredient: null, score: 0 };
  }

  for (const ingredient of ingredients) {
    if (normalizeIngredientName(ingredient.name) === normalized) {
      return { type: 'exact', ingredient, score: 1 };
    }
  }

  for (const ingredient of ingredients) {
    const aliases = Array.isArray(ingredient.aliases) ? ingredient.aliases : [];
    if (aliases.some((alias) => normalizeIngredientName(alias) === normalized)) {
      return { type: 'alias', ingredient, score: 0.98 };
    }
  }

  let best = { type: 'none', ingredient: null, score: 0 };
  for (const ingredient of ingredients) {
    const candidates = [ingredient.name, ...(Array.isArray(ingredient.aliases) ? ingredient.aliases : [])];
    for (const candidate of candidates) {
      const score = similarity(normalized, normalizeIngredientName(candidate));
      if (score > best.score) {
        best = { type: 'similar', ingredient, score };
      }
    }
  }

  return best.score >= 0.58 ? best : { type: 'none', ingredient: null, score: best.score };
}

export function addDish(state, dishInput) {
  const next = cloneState(state);
  const dish = buildDishFromInput(next, dishInput, uniqueId('dish', next.dishes.map((item) => item.id)));

  next.dishes.push(dish);

  return touch(next);
}

export function updateDish(state, dishId, dishInput) {
  const next = cloneState(state);
  const index = next.dishes.findIndex((dish) => dish.id === dishId);

  if (index === -1) {
    throw new Error('找不到要調整的料理');
  }

  next.dishes[index] = buildDishFromInput(next, dishInput, dishId);

  return touch(next);
}

export function scaleDishItems(items, people) {
  const multiplier = clampInteger(people, 1, MAX_PEOPLE, 1);

  return items.map((item) => ({
    ...item,
    quantity: roundQuantity(Number(item.quantity) * multiplier),
  }));
}

export function scaleIngredientQuantity(quantity, multiplier, ingredient) {
  const scaleType = normalizeScaleType(ingredient?.scaleType ?? inferScaleType(ingredient ?? {}));
  const rule = SCALE_TYPES.find((item) => item.id === scaleType) ?? SCALE_TYPES[0];
  const numericQuantity = Number(quantity);
  const numericMultiplier = Number(multiplier);

  if (!Number.isFinite(numericQuantity) || !Number.isFinite(numericMultiplier) || numericMultiplier <= 0) {
    return roundQuantity(numericQuantity);
  }

  if (numericMultiplier <= 1) {
    return roundQuantity(numericQuantity * numericMultiplier);
  }

  return roundQuantity(numericQuantity * (1 + (numericMultiplier - 1) * rule.factor));
}

export function scaleDishForPeople(dish, ingredients, targetPeople) {
  const baseServings = clampInteger(dish?.servings, 1, MAX_PEOPLE, 1);
  const people = clampInteger(targetPeople, 1, MAX_PEOPLE, baseServings);
  const multiplier = people / baseServings;

  return {
    ...dish,
    targetPeople: people,
    items: dish.items.map((item) => {
      const ingredient = ingredients.find((entry) => entry.id === item.ingredientId);
      return {
        ...item,
        quantity: scaleIngredientQuantity(item.quantity, multiplier, ingredient),
      };
    }),
  };
}

export function addIngredient(state, ingredientInput) {
  const next = cloneState(state);
  const ingredient = buildIngredientFromInput(next, ingredientInput, uniqueId(slugify(ingredientInput?.name), next.ingredients.map((item) => item.id)));

  next.ingredients.push(ingredient);

  return touch(next);
}

export function updateIngredient(state, ingredientId, ingredientInput) {
  const next = cloneState(state);
  const index = next.ingredients.findIndex((ingredient) => ingredient.id === ingredientId);

  if (index === -1) {
    throw new Error('找不到要調整的食材');
  }

  next.ingredients[index] = buildIngredientFromInput(next, ingredientInput, ingredientId);

  return touch(next);
}

export function removeDish(state, dishId) {
  const next = cloneState(state);
  next.dishes = next.dishes.filter((dish) => dish.id !== dishId);
  return touch(next);
}

export function removeIngredient(state, ingredientId) {
  const next = cloneState(state);
  const isUsed = next.dishes.some((dish) => dish.items.some((item) => item.ingredientId === ingredientId));
  if (isUsed) {
    throw new Error('此食材已被料理使用，請先移除相關料理');
  }
  next.ingredients = next.ingredients.filter((ingredient) => ingredient.id !== ingredientId);
  return touch(next);
}

export function importState(rawData) {
  const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

  if (!data || data.version !== SCHEMA_VERSION) {
    throw new Error(`JSON 版本需為 ${SCHEMA_VERSION}`);
  }

  const ingredients = Array.isArray(data.ingredients)
    ? data.ingredients
        .filter((item) => item && item.id && item.name)
        .map((item) => ({
          id: String(item.id),
          name: String(item.name),
          aliases: Array.isArray(item.aliases) ? item.aliases.map(String).filter(Boolean) : [],
          defaultUnit: COMMON_UNITS.includes(item.defaultUnit) ? item.defaultUnit : '份',
          units: normalizeIngredientUnits(item.units, item.defaultUnit),
          category: normalizeIngredientCategory(item.category, true),
          scaleType: normalizeScaleType(item.scaleType ?? inferScaleType(item)),
        }))
    : [];

  const ingredientIds = new Set(ingredients.map((ingredient) => ingredient.id));
  const dishes = Array.isArray(data.dishes)
    ? data.dishes
        .filter((dish) => dish && dish.id && dish.name && Array.isArray(dish.items))
        .map((dish) => ({
          id: String(dish.id),
          name: String(dish.name),
          servings: clampInteger(dish.servings, 1, MAX_PEOPLE, 1),
          roles: normalizeDishRoles(dish.roles, dish.name),
          source: dish.source === 'ai' ? 'ai' : 'local',
          items: dish.items
            .filter(
              (item) =>
                item &&
                ingredientIds.has(String(item.ingredientId)) &&
                Number.isFinite(Number(item.quantity)) &&
                Number(item.quantity) > 0 &&
                COMMON_UNITS.includes(item.unit),
            )
            .map((item) => ({
              ingredientId: String(item.ingredientId),
              quantity: Number(item.quantity),
              unit: String(item.unit),
            })),
        }))
        .filter((dish) => dish.items.length > 0)
    : [];

  return touch({
    version: SCHEMA_VERSION,
    ingredients,
    dishes,
    plans: Array.isArray(data.plans) ? data.plans : [],
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
  });
}

export function exportState(state) {
  return `${JSON.stringify(importState(state), null, 2)}\n`;
}

export function dishToDisplay(dish, ingredients) {
  return {
    ...dish,
    servings: clampInteger(dish.servings, 1, MAX_PEOPLE, 1),
    roles: normalizeDishRoles(dish.roles, dish.name),
    items: dish.items.map((item) => {
      const ingredient = ingredients.find((entry) => entry.id === item.ingredientId);
      return {
        ...item,
        ingredientName: ingredient?.name ?? '未知食材',
        ingredientUnits: ingredient?.units ?? COMMON_UNITS,
        scaleType: ingredient?.scaleType ?? 'regular',
      };
    }),
  };
}

export function groupDishesByRole(dishes) {
  return DISH_ROLES.map((role) => ({
    ...role,
    role: role.id,
    dishes: dishes.filter((dish) => normalizeDishRoles(dish.roles, dish.name).includes(role.id)),
  })).filter((group) => group.dishes.length > 0);
}

export function summarizePlanIngredients(recommendation) {
  const totals = new Map();
  const days = Array.isArray(recommendation?.days) ? recommendation.days : [];

  for (const day of days) {
    for (const meal of day.meals ?? []) {
      for (const slot of meal.slots ?? []) {
        for (const dish of slot.selectedDishes ?? []) {
          for (const item of dish.items ?? []) {
            const ingredientName = String(item.ingredientName ?? '未知食材');
            const unit = String(item.unit ?? '份');
            const key = `${ingredientName}\u0000${unit}`;
            const current = totals.get(key) ?? { ingredientName, unit, quantity: 0 };
            current.quantity = roundQuantity(current.quantity + Number(item.quantity || 0));
            totals.set(key, current);
          }
        }
      }
    }
  }

  return Array.from(totals.values()).sort((left, right) => left.ingredientName.localeCompare(right.ingredientName, 'zh-Hant'));
}

export function generateLocalRecommendation(state, options) {
  const days = clampInteger(options?.days, 1, 14, 3);
  const people = clampInteger(options?.people, 1, MAX_PEOPLE, 1);
  const meals = Array.isArray(options?.meals) && options.meals.length > 0 ? options.meals : ['午餐', '晚餐'];
  const template = MEAL_TEMPLATES.find((item) => item.id === options?.templateId) ?? MEAL_TEMPLATES[0];
  const seasonalFocus = ['香菇', '高麗菜', '青蔥', '薑', '雞蛋'];
  const dayPlans = Array.from({ length: days }, (_, dayIndex) => ({
    day: dayIndex + 1,
    meals: meals.map((meal, mealIndex) => {
      const slots = buildMealSlots(state, template, people, dayIndex, mealIndex);
      const firstDish = slots.flatMap((slot) => slot.selectedDishes)[0];
      return {
        meal,
        templateId: template.id,
        templateName: template.name,
        source: '套餐模板',
        dishName: firstDish?.name ?? template.name,
        servings: people,
        items: firstDish?.items ?? [],
        slots,
        reason: `以新社常見當季食材 ${seasonalFocus[(dayIndex + mealIndex) % seasonalFocus.length]} 搭配 ${template.name}，份量以 ${people} 人估算。`,
      };
    }),
  }));

  const suggestionIngredients = [
    ...state.ingredients,
    { name: '香菇', scaleType: 'regular' },
    { name: '薑', scaleType: 'aromatic' },
    { name: '白飯', scaleType: 'regular' },
    { name: '醬油', scaleType: 'salty' },
    { name: '青蔥', scaleType: 'aromatic' },
    { name: '雞蛋', scaleType: 'regular' },
  ];

  return {
    location: '新社',
    preferences: String(options?.preferences ?? '').trim(),
    people,
    bulkCookingNotice: people > BULK_COOKING_NOTICE_THRESHOLD,
    generatedAt: new Date().toISOString(),
    days: dayPlans,
    internetSuggestions: [
      {
        name: '香菇薑絲炊飯',
        servings: people,
        roles: ['staple'],
        source: 'ai',
        reason: '示範網路推薦料理格式，之後可改由 AI API 回傳。',
        items: scaleSuggestedItems([
          { ingredientName: '香菇', quantity: 6, unit: '朵', createIfMissing: true },
          { ingredientName: '薑', quantity: 4, unit: '片', createIfMissing: true },
          { ingredientName: '白飯', quantity: 2, unit: '碗', createIfMissing: true },
          { ingredientName: '醬油', quantity: 1, unit: '大匙', createIfMissing: true },
        ], suggestionIngredients, people),
      },
      {
        name: '青蔥雞蛋拌飯',
        servings: people,
        roles: ['staple'],
        source: 'ai',
        reason: '用既有食材庫快速組合，可一鍵加入料理管理。',
        items: scaleSuggestedItems([
          { ingredientName: '青蔥', quantity: 2, unit: '根', createIfMissing: true },
          { ingredientName: '雞蛋', quantity: 2, unit: '顆', createIfMissing: true },
          { ingredientName: '白飯', quantity: 1, unit: '碗', createIfMissing: true },
          { ingredientName: '醬油', quantity: 1, unit: '小匙', createIfMissing: true },
        ], suggestionIngredients, people),
      },
    ],
  };
}

function buildDishFromInput(state, dishInput, id) {
  const dishName = String(dishInput?.name ?? '').trim();
  const inputItems = Array.isArray(dishInput?.items) ? dishInput.items : [];
  const servings = clampInteger(dishInput?.servings, 1, MAX_PEOPLE, 1);
  const roles = normalizeDishRoles(dishInput?.roles, dishName);

  if (!dishName) {
    throw new Error('料理名稱不可空白');
  }

  const items = inputItems.map((item) => {
    const rawName = String(item.ingredientName ?? '').trim();
    const quantity = Number(item.quantity);
    const unit = COMMON_UNITS.includes(item.unit) ? item.unit : '份';

    if (!rawName) {
      throw new Error('食材名稱不可空白');
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`${rawName} 的數量需大於 0`);
    }

    const match = findIngredientMatch(state.ingredients, rawName);
    if (match.ingredient && !item.forceCreate) {
      return { ingredientId: match.ingredient.id, quantity: roundQuantity(quantity), unit };
    }

    if (!item.createIfMissing) {
      throw new Error(`${rawName} 尚未存在於食材庫`);
    }

    const created = createIngredient(rawName, unit);
    state.ingredients.push(created);
    return { ingredientId: created.id, quantity: roundQuantity(quantity), unit };
  });

  if (items.length === 0) {
    throw new Error('至少需要一項食材');
  }

  return {
    id,
    name: dishName,
    servings,
    roles,
    items,
    source: dishInput.source ?? 'local',
  };
}

function buildIngredientFromInput(state, ingredientInput, id) {
  const name = String(ingredientInput?.name ?? '').trim();

  if (!name) {
    throw new Error('食材名稱不可空白');
  }

  const comparableIngredients = state.ingredients.filter((ingredient) => ingredient.id !== id);
  const match = findIngredientMatch(comparableIngredients, name);
  if (match.ingredient && match.type !== 'none') {
    throw new Error(`食材庫已存在相似食材：${match.ingredient.name}`);
  }

  return {
    id,
    name,
    aliases: splitAliases(ingredientInput.aliases),
    defaultUnit: COMMON_UNITS.includes(ingredientInput.defaultUnit) ? ingredientInput.defaultUnit : '份',
    units: normalizeIngredientUnits(ingredientInput.units, ingredientInput.defaultUnit),
    category: normalizeIngredientCategory(ingredientInput.category, ingredientInput.allowCustomCategory),
    scaleType: normalizeScaleType(ingredientInput.scaleType ?? inferScaleType(ingredientInput)),
  };
}

function scaleSuggestedItems(items, ingredients, people) {
  return items.map((item) => {
    const match = findIngredientMatch(ingredients, item.ingredientName);
    return {
      ...item,
      quantity: scaleIngredientQuantity(item.quantity, people, match.ingredient ?? { name: item.ingredientName }),
    };
  });
}

function createIngredient(rawName, unit) {
  const name = String(rawName).trim();
  return {
    id: `${slugify(name)}-${Date.now().toString(36)}`,
    name,
    aliases: [],
    defaultUnit: COMMON_UNITS.includes(unit) ? unit : '份',
    units: [COMMON_UNITS.includes(unit) ? unit : '份'],
    category: '其他',
    scaleType: inferScaleType({ name }),
  };
}

function similarity(left, right) {
  if (left === right) return 1;
  if (!left || !right) return 0;
  if (left.includes(right) || right.includes(left)) return Math.min(left.length, right.length) / Math.max(left.length, right.length);

  const distance = levenshtein(left, right);
  return 1 - distance / Math.max(left.length, right.length);
}

function levenshtein(left, right) {
  const rows = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let index = 0; index <= left.length; index += 1) rows[index][0] = index;
  for (let index = 0; index <= right.length; index += 1) rows[0][index] = index;

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost,
      );
    }
  }

  return rows[left.length][right.length];
}

function splitAliases(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value ?? '')
    .split(/[,\n，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  const normalized = normalizeIngredientName(value);
  const ascii = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii || `item-${Array.from(normalized).map((character) => character.charCodeAt(0).toString(36)).join('-')}`;
}

function uniqueId(base, existingIds) {
  const existing = new Set(existingIds);
  let id = base || 'item';
  let counter = 2;
  while (existing.has(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }
  return id;
}

function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeScaleType(value) {
  return SCALE_TYPES.some((item) => item.id === value) ? value : 'regular';
}

function normalizeIngredientUnits(units, defaultUnit) {
  const fallbackUnit = COMMON_UNITS.includes(defaultUnit) ? defaultUnit : '份';
  const normalizedUnits = (Array.isArray(units) ? units : [fallbackUnit])
    .map(String)
    .filter((unit) => COMMON_UNITS.includes(unit));
  const uniqueUnits = Array.from(new Set([fallbackUnit, ...normalizedUnits]));

  return uniqueUnits.length > 0 ? uniqueUnits : ['份'];
}

function normalizeDishRoles(roles, dishName = '') {
  const validRoles = new Set(DISH_ROLES.map((role) => role.id));
  const normalizedRoles = (Array.isArray(roles) ? roles : inferDishRoles(dishName))
    .map(String)
    .filter((role) => validRoles.has(role));

  return normalizedRoles.length > 0 ? Array.from(new Set(normalizedRoles)) : ['main'];
}

function inferDishRoles(dishName) {
  const name = String(dishName ?? '');

  if (/飯|麵|粥|米|地瓜|馬鈴薯|主食/.test(name)) return ['staple'];
  if (/湯|羹|鍋/.test(name)) return ['soup'];
  if (/甜|蛋糕|布丁|水果|果凍|點心/.test(name)) return ['dessert'];
  if (/茶|飲|汁|奶|咖啡|豆漿/.test(name)) return ['drink'];
  if (/青菜|高麗菜|花椰|蔬|菇|水果/.test(name)) return ['vegetable'];
  if (/小菜|泡菜|涼拌/.test(name)) return ['side'];

  return ['main'];
}

function buildMealSlots(state, template, people, dayIndex, mealIndex) {
  return template.slots.map((slot, slotIndex) => {
    const candidates = state.dishes.filter((dish) => normalizeDishRoles(dish.roles, dish.name).includes(slot.role));
    const count = Math.min(slot.max, candidates.length);
    const selectedDishes = Array.from({ length: count }, (_, index) => {
      const dish = candidates[(dayIndex + mealIndex + slotIndex + index) % candidates.length];
      return dishToDisplay(scaleDishForPeople(dish, state.ingredients, people), state.ingredients);
    });

    return {
      ...slot,
      selectedDishes,
      missingCount: Math.max(0, slot.min - selectedDishes.length),
    };
  });
}

function inferScaleType(item) {
  const text = `${item.name ?? ''} ${item.category ?? ''}`;

  if (/醬油|鹽|魚露|味噌|豆瓣醬|蠔油|鹹|調味料/.test(text)) return 'salty';
  if (/胡椒|辣椒|辣粉|咖哩|五香|花椒|孜然|肉桂|丁香|八角|香料/.test(text)) return 'strong-spice';
  if (/蔥|蒜|薑|洋蔥|辛香/.test(text)) return 'aromatic';
  if (/油|奶油|豬油|橄欖油|麻油|香油/.test(text)) return 'oil';
  if (/水|高湯|湯|牛奶|醬汁|滷汁/.test(text)) return 'liquid';

  return 'regular';
}

function roundQuantity(value) {
  return Number.parseFloat(Number(value).toFixed(2));
}

function cloneState(state) {
  return importState(state);
}

function touch(state) {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
