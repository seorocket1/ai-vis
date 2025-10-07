import initSqlJs, { Database } from 'sql.js';
import localforage from 'localforage';

class LocalDatabase {
  private db: Database | null = null;
  private SQL: any = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    this.SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    });

    const savedDb = await localforage.getItem<Uint8Array>('brandtracker-db');

    if (savedDb) {
      this.db = new this.SQL.Database(savedDb);
    } else {
      this.db = new this.SQL.Database();
      await this.createSchema();
    }

    this.initialized = true;
  }

  private async createSchema() {
    if (!this.db) return;

    const schema = `
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        website_url TEXT,
        brand_name TEXT,
        subscription_tier TEXT DEFAULT 'free',
        subscription_status TEXT DEFAULT 'active',
        subscription_end_date TEXT,
        onboarding_completed INTEGER DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS competitors (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        website_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        text TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        frequency TEXT DEFAULT 'daily',
        last_triggered_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS prompt_executions (
        id TEXT PRIMARY KEY,
        prompt_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        model TEXT NOT NULL,
        platform TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        ai_response TEXT,
        executed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS brand_mentions (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        brand_name TEXT NOT NULL,
        mention_count INTEGER DEFAULT 0,
        is_user_brand INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (execution_id) REFERENCES prompt_executions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sentiment_analysis (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        positive_percentage REAL DEFAULT 0,
        neutral_percentage REAL DEFAULT 0,
        negative_percentage REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (execution_id) REFERENCES prompt_executions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        recommendation_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (execution_id) REFERENCES prompt_executions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS aggregated_metrics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        time_period TEXT DEFAULT 'all',
        avg_sentiment_score REAL DEFAULT 0,
        avg_brand_visibility REAL DEFAULT 0,
        share_of_voice REAL DEFAULT 0,
        competitive_rank INTEGER DEFAULT 0,
        response_quality REAL DEFAULT 0,
        platform_coverage INTEGER DEFAULT 0,
        total_executions INTEGER DEFAULT 0,
        total_brand_mentions INTEGER DEFAULT 0,
        total_competitor_mentions INTEGER DEFAULT 0,
        top_competitor TEXT,
        avg_positive_sentiment REAL DEFAULT 0,
        avg_neutral_sentiment REAL DEFAULT 0,
        avg_negative_sentiment REAL DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
        UNIQUE(user_id, time_period)
      );

      CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id);
      CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
      CREATE INDEX IF NOT EXISTS idx_executions_user_id ON prompt_executions(user_id);
      CREATE INDEX IF NOT EXISTS idx_executions_prompt_id ON prompt_executions(prompt_id);
      CREATE INDEX IF NOT EXISTS idx_brand_mentions_execution_id ON brand_mentions(execution_id);
      CREATE INDEX IF NOT EXISTS idx_sentiment_execution_id ON sentiment_analysis(execution_id);
      CREATE INDEX IF NOT EXISTS idx_recommendations_execution_id ON recommendations(execution_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_user_period ON aggregated_metrics(user_id, time_period);
    `;

    this.db.run(schema);
    await this.save();
  }

  async save() {
    if (!this.db) return;
    const data = this.db.export();
    await localforage.setItem('brandtracker-db', data);
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = this.db.exec(sql, params);
      if (results.length === 0) return [];

      const { columns, values } = results[0];
      return values.map(row => {
        const obj: any = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
    } catch (error) {
      console.error('Query error:', error, sql, params);
      throw error;
    }
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.run(sql, params);
      await this.save();
    } catch (error) {
      console.error('Run error:', error, sql, params);
      throw error;
    }
  }

  generateId(): string {
    return crypto.randomUUID();
  }

  async close() {
    if (this.db) {
      await this.save();
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

export const localdb = new LocalDatabase();
