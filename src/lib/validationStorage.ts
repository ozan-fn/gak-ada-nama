/**
 * LocalStorage-based validation system for danger markers
 * Allows users to confirm or report danger status
 */

type Validation = {
  markerId: string;
  action: 'confirm' | 'cleared' | 'report';
  timestamp: string;
  sessionId: string;
};

const STORAGE_KEY = 'prita-danger-validations';

/**
 * Get all validations from localStorage
 */
function getAllValidations(): Record<string, Validation[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Save validations to localStorage
 */
function saveValidations(validations: Record<string, Validation[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validations));
  } catch (error) {
    console.error('Failed to save validations:', error);
  }
}

/**
 * Get or create anonymous session ID
 */
function getSessionId(): string {
  let sessionId = localStorage.getItem('prita-session-id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('prita-session-id', sessionId);
  }
  return sessionId;
}

/**
 * Add a validation for a danger marker
 */
export function addValidation(
  markerId: string,
  action: 'confirm' | 'cleared' | 'report'
): void {
  const validations = getAllValidations();
  
  if (!validations[markerId]) {
    validations[markerId] = [];
  }
  
  const validation: Validation = {
    markerId,
    action,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  };
  
  validations[markerId].push(validation);
  saveValidations(validations);
}

/**
 * Get validation count for a specific marker
 */
export function getValidationCount(
  markerId: string,
  action?: 'confirm' | 'cleared' | 'report'
): number {
  const validations = getAllValidations();
  const markerValidations = validations[markerId] || [];
  
  if (action) {
    return markerValidations.filter(v => v.action === action).length;
  }
  
  return markerValidations.length;
}

/**
 * Get all validations for a marker
 */
export function getMarkerValidations(markerId: string): Validation[] {
  const validations = getAllValidations();
  return validations[markerId] || [];
}

/**
 * Check if current session has already validated a marker
 */
export function hasValidated(
  markerId: string,
  action?: 'confirm' | 'cleared' | 'report'
): boolean {
  const sessionId = getSessionId();
  const markerValidations = getMarkerValidations(markerId);
  
  if (action) {
    return markerValidations.some(
      v => v.sessionId === sessionId && v.action === action
    );
  }
  
  return markerValidations.some(v => v.sessionId === sessionId);
}

/**
 * Clear old validations (older than 24 hours)
 */
export function cleanupOldValidations(): void {
  const validations = getAllValidations();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  Object.keys(validations).forEach(markerId => {
    validations[markerId] = validations[markerId].filter(v => {
      const validationTime = new Date(v.timestamp).getTime();
      return validationTime > oneDayAgo;
    });
    
    // Remove empty arrays
    if (validations[markerId].length === 0) {
      delete validations[markerId];
    }
  });
  
  saveValidations(validations);
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(markerId: string): {
  confirmations: number;
  clearances: number;
  reports: number;
  total: number;
  userValidated: boolean;
} {
  return {
    confirmations: getValidationCount(markerId, 'confirm'),
    clearances: getValidationCount(markerId, 'cleared'),
    reports: getValidationCount(markerId, 'report'),
    total: getValidationCount(markerId),
    userValidated: hasValidated(markerId),
  };
}

// Cleanup old validations on module load
cleanupOldValidations();
