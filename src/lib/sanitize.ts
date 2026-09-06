/**
 * Sanitize object payload by removing all undefined keys recursively.
 * Firestore setDoc/updateDoc crashes if any value is `undefined`.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? stripUndefined(item) : item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = typeof value === 'object' && value !== null ? stripUndefined(value) : value;
      }
    }
    return result as T;
  }
  return obj;
}

export function sanitizeText(text: string, maxLength = 10000): string {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}
