/**
 * Template Variable Interpolation Utility
 *
 * Provides functionality for interpolating template variables ({{variable}})
 * with values from workflow context, enabling dynamic content generation
 * and data passing between workflow steps.
 */

import type { WorkflowContext } from '@/types/BuildingBlocks';

/**
 * Get a nested value from an object using dot notation or array notation
 * Supports paths like:
 * - "step1.lyrics" → context.step1.lyrics
 * - "step1.quotes[0].text" → context.step1.quotes[0].text
 * - "patientId" → context.patientId
 *
 * @param obj - The object to extract value from
 * @param path - The path to the value (dot notation or array notation)
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined;
  }

  // Handle array notation: convert "quotes[0]" to "quotes.0"
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');

  // Split by dots and traverse the object
  const parts = normalizedPath.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array index access
    if (Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
    } else if (typeof current === 'object') {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Extract all template variables from a string
 * Finds all instances of {{variable}} pattern
 *
 * @param template - The template string to extract variables from
 * @returns Array of variable names found in the template
 *
 * @example
 * extractTemplateVariables("Generate image of {{step1.description}}")
 * // Returns: ["step1.description"]
 */
export function extractTemplateVariables(template: string): string[] {
  if (!template || typeof template !== 'string') {
    return [];
  }

  const regex = /\{\{(.+?)\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (match[1]) {
      matches.push(match[1].trim());
    }
  }

  return matches;
}

/**
 * Interpolate template variables in a string with values from context
 * Replaces {{variable}} patterns with actual values
 *
 * @param template - The template string with {{variable}} placeholders
 * @param context - The workflow context containing variable values
 * @param options - Options for interpolation behavior
 * @returns The interpolated string with variables replaced
 *
 * @example
 * interpolateTemplate(
 *   "Generate image of {{step1.description}}",
 *   { step1: { description: "peaceful landscape" } }
 * )
 * // Returns: "Generate image of peaceful landscape"
 */
export function interpolateTemplate(
  template: string,
  context: WorkflowContext,
  options: {
    keepUnresolved?: boolean; // Keep {{var}} if value not found
    defaultValue?: string; // Default value for unresolved variables
  } = {},
): string {
  if (!template || typeof template !== 'string') {
    return template;
  }

  const { keepUnresolved = false, defaultValue = '' } = options;

  return template.replace(/\{\{(.+?)\}\}/g, (match, variable) => {
    const trimmedVar = variable.trim();
    const value = getNestedValue(context, trimmedVar);

    // Handle different value types
    if (value === null || value === undefined) {
      if (keepUnresolved) {
        return match; // Keep {{variable}} as is
      }
      return defaultValue;
    }

    // Convert value to string
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (typeof value === 'object') {
      // For objects/arrays, return JSON string
      return JSON.stringify(value);
    }

    return String(value);
  });
}

/**
 * Interpolate template variables in an object (recursively)
 * Walks through all string values in the object and interpolates them
 *
 * @param obj - The object with template strings to interpolate
 * @param context - The workflow context containing variable values
 * @param options - Options for interpolation behavior
 * @returns New object with interpolated values
 *
 * @example
 * interpolateObject(
 *   { prompt: "{{step1.text}}", style: "photorealistic" },
 *   { step1: { text: "sunset" } }
 * )
 * // Returns: { prompt: "sunset", style: "photorealistic" }
 */
export function interpolateObject(
  obj: Record<string, any>,
  context: WorkflowContext,
  options?: { keepUnresolved?: boolean; defaultValue?: string },
): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Interpolate string values
      result[key] = interpolateTemplate(value, context, options);
    } else if (Array.isArray(value)) {
      // Recursively interpolate arrays
      result[key] = value.map(item => {
        if (typeof item === 'string') {
          return interpolateTemplate(item, context, options);
        }
        if (typeof item === 'object' && item !== null) {
          return interpolateObject(item, context, options);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recursively interpolate nested objects
      result[key] = interpolateObject(value, context, options);
    } else {
      // Copy non-string, non-object values as-is
      result[key] = value;
    }
  }

  return result;
}

/**
 * Validate that all template variables in a string can be resolved
 * Checks if all {{variable}} patterns have corresponding values in context
 *
 * @param template - The template string to validate
 * @param context - The workflow context to check against
 * @returns Object with validation result and list of unresolved variables
 *
 * @example
 * validateTemplate("{{step1.text}} and {{step2.text}}", { step1: { text: "hello" } })
 * // Returns: { valid: false, unresolvedVariables: ["step2.text"] }
 */
export function validateTemplate(
  template: string,
  context: WorkflowContext,
): {
  valid: boolean;
  unresolvedVariables: string[];
} {
  const variables = extractTemplateVariables(template);
  const unresolvedVariables: string[] = [];

  for (const variable of variables) {
    const value = getNestedValue(context, variable);
    if (value === null || value === undefined) {
      unresolvedVariables.push(variable);
    }
  }

  return {
    valid: unresolvedVariables.length === 0,
    unresolvedVariables,
  };
}

/**
 * Check if a string contains template variables
 *
 * @param str - The string to check
 * @returns True if the string contains {{variable}} patterns
 */
export function hasTemplateVariables(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return /\{\{.+?\}\}/.test(str);
}
