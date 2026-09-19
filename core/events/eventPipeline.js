import { handlePlatformFieldNavigation, isPlatformNavigationElement, preserveFocusDuring } from '../ux/focusManager.js';

import { markCommittedAction } from '../formActions.js';
const DEFAULT_INTERACTIVE_SELECTOR = '[data-field], input, select, textarea, button, a, summary, [role="button"], [data-line-card], [data-saved-record-card], .saved-record-card, .segmented, [data-tc-action]';
