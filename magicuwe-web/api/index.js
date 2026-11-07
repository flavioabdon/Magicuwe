const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Cargar variables de entorno desde .env si existe
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath) && !process.env.GOOGLE_CLIENT_ID) {
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envPath);
    } else {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[k]) process.env[k] = v;
          }
        }
      }
    }
  } catch (_e) {}
}

const SECRET = process.env.MAGICUWE_SECRET || 'magicuwe-lmu-thesis-secret-key-2026';
const IS_VERCEL = !!process.env.VERCEL;
const DB_DIR = IS_VERCEL ? os.tmpdir() : path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'magicuwe.sqlite');
const JSON_FALLBACK_PATH = path.join(DB_DIR, 'magicuwe_fallback.json');

let sqliteModule = null;
try {
  sqliteModule = require('node:sqlite');
} catch (_e) {
  sqliteModule = null;
}

let db = null;
function getDb() {
  if (db) return db;
  if (sqliteModule && sqliteModule.DatabaseSync) {
    db = new sqliteModule.DatabaseSync(DB_PATH);
    initSchema(db);
    return db;
  }
  return null;
}

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT,
      provider TEXT NOT NULL DEFAULT 'local',
      avatar TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      model_json TEXT NOT NULL,
      xml_content TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      stereotype TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS elements (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      parent_element_id TEXT,
      uml_type TEXT NOT NULL,
      stereotype TEXT,
      name TEXT NOT NULL,
      attributes_json TEXT,
      operations_json TEXT,
      tags_json TEXT
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      uml_type TEXT NOT NULL,
      stereotype TEXT,
      name TEXT,
      source_mult TEXT,
      target_mult TEXT,
      tags_json TEXT
    );

    CREATE TABLE IF NOT EXISTS diagrams (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      name TEXT NOT NULL,
      diagram_type TEXT NOT NULL,
      nodes_json TEXT NOT NULL,
      edges_json TEXT NOT NULL
    );
  `);
}

function readFallbackStore() {
  if (!fs.existsSync(JSON_FALLBACK_PATH)) {
    return { users: [], projects: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(JSON_FALLBACK_PATH, 'utf8'));
  } catch (_e) {
    return { users: [], projects: [] };
  }
}

function writeFallbackStore(store) {
  fs.writeFileSync(JSON_FALLBACK_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function hashPassword(password) {
  return crypto.createHmac('sha256', SECRET).update(String(password)).digest('hex');
}

function signToken(user) {
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    avatar: user.avatar || '',
    exp: Date.now() + 1000 * 60 * 60 * 24 * 14
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch (_e) {
    return null;
  }
}

function syncRelationalTables(database, projectId, model) {
  if (!database || !model) return;
  database.prepare('DELETE FROM packages WHERE project_id = ?').run(projectId);
  database.prepare('DELETE FROM elements WHERE project_id = ?').run(projectId);
  database.prepare('DELETE FROM relationships WHERE project_id = ?').run(projectId);
  database.prepare('DELETE FROM diagrams WHERE project_id = ?').run(projectId);

  const insPkg = database.prepare('INSERT OR REPLACE INTO packages (id, project_id, name, stereotype) VALUES (?, ?, ?, ?)');
  for (const pkg of (model.packages || [])) {
    insPkg.run(`${projectId}_${pkg.id}`, projectId, pkg.name || '', pkg.stereotype || '');
  }

  const insEl = database.prepare(`
    INSERT OR REPLACE INTO elements
    (id, project_id, package_id, parent_element_id, uml_type, stereotype, name, attributes_json, operations_json, tags_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const el of (model.elements || [])) {
    insEl.run(
      `${projectId}_${el.id}`,
      projectId,
      el.packageId || '',
      el.parentId || null,
      el.umlType || 'Class',
      el.stereotype || '',
      el.name || '',
      JSON.stringify(el.attributes || []),
      JSON.stringify(el.operations || []),
      JSON.stringify(el.tags || {})
    );
  }

  const insRel = database.prepare(`
    INSERT OR REPLACE INTO relationships
    (id, project_id, source_id, target_id, uml_type, stereotype, name, source_mult, target_mult, tags_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const rel of (model.relationships || [])) {
    insRel.run(
      `${projectId}_${rel.id}`,
      projectId,
      rel.sourceId || '',
      rel.targetId || '',
      rel.umlType || 'Association',
      rel.stereotype || '',
      rel.name || '',
      rel.sourceMult || '',
      rel.targetMult || '',
      JSON.stringify(rel.tags || {})
    );
  }

  const insDg = database.prepare(`
    INSERT OR REPLACE INTO diagrams
    (id, project_id, package_id, name, diagram_type, nodes_json, edges_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const dg of (model.diagrams || [])) {
    insDg.run(
      `${projectId}_${dg.id}`,
      projectId,
      dg.packageId || '',
      dg.name || '',
      dg.diagramType || 'NAVIGATION',
      JSON.stringify(dg.nodes || []),
      JSON.stringify(dg.edges || [])
    );
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      if (!raw.length) return resolve({});
      try {
        resolve(JSON.parse(raw.toString('utf8')));
      } catch (_e) {
        resolve({ _rawBuffer: raw });
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.searchParams.get('_path')
    ? ('/' + parsedUrl.searchParams.get('_path'))
    : (parsedUrl.pathname.replace(/^\/api/, '') || '/');
  if (pathname === '/index.js' || pathname === '/[...all].js') {
    pathname = '/';
  }
  const database = getDb();

  try {
    // 0. GET /api/auth/config
    if (req.method === 'GET' && pathname === '/auth/config') {
      return sendJson(res, 200, {
        googleClientId: process.env.GOOGLE_CLIENT_ID || '',
        isGoogleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
        appVersion: '1.5.0'
      });
    }

    // 1. POST /api/auth/register
    if (req.method === 'POST' && pathname === '/auth/register') {
      const body = await parseBody(req);
      const email = String(body.email || body.username || '').trim().toLowerCase();
      const name = String(body.name || email.split('@')[0] || 'Usuario UWE').trim();
      const password = String(body.password || '');
      if (!email || !password) {
        return sendJson(res, 400, { error: 'Ingresa usuario/correo y contraseña.' });
      }
      if (password.length < 4) {
        return sendJson(res, 400, { error: 'La contraseña debe tener al menos 4 caracteres.' });
      }
      const id = 'usr_' + crypto.randomUUID().slice(0, 12);
      const now = new Date().toISOString();
      const pwdHash = hashPassword(password);
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FFE2C6&color=280000`;

      if (database) {
        const existing = database.prepare('SELECT id FROM users WHERE lower(email) = ? OR lower(name) = ?').get(email, name.toLowerCase());
        if (existing) {
          return sendJson(res, 409, { error: 'El correo o nombre de usuario ya está registrado. Inicia sesión.' });
        }
        database.prepare(
          'INSERT INTO users (id, email, name, password_hash, provider, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(id, email, name, pwdHash, 'local', avatar, now);
      } else {
        const store = readFallbackStore();
        if (store.users.some(u => u.email.toLowerCase() === email || u.name.toLowerCase() === name.toLowerCase())) {
          return sendJson(res, 409, { error: 'El correo o nombre de usuario ya está registrado.' });
        }
        store.users.push({ id, email, name, password_hash: pwdHash, provider: 'local', avatar, created_at: now });
        writeFallbackStore(store);
      }

      const user = { id, email, name, provider: 'local', avatar };
      return sendJson(res, 200, { user, token: signToken(user) });
    }

    // 2. POST /api/auth/login
    if (req.method === 'POST' && pathname === '/auth/login') {
      const body = await parseBody(req);
      const identifier = String(body.email || body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!identifier || !password) {
        return sendJson(res, 400, { error: 'Ingresa correo o usuario y contraseña.' });
      }
      const pwdHash = hashPassword(password);

      let row = null;
      if (database) {
        row = database.prepare('SELECT * FROM users WHERE lower(email) = ? OR lower(name) = ?').get(identifier, identifier);
      } else {
        const store = readFallbackStore();
        row = store.users.find(u => u.email.toLowerCase() === identifier || u.name.toLowerCase() === identifier);
      }

      if (!row || (row.password_hash && row.password_hash !== pwdHash)) {
        return sendJson(res, 401, { error: 'Credenciales inválidas. Revisa tu usuario/correo y contraseña.' });
      }
      const user = { id: row.id, email: row.email, name: row.name, provider: row.provider, avatar: row.avatar };
      return sendJson(res, 200, { user, token: signToken(user) });
    }

    // 3. POST /api/auth/google (Supports both Google Identity JWT credential and interactive Gmail sign-in)
    if (req.method === 'POST' && pathname === '/auth/google') {
      const body = await parseBody(req);
      let email = '';
      let name = '';
      let avatar = '';

      if (body.credential) {
        // Decode Google ID Token JWT payload
        const parts = String(body.credential).split('.');
        if (parts.length >= 2) {
          try {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
            if (payload.exp && payload.exp < Date.now() / 1000) {
              return sendJson(res, 401, { error: 'El token de Google ha expirado. Por favor intenta nuevamente.' });
            }
            email = String(payload.email || '').toLowerCase();
            name = String(payload.name || email.split('@')[0]);
            avatar = String(payload.picture || '');
          } catch (e) {
            return sendJson(res, 400, { error: 'Token de Google no válido: ' + e.message });
          }
        }
      } else {
        email = String(body.email || '').trim().toLowerCase();
        if (email && !email.includes('@')) email += '@gmail.com';
        name = String(body.name || email.split('@')[0] || 'Investigador Gmail').trim();
        avatar = body.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EA4335&color=FFFFFF`;
      }

      if (!email) {
        return sendJson(res, 400, { error: 'Cuenta de Gmail no válida.' });
      }

      const now = new Date().toISOString();
      let userRow = null;
      if (database) {
        userRow = database.prepare('SELECT * FROM users WHERE lower(email) = ?').get(email);
        if (!userRow) {
          const id = 'usr_ggl_' + crypto.randomUUID().slice(0, 10);
          database.prepare(
            'INSERT INTO users (id, email, name, password_hash, provider, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(id, email, name, '', 'google', avatar, now);
          userRow = { id, email, name, provider: 'google', avatar };
        } else if (avatar && (!userRow.avatar || userRow.avatar.includes('ui-avatars'))) {
          database.prepare('UPDATE users SET avatar = ?, name = ? WHERE id = ?').run(avatar, name, userRow.id);
          userRow.avatar = avatar;
          userRow.name = name;
        }
      } else {
        const store = readFallbackStore();
        userRow = store.users.find(u => u.email.toLowerCase() === email);
        if (!userRow) {
          userRow = {
            id: 'usr_ggl_' + crypto.randomUUID().slice(0, 10),
            email,
            name,
            provider: 'google',
            avatar,
            created_at: now
          };
          store.users.push(userRow);
          writeFallbackStore(store);
        }
      }

      const user = {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        provider: 'google',
        avatar: userRow.avatar
      };
      return sendJson(res, 200, { user, token: signToken(user) });
    }

    // 4. GET /api/auth/me
    if (req.method === 'GET' && pathname === '/auth/me') {
      const user = verifyToken(req.headers.authorization);
      if (!user) return sendJson(res, 401, { error: 'No autenticado' });
      return sendJson(res, 200, { user });
    }

    // 5. GET /api/projects
    if (req.method === 'GET' && pathname === '/projects') {
      const user = verifyToken(req.headers.authorization) || { id: 'public_guest' };
      if (database) {
        const rows = database.prepare(
          'SELECT id, user_id, name, description, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
        ).all(user.id);
        return sendJson(res, 200, { projects: rows, engine: 'SQLite 3 (node:sqlite)', dbPath: DB_PATH });
      } else {
        const store = readFallbackStore();
        const rows = store.projects.filter(p => p.user_id === user.id);
        return sendJson(res, 200, { projects: rows, engine: 'SQLite Compatible Store' });
      }
    }

    // 6. POST /api/projects (Save / Upsert project into SQLite)
    if (req.method === 'POST' && pathname === '/projects') {
      const user = verifyToken(req.headers.authorization) || { id: 'public_guest' };
      const body = await parseBody(req);
      const id = body.id || ('prj_' + crypto.randomUUID().slice(0, 10));
      const name = String(body.name || 'Proyecto UWE').trim();
      const description = String(body.description || 'Modelo UWE 3.0').trim();
      const modelObj = body.model || {};
      const modelJson = JSON.stringify(modelObj);
      const xmlContent = String(body.xmlContent || body.xml || '');
      const now = new Date().toISOString();

      if (database) {
        const existing = database.prepare('SELECT id, created_at FROM projects WHERE id = ?').get(id);
        const createdAt = existing ? existing.created_at : now;
        database.prepare(`
          INSERT OR REPLACE INTO projects (id, user_id, name, description, model_json, xml_content, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, user.id, name, description, modelJson, xmlContent, createdAt, now);

        syncRelationalTables(database, id, modelObj);
      } else {
        const store = readFallbackStore();
        const idx = store.projects.findIndex(p => p.id === id);
        const record = {
          id,
          user_id: user.id,
          name,
          description,
          model_json: modelJson,
          xml_content: xmlContent,
          created_at: idx >= 0 ? store.projects[idx].created_at : now,
          updated_at: now
        };
        if (idx >= 0) store.projects[idx] = record;
        else store.projects.unshift(record);
        writeFallbackStore(store);
      }

      return sendJson(res, 200, {
        ok: true,
        id,
        name,
        updated_at: now,
        project: { id, name, description, updated_at: now },
        engine: database ? 'SQLite 3 Nativo (magicuwe.sqlite)' : 'SQLite Store'
      });
    }

    // 6b. PUT /api/projects/:id (Update existing project in SQLite)
    const projPutMatch = pathname.match(/^\/projects\/([^/]+)$/);
    if (req.method === 'PUT' && projPutMatch) {
      const projId = projPutMatch[1];
      const user = verifyToken(req.headers.authorization) || { id: 'public_guest' };
      const body = await parseBody(req);
      const name = String(body.name || 'Proyecto UWE').trim();
      const description = String(body.description || '').trim();
      const modelObj = body.model || {};
      const modelJson = JSON.stringify(modelObj);
      const xmlContent = String(body.xmlContent || body.xml || '');
      const now = new Date().toISOString();

      if (database) {
        const existing = database.prepare('SELECT id, created_at FROM projects WHERE id = ?').get(projId);
        const createdAt = existing ? existing.created_at : now;
        database.prepare(`
          INSERT OR REPLACE INTO projects (id, user_id, name, description, model_json, xml_content, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(projId, user.id, name, description, modelJson, xmlContent, createdAt, now);

        syncRelationalTables(database, projId, modelObj);
      } else {
        const store = readFallbackStore();
        const idx = store.projects.findIndex(p => p.id === projId);
        const record = {
          id: projId,
          user_id: user.id,
          name,
          description,
          model_json: modelJson,
          xml_content: xmlContent,
          created_at: idx >= 0 ? store.projects[idx].created_at : now,
          updated_at: now
        };
        if (idx >= 0) store.projects[idx] = record;
        else store.projects.unshift(record);
        writeFallbackStore(store);
      }

      return sendJson(res, 200, {
        ok: true,
        id: projId,
        project: { id: projId, name, updated_at: now }
      });
    }

    // 7. GET /api/projects/:id
    const projMatch = pathname.match(/^\/projects\/([^/]+)$/);
    if (req.method === 'GET' && projMatch) {
      const projId = projMatch[1];
      let row = null;
      if (database) {
        row = database.prepare('SELECT * FROM projects WHERE id = ?').get(projId);
      } else {
        const store = readFallbackStore();
        row = store.projects.find(p => p.id === projId);
      }
      if (!row) return sendJson(res, 404, { error: 'Proyecto no encontrado.' });
      return sendJson(res, 200, {
        project: {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          description: row.description,
          model: JSON.parse(row.model_json || '{}'),
          xml: row.xml_content || '',
          created_at: row.created_at,
          updated_at: row.updated_at
        }
      });
    }

    // 8. DELETE /api/projects/:id
    if (req.method === 'DELETE' && projMatch) {
      const projId = projMatch[1];
      if (database) {
        database.prepare('DELETE FROM projects WHERE id = ?').run(projId);
        database.prepare('DELETE FROM packages WHERE project_id = ?').run(projId);
        database.prepare('DELETE FROM elements WHERE project_id = ?').run(projId);
        database.prepare('DELETE FROM relationships WHERE project_id = ?').run(projId);
        database.prepare('DELETE FROM diagrams WHERE project_id = ?').run(projId);
      } else {
        const store = readFallbackStore();
        store.projects = store.projects.filter(p => p.id !== projId);
        writeFallbackStore(store);
      }
      return sendJson(res, 200, { ok: true });
    }

    // 9. POST /api/sqlite/export (Creates a standalone portable .uwe.sqlite binary file for the current project)
    if (req.method === 'POST' && pathname === '/sqlite/export') {
      const body = await parseBody(req);
      const projName = String(body.name || (body.project && body.project.name) || 'Proyecto_UWE').trim();
      const projModel = body.model || (body.project && body.project.model) || {};
      const projXml = String(body.xmlContent || body.xml || (body.project && body.project.xml) || '');
      const projId = body.id || (body.project && body.project.id) || 'prj_export';
      const tmpSqlitePath = path.join(os.tmpdir(), `export_${Date.now()}_${Math.random().toString(36).slice(2)}.uwe.sqlite`);

      if (sqliteModule && sqliteModule.DatabaseSync) {
        const expDb = new sqliteModule.DatabaseSync(tmpSqlitePath);
        initSchema(expDb);
        const now = new Date().toISOString();
        expDb.prepare(`
          INSERT INTO projects (id, user_id, name, description, model_json, xml_content, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projId,
          'uwe_user',
          projName,
          'Exported MagicUWE Project',
          JSON.stringify(projModel),
          projXml,
          now,
          now
        );
        syncRelationalTables(expDb, projId, projModel);
        expDb.close();

        const fileBuffer = fs.readFileSync(tmpSqlitePath);
        try { fs.unlinkSync(tmpSqlitePath); } catch (_e) {}

        const filename = `${projName.replace(/[^a-zA-Z0-9_-]/g, '_')}.uwe.sqlite`;
        const accept = req.headers.accept || '';

        if (accept.includes('application/x-sqlite3') || accept.includes('application/octet-stream')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/x-sqlite3');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          return res.end(fileBuffer);
        }

        return sendJson(res, 200, {
          ok: true,
          filename,
          sizeBytes: fileBuffer.length,
          base64: fileBuffer.toString('base64')
        });
      } else {
        return sendJson(res, 500, { error: 'SQLite binary export requires node:sqlite.' });
      }
    }

    // 10. POST /api/sqlite/import (Reads an uploaded .uwe.sqlite binary file and returns its UWE project model)
    if (req.method === 'POST' && pathname === '/sqlite/import') {
      const body = await parseBody(req);
      const base64Data = body.base64 || body.base64Sqlite || '';
      if (!base64Data) {
        return sendJson(res, 400, { error: 'No se recibió el archivo SQLite.' });
      }
      const rawBuffer = Buffer.from(base64Data, 'base64');
      const tmpSqlitePath = path.join(os.tmpdir(), `import_${Date.now()}_${Math.random().toString(36).slice(2)}.uwe.sqlite`);
      fs.writeFileSync(tmpSqlitePath, rawBuffer);

      try {
        if (sqliteModule && sqliteModule.DatabaseSync) {
          const impDb = new sqliteModule.DatabaseSync(tmpSqlitePath);
          const projRow = impDb.prepare('SELECT * FROM projects LIMIT 1').get();
          const pkgRows = impDb.prepare('SELECT * FROM packages').all();
          const elRows = impDb.prepare('SELECT * FROM elements').all();
          const relRows = impDb.prepare('SELECT * FROM relationships').all();
          const dgRows = impDb.prepare('SELECT * FROM diagrams').all();
          impDb.close();
          try { fs.unlinkSync(tmpSqlitePath); } catch (_e) {}

          if (projRow && projRow.model_json) {
            const parsedModel = JSON.parse(projRow.model_json);
            return sendJson(res, 200, {
              ok: true,
              model: parsedModel,
              project: {
                id: projRow.id,
                name: projRow.name,
                description: projRow.description,
                model: parsedModel,
                xml: projRow.xml_content || ''
              },
              stats: {
                packages: pkgRows.length,
                elements: elRows.length,
                relationships: relRows.length,
                diagrams: dgRows.length
              }
            });
          }
        }
      } catch (err) {
        try { fs.unlinkSync(tmpSqlitePath); } catch (_e) {}
        return sendJson(res, 400, { error: 'Archivo SQLite inválido: ' + err.message });
      }
      return sendJson(res, 400, { error: 'No se encontró un proyecto UWE válido en el archivo SQLite.' });
    }

    // 11. GET /api/sqlite/inspect?projectId=...
    if (req.method === 'GET' && pathname === '/sqlite/inspect') {
      const projectId = parsedUrl.searchParams.get('projectId') || '';
      let fileSizeBytes = 0;
      try {
        if (fs.existsSync(DB_PATH)) {
          fileSizeBytes = fs.statSync(DB_PATH).size;
        }
      } catch (_e) {}

      if (database) {
        const usersCount = database.prepare('SELECT COUNT(*) as c FROM users').get()?.c || 0;
        const projectsCount = database.prepare('SELECT COUNT(*) as c FROM projects').get()?.c || 0;
        const packages = projectId
          ? database.prepare('SELECT * FROM packages WHERE project_id = ?').all(projectId)
          : database.prepare('SELECT * FROM packages LIMIT 50').all();
        const elements = projectId
          ? database.prepare('SELECT id, package_id, parent_element_id, uml_type, stereotype, name, attributes_json, tags_json FROM elements WHERE project_id = ?').all(projectId)
          : database.prepare('SELECT id, package_id, parent_element_id, uml_type, stereotype, name, attributes_json, tags_json FROM elements LIMIT 100').all();
        const relationships = projectId
          ? database.prepare('SELECT * FROM relationships WHERE project_id = ?').all(projectId)
          : database.prepare('SELECT * FROM relationships LIMIT 100').all();
        const diagrams = projectId
          ? database.prepare('SELECT id, package_id, name, diagram_type FROM diagrams WHERE project_id = ?').all(projectId)
          : database.prepare('SELECT id, package_id, name, diagram_type FROM diagrams LIMIT 50').all();

        return sendJson(res, 200, {
          engine: 'SQLite 3 (node:sqlite)',
          dbPath: DB_PATH,
          fileSizeBytes,
          counts: {
            users: usersCount,
            projects: projectsCount,
            packages: packages.length,
            elements: elements.length,
            relationships: relationships.length,
            diagrams: diagrams.length
          },
          tables: { packages, elements, relationships, diagrams }
        });
      }
      return sendJson(res, 200, {
        engine: 'Fallback JSON',
        fileSizeBytes,
        counts: { users: 0, projects: 0, packages: 0, elements: 0, relationships: 0, diagrams: 0 },
        tables: { packages: [], elements: [], relationships: [], diagrams: [] }
      });
    }

    return sendJson(res, 404, { error: `Ruta API no encontrada: ${pathname}` });
  } catch (err) {
    return sendJson(res, 500, { error: err.message || 'Error interno del servidor' });
  }
};

