import { localdb } from './localdb';

let currentUser: any = null;

class LocalSupabaseClient {
  auth = {
    signUp: async ({ email, password }: { email: string; password: string }) => {
      await localdb.initialize();

      const id = localdb.generateId();
      const sql = `INSERT INTO profiles (id, email, onboarding_completed) VALUES (?, ?, 0)`;

      try {
        await localdb.run(sql, [id, email]);

        currentUser = { id, email };
        localStorage.setItem('brandtracker-user', JSON.stringify(currentUser));

        return { data: { user: currentUser, session: { user: currentUser } }, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message || 'User already exists' } };
      }
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      await localdb.initialize();

      const results = await localdb.query(`SELECT * FROM profiles WHERE email = ?`, [email]);

      if (results.length === 0) {
        return { data: null, error: { message: 'Invalid email or password' } };
      }

      currentUser = results[0];
      localStorage.setItem('brandtracker-user', JSON.stringify(currentUser));

      return { data: { user: currentUser, session: { user: currentUser } }, error: null };
    },

    signOut: async () => {
      currentUser = null;
      localStorage.removeItem('brandtracker-user');
      return { error: null };
    },

    getSession: async () => {
      const stored = localStorage.getItem('brandtracker-user');
      if (stored) {
        currentUser = JSON.parse(stored);
        return { data: { session: { user: currentUser } }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    getUser: async () => {
      const stored = localStorage.getItem('brandtracker-user');
      if (stored) {
        currentUser = JSON.parse(stored);
        return { data: { user: currentUser }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      setTimeout(() => {
        const stored = localStorage.getItem('brandtracker-user');
        if (stored) {
          currentUser = JSON.parse(stored);
          callback('SIGNED_IN', { user: currentUser });
        } else {
          callback('SIGNED_OUT', null);
        }
      }, 0);

      return { data: { subscription: { unsubscribe: () => {} } } };
    },

    resetPasswordForEmail: async (email: string) => {
      return { data: null, error: null };
    }
  };

  from(table: string) {
    return new QueryBuilder(table);
  }
}

class QueryBuilder {
  private table: string;
  private selectFields = '*';
  private whereConditions: Array<{ field: string; operator: string; value: any }> = [];
  private orderByField: string | null = null;
  private orderDirection: 'asc' | 'desc' = 'asc';
  private limitValue: number | null = null;
  private insertData: any = null;
  private updateData: any = null;
  private singleMode = false;
  private maybeSingleMode = false;
  private inValues: { field: string; values: any[] } | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '=', value });
    return this;
  }

  neq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '!=', value });
    return this;
  }

  in(field: string, values: any[]) {
    this.inValues = { field, values };
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderByField = field;
    this.orderDirection = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleMode = true;
    return this;
  }

  insert(data: any) {
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  async delete() {
    await localdb.initialize();

    let sql = `DELETE FROM ${this.table}`;
    const params: any[] = [];

    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.whereConditions.map(c => {
        params.push(c.value);
        return `${c.field} ${c.operator} ?`;
      }).join(' AND ');
    }

    try {
      await localdb.run(sql, params);
      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  private async executeSelect() {
    await localdb.initialize();

    let sql = `SELECT ${this.selectFields} FROM ${this.table}`;
    const params: any[] = [];

    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.whereConditions.map(c => {
        params.push(c.value);
        return `${c.field} ${c.operator} ?`;
      }).join(' AND ');
    }

    if (this.inValues) {
      if (params.length === 0) sql += ' WHERE ';
      else sql += ' AND ';

      const placeholders = this.inValues.values.map(() => '?').join(',');
      sql += `${this.inValues.field} IN (${placeholders})`;
      params.push(...this.inValues.values);
    }

    if (this.orderByField) {
      sql += ` ORDER BY ${this.orderByField} ${this.orderDirection.toUpperCase()}`;
    }

    if (this.limitValue) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    try {
      const results = await localdb.query(sql, params);

      const convertedResults = results.map(row => {
        const converted: any = {};
        for (const key in row) {
          const value = row[key];
          if (key.includes('INTEGER') || typeof value === 'number') {
            converted[key] = value;
          } else if (value === 0 || value === 1) {
            const boolFields = ['onboarding_completed', 'is_admin', 'is_active', 'is_user_brand'];
            if (boolFields.includes(key)) {
              converted[key] = value === 1;
            } else {
              converted[key] = value;
            }
          } else {
            converted[key] = value;
          }
        }
        return converted;
      });

      if (this.singleMode || this.maybeSingleMode) {
        if (convertedResults.length === 0) {
          if (this.singleMode) {
            return { data: null, error: { message: 'No rows found' } };
          }
          return { data: null, error: null };
        }
        return { data: convertedResults[0], error: null };
      }

      return { data: convertedResults, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  private async executeInsert() {
    await localdb.initialize();

    if (!this.insertData) {
      return { data: null, error: { message: 'No data to insert' } };
    }

    const data = Array.isArray(this.insertData) ? this.insertData : [this.insertData];

    try {
      for (const item of data) {
        if (!item.id) {
          item.id = localdb.generateId();
        }

        const fields = Object.keys(item);
        const values = Object.values(item);
        const placeholders = fields.map(() => '?').join(',');

        const sql = `INSERT INTO ${this.table} (${fields.join(',')}) VALUES (${placeholders})`;
        await localdb.run(sql, values);
      }

      return { data: data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  private async executeUpdate() {
    await localdb.initialize();

    if (!this.updateData) {
      return { data: null, error: { message: 'No data to update' } };
    }

    const fields = Object.keys(this.updateData);
    const values = Object.values(this.updateData);

    let sql = `UPDATE ${this.table} SET ${fields.map(f => `${f} = ?`).join(', ')}`;
    const params = [...values];

    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.whereConditions.map(c => {
        params.push(c.value);
        return `${c.field} ${c.operator} ?`;
      }).join(' AND ');
    }

    try {
      await localdb.run(sql, params);
      return { data: this.updateData, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async then(resolve: any, reject?: any) {
    try {
      let result;

      if (this.insertData) {
        result = await this.executeInsert();
      } else if (this.updateData) {
        result = await this.executeUpdate();
      } else {
        result = await this.executeSelect();
      }

      resolve(result);
    } catch (error) {
      if (reject) reject(error);
      else resolve({ data: null, error });
    }
  }
}

export const localSupabase = new LocalSupabaseClient();
