export function calculate(currentState = {}) {
  return { quickSearch: String(currentState.quickSearch || '') };
}
