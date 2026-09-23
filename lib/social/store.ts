import 'server-only';

import { randomUUID } from 'node:crypto';

import type { DeliveryOutcome, IdempotencyStore } from '@opencoredev/social-sdk';
import type { InstagramWorkflow, InstagramWorkflowStore } from '@opencoredev/social-sdk/instagram';
import { Pool } from 'pg';

import { draftCreative } from './creative';
import type { SocialProduct } from './products';

export type DraftStatus = 'draft' | 'approved' | 'publishing' | 'pending' | 'published' | 'failed' | 'unknown' | 'rejected';
export type SocialDraft = {
  id: string;
  product: SocialProduct;
  caption: string;
  creativeDirection: string;
  status: DraftStatus;
  outcome: DeliveryOutcome | null;
  createdAt: string;
  updatedAt: string;
};

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

export function socialDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is required for the social approval queue');
    pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10_000 });
  }
  return pool;
}

export async function ensureSocialSchema(): Promise<void> {
  schemaReady ??= (async () => {
    await socialDb().query(`
      CREATE TABLE IF NOT EXISTS social_sources (
        id TEXT PRIMARY KEY,
        fingerprint TEXT NOT NULL,
        observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS social_drafts (
        id UUID PRIMARY KEY,
        source_id TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        product JSONB NOT NULL,
        caption TEXT NOT NULL,
        creative_direction TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('draft','approved','publishing','pending','published','failed','unknown','rejected')),
        outcome JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (source_id, fingerprint)
      );
      CREATE TABLE IF NOT EXISTS social_idempotency (
        claim_id UUID PRIMARY KEY,
        scope TEXT NOT NULL,
        key TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        target_keys TEXT[] NOT NULL,
        outcomes JSONB NOT NULL DEFAULT '{}'::jsonb,
        UNIQUE (scope, key)
      );
      CREATE TABLE IF NOT EXISTS social_instagram_workflows (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        claimed_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS social_watch_state (
        id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
        last_success_at TIMESTAMPTZ NOT NULL
      );
    `);
  })().catch(error => {
    schemaReady = undefined;
    throw error;
  });
  await schemaReady;
}

export async function isWatchDue(): Promise<boolean> {
  await ensureSocialSchema();
  const result = await socialDb().query<{ due: boolean }>(`
    SELECT COALESCE((SELECT last_success_at <= now() - interval '48 hours' FROM social_watch_state WHERE id = true), true) AS due
  `);
  return result.rows[0]?.due ?? true;
}

export async function markWatchComplete(): Promise<void> {
  await socialDb().query(`
    INSERT INTO social_watch_state (id, last_success_at) VALUES (true, now())
    ON CONFLICT (id) DO UPDATE SET last_success_at = now()
  `);
}

type DraftRow = {
  id: string;
  product: SocialProduct;
  caption: string;
  creative_direction: string;
  status: DraftStatus;
  outcome: DeliveryOutcome | null;
  created_at: Date;
  updated_at: Date;
};

function mapDraft(row: DraftRow): SocialDraft {
  return {
    id: row.id,
    product: row.product,
    caption: row.caption,
    creativeDirection: row.creative_direction,
    status: row.status,
    outcome: row.outcome,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function observeProducts(products: SocialProduct[]): Promise<{ scanned: number; drafted: number; baseline: boolean }> {
  if (!products.length) throw new Error('Storefront returned no products; refusing to replace the baseline');
  await ensureSocialSchema();
  const client = await socialDb().connect();
  let drafted = 0;
  let pilotChosen = false;
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(60194873)');
    const existingCount = await client.query<{ count: string }>('SELECT count(*)::text AS count FROM social_sources');
    const baseline = Number(existingCount.rows[0]?.count) === 0;
    for (const product of products) {
      const previous = await client.query<{ fingerprint: string }>('SELECT fingerprint FROM social_sources WHERE id = $1', [product.id]);
      const changed = previous.rows[0]?.fingerprint !== product.fingerprint;
      if (!changed) continue;
      await client.query(`
        INSERT INTO social_sources (id, fingerprint) VALUES ($1, $2)
        ON CONFLICT (id) DO UPDATE SET fingerprint = EXCLUDED.fingerprint, observed_at = now()
      `, [product.id, product.fingerprint]);
      // The first scan records the catalog and creates one pilot draft, avoiding an old-catalog flood.
      if (!product.imageUrl || (baseline && pilotChosen)) continue;
      const creative = draftCreative(product);
      const inserted = await client.query(`
        INSERT INTO social_drafts (id, source_id, fingerprint, product, caption, creative_direction, status)
        VALUES ($1, $2, $3, $4::jsonb, $5, $6, 'draft')
        ON CONFLICT (source_id, fingerprint) DO NOTHING RETURNING id
      `, [randomUUID(), product.id, product.fingerprint, JSON.stringify(product), creative.caption, creative.creativeDirection]);
      drafted += inserted.rowCount ?? 0;
      if (baseline && inserted.rowCount === 1) pilotChosen = true;
    }
    await client.query('COMMIT');
    return { scanned: products.length, drafted, baseline };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listDrafts(): Promise<SocialDraft[]> {
  await ensureSocialSchema();
  const rows = await socialDb().query<DraftRow>('SELECT * FROM social_drafts ORDER BY created_at DESC LIMIT 100');
  return rows.rows.map(mapDraft);
}

export async function getDraft(id: string): Promise<SocialDraft | null> {
  await ensureSocialSchema();
  const rows = await socialDb().query<DraftRow>('SELECT * FROM social_drafts WHERE id = $1', [id]);
  return rows.rows[0] ? mapDraft(rows.rows[0]) : null;
}

export async function updateReview(id: string, action: 'save' | 'approve' | 'reject', caption: string): Promise<boolean> {
  await ensureSocialSchema();
  const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'draft';
  const result = await socialDb().query(`
    UPDATE social_drafts SET caption = $2, status = $3, updated_at = now()
    WHERE id = $1 AND status = 'draft' RETURNING id
  `, [id, caption, status]);
  return result.rowCount === 1;
}

export async function claimForPublish(id: string): Promise<SocialDraft | null> {
  await ensureSocialSchema();
  const result = await socialDb().query<DraftRow>(`
    UPDATE social_drafts SET status = 'publishing', updated_at = now()
    WHERE id = $1 AND status = 'approved' RETURNING *
  `, [id]);
  return result.rows[0] ? mapDraft(result.rows[0]) : null;
}

export async function saveDelivery(id: string, status: DraftStatus, outcome: DeliveryOutcome | null): Promise<void> {
  await socialDb().query(`
    UPDATE social_drafts SET status = $2, outcome = $3::jsonb, updated_at = now()
    WHERE id = $1 AND status IN ('publishing', 'pending', 'unknown')
  `, [id, status, outcome ? JSON.stringify(outcome) : null]);
}

export const postgresIdempotencyStore: IdempotencyStore = {
  async claim(input) {
    await ensureSocialSchema();
    const claimId = randomUUID();
    const inserted = await socialDb().query(`
      INSERT INTO social_idempotency (claim_id, scope, key, fingerprint, target_keys)
      VALUES ($1, $2, $3, $4, $5) ON CONFLICT (scope, key) DO NOTHING RETURNING claim_id
    `, [claimId, input.scope, input.key, input.fingerprint, input.targetKeys]);
    if (inserted.rowCount === 1) return { kind: 'new', claimId, outcomes: {} };
    const found = await socialDb().query<{
      claim_id: string; fingerprint: string; target_keys: string[]; outcomes: Record<string, DeliveryOutcome>;
    }>('SELECT * FROM social_idempotency WHERE scope = $1 AND key = $2', [input.scope, input.key]);
    const row = found.rows[0];
    if (!row || row.fingerprint !== input.fingerprint || JSON.stringify(row.target_keys) !== JSON.stringify(input.targetKeys)) {
      return { kind: 'conflict' };
    }
    return { kind: 'existing', claimId: row.claim_id, outcomes: row.outcomes };
  },
  async saveOutcome(input) {
    const saved = await socialDb().query(`
      UPDATE social_idempotency
      SET outcomes = jsonb_set(outcomes, ARRAY[$2]::text[], $3::jsonb, true)
      WHERE claim_id = $1 AND $2 = ANY(target_keys)
    `, [input.claimId, input.targetKey, JSON.stringify(input.outcome)]);
    if (saved.rowCount !== 1) throw new Error('Unknown idempotency claim or target');
  }
};

export const postgresInstagramWorkflows: InstagramWorkflowStore = {
  async create(input) {
    await ensureSocialSchema();
    const workflow: InstagramWorkflow = { ...input, id: `igwf_${randomUUID()}` };
    await socialDb().query('INSERT INTO social_instagram_workflows (id, data) VALUES ($1, $2::jsonb)', [workflow.id, JSON.stringify(workflow)]);
    return workflow;
  },
  async get(id) {
    await ensureSocialSchema();
    const result = await socialDb().query<{ data: InstagramWorkflow }>('SELECT data FROM social_instagram_workflows WHERE id = $1', [id]);
    return result.rows[0]?.data;
  },
  async update(id, update) {
    await ensureSocialSchema();
    const client = await socialDb().connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ data: InstagramWorkflow }>('SELECT data FROM social_instagram_workflows WHERE id = $1 FOR UPDATE', [id]);
      if (!result.rows[0]) throw new Error('Instagram workflow not found');
      const workflow = { ...result.rows[0].data, ...update, id };
      await client.query('UPDATE social_instagram_workflows SET data = $2::jsonb WHERE id = $1', [id, JSON.stringify(workflow)]);
      await client.query('COMMIT');
      return workflow;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  async claim(id) {
    await ensureSocialSchema();
    const result = await socialDb().query(`
      UPDATE social_instagram_workflows SET claimed_at = now()
      WHERE id = $1 AND (claimed_at IS NULL OR claimed_at < now() - interval '10 minutes') RETURNING id
    `, [id]);
    return result.rowCount === 1;
  },
  async release(id) {
    await socialDb().query('UPDATE social_instagram_workflows SET claimed_at = NULL WHERE id = $1', [id]);
  }
};
