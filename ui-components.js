/**
 * TechCalc Pro — UI Components Library
 * Phase 1: Design System Implementation
 * 
 * Component rendering functions (HTML only, no DOM manipulation)
 * Follows design-system.md specifications
 */

const UI = {
  
  /* ====================================
     HELPER FUNCTIONS
     ==================================== */
  
  /**
   * Format number with decimal places
   * @param {number} value - Value to format
   * @param {number} decimals - Number of decimal places (default: 2)
   * @param {string} unit - Optional unit
   * @returns {string} Formatted number
   */
  fmt(value, decimals = 2, unit = '') {
    if (value === null || value === undefined || isNaN(value)) {
      return '–' + (unit ? ' ' + unit : '');
    }
    
    const formatted = Number(value).toFixed(decimals);
    return formatted + (unit ? ' ' + unit : '');
  },
  
  /**
   * Parse string to number (safe)
   * @param {string} str - String to parse
   * @returns {number} Parsed number or 0
   */
  parseNum(str) {
    const num = parseFloat(String(str).replace(/,/, '.'));
    return isNaN(num) ? 0 : num;
  },
  
  /**
   * Determine status color based on value/max ratio
   * @param {number} value - Actual value
   * @param {number} max - Maximum value
   * @returns {string} CSS class name (ok, warn, danger)
   */
  colorForValue(value, max) {
    const ratio = value / max;
    if (ratio <= 0.6) return 'ok';
    if (ratio <= 0.9) return 'warn';
    return 'danger';
  },
  
  /**
   * Escape HTML special characters (XSS protection)
   * @param {string} html - HTML string
   * @returns {string} Escaped string
   */
  escape(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },
  
  /* ====================================
     COMPONENT FUNCTIONS
     ==================================== */
  
  /**
   * Glass Card Container
   * @param {string} content - Inner HTML
   * @param {string} variant - 'neutral' | 'heat' | 'cold'
   * @returns {string} HTML
   */
  Card(content, variant = 'neutral') {
    const variantClass = variant === 'heat' ? 'gc-h'
                       : variant === 'cold' ? 'gc-c' : '';
    return `<div class="gc ${variantClass}">${content}</div>`;
  },
  
  /**
   * Input Group (Label + Input + Unit)
   * @param {string} label - Label text (e.g., "Volumenstrom")
   * @param {string} id - HTML id attribute
   * @param {object} options - Configuration
   * @returns {string} HTML
   */
  InputGroup(label, id, options = {}) {
    const {
      unit = '',
      placeholder = '',
      value = '',
      type = 'number',
      min = null,
      max = null,
      step = 'any',
      onChange = null,
    } = options;
    
    const minAttr = min !== null ? `min="${min}"` : '';
    const maxAttr = max !== null ? `max="${max}"` : '';
    const onChangeAttr = onChange ? `data-change="${onChange}"` : '';
    
    return `
      <div class="input-group">
        <label class="input-group__label" for="${id}">${this.escape(label)}</label>
        <div class="input-group__wrapper">
          <input
            type="${type}"
            id="${id}"
            class="input-group__input"
            placeholder="${this.escape(placeholder)}"
            value="${this.escape(String(value))}"
            ${minAttr}
            ${maxAttr}
            step="${step}"
            ${onChangeAttr}
          >
          ${unit ? `<span class="input-group__unit">${this.escape(unit)}</span>` : ''}
        </div>
      </div>
    `;
  },
  
  /**
   * Mode Buttons (3-button switcher)
   * @param {string[]} modes - Button labels (e.g., ['ṁ', 'Q', 'ΔT'])
   * @param {number} activeIndex - Index of active button
   * @param {string} dataAttr - Data attribute for tracking (optional)
   * @returns {string} HTML
   */
  ModeButtons(modes, activeIndex = 0, dataAttr = '') {
    const dataStr = dataAttr ? `data-mode-group="${dataAttr}"` : '';
    
    return `
      <div class="mode-buttons" ${dataStr}>
        ${modes.map((mode, i) => `
          <button 
            class="mode-btn ${i === activeIndex ? 'active' : ''}"
            data-mode-index="${i}"
          >
            ${this.escape(mode)}
          </button>
        `).join('')}
      </div>
    `;
  },
  
  /**
   * Result Card (Label + Large Value + Unit + optional Progress Bar)
   * @param {string} label - Label text
   * @param {number} value - Numeric value
   * @param {string} unit - Unit text
   * @param {object} options - Configuration
   * @returns {string} HTML
   */
  ResultCard(label, value, unit = '', options = {}) {
    const {
      progress = null,  // 0-100 for bar fill
      status = 'ok',    // 'ok', 'warn', 'danger'
      expandable = false,
      expandContent = '',
    } = options;
    
    const statusClass = status ? `result-card--${status}` : '';
    const expandClass = expandable ? 'expandable' : '';
    const progressHtml = progress !== null
      ? `<div class="result-bar">
           <div class="result-bar-fill" style="width: ${Math.min(100, Math.max(0, progress))}%"></div>
         </div>`
      : '';
    
    const expandHtml = expandable
      ? `<span class="result-card__toggle">−</span>
         <div class="result-card__content">${expandContent}</div>`
      : '';
    
    return `
      <div class="result-card ${statusClass} ${expandClass}">
        <div class="result-label">${this.escape(label)}</div>
        <div class="result-value">
          ${this.fmt(value, 1)}
          ${unit ? `<span class="unit">${this.escape(unit)}</span>` : ''}
        </div>
        ${progressHtml}
        ${expandHtml}
      </div>
    `;
  },
  
  /**
   * State Box (T, φ, x, h grid)
   * @param {string} title - Section title
   * @param {object} state - State object {T, phi, x, h}
   * @param {string} variant - 'neutral' | 'heat' | 'cold'
   * @returns {string} HTML
   */
  StateBox(title, state = {}, variant = 'neutral') {
    const variantClass = variant ? `state-box--${variant}` : '';
    const {
      T = null,
      phi = null,
      x = null,
      h = null,
    } = state;
    
    return `
      <div class="state-box ${variantClass}">
        <div class="state-box__title">${this.escape(title)}</div>
        <div class="state-box__grid">
          <div class="state-box__item">
            <div class="state-box__label">T [°C]</div>
            <div class="state-box__value">${this.fmt(T, 1)}</div>
          </div>
          <div class="state-box__item">
            <div class="state-box__label">φ [%]</div>
            <div class="state-box__value">${this.fmt(phi, 1)}</div>
          </div>
          <div class="state-box__item">
            <div class="state-box__label">x [g/kg]</div>
            <div class="state-box__value state-box__value--secondary">${this.fmt(x, 2)}</div>
          </div>
          <div class="state-box__item">
            <div class="state-box__label">h [kJ/kg]</div>
            <div class="state-box__value state-box__value--secondary">${this.fmt(h, 1)}</div>
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Section Title
   * @param {string} text - Title text
   * @param {string} variant - 'neutral' | 'heat' | 'cold'
   * @returns {string} HTML
   */
  SectionTitle(text, variant = 'neutral') {
    const variantClass = variant ? `section-title--${variant}` : '';
    return `<div class="section-title ${variantClass}">${this.escape(text)}</div>`;
  },
  
  /**
   * Unit Converter
   * @param {object} options - Configuration
   * @returns {string} HTML
   */
  UnitConverter(options = {}) {
    const {
      inputValue = '',
      inputUnit = '',
      outputValue = '',
      outputUnit = '',
      conversions = {}, // All unit conversion results
      onSwap = null,
    } = options;
    
    const onSwapAttr = onSwap ? `data-swap="${onSwap}"` : '';
    
    const conversionRows = Object.entries(conversions)
      .map(([unit, value]) => {
        const isSource = unit === inputUnit;
        const isTarget = unit === outputUnit;
        const rowClass = isSource ? 'source' : isTarget ? 'target' : '';
        
        return `
          <div class="unit-converter__row unit-converter__row--${rowClass}">
            <span class="unit-converter__unit">${this.escape(unit)}</span>
            <span class="unit-converter__value">${this.fmt(value, 3)}</span>
          </div>
        `;
      })
      .join('');
    
    return `
      <div class="unit-converter">
        <div class="unit-converter__io">
          <div>
            <input class="input-group__input" type="number" value="${this.escape(String(inputValue))}" placeholder="0">
            <span class="unit-converter__unit">${this.escape(inputUnit)}</span>
          </div>
          <button class="unit-converter__toggle" ${onSwapAttr}>⇅</button>
        </div>
        <div class="unit-converter__io">
          <div>
            <input class="input-group__input" type="number" value="${this.escape(String(outputValue))}" placeholder="0" readonly>
            <span class="unit-converter__unit">${this.escape(outputUnit)}</span>
          </div>
        </div>
        <div class="unit-converter__table">
          ${conversionRows}
        </div>
      </div>
    `;
  },
  
  /**
   * List Management (Add, Edit, Delete items)
   * @param {array} items - List of items [{name, spec, id}]
   * @param {object} callbacks - {onAdd, onEdit, onDelete}
   * @returns {string} HTML
   */
  ListManagement(items = [], callbacks = {}) {
    const { onAdd = null, onEdit = null, onDelete = null } = callbacks;
    
    const onAddAttr = onAdd ? `data-action="add"` : '';
    
    const itemsHtml = items
      .map((item, i) => {
        const onEditAttr = onEdit ? `data-action="edit" data-index="${i}"` : '';
        const onDeleteAttr = onDelete ? `data-action="delete" data-index="${i}"` : '';
        
        return `
          <div class="list-management__item">
            <div class="list-management__info">
              <div class="list-management__name">${this.escape(item.name || 'Item ' + (i+1))}</div>
              ${item.spec ? `<div class="list-management__spec">${this.escape(item.spec)}</div>` : ''}
            </div>
            <div class="list-management__actions">
              ${onEdit ? `<button class="list-management__btn" ${onEditAttr}>Bearbeiten</button>` : ''}
              ${onDelete ? `<button class="list-management__btn list-management__btn--delete" ${onDeleteAttr}>Löschen</button>` : ''}
            </div>
          </div>
        `;
      })
      .join('');
    
    return `
      <div class="list-management">
        ${onAdd ? `<button class="list-management__add-btn" ${onAddAttr}>+ Eintrag hinzufügen</button>` : ''}
        <div>
          ${itemsHtml}
        </div>
      </div>
    `;
  },
  
  /**
   * Fixture List (Count inputs for fixtures)
   * @param {array} fixtures - List of fixtures [{name, specs, count}]
   * @param {string} onChangeAttr - Data attribute for change tracking
   * @returns {string} HTML
   */
  FixtureList(fixtures = [], onChangeAttr = '') {
    const itemsHtml = fixtures
      .map((fixture, i) => {
        const onChangeStr = onChangeAttr ? `data-fixture-index="${i}"` : '';
        
        return `
          <div class="fixture-list__item">
            <div class="fixture-list__label">
              <div class="fixture-list__name">${this.escape(fixture.name || 'Fixture')}</div>
              ${fixture.specs ? `<div class="fixture-list__specs">${this.escape(fixture.specs)}</div>` : ''}
            </div>
            <input
              type="number"
              class="fixture-list__input"
              value="${fixture.count || 0}"
              min="0"
              step="1"
              ${onChangeStr}
            >
          </div>
        `;
      })
      .join('');
    
    return `<div class="fixture-list">${itemsHtml}</div>`;
  },
  
  /**
   * Action Buttons (Primary + Danger pair)
   * @param {object} actions - {primary: text, danger: text}
   * @returns {string} HTML
   */
  ActionButtons(actions = {}) {
    const { primary = null, danger = null } = actions;
    
    return `
      <div class="action-buttons">
        ${primary ? `<button class="action-btn action-btn--primary">${this.escape(primary)}</button>` : ''}
        ${danger ? `<button class="action-btn action-btn--danger">${this.escape(danger)}</button>` : ''}
      </div>
    `;
  },
  
  /**
   * Info Box (Expandable text)
   * @param {string} title - Title text
   * @param {string} content - Content text (expanded)
   * @returns {string} HTML
   */
  InfoBox(title, content = '') {
    const contentHtml = content
      ? `<div class="info-box__content">${this.escape(content)}</div>`
      : '';
    
    return `
      <div class="info-box">
        <div class="info-box__header">
          <span class="info-box__icon">▶</span>
          <span class="info-box__title">${this.escape(title)}</span>
        </div>
        ${contentHtml}
      </div>
    `;
  },
  
  /**
   * Header Menu (Slide-out menu)
   * @param {array} sections - Menu sections
   * @returns {string} HTML
   */
  HeaderMenu(sections = []) {
    const sectionsHtml = sections
      .map(section => {
        const itemsHtml = (section.items || [])
          .map(item => `
            <div class="menu-item" data-action="${item.action || ''}">
              <div class="menu-item__label">
                <div class="menu-item__title">${this.escape(item.title)}</div>
                ${item.subtitle ? `<div class="menu-item__sub">${this.escape(item.subtitle)}</div>` : ''}
              </div>
              ${item.value ? `<span>${this.escape(item.value)}</span>` : ''}
            </div>
          `)
          .join('');
        
        return `
          <div class="menu-section">
            ${section.title ? `<div class="menu-section__title">${this.escape(section.title)}</div>` : ''}
            ${itemsHtml}
          </div>
        `;
      })
      .join('');
    
    return `
      <div class="header-menu">
        <button class="header-menu__close">×</button>
        ${sectionsHtml}
      </div>
      <div class="header-menu__overlay"></div>
    `;
  },
  
  /**
   * Segmented Control (Dark/Light/System selector)
   * @param {string[]} options - Option labels
   * @param {number} activeIndex - Active option index
   * @param {string} name - Input name attribute
   * @returns {string} HTML
   */
  SegmentControl(options = ['Dark', 'Light', 'System'], activeIndex = 0, name = '') {
    return `
      <div class="segment-control" ${name ? `data-name="${name}"` : ''}>
        ${options.map((opt, i) => `
          <button
            type="button"
            class="segment-control__btn ${i === activeIndex ? 'active' : ''}"
            data-value="${i}"
          >
            ${this.escape(opt)}
          </button>
        `).join('')}
      </div>
    `;
  },
  
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UI;
}
