import type { Logger, SearchTypes } from "@medusajs/framework/types"
import { AbstractSearchProviderService, MedusaError } from "@medusajs/framework/utils"
import { compileFilters, primaryKeyIds } from "./filters"

type Options = {
  host: string
  apiKey?: string
  /** Max values Meilisearch returns per facet (its index setting). */
  maxValuesPerFacet?: number
}

type InjectedDependencies = { logger: Logger }

type MeiliTask = { taskUid: number; indexUid: string | null; status: string }
type MeiliSearchResponse = {
  hits: Record<string, unknown>[]
  estimatedTotalHits?: number
  totalHits?: number
  processingTimeMs: number
  query: string
  facetDistribution?: Record<string, Record<string, number>>
  facetStats?: Record<string, { min: number; max: number }>
}

const TASK_STATUS: Record<string, SearchTypes.SearchTaskStatus> = {
  enqueued: "enqueued",
  processing: "processing",
  succeeded: "succeeded",
  failed: "failed",
  canceled: "failed",
}

function weightOf(field: SearchTypes.SearchFieldDefinition) {
  return typeof field.searchable === "object" ? field.searchable.weight ?? 1 : 1
}

function facetTypes(field: SearchTypes.SearchFieldDefinition): SearchTypes.SearchFacetKind[] {
  if (!field.facetable) {
    return []
  }
  if (typeof field.facetable === "object" && field.facetable.types) {
    return field.facetable.types
  }
  return ["integer", "float", "date"].includes(field.type) ? ["range"] : ["value"]
}

function dateFields(definition: SearchTypes.ResolvedSearchIndexDefinition) {
  return Object.entries(definition.fields)
    .filter(([, f]) => f.type === "date")
    .map(([name]) => name)
}

class MeilisearchSearchService extends AbstractSearchProviderService {
  static identifier = "meilisearch"

  protected logger_: Logger
  protected options_: Options

  constructor({ logger }: InjectedDependencies, options: Options) {
    super()
    this.logger_ = logger
    this.options_ = options
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.host) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Meilisearch provider needs a `host` option")
    }
  }

  protected async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.options_.host.replace(/\/$/, "")}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(this.options_.apiKey ? { authorization: `Bearer ${this.options_.apiKey}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (res.status === 204) {
      return undefined as T
    }
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) {
      const type = res.status === 404 ? MedusaError.Types.NOT_FOUND : MedusaError.Types.UNEXPECTED_STATE
      throw new MedusaError(type, `Meilisearch ${method} ${path}: ${data.message ?? res.statusText}`, String(data.code ?? res.status))
    }
    return data as T
  }

  protected task(task: MeiliTask, index?: string): SearchTypes.SearchTask {
    return { id: String(task.taskUid), index: index ?? task.indexUid ?? undefined, status: TASK_STATUS[task.status] ?? "enqueued" }
  }

  async waitForTask(task: SearchTypes.SearchTask, options?: { timeout_ms?: number }): Promise<SearchTypes.SearchTask> {
    if (!task.id) {
      return task
    }
    const deadline = Date.now() + (options?.timeout_ms ?? 120_000)
    let delay = 50
    while (Date.now() < deadline) {
      const t = await this.request<{ status: string; error?: { message: string; code: string } | null }>("GET", `/tasks/${task.id}`)
      const status = TASK_STATUS[t.status] ?? "enqueued"
      if (status === "succeeded" || status === "failed") {
        return { ...task, status, ...(t.error ? { error: { message: t.error.message, code: t.error.code } } : {}) }
      }
      await new Promise((r) => setTimeout(r, delay))
      delay = Math.min(delay * 2, 1000)
    }
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Meilisearch task ${task.id} did not finish in time`)
  }

  async upsertIndex({ index }: { index: SearchTypes.ResolvedSearchIndexDefinition }): Promise<SearchTypes.SearchTask> {
    const uid = index.physical_name
    try {
      await this.request("GET", `/indexes/${uid}`)
    } catch (e) {
      if (!(e instanceof MedusaError) || e.type !== MedusaError.Types.NOT_FOUND) {
        throw e
      }
      const created = await this.request<MeiliTask>("POST", "/indexes", { uid, primaryKey: index.primary_key })
      await this.waitForTask(this.task(created, uid))
    }

    const entries = Object.entries(index.fields)
    for (const [name, field] of entries) {
      if (field.type === "vector" || field.type === "geo") {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Meilisearch provider does not support ${field.type} field "${name}"`)
      }
      if (facetTypes(field).includes("range")) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Meilisearch provider does not support range facets ("${name}"); use stats`)
      }
    }

    // Meilisearch ranks searchable attributes by list order, so higher weights go first.
    const searchable = entries
      .filter(([, f]) => f.searchable)
      .sort(([, a], [, b]) => weightOf(b) - weightOf(a))
      .map(([name]) => name)
    const typo = index.settings.typo_tolerance

    const settings = {
      searchableAttributes: searchable.length ? searchable : ["*"],
      filterableAttributes: entries.filter(([, f]) => f.filterable || f.facetable).map(([name]) => name),
      sortableAttributes: entries.filter(([, f]) => f.sortable).map(([name]) => name),
      displayedAttributes: [index.primary_key, ...entries.filter(([n, f]) => f.retrievable !== false && n !== index.primary_key).map(([name]) => name)],
      distinctAttribute: index.settings.distinct_attribute ?? null,
      faceting: { maxValuesPerFacet: this.options_.maxValuesPerFacet ?? 200 },
      typoTolerance: {
        enabled: typo?.enabled ?? true,
        minWordSizeForTypos: {
          oneTypo: typo?.min_word_size_for_one_typo ?? 5,
          twoTypos: typo?.min_word_size_for_two_typos ?? 9,
        },
        disableOnAttributes: typo?.disabled_on_attributes ?? [],
      },
      ...(index.settings.provider_options?.meilisearch ?? {}),
    }

    return this.task(await this.request<MeiliTask>("PATCH", `/indexes/${uid}/settings`, settings), uid)
  }

  async deleteIndex({ index }: { index: string }): Promise<SearchTypes.SearchTask> {
    try {
      return this.task(await this.request<MeiliTask>("DELETE", `/indexes/${index}`), index)
    } catch (e) {
      if (e instanceof MedusaError && e.type === MedusaError.Types.NOT_FOUND) {
        return { index, status: "succeeded" }
      }
      throw e
    }
  }

  async listIndexes(): Promise<SearchTypes.SearchIndexInfo[]> {
    const [{ results }, stats] = await Promise.all([
      this.request<{ results: { uid: string; createdAt: string; updatedAt: string }[] }>("GET", "/indexes?limit=1000"),
      this.request<{ indexes: Record<string, { numberOfDocuments: number }> }>("GET", "/stats"),
    ])
    return results.map((i) => ({
      name: i.uid,
      provider: MeilisearchSearchService.identifier,
      document_count: stats.indexes[i.uid]?.numberOfDocuments ?? 0,
      created_at: new Date(i.createdAt),
      updated_at: new Date(i.updatedAt),
    }))
  }

  async upsertDocuments({
    index,
    definition,
    documents,
  }: {
    index: string
    definition: SearchTypes.ResolvedSearchIndexDefinition
    documents: SearchTypes.SearchDocument[]
  }): Promise<SearchTypes.SearchTask> {
    // Meilisearch filters and sorts dates only as numbers.
    const dates = dateFields(definition)
    const docs = dates.length
      ? documents.map((doc) => {
          const out: Record<string, unknown> = { ...doc }
          for (const name of dates) {
            const v = out[name]
            if (v instanceof Date || typeof v === "string") {
              const ms = new Date(v).getTime()
              out[name] = Number.isNaN(ms) ? null : Math.floor(ms / 1000)
            }
          }
          return out
        })
      : documents
    const task = await this.request<MeiliTask>("POST", `/indexes/${index}/documents?primaryKey=${encodeURIComponent(definition.primary_key)}`, docs)
    return this.task(task, index)
  }

  async deleteDocuments({ index, filters }: SearchTypes.SearchDeleteDocumentsInput): Promise<SearchTypes.SearchTask> {
    const ids = primaryKeyIds(filters, "id")
    const task = ids
      ? await this.request<MeiliTask>("POST", `/indexes/${index}/documents/delete-batch`, ids)
      : await this.request<MeiliTask>("POST", `/indexes/${index}/documents/delete`, { filter: compileFilters(filters) })
    return this.task(task, index)
  }

  async clearIndex({ index }: { index: string }): Promise<SearchTypes.SearchTask> {
    return this.task(await this.request<MeiliTask>("DELETE", `/indexes/${index}/documents`), index)
  }

  protected buildQuery(input: SearchTypes.ProviderSearchQuery) {
    const options = input.search_options ?? {}
    if (options.vector) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Meilisearch provider does not support vector search")
    }
    if (input.pagination?.cursor) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Meilisearch provider does not support cursor pagination")
    }
    if (options.match_strategy === "any") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Meilisearch provider does not support match_strategy "any"')
    }

    const facets = (options.facets ?? []).map((f) => (typeof f === "string" ? { field: f, type: "value" as const } : f))
    if (facets.some((f) => f.type === "range")) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Meilisearch provider does not support range facets")
    }

    const highlight = options.highlight && input.q ? (options.highlight === true ? { fields: ["*"] } : options.highlight) : undefined
    const sort = Object.entries(input.pagination?.order ?? {})
      .filter(([field]) => field !== "_score")
      .map(([field, dir]) => `${field}:${dir.toLowerCase()}`)

    return {
      facets,
      body: {
        q: input.q ?? "",
        offset: input.pagination?.skip ?? 0,
        limit: input.pagination?.take ?? 20,
        filter: compileFilters(input.filters),
        attributesToRetrieve: input.attributes_to_retrieve,
        ...(sort.length ? { sort } : {}),
        ...(facets.length ? { facets: facets.map((f) => f.field) } : {}),
        ...(options.attributes_to_search_on ? { attributesToSearchOn: options.attributes_to_search_on } : {}),
        matchingStrategy: "all",
        ...(options.distinct ? { distinct: options.distinct } : {}),
        ...(options.min_score !== undefined ? { rankingScoreThreshold: options.min_score } : {}),
        ...(options.include_score || options.min_score !== undefined ? { showRankingScore: true } : {}),
        ...(options.locales ? { locales: options.locales } : {}),
        ...(highlight
          ? {
              attributesToHighlight: highlight.fields,
              highlightPreTag: highlight.pre_tag ?? "<mark>",
              highlightPostTag: highlight.post_tag ?? "</mark>",
              ...(highlight.snippet
                ? { attributesToCrop: highlight.fields, cropLength: typeof highlight.snippet === "object" ? highlight.snippet.length : 10 }
                : {}),
            }
          : {}),
        ...(input.search_options?.provider_options?.meilisearch ?? {}),
      },
    }
  }

  protected toResult(
    input: SearchTypes.ProviderSearchQuery,
    facets: SearchTypes.SearchFacetRequest[],
    res: MeiliSearchResponse
  ): SearchTypes.SearchResult {
    const pk = input.index.primary_key
    const dates = dateFields(input.index)

    const hits = res.hits.map((raw) => {
      const { _formatted, _rankingScore, ...doc } = raw as Record<string, unknown> & {
        _formatted?: Record<string, unknown>
        _rankingScore?: number
      }
      for (const name of dates) {
        if (typeof doc[name] === "number") {
          doc[name] = new Date((doc[name] as number) * 1000).toISOString()
        }
      }
      const highlights = _formatted
        ? Object.fromEntries(
            Object.entries(_formatted)
              .filter(([, v]) => typeof v === "string" && v.includes(this.preTag(input)))
              .map(([k, v]) => [k, [v as string]])
          )
        : undefined
      return {
        id: String(doc[pk]),
        document: doc,
        ...(_rankingScore !== undefined ? { score: _rankingScore } : {}),
        ...(highlights && Object.keys(highlights).length ? { highlights } : {}),
      }
    })

    const facetResults: Record<string, SearchTypes.SearchFacetResult> = {}
    for (const f of facets) {
      if (f.type === "stats") {
        const stats = res.facetStats?.[f.field]
        facetResults[f.field] = { type: "stats", min: stats?.min ?? 0, max: stats?.max ?? 0, count: stats ? res.estimatedTotalHits ?? res.hits.length : 0 }
        continue
      }
      let values = Object.entries(res.facetDistribution?.[f.field] ?? {}).map(([value, count]) => ({ value, count }))
      if (f.type !== "range" && f.query) {
        const needle = f.query.toLowerCase()
        values = values.filter((v) => v.value.toLowerCase().includes(needle))
      }
      values.sort((a, b) => (f.type !== "range" && f.sort === "alpha" ? a.value.localeCompare(b.value) : b.count - a.count))
      const limit = f.type !== "range" ? f.limit : undefined
      facetResults[f.field] = { type: "value", values: limit ? values.slice(0, limit) : values }
    }

    return {
      hits,
      ...(facets.length ? { facets: facetResults } : {}),
      metadata: {
        skip: input.pagination?.skip ?? 0,
        take: input.pagination?.take ?? 20,
        count: input.search_options?.count === "none" ? null : res.totalHits ?? res.estimatedTotalHits ?? hits.length,
        query: res.query,
        processing_time_ms: res.processingTimeMs,
      },
    }
  }

  protected preTag(input: SearchTypes.ProviderSearchQuery) {
    const h = input.search_options?.highlight
    return typeof h === "object" && h.pre_tag ? h.pre_tag : "<mark>"
  }

  async search(input: SearchTypes.ProviderSearchQuery): Promise<SearchTypes.SearchResult> {
    const { body, facets } = this.buildQuery(input)
    const res = await this.request<MeiliSearchResponse>("POST", `/indexes/${input.index.physical_name}/search`, body)
    return this.toResult(input, facets, res)
  }

  async searchMany(inputs: SearchTypes.ProviderSearchQuery[]): Promise<SearchTypes.SearchResult[]> {
    if (!inputs.length) {
      return []
    }
    const built = inputs.map((input) => ({ input, ...this.buildQuery(input) }))
    const { results } = await this.request<{ results: MeiliSearchResponse[] }>("POST", "/multi-search", {
      queries: built.map(({ input, body }) => ({ indexUid: input.index.physical_name, ...body })),
    })
    return results.map((res, i) => this.toResult(built[i].input, built[i].facets, res))
  }
}

export default MeilisearchSearchService
