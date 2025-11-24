use std::{
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

use rusqlite::{named_params, params, Connection};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

#[derive(Debug)]
pub struct Library {
    db_path: PathBuf,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LibraryItem {
    pub id: String,
    pub title: String,
    pub body: String,
    pub item_type: String,
    pub source: String,
    pub tags: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub version: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedResult {
    pub inserted: usize,
    pub skipped: usize,
}

impl Library {
    pub fn initialize(app: &AppHandle) -> Result<Self, String> {
        let base_dir = app
            .path_resolver()
            .app_data_dir()
            .ok_or_else(|| "Unable to resolve app data directory".to_string())?;

        fs::create_dir_all(&base_dir).map_err(|e| format!("Failed to create app data dir: {e}"))?;
        let db_path = base_dir.join("library.sqlite3");

        let library = Self { db_path };
        let conn = library.open_conn()?;
        library.apply_migrations(&conn)?;
        library.seed_if_empty(&conn)?;

        Ok(library)
    }

    fn open_conn(&self) -> Result<Connection, String> {
        Connection::open(&self.db_path).map_err(|e| format!("Failed to open library DB: {e}"))
    }

    fn apply_migrations(&self, conn: &Connection) -> Result<(), String> {
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                item_type TEXT NOT NULL,
                source TEXT NOT NULL,
                tags TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                version INTEGER NOT NULL,
                sync_state TEXT DEFAULT 'clean',
                hash TEXT DEFAULT ''
            );
            "#,
        )
        .map_err(|e| format!("Failed to run migrations: {e}"))?;

        Ok(())
    }

    fn seed_if_empty(&self, conn: &Connection) -> Result<SeedResult, String> {
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM items", [], |row| row.get(0))
            .map_err(|e| format!("Failed to count items: {e}"))?;

        if count > 0 {
            return Ok(SeedResult {
                inserted: 0,
                skipped: count as usize,
            });
        }

        self.insert_seed_items(conn)
    }

    fn insert_seed_items(&self, conn: &Connection) -> Result<SeedResult, String> {
        let now = current_ts();
        let seeds = demo_items();
        let total = seeds.len();

        let mut inserted = 0;
        for (idx, item) in seeds.iter().enumerate() {
            let ts = now - ((total - idx - 1) as i64 * 3600);
            let tags = serde_json::to_string(&item.tags)
                .map_err(|e| format!("Failed to serialize tags for seed item: {e}"))?;

            conn.execute(
                "INSERT INTO items (id, title, body, item_type, source, tags, created_at, updated_at, version) 
                 VALUES (:id, :title, :body, :item_type, :source, :tags, :created_at, :updated_at, :version)",
                named_params! {
                    ":id": &item.id,
                    ":title": &item.title,
                    ":body": &item.body,
                    ":item_type": &item.item_type,
                    ":source": &item.source,
                    ":tags": tags,
                    ":created_at": ts,
                    ":updated_at": ts,
                    ":version": 1i64,
                },
            )
            .map_err(|e| format!("Failed to insert seed item: {e}"))?;

            inserted += 1;
        }

        Ok(SeedResult {
            inserted,
            skipped: 0,
        })
    }

    pub fn reseed(&self) -> Result<SeedResult, String> {
        let conn = self.open_conn()?;
        conn.execute("DELETE FROM items", [])
            .map_err(|e| format!("Failed to clear library before reseed: {e}"))?;
        self.insert_seed_items(&conn)
    }

    pub fn list(&self, limit: i64, offset: i64) -> Result<Vec<LibraryItem>, String> {
        let conn = self.open_conn()?;
        let mut stmt = conn
            .prepare(
                "SELECT id, title, body, item_type, source, tags, created_at, updated_at, version 
                 FROM items 
                 ORDER BY updated_at DESC 
                 LIMIT ?1 OFFSET ?2",
            )
            .map_err(|e| format!("Failed to prepare list query: {e}"))?;

        let rows = stmt
            .query_map([limit, offset], |row| map_row(row))
            .map_err(|e| format!("Failed to iterate library rows: {e}"))?;

        collect_rows(rows)
    }

    pub fn search(&self, raw_query: &str, limit: i64) -> Result<Vec<LibraryItem>, String> {
        let conn = self.open_conn()?;
        let query = raw_query.trim();

        if query.is_empty() {
            return self.list(limit, 0);
        }

        let pattern = format!("%{query}%");
        let mut stmt = conn
            .prepare(
                "SELECT id, title, body, item_type, source, tags, created_at, updated_at, version 
                 FROM items 
                 WHERE title LIKE ?1 OR body LIKE ?1 OR tags LIKE ?1 
                 ORDER BY updated_at DESC 
                 LIMIT ?2",
            )
            .map_err(|e| format!("Failed to prepare search query: {e}"))?;

        let rows = stmt
            .query_map(params![pattern, limit], |row| map_row(row))
            .map_err(|e| format!("Failed to search library: {e}"))?;

        collect_rows(rows)
    }
}

fn map_row(row: &rusqlite::Row) -> rusqlite::Result<LibraryItem> {
    let tags_text: String = row.get("tags")?;
    let tags: Vec<String> = serde_json::from_str(&tags_text).unwrap_or_else(|_| {
        tags_text
            .split(',')
            .filter(|t| !t.trim().is_empty())
            .map(|t| t.trim().to_string())
            .collect()
    });

    Ok(LibraryItem {
        id: row.get("id")?,
        title: row.get("title")?,
        body: row.get("body")?,
        item_type: row.get("item_type")?,
        source: row.get("source")?,
        tags,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        version: row.get("version")?,
    })
}

fn collect_rows(
    rows: rusqlite::MappedRows<'_, impl FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<LibraryItem>>,
) -> Result<Vec<LibraryItem>, String> {
    let mut results = Vec::new();
    for row in rows {
        let item = row.map_err(|e| format!("Failed to read row: {e}"))?;
        results.push(item);
    }
    Ok(results)
}

fn current_ts() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn demo_items() -> Vec<SeedItem> {
    vec![
        SeedItem {
            id: "doc-onboarding".into(),
            title: "Onboarding Welcome".into(),
            body: "Welcome new teammates. Outline first-week tasks, key docs, and buddies.".into(),
            item_type: "note".into(),
            source: "dummy".into(),
            tags: vec!["onboarding".into(), "people".into()],
        },
        SeedItem {
            id: "prompt-code-review".into(),
            title: "LLM Code Review".into(),
            body: "You are a senior engineer. Review the following code for correctness, security, and performance. Respond with prioritized issues and concrete fixes.".into(),
            item_type: "prompt".into(),
            source: "dummy".into(),
            tags: vec!["prompt".into(), "code".into(), "quality".into()],
        },
        SeedItem {
            id: "prompt-debug".into(),
            title: "Incident Debug Template".into(),
            body: "Ask clarifying questions, list likely failure domains, propose a minimal debug plan, and suggest quick mitigations.".into(),
            item_type: "prompt".into(),
            source: "dummy".into(),
            tags: vec!["incident".into(), "sre".into()],
        },
        SeedItem {
            id: "faq-security".into(),
            title: "Security FAQ".into(),
            body: "Data residency: US/EU only. PII policy: no storage in logs. Rotation: API keys rotate every 90 days.".into(),
            item_type: "faq".into(),
            source: "dummy".into(),
            tags: vec!["security".into(), "policy".into()],
        },
        SeedItem {
            id: "snippet-typescript".into(),
            title: "TypeScript Error Handler".into(),
            body: "export function handleApiError(err: unknown) { if (err instanceof Error) return err.message; return 'Unexpected error'; }".into(),
            item_type: "snippet".into(),
            source: "dummy".into(),
            tags: vec!["typescript".into(), "snippet".into()],
        },
        SeedItem {
            id: "research-brief".into(),
            title: "Research Brief Template".into(),
            body: "Goal, hypothesis, success metrics, risks, and timeline. Keep to one page.".into(),
            item_type: "note".into(),
            source: "dummy".into(),
            tags: vec!["research".into(), "template".into()],
        },
        SeedItem {
            id: "meeting-notes".into(),
            title: "Weekly Sync Notes".into(),
            body: "Decisions, owners, deadlines. Avoid verbatim transcription.".into(),
            item_type: "note".into(),
            source: "dummy".into(),
            tags: vec!["meetings".into(), "ops".into()],
        },
        SeedItem {
            id: "prompt-product-spec".into(),
            title: "Product Spec Drafter".into(),
            body: "Write a crisp product spec including problem, goals/non-goals, user stories, acceptance criteria, and rollout plan.".into(),
            item_type: "prompt".into(),
            source: "dummy".into(),
            tags: vec!["product".into(), "writing".into()],
        },
        SeedItem {
            id: "prompt-qa".into(),
            title: "QA Checklist".into(),
            body: "Generate a QA checklist covering functional, performance, accessibility, and edge cases based on the feature description.".into(),
            item_type: "prompt".into(),
            source: "dummy".into(),
            tags: vec!["qa".into(), "testing".into()],
        },
        SeedItem {
            id: "snippet-sqlite".into(),
            title: "SQLite FTS Example".into(),
            body: "CREATE VIRTUAL TABLE docs USING fts5(title, body); INSERT INTO docs (title, body) VALUES ('Test', 'Hello world'); SELECT * FROM docs WHERE docs MATCH 'hello';".into(),
            item_type: "snippet".into(),
            source: "dummy".into(),
            tags: vec!["sqlite".into(), "fts".into()],
        },
    ]
}

#[derive(Debug)]
struct SeedItem {
    id: String,
    title: String,
    body: String,
    item_type: String,
    source: String,
    tags: Vec<String>,
}

#[tauri::command]
pub fn search_library(
    state: State<'_, Library>,
    query: Option<String>,
    limit: Option<u32>,
) -> Result<Vec<LibraryItem>, String> {
    let limit = limit.unwrap_or(20) as i64;
    state.search(query.as_deref().unwrap_or(""), limit)
}

#[tauri::command]
pub fn list_library(
    state: State<'_, Library>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<Vec<LibraryItem>, String> {
    state.list(limit.unwrap_or(20) as i64, offset.unwrap_or(0) as i64)
}

#[tauri::command]
pub fn reseed_library(state: State<'_, Library>) -> Result<SeedResult, String> {
    state.reseed()
}
