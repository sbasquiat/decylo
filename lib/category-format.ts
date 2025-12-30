/**
 * Category Formatting Utilities
 * 
 * Formats category values for display in the UI
 */

import { DecisionCategory } from './db/types'

const categoryLabels: Record<DecisionCategory, string> = {
  career: 'Career',
  money: 'Money',
  health: 'Health',
  relationships: 'Relationships',
  life_lifestyle: 'Life & Lifestyle',
  growth_learning: 'Growth & Learning',
  time_priorities: 'Time & Priorities',
  other: 'Other',
}

/**
 * Format a category value for display
 * Converts snake_case to proper labels
 */
export function formatCategory(category: DecisionCategory): string {
  return categoryLabels[category] || category
}

/**
 * Get all category labels in order
 */
export function getAllCategoryLabels(): Array<{ value: DecisionCategory; label: string }> {
  return Object.entries(categoryLabels).map(([value, label]) => ({
    value: value as DecisionCategory,
    label,
  }))
}


