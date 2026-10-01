import { test, expect } from '@playwright/test';

test('save/edit observer settles after selection changes and repeated synchronization', async ({ page }) => {
  await page.goto('/core/ux/saveEditModeSync.js');
  const result = await page.evaluate(async () => {
    const { initializeSaveEditModeSync, syncSaveEditMode } = await import('/core/ux/saveEditModeSync.js');
    const root = document.createElement('section');
    root.innerHTML = '<article class="card"><div class="saved-record-card"></div><div class="tc-save-actions"><button data-line-save>Speichern</button><button data-line-update>Aktualisieren</button></div></article>';
    document.body.append(root);
    let mutations = 0;
    const observer = new MutationObserver(records => { mutations += records.length; });
    observer.observe(root, { subtree: true, attributes: true });
    initializeSaveEditModeSync(root);
    const frames = async () => {
      for (let i = 0; i < 8; i += 1) await new Promise(resolve => requestAnimationFrame(resolve));
    };
    const state = () => [...root.querySelectorAll('button')].map(button => ({
      disabled: button.disabled, aria: button.getAttribute('aria-disabled')
    }));
    await frames();
    const create = state();
    let before = mutations;
    await frames();
    const idleCreate = mutations - before;
    root.querySelector('.saved-record-card').classList.add('is-active');
    await frames();
    const edit = state();
    before = mutations;
    syncSaveEditMode(root);
    syncSaveEditMode(root);
    await frames();
    const idleEdit = mutations - before;
    root.querySelector('.saved-record-card').classList.remove('is-active');
    await frames();
    const restored = state();
    observer.disconnect();
    return { create, edit, restored, idleCreate, idleEdit };
  });
  expect(result.create).toEqual([{ disabled: false, aria: 'false' }, { disabled: true, aria: 'true' }]);
  expect(result.edit).toEqual([{ disabled: true, aria: 'true' }, { disabled: false, aria: 'false' }]);
  expect(result.restored).toEqual(result.create);
  expect(result.idleCreate).toBe(0);
  expect(result.idleEdit).toBe(0);
});
