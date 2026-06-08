import { Pool } from 'pg'
import { randomUUID } from 'crypto'

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
  return _pool
}

export const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000001'
export const SINGLE_USER = { id: SINGLE_USER_ID, email: 'admin@local' }

type WhereCondition = { col: string; op: string; val: unknown }

export type DbResult<T = any> = {
  data: T | null
  error: { message: string } | null
  count?: number | null
}

class QueryBuilder {
  private _table: string
  private _op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private _cols = '*'
  private _where: WhereCondition[] = []
  private _orderCol?: string
  private _orderAsc = true
  private _limitN?: number
  private _isSingle = false
  private _isCount = false
  private _insertData?: Record<string, unknown>
  private _updateData?: Record<string, unknown>

  constructor(table: string) {
    this._table = table
  }

  select(cols: string, opts?: { count?: string; head?: boolean }) {
    this._op = 'select'
    this._cols = cols
    if (opts?.count) this._isCount = true
    return this
  }

  insert(data: Record<string, unknown>) {
    this._op = 'insert'
    this._insertData = data
    return this
  }

  update(data: Record<string, unknown>) {
    this._op = 'update'
    this._updateData = data
    return this
  }

  delete() {
    this._op = 'delete'
    return this
  }

  eq(col: string, val: unknown) {
    this._where.push({ col, op: '=', val })
    return this
  }

  lte(col: string, val: unknown) {
    this._where.push({ col, op: '<=', val })
    return this
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._orderCol = col
    this._orderAsc = opts?.ascending ?? true
    return this
  }

  limit(n: number) {
    this._limitN = n
    return this
  }

  single() {
    this._isSingle = true
    return this
  }

  private _buildWhere(startIdx = 1): { sql: string; params: unknown[] } {
    if (this._where.length === 0) return { sql: '', params: [] }
    const parts = this._where.map((c, i) => `${c.col} ${c.op} $${startIdx + i}`)
    return {
      sql: 'WHERE ' + parts.join(' AND '),
      params: this._where.map(c => c.val),
    }
  }

  private async _execute(): Promise<DbResult> {
    const pool = getPool()
    try {
      if (this._op === 'select') {
        if (this._isCount) {
          const { sql: w, params } = this._buildWhere()
          const res = await pool.query(`SELECT COUNT(*) as n FROM ${this._table} ${w}`, params)
          return { count: parseInt(res.rows[0]?.n ?? '0', 10), data: null, error: null }
        }

        const { sql: w, params } = this._buildWhere()
        let q = `SELECT ${this._cols} FROM ${this._table} ${w}`
        if (this._orderCol) q += ` ORDER BY ${this._orderCol} ${this._orderAsc ? 'ASC' : 'DESC'}`
        const lim = this._isSingle ? 1 : this._limitN
        if (lim != null) q += ` LIMIT ${lim}`

        const res = await pool.query(q, params)
        if (this._isSingle) {
          return res.rows.length > 0
            ? { data: res.rows[0], error: null }
            : { data: null, error: { message: 'Not found' } }
        }
        return { data: res.rows, error: null }
      }

      if (this._op === 'insert') {
        const row: Record<string, unknown> = {
          id: randomUUID(),
          created_at: new Date().toISOString(),
          ...this._insertData,
        }
        const keys = Object.keys(row)
        const vals = Object.values(row)
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
        await pool.query(
          `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES (${placeholders})`,
          vals
        )
        return { error: null, data: null }
      }

      if (this._op === 'update') {
        const keys = Object.keys(this._updateData!)
        const vals = Object.values(this._updateData!)
        const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
        const { sql: w, params: wp } = this._buildWhere(keys.length + 1)
        await pool.query(`UPDATE ${this._table} SET ${sets} ${w}`, [...vals, ...wp])
        return { error: null, data: null }
      }

      if (this._op === 'delete') {
        const { sql: w, params } = this._buildWhere()
        await pool.query(`DELETE FROM ${this._table} ${w}`, params)
        return { error: null, data: null }
      }

      return { error: null, data: null }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[local-db] ${this._table}.${this._op}:`, msg)
      return { error: { message: msg }, data: null, count: null }
    }
  }

  then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._execute().then(onfulfilled, onrejected) as Promise<TResult1 | TResult2>
  }
}

export function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: SINGLE_USER }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
    },
    from: (table: string) => new QueryBuilder(table),
  }
}
