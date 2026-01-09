/**
 * @typedef {string} StepId
 */

/**
 * Returns the id of the last visible step in the given order.
 *
 * @param {StepId[]} stepsInOrder - Steps in the same order as they are rendered.
 * @param {Record<StepId, boolean>} isStepVisible - Visibility map: stepId -> true/false.
 * @returns {StepId|null} Last visible step id, or null if none are visible.
 */
export function getLastVisibleStepId(stepsInOrder, isStepVisible) {
  if (!Array.isArray(stepsInOrder) || stepsInOrder.length === 0) return null;

  // Walk from the end to find the last visible step.
  for (let i = stepsInOrder.length - 1; i >= 0; i -= 1) {
    const stepId = stepsInOrder[i];
    if (isStepVisible?.[stepId] === true) return stepId;
  }

  return null;
}

/**
 * Checks whether the provided step is the last visible step.
 *
 * Rules:
 * - If the step itself is not visible => false (обычно так ожидается в UI-логике).
 * - Otherwise it's "last" when no visible steps exist after it.
 *
 * @param {StepId} stepId - Step to check.
 * @param {StepId[]} stepsInOrder - Steps in render order.
 * @param {Record<StepId, boolean>} isStepVisible - Visibility map: stepId -> true/false.
 * @returns {boolean} True if stepId is the last visible step.
 */
export function isLastVisibleStep(stepId, stepsInOrder, isStepVisible) {
  if (!stepId) return false;
  if (isStepVisible?.[stepId] !== true) return false;

  const lastVisibleId = getLastVisibleStepId(stepsInOrder, isStepVisible);
  return lastVisibleId === stepId;
}