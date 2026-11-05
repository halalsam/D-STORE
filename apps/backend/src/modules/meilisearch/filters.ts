import type { SearchTypes } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

type Value = SearchTypes.SearchFilterValue

const LOGICAL = new Set(["$and", "$or", "$not"])

export function toMeiliValue(value: Value): string {
  if (value === null) {
    return "NULL"
  }
  if (value instanceof Date) {
    return String(Math.floor(value.getTime() / 1000))
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

function attribute(path: string) {
  if (!/^[\w.]+$/.test(path)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid search filter field "${path}"`)
  }
  return path
}

function list(values: Value[]) {
  return `[${values.map(toMeiliValue).join(", ")}]`
}

function operatorClause(field: string, op: string, value: unknown): string {
  const f = attribute(field)
  switch (op) {
    case "$eq":
      return value === null ? `${f} IS NULL` : `${f} = ${toMeiliValue(value as Value)}`
    case "$ne":
      return value === null ? `${f} IS NOT NULL` : `${f} != ${toMeiliValue(value as Value)}`
    case "$in":
    case "$overlaps":
      return `${f} IN ${list(value as Value[])}`
    case "$nin":
      return `${f} NOT IN ${list(value as Value[])}`
    case "$lt":
      return `${f} < ${toMeiliValue(value as Value)}`
    case "$lte":
      return `${f} <= ${toMeiliValue(value as Value)}`
    case "$gt":
      return `${f} > ${toMeiliValue(value as Value)}`
    case "$gte":
      return `${f} >= ${toMeiliValue(value as Value)}`
    case "$exists":
      return value ? `${f} EXISTS` : `${f} NOT EXISTS`
    case "$contains": {
      const values = Array.isArray(value) ? value : [value]
      return `(${values.map((v) => `${f} = ${toMeiliValue(v as Value)}`).join(" AND ")})`
    }
    default:
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Meilisearch does not support the "${op}" filter operator`
      )
  }
}

function fieldClause(field: string, value: unknown): string {
  if (Array.isArray(value)) {
    return `${attribute(field)} IN ${list(value as Value[])}`
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const parts = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([op, v]) => operatorClause(field, op, v))
    return parts.length > 1 ? `(${parts.join(" AND ")})` : parts[0] ?? ""
  }
  return operatorClause(field, "$eq", value)
}

/** Compiles the Search Module's filter tree to a Meilisearch filter expression. */
export function compileFilters(filters: SearchTypes.SearchFilters | undefined): string | undefined {
  if (!filters) {
    return undefined
  }

  const parts: string[] = []
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || key === "q") {
      continue
    }
    if (key === "$and" || key === "$or") {
      const children = (value as SearchTypes.SearchFilters[])
        .map(compileFilters)
        .filter((c): c is string => !!c)
      if (children.length) {
        parts.push(`(${children.join(key === "$and" ? " AND " : " OR ")})`)
      }
      continue
    }
    if (key === "$not") {
      const child = compileFilters(value as SearchTypes.SearchFilters)
      if (child) {
        parts.push(`NOT (${child})`)
      }
      continue
    }
    if (LOGICAL.has(key)) {
      continue
    }
    const clause = fieldClause(key, value)
    if (clause) {
      parts.push(clause)
    }
  }

  return parts.length ? parts.join(" AND ") : undefined
}

/** Ids when the filter is a plain primary-key match, so deletes can use the batch endpoint. */
export function primaryKeyIds(
  filters: SearchTypes.SearchFilters,
  primaryKey: string
): string[] | undefined {
  const keys = Object.keys(filters).filter((k) => filters[k] !== undefined)
  if (keys.length !== 1 || keys[0] !== primaryKey) {
    return undefined
  }
  const value = filters[primaryKey] as unknown
  if (typeof value === "string") {
    return [value]
  }
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value as string[]
  }
  if (value && typeof value === "object" && Array.isArray((value as { $in?: unknown }).$in)) {
    return (value as { $in: string[] }).$in
  }
  return undefined
}
