import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "database.sqlite");

class DBManager {
  private db: any = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // Initialize the sql.js Wasm environment
      const SQL = await initSqlJs();

      if (fs.existsSync(DB_PATH)) {
        try {
          const fileBuffer = fs.readFileSync(DB_PATH);
          this.db = new SQL.Database(fileBuffer);
        } catch (error) {
          console.error("Failed to load existing database file, creating fresh DB:", error);
          this.db = new SQL.Database();
        }
      } else {
        this.db = new SQL.Database();
      }

      // Enable foreign key constraints
      this.db.run("PRAGMA foreign_keys = ON;");

      // Create tables
      this.db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          createdAt TEXT NOT NULL,
          rowCount INTEGER NOT NULL,
          processedCount INTEGER NOT NULL,
          importedCount INTEGER NOT NULL,
          failedCount INTEGER NOT NULL,
          skippedCount INTEGER NOT NULL,
          aiProcessed INTEGER DEFAULT 0,
          aiFailed INTEGER DEFAULT 0,
          processingTime INTEGER DEFAULT 0,
          batchCount INTEGER DEFAULT 0,
          status TEXT NOT NULL,
          error TEXT,
          mappings TEXT
        );
      `);

      // Dynamic alter-table migrations for backward compatibility
      const columnsToMigrate = ["aiProcessed", "aiFailed", "processingTime", "batchCount"];
      for (const col of columnsToMigrate) {
        try {
          this.db.run(`ALTER TABLE sessions ADD COLUMN ${col} INTEGER DEFAULT 0;`);
        } catch (err) {
          // Column already exists, safe to ignore
        }
      }

      this.db.run(`
        CREATE TABLE IF NOT EXISTS records (
          id TEXT PRIMARY KEY,
          sessionId TEXT NOT NULL,
          name TEXT,
          email TEXT,
          phone TEXT,
          company TEXT,
          status TEXT NOT NULL,
          error TEXT,
          FOREIGN KEY (sessionId) REFERENCES sessions (id) ON DELETE CASCADE
        );
      `);

      // Create indexes for search performance
      this.db.run("CREATE INDEX IF NOT EXISTS idx_records_session_id ON records (sessionId);");
      this.db.run("CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status);");

      this.save();
    } catch (err) {
      console.error("Database initialization failed:", err);
      throw err;
    }
  }

  public async waitReady(): Promise<void> {
    await this.initPromise;
  }

  public save(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const tempPath = DB_PATH + ".tmp";
      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, DB_PATH);
    } catch (error) {
      console.error("Failed to save database to disk:", error);
    }
  }

  public async run(query: string, params: any[] = []): Promise<void> {
    await this.waitReady();
    this.db.run(query, params);
    this.save();
  }

  public async get(query: string, params: any[] = []): Promise<any | null> {
    await this.waitReady();
    const stmt = this.db.prepare(query);
    try {
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        return row;
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  public async all(query: string, params: any[] = []): Promise<any[]> {
    await this.waitReady();
    const stmt = this.db.prepare(query);
    const rows: any[] = [];
    try {
      stmt.bind(params);
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return rows;
    } finally {
      stmt.free();
    }
  }
}

export const dbManager = new DBManager();
