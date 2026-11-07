/**
 * MagicUWE Web 1.5.0 - Main Interactive Application Controller
 * Full UWE 3.0 Visual + XML Modeler, Multi-user & Gmail Auth, SQLite Persistence, PNG/SVG Exporter
 */
(function () {
  const ASSETS = window.UWE_ASSETS;
  const ENGINE = window.UWE_ENGINE;
  const COLORS = ASSETS.magicDrawColors;

  // Application State
  const state = {
    user: null,
    token: localStorage.getItem('magicuwe_token') || null,
    projects: [],
    currentProjectId: null,
    model: (ENGINE.createMusicPortalDemoModel ? ENGINE.createMusicPortalDemoModel() : ENGINE.createAddressBookDemoModel()),
    activeDiagramId: 'dg_mp_req',
    activeTool: { id: 'select', type: 'SELECT', label: 'Select' },
    viewMode: 'visual', // 'visual' | 'split' | 'xml'
    selectedNodeId: null, // elementId of selected node
    selectedNodeIds: new Set(), // Set of elementIds of selected nodes (for grouping, multi-select)
    selectedEdgeId: null,
    collapsedPackages: new Set(),
    collapsedElements: new Set(),
    rootCollapsed: false, // relationshipId of selected edge
    selectedNestedPropIdx: null, // index of nested property inside selected node
    pendingEdgeSourceId: null, // when drawing an association/link/transition
    zoom: 1,
    dragging: null, // { elementId, startX, startY, origX, origY }
    resizing: null, // { elementId, startX, startY, origW, origH }
    xmlDirty: false
  };

  // Helper: Get Base64 icon URL by key with fallback
  function getIcon(key, fallbackKey = 'UWEicon.png') {
    if (!key) return ASSETS.icons[fallbackKey] || '';
    if (ASSETS.icons[key]) return ASSETS.icons[key];
    // Try basename lookup
    const base = key.split('/').pop();
    for (const [k, v] of Object.entries(ASSETS.icons)) {
      if (k === base || k.endsWith('/' + base)) return v;
    }
    return ASSETS.icons[fallbackKey] || '';
  }

  function getStereotypeIcon(stereotype, umlType) {
    if (stereotype && ASSETS.stereotypes[stereotype] && ASSETS.stereotypes[stereotype].iconKey) {
      return getIcon(ASSETS.stereotypes[stereotype].iconKey);
    }
    if (umlType === 'Actor') return getIcon('stereotypes/userModel/user.png');
    if (umlType === 'UseCase') return getIcon('stereotypes/requirements/webUseCase.png');
    if (umlType === 'State') return getIcon('stereotypes/navigation/navigationalNode.png');
    if (umlType === 'Action') return getIcon('stereotypes/process/userAction.png');
    if (umlType === 'Package') return getIcon('MDUWEmodels.png');
    return getIcon('insert/UWEinsertClass.png');
  }

  function getActiveDiagram() {
    return state.model.diagrams.find(d => d.id === state.activeDiagramId) || state.model.diagrams[0];
  }

  function getElement(id) {
    return state.model.elements.find(e => e.id === id);
  }

  function getRelationship(id) {
    return state.model.relationships.find(r => r.id === id);
  }

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<img src="${getIcon('UWEicon.png')}" width="16" height="16" alt="" /> <span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-hide');
      setTimeout(() => el.remove(), 300);
    }, 3600);
  }

  function setStatus(text) {
    const sb = document.getElementById('status-message');
    if (sb) sb.textContent = text;
  }

  // ==================== API & AUTHENTICATION ====================
  async function apiFetch(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }
    const res = await fetch(path, Object.assign({}, options, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Error HTTP ${res.status}`);
    }
    return data;
  }

  async function initAuth() {
    if (state.token) {
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.user) {
          state.user = res.user;
          await loadUserProjects();
        } else {
          state.token = null;
          localStorage.removeItem('magicuwe_token');
        }
      } catch (e) {
        state.token = null;
        localStorage.removeItem('magicuwe_token');
      }
    }
    renderAuthBar();
  }

  async function loadUserProjects() {
    if (!state.user) return;
    try {
      const res = await apiFetch('/api/projects');
      state.projects = res.projects || [];
      if (state.projects.length > 0 && !state.currentProjectId) {
        await loadProjectById(state.projects[0].id);
      }
      renderProjectSelect();
    } catch (e) {
      console.warn('Could not load projects:', e);
    }
  }

  async function loadProjectById(projectId) {
    try {
      const res = await apiFetch(`/api/projects/${projectId}`);
      if (res.project && res.project.model) {
        state.currentProjectId = res.project.id;
        state.model = res.project.model;
        state.activeDiagramId = state.model.diagrams[0]?.id || '';
        state.selectedNodeId = null;
        if (state.selectedNodeIds) state.selectedNodeIds.clear();
        state.selectedEdgeId = null;
        renderAll();
        showToast(`Proyecto "${res.project.name}" cargado desde SQLite`, 'success');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function saveCurrentProject() {
    // If in XML mode and dirty, apply XML first
    if (state.xmlDirty) {
      applyXmlFromEditor(true);
    }
    if (!state.user) {
      openAuthModal();
      showToast('Inicia sesión con tu cuenta Gmail o correo para guardar en la nube SQLite', 'info');
      return;
    }
    try {
      const xmlContent = ENGINE.modelToXml(state.model);
      if (state.currentProjectId) {
        const res = await apiFetch(`/api/projects/${state.currentProjectId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: state.model.name,
            model: state.model,
            xmlContent
          })
        });
        showToast(`Proyecto "${res.project.name}" guardado en SQLite`, 'success');
      } else {
        const res = await apiFetch('/api/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: state.model.name,
            description: 'Proyecto UWE 3.0',
            model: state.model,
            xmlContent
          })
        });
        state.currentProjectId = res.project.id;
        showToast(`Proyecto "${res.project.name}" creado en SQLite`, 'success');
      }
      await loadUserProjects();
    } catch (e) {
      showToast(`Error al guardar: ${e.message}`, 'error');
    }
  }

  // ==================== RENDERING: TOP BAR & AUTH ====================
  function renderAuthBar() {
    const container = document.getElementById('user-auth-area');
    if (!container) return;
    if (state.user) {
      const isGoogle = state.user.provider === 'google' || state.user.email.endsWith('@gmail.com');
      container.innerHTML = `
        <div class="user-badge" title="${state.user.email}">
          <img src="${state.user.avatar || ''}" class="user-avatar" alt="Avatar" />
          <div class="user-info-text">
            <span class="user-name">${escapeHtml(state.user.name)}</span>
            <span class="user-provider">${isGoogle ? 'Gmail / Google' : 'Cuenta UWE'}</span>
          </div>
          <button class="md-btn md-btn-sm" id="btn-logout" title="Cerrar sesión">Salir</button>
        </div>
      `;
      document.getElementById('btn-logout').onclick = () => {
        state.user = null;
        state.token = null;
        state.projects = [];
        state.currentProjectId = null;
        localStorage.removeItem('magicuwe_token');
        renderAuthBar();
        renderProjectSelect();
        showToast('Sesión cerrada', 'info');
      };
    } else {
      container.innerHTML = `
        <button class="md-btn md-btn-google" id="btn-open-google-auth">
          <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Iniciar Sesión / Gmail
        </button>
      `;
      document.getElementById('btn-open-google-auth').onclick = () => openAuthModal();
    }
  }

  function renderProjectSelect() {
    const sel = document.getElementById('project-selector');
    if (!sel) return;
    let html = `<option value="__local__">📄 ${escapeHtml(state.model.name)} (Sesión actual)</option>`;
    for (const p of state.projects) {
      const selected = p.id === state.currentProjectId ? 'selected' : '';
      html += `<option value="${p.id}" ${selected}>🗄️ ${escapeHtml(p.name)} (SQLite)</option>`;
    }
    html += `<optgroup label="Ejemplos Oficiales UWE">`;
    html += `<option value="__example_music__">🎵 Simple Music Portal (UWE Sevilla 2010)</option>`;
    html += `<option value="__example_addressbook__">📇 Libreta de Contactos (AddressBook Tutorial)</option>`;
    html += `</optgroup>`;
    html += `<optgroup label="Plantillas">`;
    html += `<option value="__blank__">➕ Crear Proyecto UWE en Blanco...</option>`;
    html += `<option value="__open_modal__">✨ Explorar Todos los Ejemplos y Plantillas...</option>`;
    html += `</optgroup>`;
    sel.innerHTML = html;
  }

  // ==================== CONTAINMENT TREE & DIAGRAMS ====================
  function renderContainmentTree() {
    const treeEl = document.getElementById('containment-tree');
    if (!treeEl) return;

    let html = `
      <div class="tree-node tree-root" id="tree-root-item" title="Doble clic o clic en la flecha para colapsar todo el modelo">
        <span class="tree-caret" id="tree-root-caret">${state.rootCollapsed ? '▶' : '▼'}</span>
        <img src="${getIcon('MDUWEmodels.png')}" width="16" height="16" alt="" />
        <strong>Model</strong> <span class="tree-meta">(${escapeHtml(state.model.name)})</span>
      </div>
      <div class="tree-root-children" id="tree-root-children" style="${state.rootCollapsed ? 'display:none;' : ''}">
    `;

    for (const pkg of state.model.packages) {
      const pkgDiagrams = state.model.diagrams.filter(d => d.packageId === pkg.id);
      const pkgElements = state.model.elements.filter(e => e.packageId === pkg.id);
      const pkgIcon = getStereotypeIcon(pkg.stereotype, 'Package');
      const isPkgCollapsed = state.collapsedPackages.has(pkg.id);
      const totalCount = pkgDiagrams.length + pkgElements.length;

      html += `
        <div class="tree-package-group">
          <div class="tree-node tree-pkg ${isPkgCollapsed ? 'collapsed' : ''}" data-pkg-id="${pkg.id}" title="Clic para ${isPkgCollapsed ? 'expandir' : 'colapsar'} paquete">
            <span class="tree-caret tree-pkg-caret" data-pkg-id="${pkg.id}">${isPkgCollapsed ? '▶' : '▼'}</span>
            <img src="${pkgIcon}" width="16" height="16" alt="" />
            <span class="tree-stereo">«${escapeHtml(pkg.stereotype)}»</span>
            <span class="tree-label">${escapeHtml(pkg.name)}</span>
            <span class="tree-count-badge">(${totalCount})</span>
          </div>
          <div class="tree-children" id="tree-children-${pkg.id}" style="${isPkgCollapsed ? 'display:none;' : ''}">
      `;

      for (const dg of pkgDiagrams) {
        const dgDef = ENGINE.DIAGRAM_TYPES[dg.diagramType] || ENGINE.DIAGRAM_TYPES.CONTENT;
        const isActive = dg.id === state.activeDiagramId;
        html += `
          <div class="tree-node tree-diagram ${isActive ? 'active' : ''}" data-dg-id="${dg.id}">
            <span style="width:12px;display:inline-block"></span>
            <img src="${getIcon(dgDef.icon)}" width="16" height="16" alt="" />
            <span class="tree-dg-label">${escapeHtml(dg.name)}</span>
          </div>
        `;
      }

      // Render top-level elements and their nested children recursively
      const topElements = pkgElements.filter(e => !e.parentId);
      for (const el of topElements) {
        html += renderTreeElement(el, pkgElements);
      }

      html += `</div></div>`;
    }

    html += `</div>`;
    treeEl.innerHTML = html;

    // Helper for rendering elements with potential children
    function renderTreeElement(el, allElements) {
      const children = allElements.filter(c => c.parentId === el.id);
      const hasChildren = children.length > 0;
      const isElCollapsed = state.collapsedElements.has(el.id);
      const isSelected = el.id === state.selectedNodeId;
      const icon = getStereotypeIcon(el.stereotype, el.umlType);

      let elHtml = `
        <div class="tree-element-group">
          <div class="tree-node tree-element ${isSelected ? 'selected' : ''}" data-el-id="${el.id}">
            ${hasChildren
          ? `<span class="tree-caret tree-el-caret" data-el-id="${el.id}">${isElCollapsed ? '▶' : '▼'}</span>`
          : `<span style="width:12px;display:inline-block"></span>`}
            <img src="${icon}" width="16" height="16" alt="" />
            ${el.stereotype ? `<span class="tree-stereo">«${escapeHtml(el.stereotype)}»</span>` : ''}
            <span class="tree-el-label">${escapeHtml(el.name || el.umlType)}</span>
            ${hasChildren ? `<span class="tree-count-badge">(${children.length})</span>` : ''}
          </div>
      `;

      if (hasChildren) {
        elHtml += `<div class="tree-children" style="${isElCollapsed ? 'display:none;' : ''}">`;
        for (const child of children) {
          elHtml += renderTreeElement(child, allElements);
        }
        elHtml += `</div>`;
      }

      elHtml += `</div>`;
      return elHtml;
    }

    // Bind Root Caret Toggle
    const rootCaret = document.getElementById('tree-root-caret');
    if (rootCaret) {
      rootCaret.onclick = (e) => {
        e.stopPropagation();
        state.rootCollapsed = !state.rootCollapsed;
        renderContainmentTree();
      };
    }
    const rootItem = document.getElementById('tree-root-item');
    if (rootItem) {
      rootItem.ondblclick = () => {
        state.rootCollapsed = !state.rootCollapsed;
        renderContainmentTree();
      };
    }

    // Bind Package Caret & Row Toggle
    treeEl.querySelectorAll('.tree-pkg').forEach(node => {
      node.onclick = () => {
        const pkgId = node.dataset.pkgId;
        if (state.collapsedPackages.has(pkgId)) {
          state.collapsedPackages.delete(pkgId);
        } else {
          state.collapsedPackages.add(pkgId);
        }
        renderContainmentTree();
      };
    });

    // Bind Element Caret Toggle
    treeEl.querySelectorAll('.tree-el-caret').forEach(caret => {
      caret.onclick = (e) => {
        e.stopPropagation();
        const elId = caret.dataset.elId;
        if (state.collapsedElements.has(elId)) {
          state.collapsedElements.delete(elId);
        } else {
          state.collapsedElements.add(elId);
        }
        renderContainmentTree();
      };
    });

    // Bind Diagram click
    treeEl.querySelectorAll('.tree-diagram').forEach(node => {
      node.onclick = (e) => {
        e.stopPropagation();
        state.activeDiagramId = node.dataset.dgId;
        state.selectedNodeId = null;
        if (state.selectedNodeIds) state.selectedNodeIds.clear();
        state.selectedEdgeId = null;
        state.pendingEdgeSourceId = null;
        state.activeTool = { id: 'select', type: 'SELECT', label: 'Select' };
        renderAll();
      };
    });

    // Bind Element click
    treeEl.querySelectorAll('.tree-element').forEach(node => {
      node.onclick = (e) => {
        if (e.target.classList.contains('tree-el-caret')) return;
        e.stopPropagation();
        const elId = node.dataset.elId;
        state.selectedNodeId = elId;
        state.selectedEdgeId = null;
        state.selectedNestedPropIdx = null;
        const currentDg = getActiveDiagram();
        if (currentDg && !currentDg.nodes.some(n => n.elementId === elId)) {
          const targetDg = state.model.diagrams.find(d => d.nodes.some(n => n.elementId === elId));
          if (targetDg) state.activeDiagramId = targetDg.id;
        }
        renderAll();
      };
    });
  }

  function renderDiagramTabs() {
    const tabsEl = document.getElementById('diagram-tabs');
    if (!tabsEl) return;

    let html = '';
    for (const dg of state.model.diagrams) {
      const dgDef = ENGINE.DIAGRAM_TYPES[dg.diagramType] || ENGINE.DIAGRAM_TYPES.CONTENT;
      const active = dg.id === state.activeDiagramId ? 'active' : '';
      html += `
        <button class="dg-tab ${active}" data-dg-id="${dg.id}" title="${dgDef.label}: ${escapeHtml(dg.name)}">
          <img src="${getIcon(dgDef.icon)}" width="15" height="15" alt="" />
          <span>${escapeHtml(dg.name)}</span>
        </button>
      `;
    }
    html += `
      <button class="dg-tab dg-tab-add" id="btn-new-diagram" title="Crear nuevo diagrama UWE 3.0">
        + Diagrama
      </button>
    `;
    tabsEl.innerHTML = html;

    tabsEl.querySelectorAll('.dg-tab[data-dg-id]').forEach(btn => {
      btn.onclick = () => {
        state.activeDiagramId = btn.dataset.dgId;
        state.selectedNodeId = null;
        if (state.selectedNodeIds) state.selectedNodeIds.clear();
        state.selectedEdgeId = null;
        state.pendingEdgeSourceId = null;
        state.activeTool = { id: 'select', type: 'SELECT', label: 'Select' };
        renderAll();
      };
    });

    const addBtn = document.getElementById('btn-new-diagram');
    if (addBtn) addBtn.onclick = openNewDiagramModal;
  }

  // ==================== PALETTE TOOLBAR (MagicDraw 18 Contextual Palette) ====================
  function getToolIcon(tool) {
    if (tool.icon) return getIcon(tool.icon);
    if (tool.stereotype) {
      const stIcon = getStereotypeIcon(tool.stereotype, tool.umlType);
      if (stIcon) return stIcon;
    }
    if (tool.umlType === 'Actor') return getIcon('stereotypes/userModel/user.png');
    if (tool.umlType === 'UseCase') return getIcon('stereotypes/requirements/webUseCase.png');
    if (tool.umlType === 'InitialNode' || tool.umlType === 'FinalNode' || tool.umlType === 'DecisionNode') {
      return getIcon('MDactivityDiagram.png');
    }
    if (tool.type === 'EDGE') {
      if (tool.umlType === 'DirectedAssociation' || tool.stereotype === 'include' || tool.stereotype === 'extend' || tool.umlType === 'ControlFlow') {
        return getIcon('MDassociationDirected.png');
      }
      return getIcon('MDassociation.png');
    }
    return getIcon('insert/UWEinsertClass.png');
  }

  function placeNewNodeOnDiagram(tool, x, y) {
    const dg = getActiveDiagram();
    if (!dg) return;
    const newElId = 'el_' + Math.random().toString(36).slice(2, 9);
    const defaultName = tool.stereotype
      ? tool.stereotype.charAt(0).toUpperCase() + tool.stereotype.slice(1)
      : tool.umlType;

    const newEl = {
      id: newElId,
      packageId: dg.packageId,
      umlType: tool.umlType || 'Class',
      stereotype: tool.stereotype || '',
      name: `${defaultName}_${state.model.elements.length + 1}`,
      attributes: tool.umlType === 'Class' && !tool.stereotype ? ['-id : String'] : [],
      operations: [],
      tags: {},
      nestedProperties: []
    };
    state.model.elements.push(newEl);

    const isSmall = ['InitialNode', 'FinalNode', 'DecisionNode'].includes(newEl.umlType);
    const isContainer = ['presentationPage', 'presentationGroup'].includes(newEl.stereotype);
    const isUc = newEl.umlType === 'UseCase';
    const isActor = newEl.umlType === 'Actor';
    const width = isSmall ? 36 : (isContainer ? 280 : (isUc ? 150 : (isActor ? 40 : 175)));
    const height = isSmall ? 36 : (isContainer ? 160 : (isUc ? 70 : (isActor ? 65 : 82)));

    dg.nodes.push({
      elementId: newElId,
      x: Math.max(15, x),
      y: Math.max(40, y),
      width,
      height
    });

    state.selectedNodeId = newElId;
    state.selectedNodeIds = new Set([newElId]);
    state.selectedEdgeId = null;
    state.activeTool = { id: 'select', type: 'SELECT', label: 'Select' };
    showToast(`Elemento «${newEl.stereotype || newEl.umlType}» añadido al diagrama`, 'success');
    renderAll();
  }

  function renderPalette() {
    const palEl = document.getElementById('diagram-palette');
    if (!palEl) return;
    const dg = getActiveDiagram();
    if (!dg) return;
    const dgDef = ENGINE.DIAGRAM_TYPES[dg.diagramType] || ENGINE.DIAGRAM_TYPES.CONTENT;

    // Normalize tools: uppercase type ('NODE' | 'EDGE' | 'NESTED_PROPERTY'), ensure unique id, clear shortcuts
    dgDef.tools.forEach((tool, idx) => {
      const rawType = (tool.type || 'node').toLowerCase();
      if (rawType === 'node') tool.type = 'NODE';
      else if (rawType === 'edge') tool.type = 'EDGE';
      else if (rawType === 'property') tool.type = 'NESTED_PROPERTY';
      else tool.type = rawType.toUpperCase();

      if (!tool.id) {
        tool.id = `tool_${dgDef.id || dg.diagramType}_${tool.stereotype || tool.umlType || 'tool'}_${idx}`;
      }
      tool.shortcut = '';
    });

    let html = `
      <div class="palette-header">
        <img src="${getIcon(dgDef.icon)}" width="15" height="15" alt="" />
        <span>${escapeHtml(dgDef.shortLabel || dgDef.label || 'UWE')} Toolbar</span>
      </div>
      <div class="palette-tools">
    `;

    for (const tool of dgDef.tools) {
      if (tool.type === 'SEPARATOR') {
        html += `<div class="palette-separator">${escapeHtml(tool.label)}</div>`;
        continue;
      }
      const isActive = state.activeTool && state.activeTool.id === tool.id;
      const iconUrl = getToolIcon(tool);
      const isDraggable = (tool.type === 'NODE' || tool.type === 'NESTED_PROPERTY');
      html += `
        <button class="palette-btn ${isActive ? 'active' : ''}" data-tool-id="${tool.id}" ${isDraggable ? 'draggable="true"' : ''} title="${escapeHtml(tool.label)}">
          <img src="${iconUrl}" width="16" height="16" alt="" />
          <span class="palette-btn-label">${escapeHtml(tool.label)}</span>
        </button>
      `;
    }

    html += `</div>`;
    palEl.innerHTML = html;

    palEl.querySelectorAll('.palette-btn').forEach(btn => {
      const toolId = btn.dataset.toolId;
      const tool = dgDef.tools.find(t => t.id === toolId);
      if (!tool) return;

      btn.onclick = () => {
        state.activeTool = tool;
        state.pendingEdgeSourceId = null;
        if (tool.type === 'NODE') {
          setStatus(`Herramienta activa: ${tool.label} — Arrastra al lienzo o haz clic donde desees colocar «${tool.stereotype || tool.umlType}»`);
        } else if (tool.type === 'NESTED_PROPERTY') {
          setStatus(`Herramienta activa: ${tool.label} — Arrastra o haz clic dentro de una «presentationPage» o «presentationGroup»`);
        } else if (tool.type === 'EDGE') {
          setStatus(`Herramienta activa: ${tool.label} — Haz clic en el nodo origen y luego en el nodo destino`);
        } else {
          setStatus('Modo Selección activo (Arrastra nodos, haz clic para inspeccionar o editar Tagged Values)');
        }
        renderPalette();
      };

      if (tool.type === 'NODE' || tool.type === 'NESTED_PROPERTY') {
        btn.ondragstart = (ev) => {
          state.draggedPaletteTool = tool;
          ev.dataTransfer.setData('text/plain', tool.id);
          ev.dataTransfer.effectAllowed = 'copy';
          btn.style.opacity = '0.5';
          setStatus(`Arrastrando: ${tool.label} — Suéltalo en el lienzo de dibujo`);
        };
        btn.ondragend = () => {
          btn.style.opacity = '1';
          state.draggedPaletteTool = null;
        };
      }
    });
  }

  // ==================== INTERACTIVE MAGICDRAW 18.0 DIAGRAM CANVAS ====================
  function renderCanvas() {
    const dg = getActiveDiagram();
    const headerFrame = document.getElementById('md-diagram-frame-header');
    const nodesLayer = document.getElementById('canvas-nodes-layer');
    const edgesSvg = document.getElementById('canvas-edges-svg');
    if (!dg || !nodesLayer || !edgesSvg) return;

    const dgDef = ENGINE.DIAGRAM_TYPES[dg.diagramType] || ENGINE.DIAGRAM_TYPES.CONTENT;
    const pkg = state.model.packages.find(p => p.id === dg.packageId);

    // 1. Update MagicDraw 18 Header Frame: package Model [ Icon DiagramName ]
    if (headerFrame) {
      headerFrame.innerHTML = `
        <span class="frame-kw">package</span>
        <span class="frame-pkg">${escapeHtml(pkg ? pkg.name : 'Model')}</span>
        <span class="frame-bracket">[</span>
        <img src="${getIcon(dgDef.icon)}" width="15" height="15" alt="" />
        <span class="frame-dg-name">${escapeHtml(dg.name)}</span>
        <span class="frame-bracket">]</span>
      `;
    }

    // 2. Render SVG Edges (Associations, Links, Transitions, ControlFlows, Dependencies)
    renderEdgesSvg(dg, edgesSvg);

    // 3. Render HTML Nodes (Classes, Presentation Containers, States, Actions, UseCases, Actors)
    nodesLayer.innerHTML = '';
    const sortedNodes = [...dg.nodes].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
    for (const nodeLayout of sortedNodes) {
      const el = getElement(nodeLayout.elementId);
      if (!el) continue;
      const nodeDom = createNodeDom(el, nodeLayout, dg);
      nodesLayer.appendChild(nodeDom);
    }
  }

  function renderEdgesSvg(dg, svgEl) {
    // Define markers for UML arrows, generalizations, dependencies, transitions
    let svgHtml = `
      <defs>
        <marker id="arrow-open" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
          <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#4A4A4A" stroke-width="1.4" />
        </marker>
        <marker id="arrow-generalization" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
          <polygon points="1,1 11,6 1,11" fill="#FFFFFF" stroke="#4A4A4A" stroke-width="1.4" />
        </marker>
      </defs>
    `;

    for (const edgeId of dg.edges) {
      const rel = getRelationship(edgeId);
      if (!rel) continue;
      const srcNode = dg.nodes.find(n => n.elementId === rel.sourceId);
      const tgtNode = dg.nodes.find(n => n.elementId === rel.targetId);
      if (!srcNode || !tgtNode) continue;

      const pts = computeEdgePoints(srcNode, tgtNode);
      const isSelected = state.selectedEdgeId === rel.id;
      const isDashed = rel.umlType === 'Dependency';
      const hasArrow = rel.umlType === 'DirectedAssociation' || rel.umlType === 'Transition' || rel.umlType === 'ControlFlow' || rel.umlType === 'Dependency';
      const isGen = rel.umlType === 'Generalization';

      const strokeColor = isSelected ? '#0055D4' : '#424242';
      const strokeWidth = isSelected ? 2.2 : 1.3;
      const markerEnd = isGen ? 'url(#arrow-generalization)' : (hasArrow ? 'url(#arrow-open)' : '');

      const midX = (pts.x1 + pts.x2) / 2;
      const midY = (pts.y1 + pts.y2) / 2;

      // Stereotype & label text
      const stereoText = rel.stereotype ? `«${rel.stereotype}»` : '';
      const nameText = rel.name || '';
      const tagsList = Object.entries(rel.tags || {}).map(([k, v]) => `${k}=${v}`).join(', ');
      const tagsText = tagsList ? `{${tagsList}}` : '';

      svgHtml += `
        <g class="canvas-edge-group ${isSelected ? 'selected' : ''}" data-edge-id="${rel.id}">
          <!-- Invisible wide hit area for easy clicking -->
          <line x1="${pts.x1}" y1="${pts.y1}" x2="${pts.x2}" y2="${pts.y2}" stroke="transparent" stroke-width="14" style="cursor:pointer" />
          <line x1="${pts.x1}" y1="${pts.y1}" x2="${pts.x2}" y2="${pts.y2}"
                stroke="${strokeColor}" stroke-width="${strokeWidth}"
                ${isDashed ? 'stroke-dasharray="5,4"' : ''}
                ${markerEnd ? `marker-end="${markerEnd}"` : ''}
                style="pointer-events:none" />
      `;

      if (stereoText) {
        svgHtml += `
          <rect x="${midX - 54}" y="${midY - 22}" width="108" height="15" rx="2" fill="rgba(255,255,255,0.88)" style="pointer-events:none" />
          <text x="${midX}" y="${midY - 11}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" fill="#1F1F1F" style="pointer-events:none">${escapeHtml(stereoText)}</text>
        `;
      }
      if (nameText) {
        svgHtml += `
          <text x="${midX}" y="${midY + 12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" fill="#280000" style="pointer-events:none">${escapeHtml(nameText)}</text>
        `;
      }
      if (tagsText) {
        svgHtml += `
          <text x="${midX}" y="${midY + 24}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9.5" fill="#280000" style="pointer-events:none">${escapeHtml(tagsText)}</text>
        `;
      }

      // Multiplicities near endpoints
      if (rel.sourceMult) {
        const sx = pts.x1 + (pts.x2 - pts.x1) * 0.14;
        const sy = pts.y1 + (pts.y2 - pts.y1) * 0.14 - 6;
        svgHtml += `<text x="${sx}" y="${sy}" font-family="Arial, sans-serif" font-size="10" fill="#000">${escapeHtml(rel.sourceMult)}</text>`;
      }
      if (rel.targetMult) {
        const tx = pts.x1 + (pts.x2 - pts.x1) * 0.86;
        const ty = pts.y1 + (pts.y2 - pts.y1) * 0.86 - 6;
        svgHtml += `<text x="${tx}" y="${ty}" font-family="Arial, sans-serif" font-size="10" fill="#000">${escapeHtml(rel.targetMult)}</text>`;
      }

      svgHtml += `</g>`;
    }

    svgEl.innerHTML = svgHtml;

    svgEl.querySelectorAll('.canvas-edge-group').forEach(g => {
      g.onclick = (ev) => {
        ev.stopPropagation();
        state.selectedEdgeId = g.dataset.edgeId;
        state.selectedNodeId = null;
        state.selectedNestedPropIdx = null;
        renderAll();
      };
    });
  }

  function computeEdgePoints(src, tgt) {
    const scx = src.x + src.width / 2;
    const scy = src.y + src.height / 2;
    const tcx = tgt.x + tgt.width / 2;
    const tcy = tgt.y + tgt.height / 2;

    const srcEl = getElement(src.elementId);
    const tgtEl = getElement(tgt.elementId);
    const srcIsEllipse = srcEl?.umlType === 'UseCase';
    const tgtIsEllipse = tgtEl?.umlType === 'UseCase';

    const p1 = intersectNode(src, scx, scy, tcx, tcy, srcIsEllipse);
    const p2 = intersectNode(tgt, tcx, tcy, scx, scy, tgtIsEllipse);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  }

  function intersectNode(rect, cx, cy, tx, ty, isEllipse = false) {
    const dx = tx - cx;
    const dy = ty - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const hw = rect.width / 2;
    const hh = rect.height / 2;

    if (isEllipse) {
      const t = 1 / Math.sqrt(Math.pow(dx / hw, 2) + Math.pow(dy / hh, 2));
      return {
        x: Math.round(cx + dx * t),
        y: Math.round(cy + dy * t)
      };
    }

    const scaleX = Math.abs(dx) > 0.001 ? hw / Math.abs(dx) : Infinity;
    const scaleY = Math.abs(dy) > 0.001 ? hh / Math.abs(dy) : Infinity;
    const scale = Math.min(scaleX, scaleY);
    return {
      x: Math.round(cx + dx * scale),
      y: Math.round(cy + dy * scale)
    };
  }
  const intersectRect = intersectNode;

  function createNodeDom(el, layout, dg) {
    const div = document.createElement('div');
    const isSelected = state.selectedNodeId === el.id;
    const isMultiSelected = Boolean(state.selectedNodeIds && state.selectedNodeIds.has(el.id));
    const isInGroup = Boolean(layout.groupId);
    const isPendingSource = state.pendingEdgeSourceId === el.id;

    div.className = `md-node md-uml-${el.umlType.toLowerCase()} ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''} ${isInGroup ? 'in-group' : ''} ${isPendingSource ? 'pending-source' : ''}`;
    div.style.left = `${layout.x}px`;
    div.style.top = `${layout.y}px`;
    div.style.width = `${layout.width}px`;
    div.style.minHeight = `${layout.height}px`;
    if (el.umlType === 'UseCase') {
      div.style.height = `${layout.height}px`;
      div.classList.add('md-node-usecase');
    }
    div.style.zIndex = layout.zIndex || 1;
    div.dataset.elementId = el.id;

    const iconUrl = getStereotypeIcon(el.stereotype, el.umlType);
    const tagsEntries = Object.entries(el.tags || {}).filter(([, v]) => v !== '' && v !== false && v !== 'false');

    // Special rendering by UML metaclass
    if (el.umlType === 'InitialNode') {
      div.classList.add('md-node-initial');
      div.style.width = '28px';
      div.style.height = '28px';
      div.style.minHeight = '28px';
      div.innerHTML = `<div class="md-initial-circle" title="${escapeHtml(el.name)}"></div>`;
    } else if (el.umlType === 'FinalNode') {
      div.classList.add('md-node-final');
      div.style.width = '30px';
      div.style.height = '30px';
      div.style.minHeight = '30px';
      div.innerHTML = `<div class="md-final-bullseye" title="${escapeHtml(el.name)}"><div></div></div>`;
    } else if (el.umlType === 'DecisionNode') {
      div.classList.add('md-node-decision');
      div.innerHTML = `<div class="md-decision-diamond" title="${escapeHtml(el.name)}"></div>`;
    } else if (el.umlType === 'Actor') {
      div.classList.add('md-node-actor');
      div.innerHTML = `
        <svg width="36" height="52" viewBox="0 0 36 52">
          <circle cx="18" cy="9" r="7" fill="#FFE2C6" stroke="#99795C" stroke-width="1.6"/>
          <line x1="18" y1="16" x2="18" y2="34" stroke="#99795C" stroke-width="1.6"/>
          <line x1="4" y1="23" x2="32" y2="23" stroke="#99795C" stroke-width="1.6"/>
          <line x1="18" y1="34" x2="6" y2="49" stroke="#99795C" stroke-width="1.6"/>
          <line x1="18" y1="34" x2="30" y2="49" stroke="#99795C" stroke-width="1.6"/>
        </svg>
        <div class="md-actor-caption">
          ${el.stereotype ? `<div class="md-stereo">«${escapeHtml(el.stereotype)}»</div>` : ''}
          <div class="md-title">${escapeHtml(el.name)}</div>
          ${tagsEntries.map(([k, v]) => `<div class="md-tag">{${escapeHtml(k)} = ${escapeHtml(String(v))}}</div>`).join('')}
        </div>
      `;
    } else if (el.umlType === 'UseCase') {
      div.style.background = COLORS.useCaseFill;
      div.style.borderColor = COLORS.useCaseBorder;
      div.style.borderRadius = '50%';
      div.innerHTML = `
        <div class="md-usecase-inner">
          ${el.stereotype || iconUrl ? `
            <div class="md-usecase-header">
              ${el.stereotype ? `<span class="md-stereo">«${escapeHtml(el.stereotype)}»</span>` : ''}
              ${iconUrl ? `<img src="${iconUrl}" width="15" height="15" class="md-usecase-inline-icon" alt="" />` : ''}
            </div>
          ` : ''}
          <div class="md-usecase-title">${escapeHtml(el.name)}</div>
          ${tagsEntries.length > 0 ? `
            <div class="md-usecase-tags">
              ${tagsEntries.map(([k, v]) => `<div class="md-tag">{${escapeHtml(k)} = ${escapeHtml(String(v))}}</div>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } else {
      // Standard Class, Presentation Class, State, Action, Pin
      if (el.umlType === 'State') {
        div.style.background = COLORS.stateFill;
        div.style.borderColor = COLORS.stateBorder;
        div.style.borderRadius = '12px';
      } else if (el.umlType === 'Action' || el.umlType === 'Pin') {
        div.style.background = COLORS.actionFill;
        div.style.borderColor = COLORS.actionBorder;
        div.style.borderRadius = el.umlType === 'Action' ? '14px' : '3px';
      } else {
        div.style.background = COLORS.classFill;
        div.style.borderColor = COLORS.classBorder;
      }

      const attrs = el.attributes || [];
      const nestedProps = el.nestedProperties || [];
      const hasCompartment = attrs.length > 0 || nestedProps.length > 0 || dg.diagramType === 'PRESENTATION';

      let inner = `
        <div class="md-node-header">
          <div class="md-header-row">
            <span class="md-stereo">${el.stereotype ? `«${escapeHtml(el.stereotype)}»` : ''}</span>
            <img src="${iconUrl}" width="16" height="16" class="md-node-icon" alt="" />
          </div>
          <div class="md-title">${escapeHtml(el.name)}</div>
          ${tagsEntries.length > 0 ? `
            <div class="md-tags-list">
              ${tagsEntries.map(([k, v]) => `<div class="md-tag">{${escapeHtml(k)}=${escapeHtml(String(v))}}</div>`).join('')}
            </div>
          ` : ''}
        </div>
      `;

      if (attrs.length > 0) {
        inner += `
          <div class="md-compartment md-attributes">
            ${attrs.map(a => `<div class="md-attr-item">${escapeHtml(a)}</div>`).join('')}
          </div>
        `;
      }

      // Presentation diagram nested properties compartment (DrawPropertyAction style)
      if (nestedProps.length > 0 || (dg.diagramType === 'PRESENTATION' && (el.stereotype === 'presentationPage' || el.stereotype === 'presentationGroup' || el.stereotype === 'inputForm'))) {
        inner += `<div class="md-compartment md-nested-props">`;
        if (nestedProps.length === 0) {
          inner += `<div class="md-nested-empty">Haz clic con un Property Tool para anidar UI</div>`;
        } else {
          nestedProps.forEach((prop, idx) => {
            const propIcon = getStereotypeIcon(prop.stereotype, 'Property');
            const propTags = Object.entries(prop.tags || {}).filter(([, v]) => v !== '' && v !== false);
            const propSel = isSelected && state.selectedNestedPropIdx === idx ? 'selected' : '';
            inner += `
              <div class="md-nested-prop-box ${propSel}" data-prop-idx="${idx}">
                <div class="md-nested-prop-top">
                  <span class="md-stereo">«${escapeHtml(prop.stereotype)}»</span>
                  <img src="${propIcon}" width="14" height="14" alt="" />
                </div>
                <div class="md-nested-prop-name">:${escapeHtml(prop.name)}</div>
                ${propTags.map(([k, v]) => `<div class="md-tag">{${escapeHtml(k)}=${escapeHtml(String(v))}}</div>`).join('')}
              </div>
            `;
          });
        }
        inner += `</div>`;
      } else if (el.umlType === 'Class' && attrs.length === 0) {
        inner += `<div class="md-compartment md-compartment-empty"></div>`;
      }

      div.innerHTML = inner;
    }

    // Resize Handle for ANY resizable node (UseCase, Class, State, Action, Pin)
    if (isSelected && !['InitialNode', 'FinalNode', 'DecisionNode', 'Actor'].includes(el.umlType)) {
      const handle = document.createElement('div');
      handle.className = 'md-resize-handle';
      handle.title = 'Arrastrar para cambiar el tamaño';
      div.appendChild(handle);
    }

    // Canva Badges for Group & Layers
    if (isInGroup && (isSelected || isMultiSelected)) {
      const b = document.createElement('div');
      b.className = 'md-group-badge';
      b.textContent = '🔗 Grupo';
      div.appendChild(b);
    }
    if ((isSelected || isMultiSelected) && layout.zIndex && layout.zIndex > 1) {
      const b = document.createElement('div');
      b.className = 'md-layer-badge';
      b.textContent = `Capa ${layout.zIndex}`;
      div.appendChild(b);
    }

    // Bind Node Mouse Events
    div.onmousedown = (ev) => {
      if (ev.button !== 0) return;
      ev.stopPropagation();

      // Check if clicking resize handle
      if (ev.target.classList.contains('md-resize-handle')) {
        state.resizing = {
          elementId: el.id,
          startX: ev.clientX,
          startY: ev.clientY,
          origW: layout.width,
          origH: layout.height
        };
        return;
      }

      // Check if active tool is NESTED_PROPERTY (DrawPropertyAction inside Presentation Class)
      if (state.activeTool && state.activeTool.type === 'NESTED_PROPERTY') {
        if (!el.nestedProperties) el.nestedProperties = [];
        const newPropName = `${state.activeTool.stereotype}_${el.nestedProperties.length + 1}`;
        el.nestedProperties.push({
          name: newPropName,
          stereotype: state.activeTool.stereotype,
          tags: {}
        });
        // Auto-grow container height if needed
        layout.height = Math.max(layout.height, 90 + Math.ceil(el.nestedProperties.length / 2) * 58);
        state.selectedNodeId = el.id;
        state.selectedNodeIds = new Set([el.id]);
        state.selectedNestedPropIdx = el.nestedProperties.length - 1;
        state.activeTool = { id: 'select', type: 'SELECT', label: 'Select' };
        showToast(`Propiedad «${el.nestedProperties[state.selectedNestedPropIdx].stereotype}» anidada en ${el.name}`, 'success');
        renderAll();
        return;
      }

      // Check if active tool is EDGE (drawing association / link / transition / dependency)
      if (state.activeTool && state.activeTool.type === 'EDGE') {
        if (!state.pendingEdgeSourceId) {
          state.pendingEdgeSourceId = el.id;
          setStatus(`Origen seleccionado: ${el.name}. Ahora haz clic en el elemento destino.`);
          renderCanvas();
        } else {
          const srcId = state.pendingEdgeSourceId;
          const tgtId = el.id;
          const newRelId = 'rel_' + Math.random().toString(36).slice(2, 9);
          const newRel = {
            id: newRelId,
            sourceId: srcId,
            targetId: tgtId,
            umlType: state.activeTool.umlType || 'Association',
            stereotype: state.activeTool.stereotype || '',
            name: '',
            sourceMult: '',
            targetMult: '',
            tags: {}
          };
          state.model.relationships.push(newRel);
          dg.edges.push(newRelId);
          state.pendingEdgeSourceId = null;
          state.selectedEdgeId = newRelId;
          state.selectedNodeId = null;
          if (state.selectedNodeIds) state.selectedNodeIds.clear();
          state.activeTool = { id: 'select', type: 'SELECT', label: 'Select' };
          showToast(`Relación ${newRel.stereotype ? '«' + newRel.stereotype + '»' : newRel.umlType} creada`, 'success');
          renderAll();
        }
        return;
      }

      // Check if clicking a nested property box
      const propBox = ev.target.closest('.md-nested-prop-box');
      if (propBox) {
        state.selectedNodeId = el.id;
        state.selectedNodeIds = new Set([el.id]);
        state.selectedEdgeId = null;
        state.selectedNestedPropIdx = parseInt(propBox.dataset.propIdx, 10);
        renderAll();
        return;
      }

      // Canva Grouping / Multi-Selection Logic
      if (!state.selectedNodeIds) state.selectedNodeIds = new Set();

      if (ev.shiftKey) {
        // Multi-select toggle
        if (state.selectedNodeIds.has(el.id)) {
          state.selectedNodeIds.delete(el.id);
          state.selectedNodeId = state.selectedNodeIds.size > 0 ? Array.from(state.selectedNodeIds)[state.selectedNodeIds.size - 1] : null;
        } else {
          state.selectedNodeIds.add(el.id);
          state.selectedNodeId = el.id;
        }
      } else {
        // Regular Click: if element belongs to a group, select the entire group!
        if (layout.groupId) {
          const groupNodes = dg.nodes.filter(n => n.groupId === layout.groupId);
          state.selectedNodeIds = new Set(groupNodes.map(n => n.elementId));
          state.selectedNodeId = el.id;
        } else {
          state.selectedNodeIds = new Set([el.id]);
          state.selectedNodeId = el.id;
        }
      }

      state.selectedEdgeId = null;
      state.selectedNestedPropIdx = null;

      // Prepare Dragging items: if node has groupId, or if multiple nodes selected, drag all in lockstep!
      const dragItems = [];
      if (layout.groupId) {
        const groupNodes = dg.nodes.filter(n => n.groupId === layout.groupId);
        for (const gn of groupNodes) {
          dragItems.push({ elementId: gn.elementId, origX: gn.x, origY: gn.y });
        }
      } else if (state.selectedNodeIds.size > 1 && state.selectedNodeIds.has(el.id)) {
        for (const sid of state.selectedNodeIds) {
          const sn = dg.nodes.find(n => n.elementId === sid);
          if (sn) dragItems.push({ elementId: sn.elementId, origX: sn.x, origY: sn.y });
        }
      } else {
        dragItems.push({ elementId: el.id, origX: layout.x, origY: layout.y });
      }

      state.dragging = {
        elementId: el.id,
        startX: ev.clientX,
        startY: ev.clientY,
        origX: layout.x,
        origY: layout.y,
        items: dragItems
      };
      renderAll();
    };

    // Drag-over and drop support for nesting properties into container nodes
    div.ondragover = (ev) => {
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
    };

    div.ondrop = (ev) => {
      let tool = state.draggedPaletteTool;
      if (!tool) {
        const toolId = ev.dataTransfer?.getData('text/plain');
        const dgDef = dg && (ENGINE.DIAGRAM_TYPES[dg.diagramType] || ENGINE.DIAGRAM_TYPES.CONTENT);
        if (toolId && dgDef) tool = dgDef.tools.find(t => t.id === toolId);
      }
      if (tool && tool.type === 'NESTED_PROPERTY') {
        ev.stopPropagation();
        ev.preventDefault();
        if (!el.nestedProperties) el.nestedProperties = [];
        const newPropName = `${tool.stereotype}_${el.nestedProperties.length + 1}`;
        el.nestedProperties.push({
          name: newPropName,
          stereotype: tool.stereotype,
          tags: {}
        });
        layout.height = Math.max(layout.height, 90 + Math.ceil(el.nestedProperties.length / 2) * 58);
        state.selectedNodeId = el.id;
        state.selectedNodeIds = new Set([el.id]);
        state.selectedNestedPropIdx = el.nestedProperties.length - 1;
        state.activeTool = { id: 'select', type: 'SELECT', label: 'Select' };
        showToast(`Propiedad «${tool.stereotype}» anidada en ${el.name}`, 'success');
        renderAll();
        return;
      }
      // If it is a NODE tool, do not stop propagation so canvasSurface.ondrop receives it!
    };

    return div;
  }

  // ==================== PROPERTIES, TAGGED VALUES & RIA INSPECTOR ====================
  function renderInspector() {
    const inspEl = document.getElementById('properties-inspector');
    if (!inspEl) return;

    // 1. If an Edge (Relationship) is selected
    if (state.selectedEdgeId) {
      const rel = getRelationship(state.selectedEdgeId);
      if (!rel) return;
      const srcEl = getElement(rel.sourceId);
      const tgtEl = getElement(rel.targetId);
      const dg = getActiveDiagram();

      inspEl.innerHTML = `
        <div class="insp-section">
          <div class="insp-header">
            <img src="${getIcon('MDassociationDirected.png')}" width="16" height="16" alt="" />
            <span>Relación UML / UWE</span>
          </div>
          <div class="insp-field">
            <label>Tipo UML</label>
            <select id="insp-rel-umltype" class="md-input">
              ${['Association', 'DirectedAssociation', 'Dependency', 'Generalization', 'Transition', 'ControlFlow'].map(t =>
        `<option value="${t}" ${rel.umlType === t ? 'selected' : ''}>${t}</option>`
      ).join('')}
            </select>
          </div>
          <div class="insp-field">
            <label>Estereotipo UWE</label>
            <input type="text" id="insp-rel-stereo" class="md-input" value="${escapeHtml(rel.stereotype || '')}" placeholder="ej. navigationLink, processLink, includes..." />
          </div>
          <div class="insp-field">
            <label>Nombre / Guarda</label>
            <input type="text" id="insp-rel-name" class="md-input" value="${escapeHtml(rel.name || '')}" placeholder="ej. [ok], viewDetails..." />
          </div>
          <div class="insp-row-2">
            <div class="insp-field">
              <label>Mult. Origen (${escapeHtml(srcEl ? srcEl.name : '')})</label>
              <input type="text" id="insp-rel-srcmult" class="md-input" value="${escapeHtml(rel.sourceMult || '')}" placeholder="1, *..." />
            </div>
            <div class="insp-field">
              <label>Mult. Destino (${escapeHtml(tgtEl ? tgtEl.name : '')})</label>
              <input type="text" id="insp-rel-tgtmult" class="md-input" value="${escapeHtml(rel.targetMult || '')}" placeholder="1, *..." />
            </div>
          </div>

          ${dg && dg.diagramType === 'NAVIGATION' ? `
            <div class="insp-subheader">Insertar Primitiva de Acceso UWE</div>
            <div class="insp-access-primitives">
              <button class="md-btn md-btn-sm" data-insert-prim="index" title="Insertar «index» en esta asociación">
                <img src="${getIcon('insert/UWEinsertIndex.png')}" width="14" height="14" /> + «index»
              </button>
              <button class="md-btn md-btn-sm" data-insert-prim="query" title="Insertar «query» en esta asociación">
                <img src="${getIcon('insert/UWEinsertQuery.png')}" width="14" height="14" /> + «query»
              </button>
              <button class="md-btn md-btn-sm" data-insert-prim="guidedTour" title="Insertar «guidedTour» en esta asociación">
                <img src="${getIcon('insert/UWEinsertGuidedTour.png')}" width="14" height="14" /> + «guidedTour»
              </button>
              <button class="md-btn md-btn-sm" data-insert-prim="menu" title="Insertar «menu» en esta asociación">
                <img src="${getIcon('insert/UWEinsertMenu.png')}" width="14" height="14" /> + «menu»
              </button>
            </div>
          ` : ''}

          <div class="insp-actions">
            <button class="md-btn md-btn-danger" id="btn-delete-edge">Eliminar Relación</button>
          </div>
        </div>
      `;

      document.getElementById('insp-rel-umltype').onchange = (e) => { rel.umlType = e.target.value; renderAll(); };
      document.getElementById('insp-rel-stereo').oninput = (e) => { rel.stereotype = e.target.value.trim(); renderCanvas(); syncXmlView(); };
      document.getElementById('insp-rel-name').oninput = (e) => { rel.name = e.target.value; renderCanvas(); syncXmlView(); };
      document.getElementById('insp-rel-srcmult').oninput = (e) => { rel.sourceMult = e.target.value; renderCanvas(); syncXmlView(); };
      document.getElementById('insp-rel-tgtmult').oninput = (e) => { rel.targetMult = e.target.value; renderCanvas(); syncXmlView(); };
      document.getElementById('btn-delete-edge').onclick = () => deleteSelectedElementOrEdge();

      inspEl.querySelectorAll('[data-insert-prim]').forEach(btn => {
        btn.onclick = () => insertAccessPrimitiveOnEdge(rel, btn.dataset.insertPrim);
      });
      return;
    }

    // 2. If a Node (Element) is selected
    if (state.selectedNodeId) {
      const el = getElement(state.selectedNodeId);
      if (!el) return;
      const dg = getActiveDiagram();
      const layout = dg ? dg.nodes.find(n => n.elementId === el.id) : null;

      // Stereotype metadata from UWE Profile
      const stereoMeta = el.stereotype ? ASSETS.stereotypes[el.stereotype] : null;
      const officialTags = stereoMeta && stereoMeta.tags ? stereoMeta.tags : ['isHome', 'isLandmark', 'guard', 'transmissionType'];
      const allTagKeys = Array.from(new Set([...officialTags, ...Object.keys(el.tags || {})]));

      // If a nested property inside a Presentation Class is selected
      const nestedProp = (state.selectedNestedPropIdx !== null && el.nestedProperties)
        ? el.nestedProperties[state.selectedNestedPropIdx]
        : null;

      inspEl.innerHTML = `
        <div class="insp-section">
          <div class="insp-header">
            <img src="${getStereotypeIcon(el.stereotype, el.umlType)}" width="16" height="16" alt="" />
            <span>Elemento «${escapeHtml(el.stereotype || el.umlType)}»</span>
          </div>

          <div class="insp-field">
            <label>Nombre del Elemento</label>
            <input type="text" id="insp-el-name" class="md-input" value="${escapeHtml(el.name)}" />
          </div>

          <div class="insp-row-2">
            <div class="insp-field">
              <label>Estereotipo UWE</label>
              <select id="insp-el-stereo" class="md-input">
                <option value="">(Sin estereotipo)</option>
                ${Object.keys(ASSETS.stereotypes).sort().map(s =>
        `<option value="${s}" ${el.stereotype === s ? 'selected' : ''}>«${s}»</option>`
      ).join('')}
              </select>
            </div>
            <div class="insp-field">
              <label>Metaclase UML</label>
              <select id="insp-el-umltype" class="md-input">
                ${['Class', 'State', 'Action', 'Pin', 'UseCase', 'Actor', 'InitialNode', 'FinalNode', 'DecisionNode'].map(t =>
        `<option value="${t}" ${el.umlType === t ? 'selected' : ''}>${t}</option>`
      ).join('')}
              </select>
            </div>
          </div>

          <!-- Canva-Style Layers & Grouping Controls -->
          <div class="insp-subheader">
            <img src="${getIcon('MDUWEmodels.png')}" width="14" height="14" />
            Capas y Agrupación (Estilo Canva)
          </div>
          <div class="insp-row-2">
            <div class="insp-field">
              <label>Capa (z-index)</label>
              <input type="number" id="insp-node-zindex" class="md-input" value="${layout?.zIndex || 1}" min="1" max="999" />
            </div>
            <div class="insp-field">
              <label>Grupo</label>
              <input type="text" id="insp-node-group" class="md-input" value="${layout?.groupId || '(Sin grupo)'}" readonly />
            </div>
          </div>
          <div style="display:flex; gap:4px; margin-top:4px; flex-wrap:wrap;">
            <button class="md-btn md-btn-sm" id="insp-btn-front" style="flex:1" title="Traer al frente">🔼 Frente</button>
            <button class="md-btn md-btn-sm" id="insp-btn-forward" style="flex:1" title="Mover adelante">⬆️ Adelante</button>
            <button class="md-btn md-btn-sm" id="insp-btn-backward" style="flex:1" title="Mover atrás">⬇️ Atrás</button>
            <button class="md-btn md-btn-sm" id="insp-btn-back" style="flex:1" title="Enviar al fondo">🔽 Fondo</button>
          </div>
          <div style="display:flex; gap:6px; margin-top:6px;">
            <button class="md-btn md-btn-sm md-btn-primary" id="insp-btn-group" style="flex:1" title="Agrupar seleccionados (Ctrl+G)">🔗 Agrupar</button>
            <button class="md-btn md-btn-sm" id="insp-btn-ungroup" style="flex:1" title="Desagrupar elementos (Ctrl+Shift+G)">🔓 Desagrupar</button>
          </div>

          <!-- Dimensions / Resizing Controls -->
          <div class="insp-subheader">
            <img src="${getIcon('MDUWEmodels.png')}" width="14" height="14" />
            Dimensiones (Tamaño del Elemento)
          </div>
          <div class="insp-row-2">
            <div class="insp-field">
              <label>Ancho (px)</label>
              <input type="number" id="insp-node-width" class="md-input" value="${layout?.width || (el.umlType === 'UseCase' ? 185 : 175)}" min="60" max="1500" step="5" />
            </div>
            <div class="insp-field">
              <label>Alto (px)</label>
              <input type="number" id="insp-node-height" class="md-input" value="${layout?.height || (el.umlType === 'UseCase' ? 85 : 80)}" min="35" max="1000" step="5" />
            </div>
          </div>
          ${el.umlType === 'UseCase' ? `
            <div style="display:flex; gap:4px; margin-top:4px;">
              <button class="md-btn md-btn-sm" id="btn-size-sm" style="flex:1" title="Óvalo compacto (140x65)">Compacto</button>
              <button class="md-btn md-btn-sm" id="btn-size-md" style="flex:1" title="Óvalo estándar (185x85)">Normal</button>
              <button class="md-btn md-btn-sm" id="btn-size-lg" style="flex:1" title="Óvalo amplio (240x110)">Amplio</button>
            </div>
          ` : ''}

          ${nestedProp ? `
            <div class="insp-nested-highlight">
              <div class="insp-subheader">
                <img src="${getStereotypeIcon(nestedProp.stereotype, 'Property')}" width="14" height="14" />
                Propiedad Anidada: :${escapeHtml(nestedProp.name)}
              </div>
              <div class="insp-field">
                <label>Nombre de Propiedad UI</label>
                <input type="text" id="insp-nprop-name" class="md-input" value="${escapeHtml(nestedProp.name)}" />
              </div>
              <div class="insp-field">
                <label>Estereotipo Presentación</label>
                <input type="text" id="insp-nprop-stereo" class="md-input" value="${escapeHtml(nestedProp.stereotype)}" />
              </div>
              <button class="md-btn md-btn-danger md-btn-sm" id="btn-del-nprop">Eliminar Propiedad Anidada</button>
            </div>
          ` : ''}

          <!-- Attributes Compartment -->
          <div class="insp-subheader">Atributos UML (${(el.attributes || []).length})</div>
          <div class="insp-attrs-list">
            ${(el.attributes || []).map((attr, idx) => `
              <div class="insp-attr-row">
                <input type="text" class="md-input md-input-sm insp-attr-input" data-idx="${idx}" value="${escapeHtml(attr)}" />
                <button class="md-btn md-btn-sm insp-attr-del" data-idx="${idx}" title="Borrar atributo">×</button>
              </div>
            `).join('')}
            <button class="md-btn md-btn-sm" id="btn-add-attr">+ Añadir Atributo (-nombre : String)</button>
          </div>

          <!-- UWE Tagged Values -->
          <div class="insp-subheader">
            <img src="${getIcon('TaggedValueString.png')}" width="14" height="14" />
            UWE Tagged Values
          </div>
          <div class="insp-tags-grid">
            ${allTagKeys.map(tagKey => {
        const val = (el.tags && el.tags[tagKey] !== undefined) ? el.tags[tagKey] : '';
        const isBool = tagKey.startsWith('is') || ['validated', 'confirmed', 'periodicRefresh', 'dragAndDrop', 'csrfPrevention', 'newSessionID'].includes(tagKey);
        return `
                <div class="insp-tag-row">
                  <span class="insp-tag-name" title="{${escapeHtml(tagKey)}}">{${escapeHtml(tagKey)}}</span>
                  ${isBool ? `
                    <select class="md-input md-input-sm insp-tag-input" data-tag="${escapeHtml(tagKey)}">
                      <option value="" ${val === '' ? 'selected' : ''}>—</option>
                      <option value="true" ${String(val) === 'true' ? 'selected' : ''}>true</option>
                      <option value="false" ${String(val) === 'false' ? 'selected' : ''}>false</option>
                    </select>
                  ` : `
                    <input type="text" class="md-input md-input-sm insp-tag-input" data-tag="${escapeHtml(tagKey)}" value="${escapeHtml(String(val))}" placeholder="valor..." />
                  `}
                </div>
              `;
      }).join('')}
          </div>

          <!-- RIA Patterns Panel (UWERiaPatterns.png) -->
          <div class="insp-subheader">
            <img src="${getIcon('UWERiaPatterns.png')}" width="14" height="14" />
            Patrones RIA (Rich Internet App)
          </div>
          <div class="insp-ria-grid">
            ${ENGINE.RIA_TAGS.map(riaKey => {
        const targetObj = nestedProp ? (nestedProp.tags = nestedProp.tags || {}) : (el.tags = el.tags || {});
        const checked = String(targetObj[riaKey]) === 'true' ? 'checked' : '';
        return `
                <label class="insp-ria-check">
                  <input type="checkbox" class="insp-ria-toggle" data-ria="${riaKey}" ${checked} />
                  <span>${riaKey}</span>
                </label>
              `;
      }).join('')}
          </div>

          <div class="insp-actions">
            <button class="md-btn md-btn-sm" id="btn-copy-tags" title="CopyTaggedValuesAction (Property <-> Class)">
              <img src="${getIcon('CopyTaggedValues.png')}" width="14" height="14" /> Copiar UWE Tags
            </button>
            <button class="md-btn md-btn-danger md-btn-sm" id="btn-delete-node">Eliminar Nodo</button>
          </div>
        </div>
      `;

      // Bind Element Inspector Events
      document.getElementById('insp-el-name').oninput = (e) => {
        el.name = e.target.value;
        renderCanvas();
        renderContainmentTree();
        syncXmlView();
      };
      document.getElementById('insp-el-stereo').onchange = (e) => {
        el.stereotype = e.target.value;
        renderAll();
      };
      document.getElementById('insp-el-umltype').onchange = (e) => {
        el.umlType = e.target.value;
        renderAll();
      };

      // Bind Canva Layer & Group Inspector Buttons
      if (document.getElementById('insp-btn-front')) document.getElementById('insp-btn-front').onclick = bringToFront;
      if (document.getElementById('insp-btn-forward')) document.getElementById('insp-btn-forward').onclick = bringForward;
      if (document.getElementById('insp-btn-backward')) document.getElementById('insp-btn-backward').onclick = sendBackward;
      if (document.getElementById('insp-btn-back')) document.getElementById('insp-btn-back').onclick = sendToBack;
      if (document.getElementById('insp-btn-group')) document.getElementById('insp-btn-group').onclick = groupSelectedNodes;
      if (document.getElementById('insp-btn-ungroup')) document.getElementById('insp-btn-ungroup').onclick = ungroupSelectedNodes;
      const inpZIndex = document.getElementById('insp-node-zindex');
      if (inpZIndex) {
        inpZIndex.onchange = (e) => {
          if (layout) {
            layout.zIndex = Math.max(1, parseInt(e.target.value, 10) || 1);
            renderCanvas();
            syncXmlView();
          }
        };
      }

      // Bind Dimension Inputs & Presets
      const inpWidth = document.getElementById('insp-node-width');
      if (inpWidth) {
        inpWidth.oninput = (e) => {
          if (layout) {
            layout.width = Math.max(60, parseInt(e.target.value, 10) || 60);
            renderCanvas();
            syncXmlView();
          }
        };
      }
      const inpHeight = document.getElementById('insp-node-height');
      if (inpHeight) {
        inpHeight.oninput = (e) => {
          if (layout) {
            layout.height = Math.max(35, parseInt(e.target.value, 10) || 35);
            renderCanvas();
            syncXmlView();
          }
        };
      }
      if (document.getElementById('btn-size-sm')) {
        document.getElementById('btn-size-sm').onclick = () => {
          if (layout) {
            layout.width = 140;
            layout.height = 65;
            renderAll();
            syncXmlView();
          }
        };
      }
      if (document.getElementById('btn-size-md')) {
        document.getElementById('btn-size-md').onclick = () => {
          if (layout) {
            layout.width = 185;
            layout.height = 85;
            renderAll();
            syncXmlView();
          }
        };
      }
      if (document.getElementById('btn-size-lg')) {
        document.getElementById('btn-size-lg').onclick = () => {
          if (layout) {
            layout.width = 240;
            layout.height = 110;
            renderAll();
            syncXmlView();
          }
        };
      }

      if (nestedProp) {
        document.getElementById('insp-nprop-name').oninput = (e) => {
          nestedProp.name = e.target.value;
          renderCanvas();
          syncXmlView();
        };
        document.getElementById('insp-nprop-stereo').oninput = (e) => {
          nestedProp.stereotype = e.target.value;
          renderCanvas();
          syncXmlView();
        };
        document.getElementById('btn-del-nprop').onclick = () => {
          el.nestedProperties.splice(state.selectedNestedPropIdx, 1);
          state.selectedNestedPropIdx = null;
          renderAll();
        };
      }

      inspEl.querySelectorAll('.insp-attr-input').forEach(inp => {
        inp.oninput = () => {
          const idx = parseInt(inp.dataset.idx, 10);
          el.attributes[idx] = inp.value;
          renderCanvas();
          syncXmlView();
        };
      });
      inspEl.querySelectorAll('.insp-attr-del').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.idx, 10);
          el.attributes.splice(idx, 1);
          renderAll();
        };
      });
      document.getElementById('btn-add-attr').onclick = () => {
        if (!el.attributes) el.attributes = [];
        el.attributes.push(`-attr${el.attributes.length + 1} : String`);
        // Expand node height slightly
        const dg = getActiveDiagram();
        const nl = dg && dg.nodes.find(n => n.elementId === el.id);
        if (nl) nl.height = Math.max(nl.height, 80 + el.attributes.length * 18);
        renderAll();
      };

      inspEl.querySelectorAll('.insp-tag-input').forEach(inp => {
        const handler = () => {
          const k = inp.dataset.tag;
          if (!el.tags) el.tags = {};
          if (inp.value === '') {
            delete el.tags[k];
          } else {
            el.tags[k] = inp.value;
          }
          renderCanvas();
          syncXmlView();
        };
        inp.oninput = handler;
        inp.onchange = handler;
      });

      inspEl.querySelectorAll('.insp-ria-toggle').forEach(chk => {
        chk.onchange = () => {
          const riaKey = chk.dataset.ria;
          const targetObj = nestedProp ? (nestedProp.tags = nestedProp.tags || {}) : (el.tags = el.tags || {});
          if (chk.checked) {
            targetObj[riaKey] = 'true';
          } else {
            delete targetObj[riaKey];
          }
          renderCanvas();
          renderInspector();
          syncXmlView();
        };
      });

      document.getElementById('btn-copy-tags').onclick = () => {
        if (el.nestedProperties && el.nestedProperties.length > 0) {
          el.nestedProperties.forEach(np => {
            np.tags = Object.assign({}, np.tags, el.tags);
          });
          showToast(`Tagged Values copiados a ${el.nestedProperties.length} propiedades anidadas`, 'success');
          renderAll();
        } else {
          showToast('Los Tagged Values del elemento están sincronizados en el perfil UWE', 'info');
        }
      };

      document.getElementById('btn-delete-node').onclick = () => deleteSelectedElementOrEdge();
      return;
    }

    // 3. Default Inspector when nothing is selected: Diagram Overview & Quick Actions
    const dg = getActiveDiagram();
    const dgDef = dg ? (ENGINE.DIAGRAM_TYPES[dg.diagramType] || ENGINE.DIAGRAM_TYPES.CONTENT) : null;
    inspEl.innerHTML = `
      <div class="insp-section">
        <div class="insp-header">
          <img src="${getIcon(dgDef ? dgDef.icon : 'UWEicon.png')}" width="16" height="16" alt="" />
          <span>Propiedades del Diagrama</span>
        </div>
        ${dg ? `
          <div class="insp-field">
            <label>Nombre del Diagrama</label>
            <input type="text" id="insp-dg-name" class="md-input" value="${escapeHtml(dg.name)}" />
          </div>
          <div class="insp-field">
            <label>Tipo de Diagrama UWE 3.0</label>
            <div class="insp-badge">${escapeHtml(dgDef.label)}</div>
          </div>
          <div class="insp-stats">
            <div>Nodos en diagrama: <strong>${dg.nodes.length}</strong></div>
            <div>Relaciones en diagrama: <strong>${dg.edges.length}</strong></div>
            <div>Total elementos proyecto: <strong>${state.model.elements.length}</strong></div>
          </div>
        ` : ''}
        <div class="insp-subheader">Verificación Semántica MagicUWE</div>
        <button class="md-btn md-btn-full" id="btn-check-tls">
          <img src="${getIcon('CheckSessionTransmissionType.png')}" width="15" height="15" />
          Check Session Transmission Type
        </button>
      </div>
    `;

    const dgNameInput = document.getElementById('insp-dg-name');
    if (dgNameInput && dg) {
      dgNameInput.oninput = (e) => {
        dg.name = e.target.value;
        renderDiagramTabs();
        renderContainmentTree();
        renderCanvas();
        syncXmlView();
      };
    }

    const tlsBtn = document.getElementById('btn-check-tls');
    if (tlsBtn) {
      tlsBtn.onclick = () => {
        const navNodes = state.model.elements.filter(e => e.stereotype === 'navigationClass' || e.stereotype === 'navigationalNode' || e.stereotype === 'session');
        let secured = 0;
        navNodes.forEach(n => {
          if (n.tags && n.tags.transmissionType) secured++;
        });
        showToast(`Verificación UWE completada: ${navNodes.length} nodos navegacionales/sesión analizados (${secured} con {transmissionType=TLS}). Sin conflictos.`, 'success');
      };
    }
  }

  // ==================== NAVIGATION ACCESS PRIMITIVE INSERTION ====================
  function insertAccessPrimitiveOnEdge(rel, primitiveStereo) {
    const dg = getActiveDiagram();
    if (!dg) return;
    const srcNode = dg.nodes.find(n => n.elementId === rel.sourceId);
    const tgtNode = dg.nodes.find(n => n.elementId === rel.targetId);
    const tgtEl = getElement(rel.targetId);
    if (!srcNode || !tgtNode) return;

    const newElId = 'el_prim_' + Math.random().toString(36).slice(2, 8);
    const primName = `${tgtEl ? tgtEl.name : 'Item'}${primitiveStereo.charAt(0).toUpperCase() + primitiveStereo.slice(1)}`;
    state.model.elements.push({
      id: newElId,
      packageId: dg.packageId,
      umlType: 'Class',
      stereotype: primitiveStereo,
      name: primName,
      attributes: [],
      operations: [],
      tags: primitiveStereo === 'index' ? { itemType: tgtEl ? tgtEl.name : 'Item' } : {}
    });

    const midX = Math.round((srcNode.x + tgtNode.x) / 2);
    const midY = Math.round((srcNode.y + tgtNode.y) / 2);
    dg.nodes.push({
      elementId: newElId,
      x: midX,
      y: midY,
      width: 165,
      height: 75
    });

    // Redirect existing relationship to primitive and add second relationship to target
    const origTargetId = rel.targetId;
    rel.targetId = newElId;
    rel.targetMult = '1';

    const rel2Id = 'rel_prim_' + Math.random().toString(36).slice(2, 8);
    state.model.relationships.push({
      id: rel2Id,
      sourceId: newElId,
      targetId: origTargetId,
      umlType: 'DirectedAssociation',
      stereotype: 'navigationLink',
      name: '',
      sourceMult: '1',
      targetMult: '*',
      tags: {}
    });
    dg.edges.push(rel2Id);

    state.selectedEdgeId = null;
    state.selectedNodeId = newElId;
    showToast(`Primitiva de acceso «${primitiveStereo}» (${primName}) insertada con multiplicidad *`, 'success');
    renderAll();
  }

  // ==================== CANVA-STYLE LAYERING & GROUPING ====================
  function getSelectedTargetNodeIds() {
    if (state.selectedNodeIds && state.selectedNodeIds.size > 0) {
      return Array.from(state.selectedNodeIds);
    }
    return state.selectedNodeId ? [state.selectedNodeId] : [];
  }

  function bringToFront() {
    const dg = getActiveDiagram();
    if (!dg) return;
    const targets = getSelectedTargetNodeIds();
    if (targets.length === 0) {
      showToast('Selecciona al menos un elemento para mover de capa', 'info');
      return;
    }
    let maxZ = 1;
    for (const n of dg.nodes) {
      if ((n.zIndex || 1) > maxZ) maxZ = n.zIndex || 1;
    }
    for (const id of targets) {
      const nl = dg.nodes.find(n => n.elementId === id);
      if (nl) nl.zIndex = maxZ + 1;
    }
    renderAll();
    syncXmlView();
    showToast('🔼 Elemento(s) al Frente (Capa superior)', 'info');
  }

  function sendToBack() {
    const dg = getActiveDiagram();
    if (!dg) return;
    const targets = getSelectedTargetNodeIds();
    if (targets.length === 0) {
      showToast('Selecciona al menos un elemento para mover de capa', 'info');
      return;
    }
    for (const n of dg.nodes) {
      if (!targets.includes(n.elementId)) {
        n.zIndex = (n.zIndex || 1) + 1;
      }
    }
    for (const id of targets) {
      const nl = dg.nodes.find(n => n.elementId === id);
      if (nl) nl.zIndex = 1;
    }
    renderAll();
    syncXmlView();
    showToast('🔽 Elemento(s) al Fondo (Capa inferior)', 'info');
  }

  function bringForward() {
    const dg = getActiveDiagram();
    if (!dg) return;
    const targets = getSelectedTargetNodeIds();
    if (targets.length === 0) {
      showToast('Selecciona al menos un elemento para mover de capa', 'info');
      return;
    }
    for (const id of targets) {
      const nl = dg.nodes.find(n => n.elementId === id);
      if (nl) nl.zIndex = (nl.zIndex || 1) + 1;
    }
    renderAll();
    syncXmlView();
    showToast('⬆️ Elemento(s) una capa Adelante', 'info');
  }

  function sendBackward() {
    const dg = getActiveDiagram();
    if (!dg) return;
    const targets = getSelectedTargetNodeIds();
    if (targets.length === 0) {
      showToast('Selecciona al menos un elemento para mover de capa', 'info');
      return;
    }
    for (const id of targets) {
      const nl = dg.nodes.find(n => n.elementId === id);
      if (nl) nl.zIndex = Math.max(1, (nl.zIndex || 1) - 1);
    }
    renderAll();
    syncXmlView();
    showToast('⬇️ Elemento(s) una capa Atrás', 'info');
  }

  function groupSelectedNodes() {
    const dg = getActiveDiagram();
    if (!dg) return;
    const targets = getSelectedTargetNodeIds();
    if (targets.length < 2) {
      showToast('Selecciona al menos 2 elementos con Shift + Clic para agrupar (Estilo Canva)', 'warning');
      return;
    }
    const newGroupId = 'grp_' + Date.now().toString(36).slice(-6);
    for (const id of targets) {
      const nl = dg.nodes.find(n => n.elementId === id);
      if (nl) nl.groupId = newGroupId;
    }
    state.selectedNodeIds = new Set(targets);
    renderAll();
    syncXmlView();
    showToast(`🔗 ${targets.length} elementos agrupados. ¡Ahora se mueven y organizan juntos!`, 'success');
  }

  function ungroupSelectedNodes() {
    const dg = getActiveDiagram();
    if (!dg) return;
    const targets = getSelectedTargetNodeIds();
    if (targets.length === 0) {
      showToast('Selecciona un elemento de un grupo para desagrupar', 'info');
      return;
    }
    const groupIds = new Set();
    for (const id of targets) {
      const nl = dg.nodes.find(n => n.elementId === id);
      if (nl && nl.groupId) groupIds.add(nl.groupId);
    }
    if (groupIds.size === 0) {
      showToast('El elemento seleccionado no pertenece a ningún grupo', 'info');
      return;
    }
    let count = 0;
    for (const n of dg.nodes) {
      if (n.groupId && groupIds.has(n.groupId)) {
        delete n.groupId;
        count++;
      }
    }
    state.selectedNodeIds = new Set(targets.filter(id => dg.nodes.some(n => n.elementId === id)));
    renderAll();
    syncXmlView();
    showToast(`🔓 ${count} elementos desagrupados. Ahora se mueven individualmente`, 'success');
  }

  function deleteSelectedElementOrEdge() {
    const dg = getActiveDiagram();
    if (state.selectedEdgeId) {
      const id = state.selectedEdgeId;
      state.model.relationships = state.model.relationships.filter(r => r.id !== id);
      state.model.diagrams.forEach(d => {
        d.edges = d.edges.filter(eId => eId !== id);
      });
      state.selectedEdgeId = null;
      showToast('Relación eliminada', 'info');
      renderAll();
      syncXmlView();
      return;
    }
    const idsToDelete = state.selectedNodeIds && state.selectedNodeIds.size > 0
      ? Array.from(state.selectedNodeIds)
      : (state.selectedNodeId ? [state.selectedNodeId] : []);
    if (idsToDelete.length > 0) {
      const idSet = new Set(idsToDelete);
      state.model.elements = state.model.elements.filter(e => !idSet.has(e.id));
      const removedRelIds = new Set(
        state.model.relationships.filter(r => idSet.has(r.sourceId) || idSet.has(r.targetId)).map(r => r.id)
      );
      state.model.relationships = state.model.relationships.filter(r => !removedRelIds.has(r.id));
      state.model.diagrams.forEach(d => {
        d.nodes = d.nodes.filter(n => !idSet.has(n.elementId));
        d.edges = d.edges.filter(eId => !removedRelIds.has(eId));
      });
      state.selectedNodeId = null;
      if (state.selectedNodeIds) state.selectedNodeIds.clear();
      showToast(idsToDelete.length === 1 ? 'Elemento eliminado del modelo' : `${idsToDelete.length} elementos eliminados`, 'info');
      renderAll();
      syncXmlView();
    }
  }

  // ==================== BI-DIRECTIONAL XML / XMI EDITOR ====================
  function syncXmlView() {
    const xmlArea = document.getElementById('xml-editor-textarea');
    if (!xmlArea) return;
    if (state.viewMode === 'split' || state.viewMode === 'xml') {
      try {
        const xml = ENGINE.modelToXml(state.model);
        xmlArea.value = xml;
        state.xmlDirty = false;
        const badge = document.getElementById('xml-sync-status');
        if (badge) {
          badge.textContent = '✓ Sincronizado con el Diagrama Visual';
          badge.className = 'xml-status-badge synced';
        }
      } catch (err) {
        console.error('Error generating XML:', err);
        const badge = document.getElementById('xml-sync-status');
        if (badge) {
          badge.textContent = '⚠ Error serializando XML: ' + err.message;
          badge.className = 'xml-status-badge dirty';
        }
      }
    }
  }

  function applyXmlFromEditor(silent = false) {
    const xmlArea = document.getElementById('xml-editor-textarea');
    if (!xmlArea) return;
    try {
      const newModel = ENGINE.xmlToModel(xmlArea.value);
      state.model = newModel;
      if (!state.model.diagrams.some(d => d.id === state.activeDiagramId)) {
        state.activeDiagramId = state.model.diagrams[0]?.id || '';
      }
      state.xmlDirty = false;
      renderAll();
      if (!silent) {
        showToast('Modelo actualizado exitosamente desde el código XML / XMI', 'success');
      }
    } catch (e) {
      showToast(`Error en sintaxis XML: ${e.message}`, 'error');
    }
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    const workspace = document.getElementById('main-workspace-split');
    const visualPane = document.getElementById('visual-canvas-pane');
    const xmlPane = document.getElementById('xml-editor-pane');

    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'visual') {
      visualPane.style.display = 'flex';
      xmlPane.style.display = 'none';
      workspace.className = 'workspace-center mode-visual';
    } else if (mode === 'split') {
      visualPane.style.display = 'flex';
      xmlPane.style.display = 'flex';
      workspace.className = 'workspace-center mode-split';
      syncXmlView();
    } else if (mode === 'xml') {
      visualPane.style.display = 'none';
      xmlPane.style.display = 'flex';
      workspace.className = 'workspace-center mode-xml';
      syncXmlView();
    }
  }

  // ==================== EXPORT STANDALONE SVG & 300-DPI PNG FOR THESIS ====================
  function buildStandaloneSvgString() {
    const dg = getActiveDiagram();
    if (!dg) return '';
    const dgDef = ENGINE.DIAGRAM_TYPES[dg.diagramType] || ENGINE.DIAGRAM_TYPES.CONTENT;
    const pkg = state.model.packages.find(p => p.id === dg.packageId);

    // Compute bounding box
    let maxX = 820;
    let maxY = 520;
    dg.nodes.forEach(n => {
      maxX = Math.max(maxX, n.x + n.width + 60);
      maxY = Math.max(maxY, n.y + n.height + 60);
    });

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}">
      <defs>
        <marker id="exp-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#333333" stroke-width="1.4" />
        </marker>
        <marker id="exp-gen" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
          <polygon points="1,1 11,6 1,11" fill="#FFFFFF" stroke="#333333" stroke-width="1.4" />
        </marker>
      </defs>
      <!-- Background & Outer MagicDraw 18 Frame -->
      <rect x="0" y="0" width="${maxX}" height="${maxY}" fill="#FFFFFF" />
      <rect x="8" y="8" width="${maxX - 16}" height="${maxY - 16}" fill="none" stroke="#8C96A8" stroke-width="1.2" />
      <!-- MagicDraw 18 Diagram Header Pentagon -->
      <polygon points="8,8 340,8 340,24 328,34 8,34" fill="#EAEFF8" stroke="#8C96A8" stroke-width="1.2" />
      <text x="16" y="25" font-family="Arial, sans-serif" font-size="11.5" fill="#1F2937">
        <tspan font-weight="bold">package</tspan> ${escapeXml(pkg ? pkg.name : 'Model')} [ ${escapeXml(dg.name)} ]
      </text>
    `;

    // Render Edges
    for (const edgeId of dg.edges) {
      const rel = getRelationship(edgeId);
      if (!rel) continue;
      const srcNode = dg.nodes.find(n => n.elementId === rel.sourceId);
      const tgtNode = dg.nodes.find(n => n.elementId === rel.targetId);
      if (!srcNode || !tgtNode) continue;
      const pts = computeEdgePoints(srcNode, tgtNode);
      const isDashed = rel.umlType === 'Dependency';
      const hasArrow = rel.umlType === 'DirectedAssociation' || rel.umlType === 'Transition' || rel.umlType === 'ControlFlow' || rel.umlType === 'Dependency';
      const isGen = rel.umlType === 'Generalization';
      const marker = isGen ? 'marker-end="url(#exp-gen)"' : (hasArrow ? 'marker-end="url(#exp-arrow)"' : '');

      svg += `<line x1="${pts.x1}" y1="${pts.y1}" x2="${pts.x2}" y2="${pts.y2}" stroke="#333333" stroke-width="1.3" ${isDashed ? 'stroke-dasharray="5,4"' : ''} ${marker} />`;

      const midX = (pts.x1 + pts.x2) / 2;
      const midY = (pts.y1 + pts.y2) / 2;
      if (rel.stereotype) {
        svg += `<rect x="${midX - 50}" y="${midY - 20}" width="100" height="14" fill="#FFFFFF" />`;
        svg += `<text x="${midX}" y="${midY - 9}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" fill="#111">«${escapeXml(rel.stereotype)}»</text>`;
      }
      if (rel.name) {
        svg += `<text x="${midX}" y="${midY + 12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" fill="#280000">${escapeXml(rel.name)}</text>`;
      }
      if (rel.sourceMult) {
        const sx = pts.x1 + (pts.x2 - pts.x1) * 0.14;
        const sy = pts.y1 + (pts.y2 - pts.y1) * 0.14 - 5;
        svg += `<text x="${sx}" y="${sy}" font-family="Arial, sans-serif" font-size="10" fill="#000">${escapeXml(rel.sourceMult)}</text>`;
      }
      if (rel.targetMult) {
        const tx = pts.x1 + (pts.x2 - pts.x1) * 0.86;
        const ty = pts.y1 + (pts.y2 - pts.y1) * 0.86 - 5;
        svg += `<text x="${tx}" y="${ty}" font-family="Arial, sans-serif" font-size="10" fill="#000">${escapeXml(rel.targetMult)}</text>`;
      }
    }

    // Render Nodes
    for (const nl of dg.nodes) {
      const el = getElement(nl.elementId);
      if (!el) continue;
      const x = nl.x;
      const y = nl.y;
      const w = nl.width;
      const h = nl.height;
      const iconDataUri = getStereotypeIcon(el.stereotype, el.umlType);
      const tagsEntries = Object.entries(el.tags || {}).filter(([, v]) => v !== '' && v !== false && v !== 'false');

      if (el.umlType === 'InitialNode') {
        svg += `<circle cx="${x + 14}" cy="${y + 14}" r="11" fill="#111111" />`;
        continue;
      }
      if (el.umlType === 'FinalNode') {
        svg += `<circle cx="${x + 15}" cy="${y + 15}" r="12" fill="#FFFFFF" stroke="#111111" stroke-width="1.6" />`;
        svg += `<circle cx="${x + 15}" cy="${y + 15}" r="7.5" fill="#111111" />`;
        continue;
      }
      if (el.umlType === 'DecisionNode') {
        svg += `<polygon points="${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}" fill="#FFE2C6" stroke="#99795C" stroke-width="1.4" />`;
        continue;
      }
      if (el.umlType === 'Actor') {
        const cx = x + w / 2;
        svg += `
          <circle cx="${cx}" cy="${y + 10}" r="7" fill="#FFE2C6" stroke="#99795C" stroke-width="1.5"/>
          <line x1="${cx}" y1="${y + 17}" x2="${cx}" y2="${y + 35}" stroke="#99795C" stroke-width="1.5"/>
          <line x1="${cx - 14}" y1="${y + 24}" x2="${cx + 14}" y2="${y + 24}" stroke="#99795C" stroke-width="1.5"/>
          <line x1="${cx}" y1="${y + 35}" x2="${cx - 11}" y2="${y + 50}" stroke="#99795C" stroke-width="1.5"/>
          <line x1="${cx}" y1="${y + 35}" x2="${cx + 11}" y2="${y + 50}" stroke="#99795C" stroke-width="1.5"/>
          ${el.stereotype ? `<text x="${cx}" y="${y + 64}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#222">«${escapeXml(el.stereotype)}»</text>` : ''}
          <text x="${cx}" y="${y + 77}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#000">${escapeXml(el.name)}</text>
        `;
        continue;
      }
      if (el.umlType === 'UseCase') {
        const cx = x + w / 2;
        const cy = y + h / 2;
        svg += `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" fill="${COLORS.useCaseFill}" stroke="${COLORS.useCaseBorder}" stroke-width="1.3" />`;

        const hasStereo = Boolean(el.stereotype);
        const hasTags = tagsEntries.length > 0;
        let startY = cy;
        if (hasStereo && hasTags) startY = cy - 14;
        else if (hasStereo || hasTags) startY = cy - 7;
        else startY = cy + 4;

        if (hasStereo) {
          svg += `<text x="${cx}" y="${startY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#222">«${escapeXml(el.stereotype)}»</text>`;
          if (iconDataUri) {
            svg += `<image x="${x + w - 32}" y="${y + 12}" width="15" height="15" href="${iconDataUri}" />`;
          }
          startY += 15;
        } else if (iconDataUri) {
          svg += `<image x="${x + w - 32}" y="${y + 12}" width="15" height="15" href="${iconDataUri}" />`;
        }

        svg += `<text x="${cx}" y="${startY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11.5" font-weight="bold" fill="#000">${escapeXml(el.name)}</text>`;

        if (hasTags) {
          startY += 13;
          for (const [k, v] of tagsEntries) {
            svg += `<text x="${cx}" y="${startY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#280000">{${escapeXml(k)} = ${escapeXml(String(v))}}</text>`;
            startY += 11;
          }
        }
        continue;
      }

      // Class, State, Action, Pin
      let fill = COLORS.classFill;
      let stroke = COLORS.classBorder;
      let rx = 0;
      if (el.umlType === 'State') {
        fill = COLORS.stateFill;
        stroke = COLORS.stateBorder;
        rx = 10;
      } else if (el.umlType === 'Action') {
        fill = COLORS.actionFill;
        stroke = COLORS.actionBorder;
        rx = 12;
      }

      // Shadow + Main Box
      svg += `<rect x="${x + 2}" y="${y + 2}" width="${w}" height="${h}" rx="${rx}" fill="rgba(0,0,0,0.08)" />`;
      svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.3" />`;

      let curY = y + 15;
      if (el.stereotype) {
        svg += `<text x="${x + w / 2 - 6}" y="${curY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" fill="#1F1F1F">«${escapeXml(el.stereotype)}»</text>`;
        curY += 15;
      }
      if (iconDataUri) {
        svg += `<image x="${x + w - 21}" y="${y + 4}" width="16" height="16" href="${iconDataUri}" />`;
      }
      svg += `<text x="${x + w / 2}" y="${curY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11.5" font-weight="bold" fill="#000000">${escapeXml(el.name)}</text>`;
      curY += 6;

      for (const [tk, tv] of tagsEntries) {
        curY += 12;
        svg += `<text x="${x + w / 2}" y="${curY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9.5" fill="${COLORS.attributeText}">{${escapeXml(tk)}=${escapeXml(String(tv))}}</text>`;
      }

      curY += 6;
      svg += `<line x1="${x}" y1="${curY}" x2="${x + w}" y2="${curY}" stroke="${stroke}" stroke-width="1" />`;

      // Attributes
      if (el.attributes && el.attributes.length > 0) {
        for (const attr of el.attributes) {
          curY += 14;
          svg += `<text x="${x + 8}" y="${curY}" font-family="Arial, sans-serif" font-size="10.5" fill="${COLORS.attributeText}">${escapeXml(attr)}</text>`;
        }
      }

      // Nested Presentation Properties
      if (el.nestedProperties && el.nestedProperties.length > 0) {
        const cols = 2;
        const pad = 8;
        const cellW = Math.floor((w - pad * 3) / cols);
        const cellH = 44;
        el.nestedProperties.forEach((np, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const px = x + pad + col * (cellW + pad);
          const py = curY + 8 + row * (cellH + 6);
          const npIcon = getStereotypeIcon(np.stereotype, 'Property');
          svg += `<rect x="${px}" y="${py}" width="${cellW}" height="${cellH}" fill="${COLORS.classFill}" stroke="${COLORS.propertyBorder}" stroke-width="1" stroke-dasharray="3,2" />`;
          svg += `<text x="${px + cellW / 2 - 5}" y="${py + 13}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9.5" fill="#222">«${escapeXml(np.stereotype)}»</text>`;
          if (npIcon) {
            svg += `<image x="${px + cellW - 17}" y="${py + 2}" width="14" height="14" href="${npIcon}" />`;
          }
          svg += `<text x="${px + cellW / 2}" y="${py + 27}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#000">:${escapeXml(np.name)}</text>`;
        });
      }
    }

    svg += `</svg>`;
    return { svg, width: maxX, height: maxY, name: dg.name };
  }

  function exportDiagramSvg() {
    const res = buildStandaloneSvgString();
    if (!res.svg) return;
    const blob = new Blob([res.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${res.name.replace(/\s+/g, '_')}_UWE.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Diagrama exportado en formato vectorial SVG (${res.name})`, 'success');
  }

  function exportDiagramPng() {
    const res = buildStandaloneSvgString();
    if (!res.svg) return;
    const scale = 3; // 300 DPI equivalent scale
    const img = new Image();
    const svgBlob = new Blob([res.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = res.width * scale;
      canvas.height = res.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${res.name.replace(/\s+/g, '_')}_UWE_300DPI.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
        showToast(`Diagrama exportado en PNG Alta Resolución 300 DPI (${res.name})`, 'success');
      }, 'image/png');
    };
    img.src = url;
  }

  // ==================== SQLITE PORTABLE FILE EXPORT / IMPORT / INSPECTOR ====================
  async function downloadPortableSqliteFile() {
    try {
      setStatus('Generando archivo SQLite relacional (.uwe.sqlite)...');
      const xmlContent = ENGINE.modelToXml(state.model);
      const res = await apiFetch('/api/sqlite/export', {
        method: 'POST',
        body: JSON.stringify({
          name: state.model.name,
          model: state.model,
          xmlContent
        })
      });
      if (res.base64) {
        const binStr = atob(res.base64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/vnd.sqlite3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename || `${state.model.name}.uwe.sqlite`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Archivo SQLite descargado: ${res.filename} (${Math.round(res.sizeBytes / 1024)} KB)`, 'success');
      }
    } catch (e) {
      showToast(`Error exportando SQLite: ${e.message}`, 'error');
    }
  }

  function importPortableSqliteFile(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1] || reader.result;
        const res = await apiFetch('/api/sqlite/import', {
          method: 'POST',
          body: JSON.stringify({ base64 })
        });
        if (res.model) {
          state.model = res.model;
          state.activeDiagramId = state.model.diagrams[0]?.id || '';
          state.selectedNodeId = null;
          state.selectedEdgeId = null;
          renderAll();
          showToast(`Archivo .uwe.sqlite importado (${res.stats?.elements || state.model.elements.length} elementos)`, 'success');
        }
      } catch (e) {
        showToast(`Error al importar .uwe.sqlite: ${e.message}`, 'error');
      }
    };
    reader.readAsDataURL(file);
  }

  async function openSqliteInspectorModal() {
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    if (!modal || !content) return;

    title.innerHTML = `<img src="${getIcon('MDUWEmodels.png')}" width="16" height="16" /> Base de Datos Relacional SQLite (magicuwe.sqlite)`;
    content.innerHTML = `<div style="padding:16px">Consultando motor SQLite...</div>`;
    modal.style.display = 'flex';

    try {
      const info = await apiFetch('/api/sqlite/inspect');
      content.innerHTML = `
        <div class="sqlite-inspector">
          <div class="sqlite-meta-cards">
            <div class="sqlite-card">
              <div class="sqlite-card-label">Motor SQLite</div>
              <div class="sqlite-card-val">${escapeHtml(info.engine)}</div>
            </div>
            <div class="sqlite-card">
              <div class="sqlite-card-label">Tamaño BD</div>
              <div class="sqlite-card-val">${Math.round((info.fileSizeBytes || 0) / 1024)} KB</div>
            </div>
            <div class="sqlite-card">
              <div class="sqlite-card-label">Usuarios</div>
              <div class="sqlite-card-val">${info.counts?.users || 0}</div>
            </div>
            <div class="sqlite-card">
              <div class="sqlite-card-label">Elementos UML/UWE</div>
              <div class="sqlite-card-val">${state.model.elements.length}</div>
            </div>
          </div>
          <p class="sqlite-desc">
            Tu modelo UWE se almacena en la base de datos relacional SQLite del servidor con las tablas <code>uwe_packages</code>, <code>uwe_elements</code>, <code>uwe_relationships</code>, <code>uwe_diagrams</code> y <code>uwe_xml_snapshots</code>.
          </p>
          <div class="sqlite-actions-bar">
            <button class="md-btn" id="modal-btn-up-sqlite">📂 Importar Archivo .uwe.sqlite</button>
            <button class="md-btn md-btn-primary" id="modal-btn-close-sqlite">Cerrar</button>
          </div>
        </div>
      `;
      document.getElementById('modal-btn-close-sqlite').onclick = () => {
        modal.style.display = 'none';
      };
      document.getElementById('modal-btn-up-sqlite').onclick = () => {
        document.getElementById('hidden-sqlite-input').click();
        modal.style.display = 'none';
      };
    } catch (e) {
      content.innerHTML = `<div style="padding:16px;color:#b91c1c">${escapeHtml(e.message)}</div>`;
    }
  }

  // ==================== PROJECT SELECTION / EXAMPLES MODAL ====================
  function openProjectSelectionModal({ isFirstVisit = false } = {}) {
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    if (!modal || !content) return;

    const examples = ENGINE.getExampleProjects ? ENGINE.getExampleProjects() : [];
    let selectedId = 'music_portal';

    title.innerHTML = isFirstVisit
      ? `<img src="${getIcon('UWEicon.png')}" width="16" height="16" /> Bienvenido a MagicUWE Web — Seleccionar Proyecto Inicial`
      : `<img src="${getIcon('UWEicon.png')}" width="16" height="16" /> Cargar Proyecto de Ejemplo o Plantilla UWE`;

    let cardsHtml = '';
    for (const ex of examples) {
      const isSel = ex.id === selectedId;
      const recBadge = ex.isRecommended
        ? `<span class="example-badge recommended">Recomendado</span>`
        : `<span class="example-badge">${escapeHtml(ex.badge || '')}</span>`;

      const pdfLinkHtml = ex.pdfUrl ? `
        <div style="margin-top:6px;">
          <a href="${ex.pdfUrl}" target="_blank" rel="noopener noreferrer" class="example-pdf-link" onclick="event.stopPropagation();" title="Abrir especificación en el PDF original">
            📖 ${escapeHtml(ex.pdfLabel || 'Ver en PDF')} ↗
          </a>
        </div>
      ` : '';

      cardsHtml += `
        <div class="example-card ${isSel ? 'selected' : ''}" data-example-id="${ex.id}" id="card-ex-${ex.id}">
          <input type="radio" name="project_example_choice" value="${ex.id}" class="example-card-radio" ${isSel ? 'checked' : ''} />
          <div class="example-card-icon">${ex.icon || '📁'}</div>
          <div class="example-card-content">
            <div class="example-card-title-row">
              <span class="example-card-title">${escapeHtml(ex.name)}</span>
              ${recBadge}
            </div>
            <div class="example-card-desc">${escapeHtml(ex.description)}</div>
            <div class="example-card-tags">
              <span class="example-tag">${escapeHtml(ex.stats || '')}</span>
              <span class="example-tag">${escapeHtml(ex.category || '')}</span>
            </div>
            ${pdfLinkHtml}
          </div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="examples-modal-grid">

        <p class="examples-header-desc">
          ${isFirstVisit
        ? '¡Bienvenido al entorno CASE web de <strong>Ingeniería Web basada en UML (UWE 3.0)</strong>! Selecciona si deseas cargar un caso de estudio del manual oficial de UWE (Nora Koch, Sevilla 2010) o iniciar con un proyecto en blanco:'
        : 'Selecciona el proyecto de ejemplo o plantilla que deseas abrir en el entorno de modelado:'}
        </p>
        <div class="examples-list" style="display:flex;flex-direction:column;gap:10px;">
          ${cardsHtml}
        </div>
      </div>
      <div class="examples-modal-footer">
        <label class="examples-remember-check">
          <input type="checkbox" id="check-remember-project-choice" ${isFirstVisit ? 'checked' : ''} />
          <span>No volver a mostrar esta ventana al iniciar</span>
        </label>
        <div style="display:flex;gap:8px;">
          ${!isFirstVisit ? `<button class="md-btn" id="btn-cancel-example-select">Cancelar</button>` : ''}
          <button class="md-btn md-btn-primary" id="btn-confirm-example-select" style="font-weight:bold;padding:5px 14px;">
            Cargar Proyecto
          </button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    // Click handler for cards
    content.querySelectorAll('.example-card').forEach(card => {
      card.onclick = () => {
        const id = card.getAttribute('data-example-id');
        selectedId = id;
        content.querySelectorAll('.example-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      };
    });

    if (!isFirstVisit) {
      const cancelBtn = document.getElementById('btn-cancel-example-select');
      if (cancelBtn) cancelBtn.onclick = () => { modal.style.display = 'none'; };
    }

    const confirmBtn = document.getElementById('btn-confirm-example-select');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        const selectedEx = examples.find(e => e.id === selectedId) || examples[0];
        if (selectedEx) {
          if (selectedEx.id === 'blank') {
            state.model = selectedEx.create('Proyecto UWE');
          } else {
            state.model = selectedEx.create();
          }
          state.activeDiagramId = state.model.diagrams[0]?.id || '';
          state.currentProjectId = null;
          state.selectedNodeId = null;
          if (state.selectedNodeIds) state.selectedNodeIds.clear();
          state.selectedEdgeId = null;

          const rememberCheck = document.getElementById('check-remember-project-choice');
          if (rememberCheck && rememberCheck.checked) {
            localStorage.setItem('magicuwe_visited', 'true');
          }

          modal.style.display = 'none';
          renderAll();
          showToast(`Proyecto '${state.model.name}' cargado exitosamente`, 'success');
        }
      };
    }
  }

  // Cache for auth configuration from /api/auth/config
  let authConfigCache = null;
  async function getAuthConfig() {
    if (authConfigCache) return authConfigCache;
    try {
      authConfigCache = await apiFetch('/api/auth/config');
    } catch (_e) {
      authConfigCache = { googleClientId: '', isGoogleConfigured: false, appVersion: '1.5.0' };
    }
    return authConfigCache;
  }

  function checkFirstVisit() {
    const hasVisited = localStorage.getItem('magicuwe_visited');
    const token = localStorage.getItem('magicuwe_token');
    if (!state.user && !token) {
      // First visit or unauthenticated session: prompt user to log in / register
      openAuthModal({ isFirstVisit: true, initialTab: 'login' });
    } else if (!hasVisited) {
      openProjectSelectionModal({ isFirstVisit: true });
    }
  }

  // ==================== AUTH MODAL (GOOGLE / GMAIL & MULTI-USER) ====================
  async function openAuthModal(options = {}) {
    const { isFirstVisit = false, initialTab = 'login' } = options;
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    if (!modal || !content) return;

    title.innerHTML = `<img src="${getIcon('stereotypes/userModel/user.png')}" width="16" height="16" /> Iniciar Sesión / Crear Cuenta (Multi-usuario y Gmail)`;

    const authConfig = await getAuthConfig();
    const isGoogleConfigured = Boolean(authConfig && authConfig.isGoogleConfigured);

    content.innerHTML = `
      <div class="auth-modal-container">
        ${isFirstVisit ? `
          <div class="auth-welcome-banner">
            <span class="auth-welcome-icon">🎓</span>
            <div class="auth-welcome-text">
              <h4>¡Bienvenido a MagicUWE Web 1.5.0!</h4>
              <p>Por favor <strong>inicia sesión</strong> o <strong>crea tu cuenta</strong> para comenzar a modelar proyectos UWE y guardarlos en la base de datos SQLite. También puedes ingresar rápidamente con tu cuenta de <strong>Gmail</strong>.</p>
            </div>
          </div>
        ` : ''}

        <div class="auth-tabs-bar">
          <button class="auth-tab-btn ${initialTab === 'login' ? 'active' : ''}" data-tab="login" id="tab-btn-login">
            🔑 Iniciar Sesión
          </button>
          <button class="auth-tab-btn ${initialTab === 'register' ? 'active' : ''}" data-tab="register" id="tab-btn-register">
            📝 Registrarse
          </button>
          <button class="auth-tab-btn ${initialTab === 'google' ? 'active' : ''}" data-tab="google" id="tab-btn-google">
            <svg width="14" height="14" viewBox="0 0 48 48" style="vertical-align:middle;display:inline-block"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Cuenta de Gmail / Google
          </button>
        </div>

        <!-- TAB 1: INICIAR SESIÓN -->
        <div class="auth-tab-pane ${initialTab === 'login' ? 'active' : ''}" id="pane-auth-login">
          <div class="insp-field">
            <label>Correo Electrónico o Usuario</label>
            <input type="text" id="login-email-input" class="md-input" placeholder="tu.correo@universidad.edu o usuario" autocomplete="username" />
          </div>
          <div class="insp-field">
            <label>Contraseña</label>
            <input type="password" id="login-pass-input" class="md-input" placeholder="••••••••" autocomplete="current-password" />
          </div>
          <button class="md-btn md-btn-primary md-btn-full" id="btn-login-submit" style="padding:7px;font-weight:bold;margin-top:4px;">
            Iniciar Sesión
          </button>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;font-size:11px;">
            <span>¿No tienes una cuenta? <a href="#" id="link-switch-to-register" class="auth-link-text">Crear cuenta</a></span>
            <button class="md-btn md-btn-google md-btn-sm" id="btn-quick-google-switch">
              Continuar con Google / Gmail
            </button>
          </div>
        </div>

        <!-- TAB 2: REGISTRARSE -->
        <div class="auth-tab-pane ${initialTab === 'register' ? 'active' : ''}" id="pane-auth-register">
          <div class="insp-field">
            <label>Nombre Completo (Investigador / Tesis)</label>
            <input type="text" id="reg-name-input" class="md-input" placeholder="Ej. Flavio Abdon" autocomplete="name" />
          </div>
          <div class="insp-field">
            <label>Correo Electrónico o Nombre de Usuario</label>
            <input type="text" id="reg-email-input" class="md-input" placeholder="usuario@universidad.edu o mi_usuario" autocomplete="email" />
          </div>
          <div class="insp-row-2">
            <div class="insp-field">
              <label>Contraseña</label>
              <input type="password" id="reg-pass-input" class="md-input" placeholder="Mínimo 4 caracteres" autocomplete="new-password" />
            </div>
            <div class="insp-field">
              <label>Confirmar Contraseña</label>
              <input type="password" id="reg-pass2-input" class="md-input" placeholder="Repite la contraseña" autocomplete="new-password" />
            </div>
          </div>
          <button class="md-btn md-btn-primary md-btn-full" id="btn-register-submit" style="padding:7px;font-weight:bold;margin-top:4px;">
            Crear Cuenta y Continuar
          </button>
          <div style="margin-top:4px;font-size:11px;text-align:center;">
            ¿Ya tienes una cuenta registrada? <a href="#" id="link-switch-to-login" class="auth-link-text">Inicia sesión aquí</a>
          </div>
        </div>

        <!-- TAB 3: GMAIL / GOOGLE -->
        <div class="auth-tab-pane ${initialTab === 'google' ? 'active' : ''}" id="pane-auth-google">
          ${isGoogleConfigured ? `
            <div class="auth-env-badge configured">
              <span>🟢</span>
              <div>
                <strong>Google OAuth 2.0 Activo:</strong> Cliente configurado desde <code>.env</code>. Puedes iniciar sesión usando el botón oficial de Google abajo.
              </div>
            </div>
            <div id="google-official-btn-container" style="display:flex;justify-content:center;margin:6px 0;"></div>
            <div style="text-align:center;font-size:10.5px;color:#777;margin:4px 0;">— o ingresa con tu dirección de Gmail abajo —</div>
          ` : `
            <div class="auth-env-badge notice">
              <span>💡</span>
              <div>
                <strong>Acceso Rápido con Gmail (Directo / Local):</strong> Puedes ingresar directamente con tu cuenta de Gmail a continuación.<br/>
                <em>Para habilitar el botón oficial de Google OAuth, guarda tu <code>GOOGLE_CLIENT_ID</code> en el archivo <code>magicuwe-web/.env</code>.</em>
              </div>
            </div>
          `}

          <div class="insp-field">
            <label>Correo Electrónico de Gmail</label>
            <input type="email" id="gmail-email-input" class="md-input" placeholder="tu.nombre@gmail.com" />
          </div>
          <div class="insp-field">
            <label>Tu Nombre Completo (Opcional)</label>
            <input type="text" id="gmail-name-input" class="md-input" placeholder="Ej. Flavio Abdon" />
          </div>
          <button class="md-btn md-btn-google md-btn-full" id="btn-submit-gmail" style="padding:7px;font-weight:bold;">
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continuar con Cuenta de Gmail
          </button>

          <details class="auth-help-details">
            <summary style="cursor:pointer;font-weight:600;color:#1C4D8F;">⚙️ ¿Cómo generar y configurar el Token / Client ID de Google en el archivo .env?</summary>
            <div style="margin-top:6px;padding-left:4px;">
              <ol style="margin:4px 0;padding-left:18px;">
                <li>Entra a la consola de Google: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:#316AC5;">Google Cloud Console &gt; Credenciales</a>.</li>
                <li>Haz clic en <strong>Crear credenciales &gt; ID de cliente de OAuth</strong> (Tipo de aplicación: <em>Aplicación Web</em>).</li>
                <li>En <strong>Orígenes de JavaScript autorizados</strong>, añade: <code>http://localhost:3456</code></li>
                <li>Copia tu <strong>ID de cliente</strong> (termina en <code>.apps.googleusercontent.com</code>).</li>
                <li>Pégalo en el archivo <code>magicuwe-web/.env</code>:
                  <div style="background:#FFF;border:1px solid #CCC;padding:4px 6px;margin:4px 0;font-family:monospace;font-size:10.5px;">GOOGLE_CLIENT_ID=tu-id-de-cliente.apps.googleusercontent.com</div>
                </li>
                <li>Reinicia el servidor (o recarga). El botón oficial de Google aparecerá automáticamente arriba.</li>
              </ol>
            </div>
          </details>
        </div>

        <!-- MODAL FOOTER -->
        <div class="auth-footer-actions">
          <button class="md-btn" id="btn-guest-mode" style="background:#ECE9D8;border:1px solid #7F9DB9;color:#333;" title="Explorar la herramienta sin guardar en la nube">
            👤 Continuar como Invitado (Modo local)
          </button>
          ${!isFirstVisit ? `<button class="md-btn" id="btn-cancel-auth">Cancelar</button>` : ''}
        </div>
      </div>
    `;
    modal.style.display = 'flex';

    function switchTab(tabName) {
      content.querySelectorAll('.auth-tab-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
      });
      content.querySelectorAll('.auth-tab-pane').forEach(p => {
        p.classList.toggle('active', p.id === `pane-auth-${tabName}`);
      });
    }

    content.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.onclick = () => switchTab(btn.getAttribute('data-tab'));
    });

    const linkGoReg = document.getElementById('link-switch-to-register');
    if (linkGoReg) linkGoReg.onclick = (e) => { e.preventDefault(); switchTab('register'); };

    const linkGoLogin = document.getElementById('link-switch-to-login');
    if (linkGoLogin) linkGoLogin.onclick = (e) => { e.preventDefault(); switchTab('login'); };

    const btnQuickGoogle = document.getElementById('btn-quick-google-switch');
    if (btnQuickGoogle) btnQuickGoogle.onclick = () => switchTab('google');

    const onAuthSuccess = async (res, msg) => {
      state.token = res.token;
      state.user = res.user;
      localStorage.setItem('magicuwe_token', res.token);
      modal.style.display = 'none';
      renderAuthBar();
      await loadUserProjects();
      showToast(msg || `¡Bienvenido ${res.user.name}!`, 'success');
      if (isFirstVisit && !localStorage.getItem('magicuwe_visited')) {
        openProjectSelectionModal({ isFirstVisit: true });
      }
    };

    // Google Identity Services (GIS) initialization if configured
    if (isGoogleConfigured && window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: authConfig.googleClientId,
          callback: async (response) => {
            try {
              const res = await apiFetch('/api/auth/google', {
                method: 'POST',
                body: JSON.stringify({
                  credential: response.credential,
                  model: state.model,
                  xmlContent: ENGINE.modelToXml(state.model)
                })
              });
              await onAuthSuccess(res, `¡Autenticado con Google como ${res.user.name}!`);
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        });
        const gBtnEl = document.getElementById('google-official-btn-container');
        if (gBtnEl) {
          window.google.accounts.id.renderButton(gBtnEl, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 280
          });
        }
      } catch (gErr) {
        console.warn('Google Identity Services no pudo inicializarse:', gErr);
      }
    }

    // Tab 1: Submit Login
    const doLogin = async () => {
      const email = document.getElementById('login-email-input').value.trim();
      const password = document.getElementById('login-pass-input').value;
      if (!email || !password) {
        showToast('Ingresa tu correo o usuario y tu contraseña', 'warning');
        return;
      }
      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        await onAuthSuccess(res, `Sesión iniciada como ${res.user.name}`);
      } catch (e) {
        showToast(e.message, 'error');
      }
    };
    document.getElementById('btn-login-submit').onclick = doLogin;
    document.getElementById('login-email-input').onkeydown = (e) => { if (e.key === 'Enter') doLogin(); };
    document.getElementById('login-pass-input').onkeydown = (e) => { if (e.key === 'Enter') doLogin(); };

    // Tab 2: Submit Register
    const doRegister = async () => {
      const name = document.getElementById('reg-name-input').value.trim();
      const email = document.getElementById('reg-email-input').value.trim();
      const password = document.getElementById('reg-pass-input').value;
      const password2 = document.getElementById('reg-pass2-input').value;

      if (!email || !password) {
        showToast('Ingresa usuario/correo y contraseña', 'warning');
        return;
      }
      if (password.length < 4) {
        showToast('La contraseña debe tener al menos 4 caracteres', 'warning');
        return;
      }
      if (password !== password2) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
      }
      try {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: name || email.split('@')[0],
            email,
            password,
            model: state.model,
            xmlContent: ENGINE.modelToXml(state.model)
          })
        });
        await onAuthSuccess(res, `¡Cuenta creada exitosamente para ${res.user.name}!`);
      } catch (e) {
        showToast(e.message, 'error');
      }
    };
    document.getElementById('btn-register-submit').onclick = doRegister;
    document.getElementById('reg-name-input').onkeydown = (e) => { if (e.key === 'Enter') doRegister(); };
    document.getElementById('reg-email-input').onkeydown = (e) => { if (e.key === 'Enter') doRegister(); };
    document.getElementById('reg-pass-input').onkeydown = (e) => { if (e.key === 'Enter') doRegister(); };
    document.getElementById('reg-pass2-input').onkeydown = (e) => { if (e.key === 'Enter') doRegister(); };

    // Tab 3: Submit Gmail
    const doGmail = async () => {
      let email = document.getElementById('gmail-email-input').value.trim();
      const name = document.getElementById('gmail-name-input').value.trim();
      if (!email) {
        showToast('Ingresa tu correo de Gmail', 'warning');
        return;
      }
      if (!email.includes('@')) email += '@gmail.com';
      try {
        const res = await apiFetch('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({
            email,
            name: name || email.split('@')[0],
            googleId: 'gmail_' + email.toLowerCase(),
            model: state.model,
            xmlContent: ENGINE.modelToXml(state.model)
          })
        });
        await onAuthSuccess(res, `¡Bienvenido ${res.user.name} (${res.user.email})!`);
      } catch (e) {
        showToast(e.message, 'error');
      }
    };
    document.getElementById('btn-submit-gmail').onclick = doGmail;
    document.getElementById('gmail-email-input').onkeydown = (e) => { if (e.key === 'Enter') doGmail(); };
    document.getElementById('gmail-name-input').onkeydown = (e) => { if (e.key === 'Enter') doGmail(); };

    // Guest Mode & Cancel
    document.getElementById('btn-guest-mode').onclick = () => {
      modal.style.display = 'none';
      if (isFirstVisit && !localStorage.getItem('magicuwe_visited')) {
        openProjectSelectionModal({ isFirstVisit: true });
      }
      showToast('Modo Invitado activo: trabajando localmente en el navegador', 'info');
    };

    const cancelBtn = document.getElementById('btn-cancel-auth');
    if (cancelBtn) {
      cancelBtn.onclick = () => { modal.style.display = 'none'; };
    }
  }

  // ==================== NEW DIAGRAM MODAL ====================
  function openNewDiagramModal() {
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    if (!modal || !content) return;

    title.innerHTML = `<img src="${getIcon('UWEicon.png')}" width="16" height="16" /> Crear Nuevo Diagrama UWE 3.0`;
    content.innerHTML = `
      <div class="new-dg-form">
        <div class="insp-field">
          <label>Nombre del Diagrama</label>
          <input type="text" id="new-dg-name" class="md-input" value="New UWE Diagram" />
        </div>
        <div class="insp-field">
          <label>Selecciona el Tipo de Diagrama UWE (10 vistas oficiales)</label>
          <div class="new-dg-grid">
            ${Object.values(ENGINE.DIAGRAM_TYPES).map((dt, idx) => `
              <label class="new-dg-option ${idx === 0 ? 'selected' : ''}">
                <input type="radio" name="new-dg-type" value="${dt.key}" ${idx === 0 ? 'checked' : ''} />
                <img src="${getIcon(dt.icon)}" width="18" height="18" alt="" />
                <div>
                  <div class="new-dg-opt-title">${escapeHtml(dt.label)}</div>
                  <div class="new-dg-opt-pkg">«${escapeHtml(dt.packageStereotype)}»</div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:14px;text-align:right">
          <button class="md-btn md-btn-primary" id="btn-confirm-new-dg">Crear Diagrama</button>
        </div>
      </div>
    `;
    modal.style.display = 'flex';

    content.querySelectorAll('.new-dg-option').forEach(lbl => {
      lbl.onclick = () => {
        content.querySelectorAll('.new-dg-option').forEach(l => l.classList.remove('selected'));
        lbl.classList.add('selected');
      };
    });

    document.getElementById('btn-confirm-new-dg').onclick = () => {
      const name = document.getElementById('new-dg-name').value.trim() || 'UWE Diagram';
      const checked = content.querySelector('input[name="new-dg-type"]:checked');
      const dgType = checked ? checked.value : 'NAVIGATION';
      const dtDef = ENGINE.DIAGRAM_TYPES[dgType];

      let pkg = state.model.packages.find(p => p.stereotype === dtDef.packageStereotype);
      if (!pkg) {
        pkg = {
          id: 'pkg_' + Math.random().toString(36).slice(2, 8),
          name: dtDef.shortLabel,
          stereotype: dtDef.packageStereotype
        };
        state.model.packages.push(pkg);
      }

      const newDg = {
        id: 'dg_' + Math.random().toString(36).slice(2, 8),
        packageId: pkg.id,
        name,
        diagramType: dgType,
        nodes: [],
        edges: []
      };
      state.model.diagrams.push(newDg);
      state.activeDiagramId = newDg.id;
      modal.style.display = 'none';
      renderAll();
      showToast(`Diagrama "${name}" (${dtDef.label}) creado`, 'success');
    };
  }

  // ==================== GLOBAL EVENTS & CANVAS INTERACTION ====================
  function setupEvents() {
    const canvasContainer = document.getElementById('canvas-container');
    const canvasSurface = document.getElementById('canvas-surface');

    if (canvasContainer) {
      canvasContainer.ondragover = (ev) => {
        ev.preventDefault();
        if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
      };
    }

    if (canvasSurface) {
      // HTML5 Drag and Drop target from vertical palette
      canvasSurface.ondragover = (ev) => {
        ev.preventDefault();
        if (ev.dataTransfer) {
          ev.dataTransfer.dropEffect = 'copy';
        }
      };

      canvasSurface.ondragenter = (ev) => {
        ev.preventDefault();
      };

      canvasSurface.ondrop = (ev) => {
        ev.preventDefault();
        const dg = getActiveDiagram();
        if (!dg) return;
        const dgDef = ENGINE.DIAGRAM_TYPES[dg.diagramType] || ENGINE.DIAGRAM_TYPES.CONTENT;

        let tool = state.draggedPaletteTool;
        if (!tool) {
          const toolId = ev.dataTransfer?.getData('text/plain');
          if (toolId && dgDef) {
            tool = dgDef.tools.find(t => t.id === toolId);
          }
        }
        if (!tool && state.activeTool && (state.activeTool.type === 'NODE' || state.activeTool.type === 'NESTED_PROPERTY')) {
          tool = state.activeTool;
        }
        if (!tool) return;

        const rect = canvasSurface.getBoundingClientRect();
        const canvasX = (ev.clientX - rect.left) / state.zoom;
        const canvasY = (ev.clientY - rect.top) / state.zoom;

        if (tool.type === 'NESTED_PROPERTY') {
          // Check if dropped inside an existing container node
          const hitNode = dg.nodes.slice().reverse().find(nl => {
            return canvasX >= nl.x && canvasX <= nl.x + nl.width &&
                   canvasY >= nl.y && canvasY <= nl.y + nl.height;
          });
          if (hitNode) {
            const targetEl = getElement(hitNode.elementId);
            if (targetEl) {
              if (!targetEl.nestedProperties) targetEl.nestedProperties = [];
              const newPropName = `${tool.stereotype}_${targetEl.nestedProperties.length + 1}`;
              targetEl.nestedProperties.push({
                name: newPropName,
                stereotype: tool.stereotype,
                tags: {}
              });
              hitNode.height = Math.max(hitNode.height, 90 + Math.ceil(targetEl.nestedProperties.length / 2) * 58);
              state.selectedNodeId = targetEl.id;
              state.selectedNodeIds = new Set([targetEl.id]);
              state.selectedNestedPropIdx = targetEl.nestedProperties.length - 1;
              state.activeTool = { id: 'select', type: 'SELECT', label: 'Select' };
              showToast(`Propiedad «${tool.stereotype}» anidada en ${targetEl.name}`, 'success');
              renderAll();
              return;
            }
          }
          // If dropped on empty canvas, create a presentationPage container at drop position
          const newContainerId = 'el_' + Math.random().toString(36).slice(2, 9);
          const newContainer = {
            id: newContainerId,
            packageId: dg.packageId,
            umlType: 'Class',
            stereotype: 'presentationPage',
            name: `Page_${state.model.elements.length + 1}`,
            attributes: [],
            operations: [],
            tags: {},
            nestedProperties: [{
              name: `${tool.stereotype}_1`,
              stereotype: tool.stereotype,
              tags: {}
            }]
          };
          state.model.elements.push(newContainer);
          dg.nodes.push({
            elementId: newContainerId,
            x: Math.max(20, Math.round(canvasX - 140)),
            y: Math.max(45, Math.round(canvasY - 80)),
            width: 280,
            height: 160
          });
          state.selectedNodeId = newContainerId;
          state.selectedNodeIds = new Set([newContainerId]);
          state.selectedNestedPropIdx = 0;
          state.activeTool = { id: 'select', type: 'SELECT', label: 'Select' };
          showToast(`«presentationPage» creada con propiedad «${tool.stereotype}»`, 'success');
          renderAll();
          return;
        }

        if (tool.type === 'NODE') {
          const isSmall = ['InitialNode', 'FinalNode', 'DecisionNode'].includes(tool.umlType);
          const isContainer = ['presentationPage', 'presentationGroup'].includes(tool.stereotype);
          const isUc = tool.umlType === 'UseCase';
          const isActor = tool.umlType === 'Actor';
          const defW = isSmall ? 36 : (isContainer ? 280 : (isUc ? 150 : (isActor ? 40 : 175)));
          const defH = isSmall ? 36 : (isContainer ? 160 : (isUc ? 70 : (isActor ? 65 : 82)));

          const dropX = Math.max(20, Math.round(canvasX - defW / 2));
          const dropY = Math.max(45, Math.round(canvasY - defH / 2));

          placeNewNodeOnDiagram(tool, dropX, dropY);
          return;
        }
      };

      canvasSurface.onmousedown = (ev) => {
        if (ev.target !== canvasSurface && !ev.target.classList.contains('canvas-edges-svg') && !ev.target.classList.contains('canvas-nodes-layer')) {
          return;
        }
        const rect = canvasSurface.getBoundingClientRect();

        // If a NODE placement tool is active, create the element on the canvas
        if (state.activeTool && state.activeTool.type === 'NODE') {
          const tool = state.activeTool;
          const isSmall = ['InitialNode', 'FinalNode', 'DecisionNode'].includes(tool.umlType);
          const isContainer = ['presentationPage', 'presentationGroup'].includes(tool.stereotype);
          const isUc = tool.umlType === 'UseCase';
          const isActor = tool.umlType === 'Actor';
          const defW = isSmall ? 36 : (isContainer ? 280 : (isUc ? 150 : (isActor ? 40 : 175)));
          const defH = isSmall ? 36 : (isContainer ? 160 : (isUc ? 70 : (isActor ? 65 : 82)));
          const x = Math.max(20, Math.round((ev.clientX - rect.left) / state.zoom - defW / 2));
          const y = Math.max(45, Math.round((ev.clientY - rect.top) / state.zoom - defH / 2));
          placeNewNodeOnDiagram(tool, x, y);
          return;
        }

        // Otherwise deselect
        state.selectedNodeId = null;
        if (state.selectedNodeIds) state.selectedNodeIds.clear();
        state.selectedEdgeId = null;
        state.selectedNestedPropIdx = null;
        state.pendingEdgeSourceId = null;
        renderAll();
      };
    }

    window.addEventListener('mousemove', (ev) => {
      const dg = getActiveDiagram();
      if (!dg) return;
      if (state.dragging) {
        const dx = (ev.clientX - state.dragging.startX) / state.zoom;
        const dy = (ev.clientY - state.dragging.startY) / state.zoom;
        if (state.dragging.items && state.dragging.items.length > 0) {
          for (const item of state.dragging.items) {
            const nl = dg.nodes.find(n => n.elementId === item.elementId);
            if (nl) {
              nl.x = Math.max(10, Math.round(item.origX + dx));
              nl.y = Math.max(38, Math.round(item.origY + dy));
            }
          }
        } else {
          const nl = dg.nodes.find(n => n.elementId === state.dragging.elementId);
          if (nl) {
            nl.x = Math.max(10, Math.round(state.dragging.origX + dx));
            nl.y = Math.max(38, Math.round(state.dragging.origY + dy));
          }
        }
        renderCanvas();
      } else if (state.resizing) {
        const nl = dg.nodes.find(n => n.elementId === state.resizing.elementId);
        if (nl) {
          const resEl = getElement(nl.elementId);
          const isUc = resEl && resEl.umlType === 'UseCase';
          const minW = isUc ? 80 : 110;
          const minH = isUc ? 40 : 60;
          nl.width = Math.max(minW, Math.round(state.resizing.origW + (ev.clientX - state.resizing.startX) / state.zoom));
          nl.height = Math.max(minH, Math.round(state.resizing.origH + (ev.clientY - state.resizing.startY) / state.zoom));
          renderCanvas();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (state.dragging || state.resizing) {
        state.dragging = null;
        state.resizing = null;
        syncXmlView();
      }
    });

    // Keyboard shortcuts (Delete, Canva grouping, Escape) - Toolbar shortcuts removed per user requirement
    window.addEventListener('keydown', (ev) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        if (state.selectedNodeId || state.selectedEdgeId) {
          deleteSelectedElementOrEdge();
        }
      } else if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'g' || ev.key === 'G') && !ev.shiftKey) {
        ev.preventDefault();
        groupSelectedNodes();
      } else if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'g' || ev.key === 'G') && ev.shiftKey) {
        ev.preventDefault();
        ungroupSelectedNodes();
      } else if ((ev.ctrlKey || ev.metaKey) && ev.key === ']') {
        ev.preventDefault();
        bringForward();
      } else if ((ev.ctrlKey || ev.metaKey) && ev.key === '[') {
        ev.preventDefault();
        sendBackward();
      } else if (ev.key === 'Escape') {
        state.activeTool = { id: 'select', type: 'SELECT', label: 'Select' };
        state.pendingEdgeSourceId = null;
        renderAll();
      }
    });

    // Top bar & XML controls
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.onclick = () => setViewMode(btn.dataset.mode);
    });

    const xmlArea = document.getElementById('xml-editor-textarea');
    if (xmlArea) {
      xmlArea.oninput = () => {
        state.xmlDirty = true;
        const badge = document.getElementById('xml-sync-status');
        if (badge) {
          badge.textContent = '● XML modificado (Haz clic en "Aplicar XML al Modelo")';
          badge.className = 'xml-status-badge dirty';
        }
      };
    }

    const btnApplyXml = document.getElementById('btn-apply-xml');
    if (btnApplyXml) btnApplyXml.onclick = () => applyXmlFromEditor(false);

    const btnDownloadXml = document.getElementById('btn-download-xml');
    if (btnDownloadXml) {
      btnDownloadXml.onclick = () => {
        const xml = ENGINE.modelToXml(state.model);
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.model.name.replace(/\s+/g, '_')}.uwe.xmi.xml`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Archivo XML / XMI descargado', 'success');
      };
    }

    // Toolbar Canva Layer & Group buttons
    const btnBringFront = document.getElementById('btn-bring-front');
    if (btnBringFront) btnBringFront.onclick = bringToFront;
    const btnBringForward = document.getElementById('btn-bring-forward');
    if (btnBringForward) btnBringForward.onclick = bringForward;
    const btnSendBackward = document.getElementById('btn-send-backward');
    if (btnSendBackward) btnSendBackward.onclick = sendBackward;
    const btnSendBack = document.getElementById('btn-send-back');
    if (btnSendBack) btnSendBack.onclick = sendToBack;
    const btnGroupNodes = document.getElementById('btn-group-nodes');
    if (btnGroupNodes) btnGroupNodes.onclick = groupSelectedNodes;
    const btnUngroupNodes = document.getElementById('btn-ungroup-nodes');
    if (btnUngroupNodes) btnUngroupNodes.onclick = ungroupSelectedNodes;

    // Transformations Menu
    document.querySelectorAll('[data-trans-key]').forEach(item => {
      item.onclick = () => {
        const key = item.dataset.transKey;
        const res = ENGINE.executeTransformation(state.model, key);
        state.model = res.model;
        if (res.activeDiagramId) state.activeDiagramId = res.activeDiagramId;
        renderAll();
        showToast(res.summary, 'success');
      };
    });

    // Export buttons
    const btnExportPng = document.getElementById('btn-export-png');
    if (btnExportPng) btnExportPng.onclick = exportDiagramPng;
    const btnExportSvg = document.getElementById('btn-export-svg');
    if (btnExportSvg) btnExportSvg.onclick = exportDiagramSvg;
    const btnSaveCloud = document.getElementById('btn-save-cloud');
    if (btnSaveCloud) btnSaveCloud.onclick = saveCurrentProject;
    const btnSqliteDl = document.getElementById('btn-sqlite-Download');
    if (btnSqliteDl) btnSqliteDl.onclick = downloadPortableSqliteFile;
    const btnSqliteInspect = document.getElementById('btn-sqlite-inspect');
    if (btnSqliteInspect) btnSqliteInspect.onclick = openSqliteInspectorModal;

    const sqliteFileInput = document.getElementById('hidden-sqlite-input');
    if (sqliteFileInput) {
      sqliteFileInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          importPortableSqliteFile(e.target.files[0]);
          e.target.value = '';
        }
      };
    }

    // Archivo Menu & Example Buttons
    const menuOpenExamples = document.getElementById('menu-open-examples');
    if (menuOpenExamples) menuOpenExamples.onclick = () => openProjectSelectionModal({ isFirstVisit: false });
    const btnExamplesQuick = document.getElementById('btn-examples-quick');
    if (btnExamplesQuick) btnExamplesQuick.onclick = () => openProjectSelectionModal({ isFirstVisit: false });
    const menuNewBlank = document.getElementById('menu-new-blank');
    if (menuNewBlank) {
      menuNewBlank.onclick = () => {
        const name = prompt('Nombre del nuevo proyecto UWE:', 'Proyecto_UWE') || 'Proyecto_UWE';
        state.model = ENGINE.createBlankUWEModel(name);
        state.currentProjectId = null;
        state.activeDiagramId = state.model.diagrams[0]?.id || 'dg_req_1';
        state.selectedNodeId = null;
        if (state.selectedNodeIds) state.selectedNodeIds.clear();
        state.selectedEdgeId = null;
        renderAll();
        showToast(`Proyecto en blanco "${name}" inicializado`, 'success');
      };
    }
    const menuSaveCloud = document.getElementById('menu-save-cloud');
    if (menuSaveCloud) menuSaveCloud.onclick = saveCurrentProject;
    const menuExportSvg = document.getElementById('menu-export-svg');
    if (menuExportSvg) menuExportSvg.onclick = exportDiagramSvg;
    const menuExportPng = document.getElementById('menu-export-png');
    if (menuExportPng) menuExportPng.onclick = exportDiagramPng;
    const menuExportXml = document.getElementById('menu-export-xml');
    if (menuExportXml) {
      menuExportXml.onclick = () => {
        const xml = ENGINE.modelToXml(state.model);
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.model.name.replace(/\s+/g, '_')}.uwe.xmi.xml`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Archivo XML / XMI descargado', 'success');
      };
    }

    const btnTreeExpandAll = document.getElementById('btn-tree-expand-all');
    if (btnTreeExpandAll) {
      btnTreeExpandAll.onclick = () => {
        state.rootCollapsed = false;
        state.collapsedPackages.clear();
        state.collapsedElements.clear();
        renderContainmentTree();
        showToast('Árbol de paquetes expandido', 'info');
      };
    }
    const btnTreeCollapseAll = document.getElementById('btn-tree-collapse-all');
    if (btnTreeCollapseAll) {
      btnTreeCollapseAll.onclick = () => {
        state.model.packages.forEach(p => state.collapsedPackages.add(p.id));
        renderContainmentTree();
        showToast('Árbol de paquetes colapsado', 'info');
      };
    }

    const projectSel = document.getElementById('project-selector');
    if (projectSel) {
      projectSel.onchange = async (e) => {
        const val = e.target.value;
        if (val === '__example_music__') {
          state.model = ENGINE.createMusicPortalDemoModel();
          state.currentProjectId = null;
          state.activeDiagramId = state.model.diagrams[0]?.id || 'dg_mp_req';
          state.selectedNodeId = null;
          if (state.selectedNodeIds) state.selectedNodeIds.clear();
          state.selectedEdgeId = null;
          renderAll();
          showToast('Ejemplo oficial "Simple Music Portal" (UWE Sevilla 2010 - Nora Koch) cargado', 'success');
        } else if (val === '__example_addressbook__' || val === '__demo__') {
          state.model = ENGINE.createAddressBookDemoModel();
          state.currentProjectId = null;
          state.activeDiagramId = state.model.diagrams[0]?.id || 'dg_nav';
          state.selectedNodeId = null;
          if (state.selectedNodeIds) state.selectedNodeIds.clear();
          state.selectedEdgeId = null;
          renderAll();
          showToast('Modelo de ejemplo AddressBook UWE cargado', 'success');
        } else if (val === '__blank__') {
          const name = prompt('Nombre del nuevo proyecto UWE:', 'Proyecto_UWE') || 'Proyecto_UWE';
          state.model = ENGINE.createBlankUWEModel(name);
          state.currentProjectId = null;
          state.activeDiagramId = state.model.diagrams[0]?.id || 'dg_req_1';
          state.selectedNodeId = null;
          if (state.selectedNodeIds) state.selectedNodeIds.clear();
          state.selectedEdgeId = null;
          renderAll();
          showToast(`Proyecto en blanco "${name}" inicializado`, 'success');
        } else if (val === '__open_modal__') {
          openProjectSelectionModal({ isFirstVisit: false });
        } else if (val !== '__local__') {
          await loadProjectById(val);
        }
      };
    }

    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.onclick = () => {
        document.getElementById('modal-overlay').style.display = 'none';
      };
    }
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeXml(str) {
    return escapeHtml(str).replace(/'/g, '&apos;');
  }

  function renderAll() {
    renderProjectSelect();
    renderContainmentTree();
    renderDiagramTabs();
    renderPalette();
    renderCanvas();
    renderInspector();
    syncXmlView();
  }

  // Boot application
  window.addEventListener('DOMContentLoaded', async () => {
    // Set MagicUWE brand icon in header
    const logoImg = document.getElementById('brand-uwe-logo');
    if (logoImg) logoImg.src = getIcon('UWEicon.png');
    setupEvents();
    renderAll();
    await initAuth();
    checkFirstVisit();
  });
})();

