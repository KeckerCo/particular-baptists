CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    lifespan TEXT,
    bio TEXT
);

CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    year INTEGER,
    summary TEXT,
    source_pdf_name TEXT,
    source_page_start INTEGER,
    source_page_end INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    heading TEXT NOT NULL,
    section_order INTEGER NOT NULL DEFAULT 0,
    page_start INTEGER,
    page_end INTEGER,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    UNIQUE (work_id, slug)
);

CREATE TABLE IF NOT EXISTS search_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER NOT NULL,
    section_id INTEGER,
    author_id INTEGER,
    chunk_order INTEGER NOT NULL DEFAULT 0,
    page_anchor TEXT,
    body_text TEXT NOT NULL,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS search_chunks_fts USING fts5(
    body_text,
    content='search_chunks',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS search_chunks_ai AFTER INSERT ON search_chunks BEGIN
    INSERT INTO search_chunks_fts(rowid, body_text) VALUES (new.id, new.body_text);
END;

CREATE TRIGGER IF NOT EXISTS search_chunks_ad AFTER DELETE ON search_chunks BEGIN
    INSERT INTO search_chunks_fts(search_chunks_fts, rowid, body_text)
    VALUES ('delete', old.id, old.body_text);
END;

CREATE TRIGGER IF NOT EXISTS search_chunks_au AFTER UPDATE ON search_chunks BEGIN
    INSERT INTO search_chunks_fts(search_chunks_fts, rowid, body_text)
    VALUES ('delete', old.id, old.body_text);
    INSERT INTO search_chunks_fts(rowid, body_text) VALUES (new.id, new.body_text);
END;
