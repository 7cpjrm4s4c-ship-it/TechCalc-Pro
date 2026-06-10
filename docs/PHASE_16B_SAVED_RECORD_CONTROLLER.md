# Phase 16B – Saved Record Controller

Phase 16B starts the extraction of save/update/select/delete/accordion workflows from module code into a central controller.

## New central contract

Modules should not own saved-record interaction behavior. A module may still define the domain snapshot/hydration functions, but the platform owns:

- save button handling
- update button handling
- select/load handling
- delete handling
- accordion toggle binding
- edit mode clear behavior
- scroll-safe action handling

The central entry point is:

```js
bindSavedRecordWorkflow(root, {
  state,
  calculate,
  snapshot,
  hydrate,
  clear,
  listKey,
  activeIdKey,
  nameKey,
  saveSelector,
  updateSelector,
  loadAttr,
  toggleAttr,
  deleteAttr
});
```

## Migration rule

During the remaining module migrations, direct module-owned listeners for saved records should be replaced by the central controller. Modules keep only domain-specific mapping functions:

- `snapshot(current, result)`
- `hydrate(record, currentState)`
- `clear(currentState)`

This keeps UX behavior consistent with the reference modules and avoids duplicate touch/click/save handlers.
