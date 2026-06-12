import { wastewaterSavedController } from './controller.js';

export function createWastewaterViewModel(s = {}, r = {}) {
  return {
    state: s,
    result: r,
    savedRecordsHtml: wastewaterSavedController.renderCard(s)
  };
}

export default createWastewaterViewModel;
