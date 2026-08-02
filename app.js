import {
  COMMON_UNITS,
  DISH_ROLES,
  INGREDIENT_CATEGORIES,
  MEAL_TEMPLATES,
  SCALE_TYPES,
  addDish,
  addIngredient,
  createInitialState,
  dishToDisplay,
  exportState,
  findIngredientMatch,
  generateLocalRecommendation,
  groupDishesByRole,
  importState,
  removeDish,
  removeIngredient,
  scaleDishForPeople,
  summarizePlanIngredients,
  updateDish,
  updateIngredient,
} from './data.js';

const STORAGE_KEY = 'cooking-manager-state-v1';

const elements = {
  tabs: document.querySelectorAll('.tab'),
  panels: document.querySelectorAll('.panel'),
  updatedAt: document.querySelector('#updatedAt'),
  stats: document.querySelector('#stats'),
  dishForm: document.querySelector('#dishForm'),
  dishName: document.querySelector('#dishName'),
  dishServings: document.querySelector('#dishServings'),
  dishRoles: document.querySelector('#dishRoles'),
  ingredientLines: document.querySelector('#ingredientLines'),
  addLine: document.querySelector('#addLine'),
  saveDishButton: document.querySelector('#saveDishButton'),
  cancelDishEdit: document.querySelector('#cancelDishEdit'),
  dishSearch: document.querySelector('#dishSearch'),
  dishList: document.querySelector('#dishList'),
  ingredientForm: document.querySelector('#ingredientForm'),
  ingredientName: document.querySelector('#ingredientName'),
  ingredientAliases: document.querySelector('#ingredientAliases'),
  ingredientCategory: document.querySelector('#ingredientCategory'),
  customCategoryWrap: document.querySelector('#customCategoryWrap'),
  customCategory: document.querySelector('#customCategory'),
  ingredientUnit: document.querySelector('#ingredientUnit'),
  ingredientUnits: document.querySelector('#ingredientUnits'),
  ingredientScaleType: document.querySelector('#ingredientScaleType'),
  saveIngredientButton: document.querySelector('#saveIngredientButton'),
  cancelIngredientEdit: document.querySelector('#cancelIngredientEdit'),
  ingredientTable: document.querySelector('#ingredientTable'),
  recommendationForm: document.querySelector('#recommendationForm'),
  planDays: document.querySelector('#planDays'),
  planPeople: document.querySelector('#planPeople'),
  mealTemplate: document.querySelector('#mealTemplate'),
  preferences: document.querySelector('#preferences'),
  recommendationOutput: document.querySelector('#recommendationOutput'),
  exportJson: document.querySelector('#exportJson'),
  downloadJson: document.querySelector('#downloadJson'),
  importJson: document.querySelector('#importJson'),
  jsonText: document.querySelector('#jsonText'),
  jsonFile: document.querySelector('#jsonFile'),
  resetData: document.querySelector('#resetData'),
  toast: document.querySelector('#toast'),
};

let state = loadState();
let lastRecommendation = null;
let editingDishId = null;
let expandedDishId = null;
let editingIngredientId = null;

initialize();

function initialize() {
  renderDishRoleOptions();
  renderUnitOptions();
  renderCategoryOptions();
  renderScaleTypeOptions();
  renderMealTemplateOptions();
  bindEvents();
  addIngredientLine();
  render();
}

function bindEvents() {
  elements.tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  elements.addLine.addEventListener('click', () => addIngredientLine());
  elements.dishForm.addEventListener('submit', handleDishSubmit);
  elements.cancelDishEdit.addEventListener('click', clearDishForm);
  elements.dishSearch.addEventListener('input', renderDishes);
  elements.ingredientCategory.addEventListener('change', handleCategoryChange);
  elements.ingredientUnit.addEventListener('change', syncDefaultUnitCheckbox);
  elements.ingredientForm.addEventListener('submit', handleIngredientSubmit);
  elements.cancelIngredientEdit.addEventListener('click', clearIngredientForm);
  elements.recommendationForm.addEventListener('submit', handleRecommendationSubmit);
  elements.exportJson.addEventListener('click', updateJsonText);
  elements.downloadJson.addEventListener('click', downloadJson);
  elements.importJson.addEventListener('click', importFromText);
  elements.jsonFile.addEventListener('change', importFromFile);
  elements.resetData.addEventListener('click', resetData);
}

function render() {
  saveState();
  renderStats();
  renderDishes();
  renderIngredients();
  updateJsonText();
}

function renderStats() {
  elements.updatedAt.textContent = `更新：${formatDate(state.updatedAt)}`;
  elements.stats.innerHTML = [
    statTemplate('料理', state.dishes.length),
    statTemplate('食材', state.ingredients.length),
    statTemplate('單位', COMMON_UNITS.length),
  ].join('');
}

function renderDishes() {
  const keyword = elements.dishSearch.value.trim();
  const dishes = state.dishes.filter((dish) => dishMatchesKeyword(dish, keyword));

  if (state.dishes.length === 0) {
    elements.dishList.innerHTML = '<p class="muted">尚未建立料理。</p>';
    return;
  }

  if (dishes.length === 0) {
    elements.dishList.innerHTML = '<p class="muted">沒有符合關鍵字的料理。</p>';
    return;
  }

  elements.dishList.innerHTML = groupDishesByRole(dishes)
    .map((group) => `
      <section class="dish-role-section">
        <div class="role-section-head">
          <h3>${escapeHtml(group.label)}</h3>
          <span>${group.dishes.length} 道</span>
        </div>
        <div class="list-grid">
          ${group.dishes.map((dish) => dishCardTemplate(dish)).join('')}
        </div>
      </section>
    `)
    .join('');

  elements.dishList.querySelectorAll('[data-toggle-dish]').forEach((button) => {
    button.addEventListener('click', () => {
      expandedDishId = expandedDishId === button.dataset.toggleDish ? null : button.dataset.toggleDish;
      renderDishes();
    });
  });

  elements.dishList.querySelectorAll('[data-edit-dish]').forEach((button) => {
    button.addEventListener('click', () => startDishEdit(button.dataset.editDish));
  });

  elements.dishList.querySelectorAll('[data-remove-dish]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('確定要刪除這道料理？')) return;
      state = removeDish(state, button.dataset.removeDish);
      if (editingDishId === button.dataset.removeDish) clearDishForm();
      render();
      showToast('已刪除料理');
    });
  });
}

function dishCardTemplate(dish) {
  const displayDish = dishToDisplay(dish, state.ingredients);
  const isExpanded = expandedDishId === displayDish.id;
  const tags = displayDish.items
    .map((item) => `<span class="tag">${escapeHtml(item.ingredientName)} ${item.quantity}${escapeHtml(item.unit)} · ${escapeHtml(scaleTypeLabel(item.scaleType))}</span>`)
    .join('');
  const roleTags = displayDish.roles
    .map((role) => `<span class="tag role-tag">${escapeHtml(dishRoleLabel(role))}</span>`)
    .join('');

  return `
    <article class="item-card dish-card ${isExpanded ? 'is-expanded' : ''}">
      <button class="dish-summary" data-toggle-dish="${escapeHtml(displayDish.id)}" type="button" aria-expanded="${isExpanded}">
        <span>
          <strong>${escapeHtml(displayDish.name)}</strong>
          <small>${displayDish.servings} 人份基準 · ${displayDish.items.length} 項食材</small>
        </span>
        <span class="chevron">${isExpanded ? '收合' : '展開'}</span>
      </button>
      <div class="dish-detail">
        <div class="tag-list">${roleTags}</div>
        <div class="tag-list">${tags}</div>
        <div class="form-actions">
          <button class="secondary" data-edit-dish="${escapeHtml(displayDish.id)}" type="button">調整</button>
          <button class="danger" data-remove-dish="${escapeHtml(displayDish.id)}" type="button">刪除</button>
        </div>
      </div>
    </article>
  `;
}

function renderIngredients() {
  elements.ingredientTable.innerHTML = state.ingredients
    .map((ingredient) => {
      const usedCount = state.dishes.filter((dish) => dish.items.some((item) => item.ingredientId === ingredient.id)).length;
      return `
        <tr>
          <td><strong>${escapeHtml(ingredient.name)}</strong></td>
          <td>${escapeHtml(ingredient.aliases.join('、') || '-')}</td>
          <td>${escapeHtml(ingredient.category)}</td>
          <td>${escapeHtml(ingredient.defaultUnit)}</td>
          <td>${escapeHtml((ingredient.units ?? [ingredient.defaultUnit]).join('、'))}</td>
          <td>${escapeHtml(scaleTypeLabel(ingredient.scaleType))}</td>
          <td>
            <button class="secondary" data-edit-ingredient="${escapeHtml(ingredient.id)}" type="button">編輯</button>
            <button class="danger" data-remove-ingredient="${escapeHtml(ingredient.id)}" data-used-count="${usedCount}" type="button">
              刪除
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  elements.ingredientTable.querySelectorAll('[data-edit-ingredient]').forEach((button) => {
    button.addEventListener('click', () => startIngredientEdit(button.dataset.editIngredient));
  });

  elements.ingredientTable.querySelectorAll('[data-remove-ingredient]').forEach((button) => {
    button.addEventListener('click', () => {
      const usedCount = Number(button.dataset.usedCount || 0);
      const confirmMessage = usedCount > 0
        ? `此食材已被 ${usedCount} 道料理使用，刪除後會同步從那些料理移除。確定刪除？`
        : '確定要刪除這個食材？';
      if (!window.confirm(confirmMessage)) return;

      try {
        state = removeIngredient(state, button.dataset.removeIngredient);
        render();
        showToast('已刪除食材');
      } catch (error) {
        showToast(error.message);
      }
    });
  });
}

async function handleDishSubmit(event) {
  event.preventDefault();

  const items = [];
  for (const line of elements.ingredientLines.querySelectorAll('.ingredient-line')) {
    const ingredientName = line.querySelector('[name="ingredientName"]').value.trim();
    const quantity = line.querySelector('[name="quantity"]').value;
    const unit = line.querySelector('[name="unit"]').value;

    if (!ingredientName) continue;

    const match = findIngredientMatch(state.ingredients, ingredientName);
    let finalName = ingredientName;
    let createIfMissing = false;

    if (match.type === 'similar') {
      const useMatch = window.confirm(`你輸入「${ingredientName}」，是否是指「${match.ingredient.name}」？`);
      if (useMatch) finalName = match.ingredient.name;
      if (!useMatch) createIfMissing = window.confirm(`要將「${ingredientName}」新增為新食材嗎？`);
    } else if (match.type === 'none') {
      createIfMissing = window.confirm(`食材庫沒有「${ingredientName}」，要新增為新食材嗎？`);
    }

    if ((match.type === 'none' || match.type === 'similar') && finalName === ingredientName && !createIfMissing) {
      showToast(`已取消新增「${ingredientName}」`);
      return;
    }

    items.push({ ingredientName: finalName, quantity, unit, createIfMissing, forceCreate: createIfMissing && finalName === ingredientName });
  }

  try {
    const dishInput = {
      name: elements.dishName.value,
      servings: elements.dishServings.value,
      roles: selectedDishRoles(),
      items,
    };
    state = editingDishId ? updateDish(state, editingDishId, dishInput) : addDish(state, dishInput);
    const message = editingDishId ? '已更新料理' : '已儲存料理';
    clearDishForm();
    render();
    showToast(message);
  } catch (error) {
    showToast(error.message);
  }
}

function handleIngredientSubmit(event) {
  event.preventDefault();

  try {
    const ingredientInput = {
      name: elements.ingredientName.value,
      aliases: elements.ingredientAliases.value,
      category: elements.ingredientCategory.value === '__custom__' ? elements.customCategory.value : elements.ingredientCategory.value,
      allowCustomCategory: elements.ingredientCategory.value === '__custom__',
      defaultUnit: elements.ingredientUnit.value,
      units: selectedIngredientUnits(),
      scaleType: elements.ingredientScaleType.value,
    };
    state = editingIngredientId ? updateIngredient(state, editingIngredientId, ingredientInput) : addIngredient(state, ingredientInput);
    const message = editingIngredientId ? '已更新食材' : '已新增食材';
    clearIngredientForm();
    render();
    showToast(message);
  } catch (error) {
    showToast(error.message);
  }
}

function handleRecommendationSubmit(event) {
  event.preventDefault();
  const meals = Array.from(document.querySelectorAll('[name="meal"]:checked')).map((input) => input.value);
  lastRecommendation = generateLocalRecommendation(state, {
    days: elements.planDays.value,
    people: elements.planPeople.value,
    meals,
    templateId: elements.mealTemplate.value,
    preferences: elements.preferences.value,
  });
  renderRecommendation(lastRecommendation);
}

function renderRecommendation(recommendation) {
  const days = recommendation.days
    .map(
      (day, dayIndex) => `
        <article class="plan-day">
          <h3>第 ${day.day} 天</h3>
          ${day.meals
            .map(
              (meal, mealIndex) => `
                <div class="meal-block ${mealToneClass(meal.meal)}">
                  <strong>${escapeHtml(meal.meal)} · ${escapeHtml(meal.templateName)}</strong>
                  <div class="meal-slots">
                    ${meal.slots.map((slot, slotIndex) => slotTemplate(slot, dayIndex, mealIndex, slotIndex)).join('')}
                  </div>
                </div>
              `,
            )
            .join('')}
        </article>
      `,
    )
    .join('');

  const suggestions = recommendation.internetSuggestions
    .map(
      (dish, index) => `
        <article class="item-card">
          <h3>${escapeHtml(dish.name)}</h3>
          <p class="muted">${escapeHtml(dish.reason)}</p>
          <div class="tag-list">
            ${dish.items.map((item) => `<span class="tag">${escapeHtml(item.ingredientName)} ${item.quantity}${escapeHtml(item.unit)}</span>`).join('')}
          </div>
          <button data-add-suggestion="${index}" type="button">加入料理管理</button>
        </article>
      `,
    )
    .join('');

  const ingredientSummary = summarizePlanIngredients(recommendation);
  const shoppingList = ingredientSummary.length
    ? `
      <section class="shopping-list">
        <div class="slot-head">
          <h3>食材清單</h3>
          <span>依目前手動調整結果彙總</span>
        </div>
        <div class="table-wrap shopping-table">
          <table>
            <thead>
              <tr>
                <th>食材</th>
                <th>數量</th>
                <th>單位</th>
              </tr>
            </thead>
            <tbody>
              ${ingredientSummary
                .map(
                  (item) => `
                    <tr>
                      <td>${escapeHtml(item.ingredientName)}</td>
                      <td class="quantity-cell">${item.quantity}</td>
                      <td>${escapeHtml(item.unit)}</td>
                    </tr>
                  `,
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>
    `
    : '';

  elements.recommendationOutput.innerHTML = `
    <p class="muted">份量以 ${recommendation.people} 人計算；套餐會依料理角色組合，缺少的角色會標示待補。</p>
    ${recommendation.bulkCookingNotice ? '<p class="notice">超過 20 人份時，鍋具大小、分批烹調與蒸發量會明顯影響味道；調味料已保守縮放，出鍋前請分批試味調整。</p>' : ''}
    <div class="list-grid">${days}</div>
    ${shoppingList}
    <div class="list-grid">${suggestions}</div>
  `;

  elements.recommendationOutput.querySelectorAll('[data-plan-select]').forEach((select) => {
    select.addEventListener('change', handlePlanDishChange);
  });

  elements.recommendationOutput.querySelectorAll('[data-add-suggestion]').forEach((button) => {
    button.addEventListener('click', () => {
      const dish = lastRecommendation.internetSuggestions[Number(button.dataset.addSuggestion)];
      try {
        state = addDish(state, dish);
        render();
        renderRecommendation(lastRecommendation);
        showToast(`已加入「${dish.name}」`);
      } catch (error) {
        showToast(error.message);
      }
    });
  });
}

function slotTemplate(slot, dayIndex, mealIndex, slotIndex) {
  const choices = Array.from({ length: slot.max }, (_, dishIndex) => {
    const selectedDish = slot.selectedDishes[dishIndex];
    const dishDetail = selectedDish ? selectedDishTemplate(selectedDish) : '<p class="muted">可留空或改選料理。</p>';

    return `
      <div class="slot-choice">
        <label for="planDish-${dayIndex}-${mealIndex}-${slotIndex}-${dishIndex}">第 ${dishIndex + 1} 道</label>
        <select
          id="planDish-${dayIndex}-${mealIndex}-${slotIndex}-${dishIndex}"
          data-plan-select
          data-day-index="${dayIndex}"
          data-meal-index="${mealIndex}"
          data-slot-index="${slotIndex}"
          data-dish-index="${dishIndex}"
        >
          ${dishOptionsForRole(slot.role, selectedDish?.id)}
        </select>
        ${dishDetail}
      </div>
    `;
  }).join('');
  const missing = slot.missingCount > 0 ? `<p class="muted">尚缺 ${slot.missingCount} 道${escapeHtml(slot.label)}</p>` : '';

  return `
    <section class="meal-slot">
      <div class="slot-head">
        <strong>${escapeHtml(slot.label)}</strong>
        <span>${slot.min}${slot.min === slot.max ? '' : `-${slot.max}`} 道</span>
      </div>
      ${choices || '<p class="muted">尚無符合角色的料理。</p>'}
      ${missing}
    </section>
  `;
}

function selectedDishTemplate(dish) {
  return `
    <div class="slot-dish">
      <strong>${escapeHtml(dish.name)}</strong>
      <div class="tag-list">
        ${dish.items.map((item) => `<span class="tag">${escapeHtml(item.ingredientName)} ${item.quantity}${escapeHtml(item.unit)}</span>`).join('')}
      </div>
    </div>
  `;
}

function dishOptionsForRole(role, selectedDishId) {
  const options = state.dishes.filter((dish) => (dish.roles ?? []).includes(role));
  const optionMarkup = options
    .map((dish) => `<option value="${escapeHtml(dish.id)}" ${dish.id === selectedDishId ? 'selected' : ''}>${escapeHtml(dish.name)}</option>`)
    .join('');

  return `<option value="">未選</option>${optionMarkup}`;
}

function handlePlanDishChange(event) {
  if (!lastRecommendation) return;

  const select = event.currentTarget;
  const day = lastRecommendation.days[Number(select.dataset.dayIndex)];
  const meal = day?.meals?.[Number(select.dataset.mealIndex)];
  const slot = meal?.slots?.[Number(select.dataset.slotIndex)];
  if (!slot) return;

  const dishIndex = Number(select.dataset.dishIndex);
  const selectedDish = select.value ? state.dishes.find((dish) => dish.id === select.value) : null;
  const nextDishes = [...slot.selectedDishes];
  nextDishes[dishIndex] = selectedDish ? dishToDisplay(scaleDishForPeople(selectedDish, state.ingredients, lastRecommendation.people), state.ingredients) : null;
  slot.selectedDishes = nextDishes.filter(Boolean);
  slot.missingCount = Math.max(0, slot.min - slot.selectedDishes.length);

  renderRecommendation(lastRecommendation);
}

function mealToneClass(mealName) {
  if (mealName === '早餐') return 'meal-breakfast';
  if (mealName === '午餐') return 'meal-lunch';
  if (mealName === '晚餐') return 'meal-dinner';
  return 'meal-other';
}

function addIngredientLine(prefill = {}) {
  const row = document.createElement('div');
  row.className = 'ingredient-line';
  row.innerHTML = `
    <label>
      食材
      <input name="ingredientName" list="ingredientOptions" placeholder="雞蛋" required>
    </label>
    <label>
      數量
      <input name="quantity" min="0.01" step="0.01" type="number" value="1" required>
    </label>
    <label>
      單位
      <select name="unit">${COMMON_UNITS.map((unit) => `<option value="${unit}">${unit}</option>`).join('')}</select>
    </label>
    <button class="danger icon-button" type="button" title="移除食材列">×</button>
  `;
  row.querySelector('[name="ingredientName"]').addEventListener('input', () => setLineUnitOptions(row));
  row.querySelector('[name="ingredientName"]').addEventListener('change', () => setLineUnitOptions(row));
  row.querySelector('button').addEventListener('click', () => {
    if (elements.ingredientLines.children.length > 1) row.remove();
  });
  elements.ingredientLines.append(row);
  row.querySelector('[name="ingredientName"]').value = prefill.ingredientName ?? '';
  row.querySelector('[name="quantity"]').value = prefill.quantity ?? 1;
  setLineUnitOptions(row, prefill.unit ?? '顆');
  ensureIngredientDatalist();
}

function setLineUnitOptions(row, preferredUnit) {
  const ingredientName = row.querySelector('[name="ingredientName"]').value.trim();
  const unitSelect = row.querySelector('[name="unit"]');
  const units = unitsForIngredientName(ingredientName);
  const selectedUnit = units.includes(preferredUnit) ? preferredUnit : units[0];

  unitSelect.innerHTML = units.map((unit) => `<option value="${unit}">${unit}</option>`).join('');
  unitSelect.value = selectedUnit;
}

function unitsForIngredientName(ingredientName) {
  const match = findIngredientMatch(state.ingredients, ingredientName);
  if (match.ingredient?.units?.length) return match.ingredient.units;
  return COMMON_UNITS;
}

function startDishEdit(dishId) {
  const dish = state.dishes.find((item) => item.id === dishId);
  if (!dish) return;

  const displayDish = dishToDisplay(dish, state.ingredients);
  editingDishId = dishId;
  expandedDishId = dishId;
  elements.dishName.value = displayDish.name;
  elements.dishServings.value = displayDish.servings;
  setDishRoles(displayDish.roles);
  elements.ingredientLines.innerHTML = '';
  displayDish.items.forEach((item) => addIngredientLine(item));
  elements.saveDishButton.textContent = '更新料理';
  elements.cancelDishEdit.classList.remove('is-hidden');
  renderDishes();
  elements.dishForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearDishForm() {
  editingDishId = null;
  elements.dishForm.reset();
  elements.dishServings.value = 1;
  setDishRoles(['main']);
  elements.ingredientLines.innerHTML = '';
  addIngredientLine();
  elements.saveDishButton.textContent = '儲存料理';
  elements.cancelDishEdit.classList.add('is-hidden');
}

function startIngredientEdit(ingredientId) {
  const ingredient = state.ingredients.find((item) => item.id === ingredientId);
  if (!ingredient) return;

  editingIngredientId = ingredientId;
  elements.ingredientName.value = ingredient.name;
  elements.ingredientAliases.value = ingredient.aliases.join('、');
  setCategoryFormValue(ingredient.category);
  elements.ingredientUnit.value = ingredient.defaultUnit;
  setIngredientUnits(ingredient.units ?? [ingredient.defaultUnit]);
  elements.ingredientScaleType.value = ingredient.scaleType;
  elements.saveIngredientButton.textContent = '更新食材';
  elements.cancelIngredientEdit.classList.remove('is-hidden');
  elements.ingredientForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearIngredientForm() {
  editingIngredientId = null;
  elements.ingredientForm.reset();
  elements.ingredientCategory.value = '其他';
  handleCategoryChange();
  elements.ingredientUnit.value = '份';
  setIngredientUnits(['份']);
  elements.ingredientScaleType.value = 'regular';
  elements.saveIngredientButton.textContent = '新增食材';
  elements.cancelIngredientEdit.classList.add('is-hidden');
}

function setCategoryFormValue(category) {
  if (INGREDIENT_CATEGORIES.includes(category)) {
    elements.ingredientCategory.value = category;
    handleCategoryChange();
    return;
  }

  elements.ingredientCategory.value = '__custom__';
  handleCategoryChange();
  elements.customCategory.value = category;
}

function ensureIngredientDatalist() {
  let datalist = document.querySelector('#ingredientOptions');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'ingredientOptions';
    document.body.append(datalist);
  }
  datalist.innerHTML = state.ingredients.map((ingredient) => `<option value="${escapeHtml(ingredient.name)}"></option>`).join('');
}

function renderUnitOptions() {
  const options = COMMON_UNITS.map((unit) => `<option value="${unit}">${unit}</option>`).join('');
  elements.ingredientUnit.innerHTML = options;
  elements.ingredientUnit.value = '份';
  elements.ingredientUnits.innerHTML = COMMON_UNITS.map(
    (unit) => `
      <label class="check unit-check">
        <input name="ingredientUnits" type="checkbox" value="${unit}">
        ${unit}
      </label>
    `,
  ).join('');
  setIngredientUnits(['份']);
}

function renderDishRoleOptions() {
  elements.dishRoles.innerHTML = DISH_ROLES.map(
    (role) => `
      <label class="check unit-check">
        <input name="dishRoles" type="checkbox" value="${role.id}">
        ${role.label}
      </label>
    `,
  ).join('');
  setDishRoles(['main']);
}

function renderCategoryOptions() {
  const options = INGREDIENT_CATEGORIES.map((category) => `<option value="${category}">${category}</option>`).join('');
  elements.ingredientCategory.innerHTML = `${options}<option value="__custom__">新增分類...</option>`;
  elements.ingredientCategory.value = '其他';
  handleCategoryChange();
}

function renderMealTemplateOptions() {
  elements.mealTemplate.innerHTML = MEAL_TEMPLATES.map((template) => `<option value="${template.id}">${template.name}</option>`).join('');
  elements.mealTemplate.value = MEAL_TEMPLATES[0].id;
}

function renderScaleTypeOptions() {
  const options = SCALE_TYPES.map((type) => `<option value="${type.id}">${type.label}</option>`).join('');
  elements.ingredientScaleType.innerHTML = options;
  elements.ingredientScaleType.value = 'regular';
}

function handleCategoryChange() {
  const isCustom = elements.ingredientCategory.value === '__custom__';
  elements.customCategoryWrap.classList.toggle('is-hidden', !isCustom);
  elements.customCategory.required = isCustom;
  if (!isCustom) elements.customCategory.value = '';
}

function syncDefaultUnitCheckbox() {
  const defaultUnit = elements.ingredientUnit.value;
  const checkbox = elements.ingredientUnits.querySelector(`input[value="${CSS.escape(defaultUnit)}"]`);
  if (checkbox) checkbox.checked = true;
}

function selectedIngredientUnits() {
  const selected = Array.from(elements.ingredientUnits.querySelectorAll('input:checked')).map((input) => input.value);
  return Array.from(new Set([elements.ingredientUnit.value, ...selected]));
}

function setIngredientUnits(units) {
  const selected = new Set(units);
  elements.ingredientUnits.querySelectorAll('input').forEach((input) => {
    input.checked = selected.has(input.value);
  });
  syncDefaultUnitCheckbox();
}

function selectedDishRoles() {
  const selected = Array.from(elements.dishRoles.querySelectorAll('input:checked')).map((input) => input.value);
  return selected.length > 0 ? selected : ['main'];
}

function setDishRoles(roles) {
  const selected = new Set(roles?.length ? roles : ['main']);
  elements.dishRoles.querySelectorAll('input').forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function updateJsonText() {
  elements.jsonText.value = exportState(state);
}

function importFromText() {
  try {
    state = importState(elements.jsonText.value);
    render();
    showToast('JSON 匯入完成');
  } catch (error) {
    showToast(`匯入失敗：${error.message}`);
  }
}

async function importFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    state = importState(await file.text());
    render();
    showToast('JSON 檔案匯入完成');
  } catch (error) {
    showToast(`匯入失敗：${error.message}`);
  } finally {
    event.target.value = '';
  }
}

function downloadJson() {
  const blob = new Blob([exportState(state)], { type: 'application/json;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `cooking-manager-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function resetData() {
  if (!window.confirm('確定要重設為範例資料？目前瀏覽器內的資料會被覆蓋。')) return;
  state = createInitialState();
  render();
  showToast('已重設範例資料');
}

function switchTab(tabName) {
  elements.tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.tab === tabName));
  elements.panels.forEach((panel) => panel.classList.toggle('is-active', panel.id === `panel-${tabName}`));
}

function dishMatchesKeyword(dish, keyword) {
  if (!keyword) return true;

  const normalizedKeyword = keyword.toLowerCase();
  const displayDish = dishToDisplay(dish, state.ingredients);
  const haystack = [
    displayDish.name,
    ...displayDish.roles.map((role) => dishRoleLabel(role)),
    ...displayDish.items.map((item) => item.ingredientName),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedKeyword);
}

function loadState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? importState(saved) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, exportState(state));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove('is-visible');
  }, 2400);
}

function statTemplate(label, value) {
  return `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`;
}

function scaleTypeLabel(scaleType) {
  return SCALE_TYPES.find((type) => type.id === scaleType)?.label ?? '一般食材';
}

function dishRoleLabel(role) {
  return DISH_ROLES.find((item) => item.id === role)?.label ?? role;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
