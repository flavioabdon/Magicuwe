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
const SEED_DB_PATH = path.join(__dirname, '..', 'data', 'magicuwe.sqlite');
const DB_DIR = IS_VERCEL ? os.tmpdir() : path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'magicuwe.sqlite');
if (IS_VERCEL && !fs.existsSync(DB_PATH) && fs.existsSync(SEED_DB_PATH)) {
  try {
    fs.copyFileSync(SEED_DB_PATH, DB_PATH);
  } catch (_e) {}
}
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

function generateUserId(email, provider = 'local') {
  const clean = String(email || '').trim().toLowerCase();
  const hash = crypto.createHash('sha256').update(clean).digest('hex').slice(0, 14);
  return provider === 'google' ? `usr_ggl_${hash}` : `usr_${hash}`;
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

function isExampleId(id) {
  if (!id) return false;
  const lower = String(id).toLowerCase().trim();
  return (
    lower === 'music_portal' ||
    lower === 'addressbook' ||
    lower === 'example_music' ||
    lower === 'example_addressbook' ||
    lower === 'blank' ||
    lower.startsWith('example_') ||
    lower.startsWith('demo_')
  );
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
      const id = generateUserId(email, 'local');
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

      // Cold-start self-healing on serverless: if row is missing from ephemeral /tmp, auto-provision
      if (!row) {
        const id = generateUserId(identifier, 'local');
        const now = new Date().toISOString();
        const name = identifier.split('@')[0] || 'Usuario UWE';
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FFE2C6&color=280000`;
        if (database) {
          database.prepare(
            'INSERT OR REPLACE INTO users (id, email, name, password_hash, provider, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(id, identifier, name, pwdHash, 'local', avatar, now);
        } else {
          const store = readFallbackStore();
          store.users.push({ id, email: identifier, name, password_hash: pwdHash, provider: 'local', avatar, created_at: now });
          writeFallbackStore(store);
        }
        row = { id, email: identifier, name, password_hash: pwdHash, provider: 'local', avatar };
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
      const id = generateUserId(email, 'google');
      let userRow = null;
      if (database) {
        userRow = database.prepare('SELECT * FROM users WHERE lower(email) = ?').get(email);
        if (!userRow) {
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
            id,
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
      const user = verifyToken(req.headers.authorization) || { id: 'public_guest', email: '' };
      const emailLower = String(user.email || '').trim().toLowerCase();
      const altLocalId = emailLower ? generateUserId(emailLower, 'local') : user.id;
      const altGoogleId = emailLower ? generateUserId(emailLower, 'google') : user.id;

      if (database) {
        const rawRows = database.prepare(`
          SELECT id, user_id, name, description, model_json, xml_content, created_at, updated_at
          FROM projects
          WHERE user_id = ?
             OR user_id = ?
             OR user_id = ?
             OR ( ? != '' AND user_id IN (SELECT id FROM users WHERE lower(email) = ?) )
          ORDER BY updated_at DESC
        `).all(user.id, altLocalId, altGoogleId, emailLower, emailLower);

        const rows = rawRows.map(r => {
          let parsedModel = null;
          try { parsedModel = r.model_json ? JSON.parse(r.model_json) : null; } catch (_e) {}
          return {
            id: r.id,
            user_id: r.user_id,
            name: r.name,
            description: r.description,
            model: parsedModel,
            xmlContent: r.xml_content || '',
            created_at: r.created_at,
            updated_at: r.updated_at
          };
        });
        return sendJson(res, 200, { projects: rows, engine: 'SQLite 3 (node:sqlite)', dbPath: DB_PATH });
      } else {
        const store = readFallbackStore();
        const matchingUserIds = new Set([user.id, altLocalId, altGoogleId]);
        if (emailLower) {
          for (const u of store.users) {
            if ((u.email || '').toLowerCase() === emailLower) matchingUserIds.add(u.id);
          }
        }
        const rows = store.projects
          .filter(p => matchingUserIds.has(p.user_id))
          .map(r => {
            let parsedModel = r.model || null;
            if (!parsedModel && r.model_json) {
              try { parsedModel = JSON.parse(r.model_json); } catch (_e) {}
            }
            return {
              id: r.id,
              user_id: r.user_id,
              name: r.name,
              description: r.description,
              model: parsedModel,
              xmlContent: r.xml_content || r.xmlContent || '',
              created_at: r.created_at,
              updated_at: r.updated_at
            };
          });
        return sendJson(res, 200, { projects: rows, engine: 'SQLite Compatible Store' });
      }
    }

    // 5.5 POST /api/projects/sync (Batch re-hydrate projects from client vault into SQLite)
    if (req.method === 'POST' && pathname === '/projects/sync') {
      const user = verifyToken(req.headers.authorization);
      if (!user) return sendJson(res, 401, { error: 'No autenticado' });
      const body = await parseBody(req);
      const projectsToSync = Array.isArray(body.projects) ? body.projects : [];
      let syncedCount = 0;
      const now = new Date().toISOString();

      for (const p of projectsToSync) {
        if (!p || !p.id || isExampleId(p.id)) continue;
        const id = p.id;
        const name = String(p.name || 'Proyecto UWE').trim();
        const description = String(p.description || 'Modelo UWE 3.0').trim();
        const modelObj = p.model || {};
        const modelJson = JSON.stringify(modelObj);
        const xmlContent = String(p.xmlContent || p.xml || '');
        const createdAt = p.created_at || now;
        const updatedAt = p.updated_at || now;

        if (database) {
          const existing = database.prepare('SELECT id, user_id FROM projects WHERE id = ?').get(id);
          if (existing && existing.user_id && existing.user_id !== user.id) {
            continue; // protect other users' projects
          }
          database.prepare(`
            INSERT OR REPLACE INTO projects (id, user_id, name, description, model_json, xml_content, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(id, user.id, name, description, modelJson, xmlContent, createdAt, updatedAt);
          syncRelationalTables(database, id, modelObj);
          syncedCount++;
        } else {
          const store = readFallbackStore();
          const idx = store.projects.findIndex(item => item.id === id);
          if (idx >= 0 && store.projects[idx].user_id && store.projects[idx].user_id !== user.id) {
            continue;
          }
          const record = { id, user_id: user.id, name, description, model_json: modelJson, xml_content: xmlContent, created_at: createdAt, updated_at: updatedAt };
          if (idx >= 0) store.projects[idx] = record;
          else store.projects.unshift(record);
          writeFallbackStore(store);
          syncedCount++;
        }
      }

      return sendJson(res, 200, { ok: true, syncedCount });
    }

    // 6. POST /api/projects (Save / Upsert project into SQLite)
    if (req.method === 'POST' && pathname === '/projects') {
      const user = verifyToken(req.headers.authorization) || { id: 'public_guest' };
      const body = await parseBody(req);
      let id = body.id || ('prj_' + crypto.randomUUID().slice(0, 10));
      // Protected: never allow saving directly onto an example id
      if (isExampleId(id)) {
        id = 'prj_' + crypto.randomUUID().slice(0, 10);
      }
      const name = String(body.name || 'Proyecto UWE').trim();
      const description = String(body.description || 'Modelo UWE 3.0').trim();
      const modelObj = body.model || {};
      const modelJson = JSON.stringify(modelObj);
      const xmlContent = String(body.xmlContent || body.xml || '');
      const now = new Date().toISOString();

      if (database) {
        const existing = database.prepare('SELECT id, user_id, created_at FROM projects WHERE id = ?').get(id);
        if (existing && existing.user_id && existing.user_id !== user.id) {
          return sendJson(res, 403, {
            ok: false,
            error: 'No tienes permiso para modificar este proyecto ajeno. Solo puedes guardar sobre tus propios proyectos.'
          });
        }

        // Prevent duplicate project name for the same user
        const duplicate = database.prepare(
          'SELECT id, name FROM projects WHERE user_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ?'
        ).get(user.id, name, id);
        if (duplicate) {
          return sendJson(res, 400, {
            ok: false,
            error: `Ya existe un proyecto con el nombre "${name}". Por favor elige un nombre único.`
          });
        }

        const createdAt = existing ? existing.created_at : now;
        database.prepare(`
          INSERT OR REPLACE INTO projects (id, user_id, name, description, model_json, xml_content, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, user.id, name, description, modelJson, xmlContent, createdAt, now);

        syncRelationalTables(database, id, modelObj);
      } else {
        const store = readFallbackStore();
        const idx = store.projects.findIndex(p => p.id === id);
        if (idx >= 0 && store.projects[idx].user_id && store.projects[idx].user_id !== user.id) {
          return sendJson(res, 403, {
            ok: false,
            error: 'No tienes permiso para modificar este proyecto ajeno. Solo puedes guardar sobre tus propios proyectos.'
          });
        }
        // Prevent duplicate project name for the same user
        const duplicate = store.projects.find(
          p => p.user_id === user.id && p.id !== id && p.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (duplicate) {
          return sendJson(res, 400, {
            ok: false,
            error: `Ya existe un proyecto con el nombre "${name}". Por favor elige un nombre único.`
          });
        }
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
      // Examples are strictly READ-ONLY
      if (isExampleId(projId)) {
        return sendJson(res, 403, {
          ok: false,
          error: 'Los ejemplos oficiales de UWE son de solo lectura. Solo se puede guardar sobre proyectos propios.'
        });
      }

      const user = verifyToken(req.headers.authorization) || { id: 'public_guest' };
      const body = await parseBody(req);
      const name = String(body.name || 'Proyecto UWE').trim();
      const description = String(body.description || '').trim();
      const modelObj = body.model || {};
      const modelJson = JSON.stringify(modelObj);
      const xmlContent = String(body.xmlContent || body.xml || '');
      const now = new Date().toISOString();

      if (database) {
        const existing = database.prepare('SELECT id, user_id, created_at FROM projects WHERE id = ?').get(projId);
        if (existing && existing.user_id && existing.user_id !== user.id) {
          return sendJson(res, 403, {
            ok: false,
            error: 'No tienes permiso para modificar este proyecto ajeno. Solo puedes guardar sobre tus propios proyectos.'
          });
        }

        // Prevent renaming to a duplicate project name for the same user
        const duplicate = database.prepare(
          'SELECT id, name FROM projects WHERE user_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ?'
        ).get(user.id, name, projId);
        if (duplicate) {
          return sendJson(res, 400, {
            ok: false,
            error: `Ya existe otro proyecto con el nombre "${name}". Por favor elige un nombre único.`
          });
        }

        const createdAt = existing ? existing.created_at : now;
        database.prepare(`
          INSERT OR REPLACE INTO projects (id, user_id, name, description, model_json, xml_content, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(projId, user.id, name, description, modelJson, xmlContent, createdAt, now);

        syncRelationalTables(database, projId, modelObj);
      } else {
        const store = readFallbackStore();
        const idx = store.projects.findIndex(p => p.id === projId);
        if (idx >= 0 && store.projects[idx].user_id && store.projects[idx].user_id !== user.id) {
          return sendJson(res, 403, {
            ok: false,
            error: 'No tienes permiso para modificar este proyecto ajeno. Solo puedes guardar sobre tus propios proyectos.'
          });
        }
        // Prevent renaming to duplicate
        const duplicate = store.projects.find(
          p => p.user_id === user.id && p.id !== projId && p.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (duplicate) {
          return sendJson(res, 400, {
            ok: false,
            error: `Ya existe otro proyecto con el nombre "${name}". Por favor elige un nombre único.`
          });
        }
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
      let ownerName = 'Usuario Registrado';
      if (database) {
        row = database.prepare('SELECT * FROM projects WHERE id = ?').get(projId);
        if (row && row.user_id) {
          const owner = database.prepare('SELECT name, email FROM users WHERE id = ?').get(row.user_id);
          if (owner) {
            ownerName = owner.name || (owner.email ? owner.email.split('@')[0] : 'Usuario');
          }
        }
      } else {
        const store = readFallbackStore();
        row = store.projects.find(p => p.id === projId);
        if (row && row.user_id) {
          const owner = store.users.find(u => u.id === row.user_id);
          if (owner) {
            ownerName = owner.name || (owner.email ? owner.email.split('@')[0] : 'Usuario');
          }
        }
      }
      if (!row) return sendJson(res, 404, { error: 'Proyecto no encontrado.' });
      return sendJson(res, 200, {
        project: {
          id: row.id,
          user_id: row.user_id,
          owner_name: ownerName,
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
      if (isExampleId(projId)) {
        return sendJson(res, 403, {
          ok: false,
          error: 'Los ejemplos oficiales de UWE son de solo lectura y no pueden eliminarse.'
        });
      }
      const user = verifyToken(req.headers.authorization) || { id: 'public_guest' };
      if (database) {
        const existing = database.prepare('SELECT id, user_id FROM projects WHERE id = ?').get(projId);
        if (existing && existing.user_id && existing.user_id !== user.id) {
          return sendJson(res, 403, {
            ok: false,
            error: 'No tienes permiso para eliminar este proyecto ajeno.'
          });
        }
        database.prepare('DELETE FROM projects WHERE id = ?').run(projId);
        database.prepare('DELETE FROM packages WHERE project_id = ?').run(projId);
        database.prepare('DELETE FROM elements WHERE project_id = ?').run(projId);
        database.prepare('DELETE FROM relationships WHERE project_id = ?').run(projId);
        database.prepare('DELETE FROM diagrams WHERE project_id = ?').run(projId);
      } else {
        const store = readFallbackStore();
        const existing = store.projects.find(p => p.id === projId);
        if (existing && existing.user_id && existing.user_id !== user.id) {
          return sendJson(res, 403, {
            ok: false,
            error: 'No tienes permiso para eliminar este proyecto ajeno.'
          });
        }
        store.projects = store.projects.filter(p => p.id !== projId);
        writeFallbackStore(store);
      }
      return sendJson(res, 200, { ok: true });
    }

    // 9. POST /api/sqlite/export (Creates a standalone portable .sqlite.db binary file for the current project)
    if (req.method === 'POST' && pathname === '/sqlite/export') {
      const body = await parseBody(req);
      const projName = String(body.name || (body.project && body.project.name) || 'Proyecto_UWE').trim();
      const projModel = body.model || (body.project && body.project.model) || {};
      const projXml = String(body.xmlContent || body.xml || (body.project && body.project.xml) || '');
      const projId = body.id || (body.project && body.project.id) || 'prj_export';
      const cleanFileBase = projName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Proyecto_UWE';
      const filename = `${cleanFileBase}.sqlite.db`;
      const tmpSqlitePath = path.join(os.tmpdir(), `export_${Date.now()}_${Math.random().toString(36).slice(2)}.sqlite.db`);

      if (sqliteModule && sqliteModule.DatabaseSync) {
        try {
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
            'Exported MagicUWE Project (.sqlite.db)',
            JSON.stringify(projModel),
            projXml,
            now,
            now
          );
          syncRelationalTables(expDb, projId, projModel);
          expDb.close();

          const fileBuffer = fs.readFileSync(tmpSqlitePath);
          try { fs.unlinkSync(tmpSqlitePath); } catch (_e) {}

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
        } catch (_sqliteErr) {
          try { fs.unlinkSync(tmpSqlitePath); } catch (_e) {}
        }
      }

      // Fallback portable SQLite container if native module is unavailable in runtime
      const portablePayload = JSON.stringify({
        magicuwe_sqlite_version: '1.5.0',
        format: 'MagicUWE_SQLite_DB',
        exported_at: new Date().toISOString(),
        project: {
          id: projId,
          name: projName,
          description: 'Exported MagicUWE Project (.sqlite.db)',
          model: projModel,
          xml: projXml
        },
        tables: {
          packages: projModel.packages || [],
          elements: projModel.elements || [],
          relationships: projModel.relationships || [],
          diagrams: projModel.diagrams || []
        }
      }, null, 2);
      const headerBuf = Buffer.from('SQLite format 3\0-- MagicUWE Portable DB --\n', 'utf8');
      const bodyBuf = Buffer.from(portablePayload, 'utf8');
      const fileBuffer = Buffer.concat([headerBuf, bodyBuf]);

      return sendJson(res, 200, {
        ok: true,
        filename,
        sizeBytes: fileBuffer.length,
        base64: fileBuffer.toString('base64')
      });
    }

    // 10. POST /api/sqlite/import (Reads an uploaded .sqlite.db / .sqlite / .db binary file and returns its UWE project model)
    if (req.method === 'POST' && pathname === '/sqlite/import') {
      const body = await parseBody(req);
      const base64Data = body.base64 || body.base64Sqlite || '';
      if (!base64Data) {
        return sendJson(res, 400, { error: 'No se recibió el archivo SQLite (.sqlite.db).' });
      }
      const rawBuffer = Buffer.from(base64Data, 'base64');

      // 1. Check if it is a portable container or raw JSON first
      const rawStr = rawBuffer.toString('utf8');
      const marker = '-- MagicUWE Portable DB --\n';
      const markerIdx = rawStr.indexOf(marker);
      if (markerIdx !== -1) {
        try {
          const jsonPart = rawStr.slice(markerIdx + marker.length).trim();
          const parsed = JSON.parse(jsonPart);
          if (parsed && parsed.project && parsed.project.model) {
            const m = parsed.project.model;
            return sendJson(res, 200, {
              ok: true,
              model: m,
              project: parsed.project,
              stats: {
                packages: (m.packages || []).length,
                elements: (m.elements || []).length,
                relationships: (m.relationships || []).length,
                diagrams: (m.diagrams || []).length
              }
            });
          }
        } catch (err) {
          return sendJson(res, 400, { error: 'Archivo .sqlite.db corrupto: ' + err.message });
        }
      }

      // 2. Try native SQLite 3 binary inspection via node:sqlite
      if (sqliteModule && sqliteModule.DatabaseSync) {
        const tmpSqlitePath = path.join(os.tmpdir(), `import_${Date.now()}_${Math.random().toString(36).slice(2)}.sqlite.db`);
        try {
          fs.writeFileSync(tmpSqlitePath, rawBuffer);
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
        } catch (_err) {
          try { fs.unlinkSync(tmpSqlitePath); } catch (_e) {}
        }
      }

      // 3. Fallback: scan SQLite binary pages for embedded UTF-8 model_json
      const pkgKeyIdx = rawStr.indexOf('"packages":[');
      if (pkgKeyIdx !== -1) {
        let startIdx = rawStr.lastIndexOf('{"id":', pkgKeyIdx);
        if (startIdx === -1 || pkgKeyIdx - startIdx > 600) {
          startIdx = rawStr.lastIndexOf('{"name":', pkgKeyIdx);
        }
        if (startIdx !== -1) {
          let depth = 0;
          let inStr = false;
          let esc = false;
          for (let i = startIdx; i < rawStr.length; i++) {
            const ch = rawStr[i];
            if (esc) { esc = false; continue; }
            if (ch === '\\') { esc = true; continue; }
            if (ch === '"') { inStr = !inStr; continue; }
            if (!inStr) {
              if (ch === '{') depth++;
              else if (ch === '}') {
                depth--;
                if (depth === 0) {
                  try {
                    const parsedModel = JSON.parse(rawStr.slice(startIdx, i + 1));
                    if (parsedModel && Array.isArray(parsedModel.packages) && Array.isArray(parsedModel.diagrams)) {
                      return sendJson(res, 200, {
                        ok: true,
                        model: parsedModel,
                        project: {
                          id: parsedModel.id || 'prj_imported',
                          name: parsedModel.name || 'Proyecto_Importado',
                          description: 'Proyecto importado desde .sqlite.db',
                          model: parsedModel,
                          xml: ''
                        },
                        stats: {
                          packages: (parsedModel.packages || []).length,
                          elements: (parsedModel.elements || []).length,
                          relationships: (parsedModel.relationships || []).length,
                          diagrams: (parsedModel.diagrams || []).length
                        }
                      });
                    }
                  } catch (_e) {}
                  break;
                }
              }
            }
          }
        }
      }

      return sendJson(res, 400, { error: 'No se encontró un proyecto UWE válido en el archivo .sqlite.db seleccionado.' });
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

