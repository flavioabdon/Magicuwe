// MagicUWE 1.5.0 Web Semantic Engine: Metamodel, XML/XMI Bi-directional Sync, Transformations & SVG/PNG Exporter
(function () {
  const DIAGRAM_TYPES = {
    CONTENT: {
      id: 'CONTENT',
      label: 'Content Diagram',
      umlBase: 'Class Diagram',
      defaultPkgName: 'Content',
      pkgStereotype: 'contentModel',
      iconKey: 'MDUWEclassDiagram.png',
      tools: [
        { type: 'node', umlType: 'Class', stereotype: '', label: 'Class (Content)', iconKey: 'insert/UWEinsertClass.png', shortcut: 'C' },
        { type: 'edge', umlType: 'Association', stereotype: '', label: 'Association', iconKey: 'MDassociation.png', shortcut: '' },
        { type: 'edge', umlType: 'DirectedAssociation', stereotype: '', label: 'Directed Association', iconKey: 'MDassociationDirected.png', shortcut: '' },
        { type: 'edge', umlType: 'Composition', stereotype: '', label: 'Composition', iconKey: 'MDassociation.png', shortcut: '' },
        { type: 'edge', umlType: 'Generalization', stereotype: '', label: 'Generalization', iconKey: 'MDassociationDirected.png', shortcut: '' }
      ]
    },
    NAVIGATION: {
      id: 'NAVIGATION',
      label: 'Navigation Diagram',
      umlBase: 'Class Diagram',
      defaultPkgName: 'Navigation',
      pkgStereotype: 'navigationModel',
      iconKey: 'MDUWEclassDiagram.png',
      tools: [
        { type: 'node', umlType: 'Class', stereotype: 'navigationClass', label: 'navigationClass', iconKey: 'stereotypes/navigation/navigationClass.png', shortcut: 'Alt+Shift+K' },
        { type: 'node', umlType: 'Class', stereotype: 'guidedTour', label: 'guidedTour', iconKey: 'stereotypes/navigation/guidedTour.png', shortcut: 'Alt+Shift+U' },
        { type: 'node', umlType: 'Class', stereotype: 'index', label: 'index', iconKey: 'stereotypes/navigation/index.png', shortcut: 'Alt+Shift+I' },
        { type: 'node', umlType: 'Class', stereotype: 'query', label: 'query', iconKey: 'stereotypes/navigation/query.png', shortcut: 'Alt+Shift+O' },
        { type: 'node', umlType: 'Class', stereotype: 'menu', label: 'menu', iconKey: 'stereotypes/navigation/menu.png', shortcut: 'Alt+Shift+P' },
        { type: 'node', umlType: 'Class', stereotype: 'externalNode', label: 'externalNode', iconKey: 'stereotypes/navigation/externalNode.png', shortcut: '' },
        { type: 'node', umlType: 'Class', stereotype: 'processClass', label: 'processClass', iconKey: 'stereotypes/process/processClass.png', shortcut: 'Alt+Shift+V' },
        { type: 'edge', umlType: 'Association', stereotype: 'navigationLink', label: 'navigationLink', iconKey: 'MDassociation.png', shortcut: 'Alt+Shift+Y' },
        { type: 'edge', umlType: 'DirectedAssociation', stereotype: 'navigationLink', label: 'directed navigationLink', iconKey: 'MDassociationDirected.png', shortcut: 'Alt+Shift+N' },
        { type: 'edge', umlType: 'Association', stereotype: 'processLink', label: 'processLink', iconKey: 'MDassociation.png', shortcut: 'Alt+Shift+X' },
        { type: 'edge', umlType: 'DirectedAssociation', stereotype: 'processLink', label: 'directed processLink', iconKey: 'MDassociationDirected.png', shortcut: 'Alt+Shift+M' }
      ]
    },
    PRESENTATION: {
      id: 'PRESENTATION',
      label: 'Presentation Diagram',
      umlBase: 'Class Diagram',
      defaultPkgName: 'Presentation',
      pkgStereotype: 'presentationModel',
      iconKey: 'MDUWEclassDiagram.png',
      tools: [
        { type: 'node', umlType: 'Class', stereotype: 'presentationPage', label: 'presentationPage', iconKey: 'stereotypes/presentation/presentationPage.png', shortcut: 'Alt+Shift+H' },
        { type: 'node', umlType: 'Class', stereotype: 'presentationGroup', label: 'presentationGroup', iconKey: 'stereotypes/presentation/presentationGroup.png', shortcut: 'Alt+Shift+Z' },
        { type: 'node', umlType: 'Class', stereotype: 'iteratedPresentationGroup', label: 'iteratedPresentationGroup', iconKey: 'stereotypes/presentation/iteratedPresentationGroup.png', shortcut: '' },
        { type: 'node', umlType: 'Class', stereotype: 'presentationAlternatives', label: 'presentationAlternatives', iconKey: 'stereotypes/presentation/presentationAlternatives.png', shortcut: '' },
        { type: 'property', umlType: 'Property', stereotype: 'presentationGroup', label: 'presentationGroup Property', iconKey: 'stereotypes/presentation/presentationGroup.png', shortcut: 'Alt+Shift+T' },
        { type: 'property', umlType: 'Property', stereotype: 'inputForm', label: 'inputForm Property', iconKey: 'stereotypes/presentation/inputForm.png', shortcut: 'Alt+Shift+W' },
        { type: 'property', umlType: 'Property', stereotype: 'button', label: 'button Property', iconKey: 'stereotypes/presentation/button.png', shortcut: 'Alt+Shift+R' },
        { type: 'property', umlType: 'Property', stereotype: 'textInput', label: 'textInput Property', iconKey: 'stereotypes/presentation/textInput.png', shortcut: 'Alt+Shift+G' },
        { type: 'property', umlType: 'Property', stereotype: 'text', label: 'text Property', iconKey: 'stereotypes/presentation/text.png', shortcut: 'Alt+Shift+F' },
        { type: 'property', umlType: 'Property', stereotype: 'anchor', label: 'anchor Property', iconKey: 'stereotypes/presentation/anchor.png', shortcut: 'Alt+Shift+S' },
        { type: 'property', umlType: 'Property', stereotype: 'image', label: 'image Property', iconKey: 'stereotypes/presentation/image.png', shortcut: 'Alt+Shift+E' },
        { type: 'property', umlType: 'Property', stereotype: 'selection', label: 'selection Property', iconKey: 'stereotypes/presentation/selection.png', shortcut: '' },
        { type: 'property', umlType: 'Property', stereotype: 'fileUpload', label: 'fileUpload Property', iconKey: 'stereotypes/presentation/fileUpload.png', shortcut: '' },
        { type: 'property', umlType: 'Property', stereotype: 'mediaObject', label: 'mediaObject Property', iconKey: 'stereotypes/presentation/mediaObject.png', shortcut: '' },
        { type: 'property', umlType: 'Property', stereotype: 'customComponent', label: 'customComponent Property', iconKey: 'stereotypes/presentation/customComponent.png', shortcut: '' },
        { type: 'property', umlType: 'Property', stereotype: 'tab', label: 'tab Property', iconKey: 'stereotypes/presentation/tab.png', shortcut: '' },
        { type: 'edge', umlType: 'Composition', stereotype: '', label: 'Composition', iconKey: 'MDassociation.png', shortcut: '' }
      ]
    },
    PROCESS_STRUCTURE: {
      id: 'PROCESS_STRUCTURE',
      label: 'Process Structure Diagram',
      umlBase: 'Class Diagram',
      defaultPkgName: 'Process',
      pkgStereotype: 'processModel',
      iconKey: 'MDUWEclassDiagram.png',
      tools: [
        { type: 'node', umlType: 'Class', stereotype: 'processClass', label: 'processClass', iconKey: 'stereotypes/process/processClass.png', shortcut: 'Alt+Shift+V' },
        { type: 'node', umlType: 'Class', stereotype: '', label: 'Auxiliary Class', iconKey: 'insert/UWEinsertClass.png', shortcut: '' },
        { type: 'edge', umlType: 'DirectedAssociation', stereotype: 'processLink', label: 'directed processLink', iconKey: 'MDassociationDirected.png', shortcut: 'Alt+Shift+M' },
        { type: 'edge', umlType: 'Generalization', stereotype: '', label: 'Generalization', iconKey: 'MDassociationDirected.png', shortcut: '' }
      ]
    },
    PROCESS_FLOW: {
      id: 'PROCESS_FLOW',
      label: 'Process Flow Diagram',
      umlBase: 'Activity Diagram',
      defaultPkgName: 'Process',
      pkgStereotype: 'processModel',
      iconKey: 'MDactivityDiagram.png',
      tools: [
        { type: 'node', umlType: 'Action', stereotype: 'userAction', label: 'userAction', iconKey: 'stereotypes/process/userAction.png', shortcut: 'Alt+Shift+U' },
        { type: 'node', umlType: 'Action', stereotype: 'systemAction', label: 'systemAction', iconKey: 'stereotypes/process/systemAction.png', shortcut: 'Alt+Shift+S' },
        { type: 'node', umlType: 'InitialNode', stereotype: '', label: 'Initial Node', iconKey: 'MDactivityDiagram.png', shortcut: '' },
        { type: 'node', umlType: 'DecisionNode', stereotype: '', label: 'Decision Node', iconKey: 'MDactivityDiagram.png', shortcut: '' },
        { type: 'node', umlType: 'FinalNode', stereotype: '', label: 'Activity Final', iconKey: 'MDactivityDiagram.png', shortcut: '' },
        { type: 'edge', umlType: 'ControlFlow', stereotype: '', label: 'Control Flow', iconKey: 'MDassociationDirected.png', shortcut: '' }
      ]
    },
    USE_CASE: {
      id: 'USE_CASE',
      label: 'Use Case Diagram (Requirements)',
      umlBase: 'Use Case Diagram',
      defaultPkgName: 'Requirements',
      pkgStereotype: 'requirementsModel',
      iconKey: 'MDusecaseDiagram.png',
      tools: [
        { type: 'node', umlType: 'UseCase', stereotype: 'browsing', label: 'browsing UseCase', iconKey: 'stereotypes/requirements/browsing.png', shortcut: '' },
        { type: 'node', umlType: 'UseCase', stereotype: 'processing', label: 'processing UseCase', iconKey: 'stereotypes/requirements/processing.png', shortcut: '' },
        { type: 'node', umlType: 'UseCase', stereotype: 'webUseCase', label: 'webUseCase', iconKey: 'stereotypes/requirements/webUseCase.png', shortcut: '' },
        { type: 'node', umlType: 'Actor', stereotype: '', label: 'Actor (User)', iconKey: 'stereotypes/process/userAction.png', shortcut: '' },
        { type: 'edge', umlType: 'Association', stereotype: '', label: 'Actor Association', iconKey: 'MDassociation.png', shortcut: '' },
        { type: 'edge', umlType: 'DirectedAssociation', stereotype: 'include', label: '«include»', iconKey: 'MDassociationDirected.png', shortcut: '' },
        { type: 'edge', umlType: 'DirectedAssociation', stereotype: 'extend', label: '«extend»', iconKey: 'MDassociationDirected.png', shortcut: '' }
      ]
    },
    USE_CASE_FLOW: {
      id: 'USE_CASE_FLOW',
      label: 'Use Case Activity Diagram',
      umlBase: 'Activity Diagram',
      defaultPkgName: 'Requirements',
      pkgStereotype: 'requirementsModel',
      iconKey: 'MDactivityDiagram.png',
      tools: [
        { type: 'node', umlType: 'Action', stereotype: 'displayAction', label: 'displayAction', iconKey: 'stereotypes/requirements/displayAction.png', shortcut: '' },
        { type: 'node', umlType: 'Action', stereotype: 'navigationAction', label: 'navigationAction', iconKey: 'stereotypes/requirements/navigationAction.png', shortcut: '' },
        { type: 'node', umlType: 'Pin', stereotype: 'displayPin', label: 'displayPin', iconKey: 'stereotypes/requirements/displayPin.png', shortcut: '' },
        { type: 'node', umlType: 'Pin', stereotype: 'interactionPin', label: 'interactionPin', iconKey: 'stereotypes/requirements/interactionPin.png', shortcut: '' },
        { type: 'edge', umlType: 'ControlFlow', stereotype: '', label: 'Activity Flow', iconKey: 'MDassociationDirected.png', shortcut: '' }
      ]
    },
    NAVIGATION_STATES: {
      id: 'NAVIGATION_STATES',
      label: 'Navigation States Diagram',
      umlBase: 'State Machine Diagram',
      defaultPkgName: 'NavigationStates',
      pkgStereotype: 'navigationStatesModel',
      iconKey: 'MDstatechartDiagram.png',
      tools: [
        { type: 'node', umlType: 'State', stereotype: 'navigationalNode', label: 'navigationalNode', iconKey: 'stereotypes/navigation/navigationalNode.png', shortcut: 'Alt+Shift+N' },
        { type: 'node', umlType: 'State', stereotype: 'session', label: 'session', iconKey: 'stereotypes/navigation/session.png', shortcut: 'Alt+Shift+S' },
        { type: 'node', umlType: 'State', stereotype: 'collection', label: 'collection', iconKey: 'stereotypes/navigation/collection.png', shortcut: 'Alt+Shift+C' },
        { type: 'node', umlType: 'State', stereotype: 'target', label: 'target', iconKey: 'stereotypes/navigation/target.png', shortcut: 'Alt+Shift+T' },
        { type: 'edge', umlType: 'Transition', stereotype: 'integratedMenu', label: 'integratedMenu', iconKey: 'MDassociationDirected.png', shortcut: 'Alt+Shift+M' },
        { type: 'edge', umlType: 'Transition', stereotype: 'search', label: 'search', iconKey: 'stereotypes/navigation/search.png', shortcut: 'Alt+Shift+Q' },
        { type: 'edge', umlType: 'Transition', stereotype: 'allItems', label: 'allItems', iconKey: 'MDassociationDirected.png', shortcut: 'Alt+Shift+A' }
      ]
    },
    USER_MODEL: {
      id: 'USER_MODEL',
      label: 'User Model Diagram',
      umlBase: 'Class Diagram',
      defaultPkgName: 'UserModel',
      pkgStereotype: 'userModel',
      iconKey: 'MDUWEclassDiagram.png',
      tools: [
        { type: 'node', umlType: 'Class', stereotype: 'webUser', label: 'webUser', iconKey: 'stereotypes/process/userAction.png', shortcut: '' },
        { type: 'node', umlType: 'Class', stereotype: 'sessionClass', label: 'sessionClass', iconKey: 'stereotypes/navigation/session.png', shortcut: '' },
        { type: 'node', umlType: 'Class', stereotype: '', label: 'Role / Profile Class', iconKey: 'insert/UWEinsertClass.png', shortcut: '' },
        { type: 'edge', umlType: 'Association', stereotype: '', label: 'Association', iconKey: 'MDassociation.png', shortcut: '' }
      ]
    },
    BASIC_RIGHTS: {
      id: 'BASIC_RIGHTS',
      label: 'Basic Rights Diagram',
      umlBase: 'Class Diagram',
      defaultPkgName: 'BasicRights',
      pkgStereotype: 'basicRightsModel',
      iconKey: 'MDUWEclassDiagram.png',
      tools: [
        { type: 'node', umlType: 'Class', stereotype: 'webUser', label: 'Role / webUser', iconKey: 'stereotypes/process/userAction.png', shortcut: '' },
        { type: 'node', umlType: 'Class', stereotype: '', label: 'Protected Class', iconKey: 'insert/UWEinsertClass.png', shortcut: '' },
        { type: 'edge', umlType: 'Dependency', stereotype: 'create', label: '«create»', iconKey: 'dependencies/create.png', shortcut: '' },
        { type: 'edge', umlType: 'Dependency', stereotype: 'read', label: '«read»', iconKey: 'dependencies/read.png', shortcut: '' },
        { type: 'edge', umlType: 'Dependency', stereotype: 'update', label: '«update»', iconKey: 'dependencies/update.png', shortcut: '' },
        { type: 'edge', umlType: 'Dependency', stereotype: 'delete', label: '«delete»', iconKey: 'dependencies/delete.png', shortcut: '' },
        { type: 'edge', umlType: 'Dependency', stereotype: 'execute', label: '«execute»', iconKey: 'dependencies/execute.png', shortcut: '' }
      ]
    }
  };

  // Normalize DIAGRAM_TYPES tools: ensure uppercase type ('NODE' | 'EDGE' | 'NESTED_PROPERTY'), unique tool id, and remove shortcuts per user request
  Object.values(DIAGRAM_TYPES).forEach(dt => {
    dt.tools.forEach((tool, idx) => {
      const rawType = (tool.type || 'node').toLowerCase();
      if (rawType === 'node') tool.type = 'NODE';
      else if (rawType === 'edge') tool.type = 'EDGE';
      else if (rawType === 'property') tool.type = 'NESTED_PROPERTY';
      else tool.type = rawType.toUpperCase();

      if (!tool.id) {
        tool.id = `tool_${dt.id}_${tool.stereotype || tool.umlType || 'tool'}_${idx}`;
      }
      tool.shortcut = ''; // No toolbar shortcuts
    });
  });

  const RIA_TAGS = [
    'liveValidation', 'autoCompletion', 'autoSuggestion', 'lightbox', 'collapse',
    'carrousel', 'dragDrop', 'periodicRefresh', 'richEditor', 'liveReport',
    'dynamicDisplay', 'liveFeedback', 'submitChange', 'multiple'
  ];

  function createAddressBookDemoModel() {
    return {
      name: 'AddressBook UWE 3.0',
      packages: [
        { id: 'pkg_req', name: 'Requirements', stereotype: 'requirementsModel' },
        { id: 'pkg_con', name: 'Content', stereotype: 'contentModel' },
        { id: 'pkg_nav', name: 'Navigation', stereotype: 'navigationModel' },
        { id: 'pkg_pres', name: 'Presentation', stereotype: 'presentationModel' },
        { id: 'pkg_proc', name: 'Process', stereotype: 'processModel' },
        { id: 'pkg_navst', name: 'NavigationStates', stereotype: 'navigationStatesModel' },
        { id: 'pkg_usr', name: 'UserModel', stereotype: 'userModel' },
        { id: 'pkg_br', name: 'BasicRights', stereotype: 'basicRightsModel' }
      ],
      elements: [
        // Requirements
        { id: 'el_actor_user', packageId: 'pkg_req', umlType: 'Actor', stereotype: '', name: 'User', attributes: [], operations: [], tags: {} },
        { id: 'el_uc_view', packageId: 'pkg_req', umlType: 'UseCase', stereotype: 'browsing', name: 'ViewContacts', attributes: [], operations: [], tags: { isLandmark: 'true' } },
        { id: 'el_uc_search', packageId: 'pkg_req', umlType: 'UseCase', stereotype: 'browsing', name: 'SearchContact', attributes: [], operations: [], tags: {} },
        { id: 'el_uc_create', packageId: 'pkg_req', umlType: 'UseCase', stereotype: 'processing', name: 'CreateContact', attributes: [], operations: [], tags: { transmissionType: 'TLS' } },

        // Content
        {
          id: 'el_con_book', packageId: 'pkg_con', umlType: 'Class', stereotype: '', name: 'AddressBook',
          attributes: ['-owner : String', '-lastUpdated : Date'], operations: [], tags: {}
        },
        {
          id: 'el_con_contact', packageId: 'pkg_con', umlType: 'Class', stereotype: '', name: 'Contact',
          attributes: ['-name : String', '-email : String', '-phone : String', '-picture : Image'], operations: [], tags: {}
        },
        {
          id: 'el_con_category', packageId: 'pkg_con', umlType: 'Class', stereotype: '', name: 'Category',
          attributes: ['-title : String'], operations: [], tags: {}
        },

        // Navigation
        {
          id: 'el_nav_book', packageId: 'pkg_nav', umlType: 'Class', stereotype: 'navigationClass', name: 'AddressBook',
          attributes: [], operations: [], tags: { isHome: 'true', isLandmark: 'true' }
        },
        {
          id: 'el_nav_menu', packageId: 'pkg_nav', umlType: 'Class', stereotype: 'menu', name: 'MainMenu',
          attributes: [], operations: [], tags: {}
        },
        {
          id: 'el_nav_index', packageId: 'pkg_nav', umlType: 'Class', stereotype: 'index', name: 'ContactList',
          attributes: [], operations: [], tags: { itemType: 'Contact' }
        },
        {
          id: 'el_nav_query', packageId: 'pkg_nav', umlType: 'Class', stereotype: 'query', name: 'ContactSearch',
          attributes: [], operations: [], tags: { expression: 'Contact.name like ?input' }
        },
        {
          id: 'el_nav_contact', packageId: 'pkg_nav', umlType: 'Class', stereotype: 'navigationClass', name: 'Contact',
          attributes: ['-name : String', '-email : String'], operations: [], tags: {}
        },
        {
          id: 'el_nav_proc_create', packageId: 'pkg_nav', umlType: 'Class', stereotype: 'processClass', name: 'CreateContact',
          attributes: [], operations: [], tags: {}
        },

        // Presentation (with nested properties via parentId!)
        {
          id: 'el_pres_page', packageId: 'pkg_pres', umlType: 'Class', stereotype: 'presentationPage', name: 'AddressBookPage',
          attributes: [], operations: [], tags: { liveFeedback: 'true' }
        },
        {
          id: 'el_pres_search_form', packageId: 'pkg_pres', parentId: 'el_pres_page', umlType: 'Property', stereotype: 'inputForm', name: 'searchForm : SearchForm',
          attributes: [], operations: [], tags: {}
        },
        {
          id: 'el_pres_query_in', packageId: 'pkg_pres', parentId: 'el_pres_search_form', umlType: 'Property', stereotype: 'textInput', name: 'queryField : String',
          attributes: [], operations: [], tags: { autoCompletion: 'true' }
        },
        {
          id: 'el_pres_search_btn', packageId: 'pkg_pres', parentId: 'el_pres_search_form', umlType: 'Property', stereotype: 'button', name: 'findBtn : Button',
          attributes: [], operations: [], tags: {}
        },
        {
          id: 'el_pres_contact_grp', packageId: 'pkg_pres', parentId: 'el_pres_page', umlType: 'Property', stereotype: 'presentationGroup', name: 'contactView : ContactView',
          attributes: [], operations: [], tags: { collapse: 'true' }
        },
        {
          id: 'el_pres_name_txt', packageId: 'pkg_pres', parentId: 'el_pres_contact_grp', umlType: 'Property', stereotype: 'text', name: 'fullName : Text',
          attributes: [], operations: [], tags: {}
        },
        {
          id: 'el_pres_email_txt', packageId: 'pkg_pres', parentId: 'el_pres_contact_grp', umlType: 'Property', stereotype: 'anchor', name: 'emailLink : Anchor',
          attributes: [], operations: [], tags: {}
        },
        {
          id: 'el_pres_avatar_img', packageId: 'pkg_pres', parentId: 'el_pres_contact_grp', umlType: 'Property', stereotype: 'image', name: 'photo : Image',
          attributes: [], operations: [], tags: { lightbox: 'true' }
        },

        // Process Flow
        { id: 'el_pf_init', packageId: 'pkg_proc', umlType: 'InitialNode', stereotype: '', name: 'Start', attributes: [], operations: [], tags: {} },
        { id: 'el_pf_user', packageId: 'pkg_proc', umlType: 'Action', stereotype: 'userAction', name: 'EnterContactDetails', attributes: [], operations: [], tags: { validated: 'true' } },
        { id: 'el_pf_sys', packageId: 'pkg_proc', umlType: 'Action', stereotype: 'systemAction', name: 'SaveContactRecord', attributes: [], operations: [], tags: { confirmed: 'true' } },
        { id: 'el_pf_final', packageId: 'pkg_proc', umlType: 'FinalNode', stereotype: '', name: 'End', attributes: [], operations: [], tags: {} },

        // Navigation States
        { id: 'el_ns_session', packageId: 'pkg_navst', umlType: 'State', stereotype: 'session', name: 'AuthenticatedSession', attributes: [], operations: [], tags: { transmissionType: 'TLS', isHome: 'true' } },
        { id: 'el_ns_list', packageId: 'pkg_navst', umlType: 'State', stereotype: 'collection', name: 'ContactCollection', attributes: [], operations: [], tags: { itemType: 'Contact', transmissionType: 'TLS' } },
        { id: 'el_ns_detail', packageId: 'pkg_navst', umlType: 'State', stereotype: 'navigationalNode', name: 'ContactDetailsState', attributes: [], operations: [], tags: { transmissionType: 'TLS' } }
      ],
      relationships: [
        // Requirements
        { id: 'rel_uc_1', sourceId: 'el_actor_user', targetId: 'el_uc_view', umlType: 'Association', stereotype: '', name: '', sourceMult: '', targetMult: '' },
        { id: 'rel_uc_2', sourceId: 'el_actor_user', targetId: 'el_uc_search', umlType: 'Association', stereotype: '', name: '', sourceMult: '', targetMult: '' },
        { id: 'rel_uc_3', sourceId: 'el_actor_user', targetId: 'el_uc_create', umlType: 'Association', stereotype: '', name: '', sourceMult: '', targetMult: '' },

        // Content
        { id: 'rel_con_1', sourceId: 'el_con_book', targetId: 'el_con_contact', umlType: 'Composition', stereotype: '', name: 'contacts', sourceMult: '1', targetMult: '*' },
        { id: 'rel_con_2', sourceId: 'el_con_contact', targetId: 'el_con_category', umlType: 'Association', stereotype: '', name: 'belongsTo', sourceMult: '*', targetMult: '0..*' },

        // Navigation
        { id: 'rel_nav_1', sourceId: 'el_nav_book', targetId: 'el_nav_menu', umlType: 'Composition', stereotype: 'navigationLink', name: '', sourceMult: '1', targetMult: '1' },
        { id: 'rel_nav_2', sourceId: 'el_nav_menu', targetId: 'el_nav_index', umlType: 'DirectedAssociation', stereotype: 'navigationLink', name: '', sourceMult: '1', targetMult: '1' },
        { id: 'rel_nav_3', sourceId: 'el_nav_menu', targetId: 'el_nav_query', umlType: 'DirectedAssociation', stereotype: 'navigationLink', name: '', sourceMult: '1', targetMult: '1' },
        { id: 'rel_nav_4', sourceId: 'el_nav_index', targetId: 'el_nav_contact', umlType: 'DirectedAssociation', stereotype: 'navigationLink', name: '', sourceMult: '1', targetMult: '*' },
        { id: 'rel_nav_5', sourceId: 'el_nav_query', targetId: 'el_nav_contact', umlType: 'DirectedAssociation', stereotype: 'navigationLink', name: '', sourceMult: '1', targetMult: '*' },
        { id: 'rel_nav_6', sourceId: 'el_nav_menu', targetId: 'el_nav_proc_create', umlType: 'DirectedAssociation', stereotype: 'processLink', name: '', sourceMult: '1', targetMult: '1' },

        // Process Flow
        { id: 'rel_pf_1', sourceId: 'el_pf_init', targetId: 'el_pf_user', umlType: 'ControlFlow', stereotype: '', name: '', sourceMult: '', targetMult: '' },
        { id: 'rel_pf_2', sourceId: 'el_pf_user', targetId: 'el_pf_sys', umlType: 'ControlFlow', stereotype: '', name: '[valid]', sourceMult: '', targetMult: '' },
        { id: 'rel_pf_3', sourceId: 'el_pf_sys', targetId: 'el_pf_final', umlType: 'ControlFlow', stereotype: '', name: '', sourceMult: '', targetMult: '' },

        // Navigation States
        { id: 'rel_ns_1', sourceId: 'el_ns_session', targetId: 'el_ns_list', umlType: 'Transition', stereotype: 'integratedMenu', name: 'openContacts', sourceMult: '', targetMult: '' },
        { id: 'rel_ns_2', sourceId: 'el_ns_list', targetId: 'el_ns_detail', umlType: 'Transition', stereotype: 'search', name: 'selectItem', sourceMult: '', targetMult: '' }
      ],
      diagrams: [
        {
          id: 'dg_nav',
          packageId: 'pkg_nav',
          name: 'Navigation Diagram',
          diagramType: 'NAVIGATION',
          nodes: [
            { elementId: 'el_nav_book', x: 40, y: 70, width: 165, height: 85 },
            { elementId: 'el_nav_menu', x: 265, y: 75, width: 150, height: 70 },
            { elementId: 'el_nav_index', x: 495, y: 35, width: 155, height: 75 },
            { elementId: 'el_nav_query', x: 495, y: 155, width: 165, height: 80 },
            { elementId: 'el_nav_contact', x: 735, y: 85, width: 170, height: 95 },
            { elementId: 'el_nav_proc_create', x: 265, y: 225, width: 155, height: 70 }
          ],
          edges: ['rel_nav_1', 'rel_nav_2', 'rel_nav_3', 'rel_nav_4', 'rel_nav_5', 'rel_nav_6']
        },
        {
          id: 'dg_pres',
          packageId: 'pkg_pres',
          name: 'Presentation Diagram',
          diagramType: 'PRESENTATION',
          nodes: [
            { elementId: 'el_pres_page', x: 55, y: 45, width: 680, height: 340, zIndex: 1, groupId: 'grp_pres_1' },
            { elementId: 'el_pres_search_form', x: 80, y: 110, width: 290, height: 225, zIndex: 2, groupId: 'grp_pres_1' },
            { elementId: 'el_pres_query_in', x: 100, y: 165, width: 245, height: 68, zIndex: 3, groupId: 'grp_pres_1' },
            { elementId: 'el_pres_search_btn', x: 100, y: 248, width: 160, height: 62, zIndex: 3, groupId: 'grp_pres_1' },
            { elementId: 'el_pres_contact_grp', x: 395, y: 110, width: 315, height: 245, zIndex: 2, groupId: 'grp_pres_1' },
            { elementId: 'el_pres_name_txt', x: 415, y: 165, width: 138, height: 65, zIndex: 3, groupId: 'grp_pres_1' },
            { elementId: 'el_pres_email_txt', x: 562, y: 165, width: 132, height: 65, zIndex: 3, groupId: 'grp_pres_1' },
            { elementId: 'el_pres_avatar_img', x: 415, y: 245, width: 165, height: 85, zIndex: 3, groupId: 'grp_pres_1' }
          ],
          edges: []
        },
        {
          id: 'dg_con',
          packageId: 'pkg_con',
          name: 'Content Diagram',
          diagramType: 'CONTENT',
          nodes: [
            { elementId: 'el_con_book', x: 70, y: 95, width: 185, height: 95 },
            { elementId: 'el_con_contact', x: 360, y: 80, width: 195, height: 120 },
            { elementId: 'el_con_category', x: 660, y: 95, width: 165, height: 85 }
          ],
          edges: ['rel_con_1', 'rel_con_2']
        },
        {
          id: 'dg_proc_struct',
          packageId: 'pkg_proc',
          name: 'Process Structure Diagram',
          diagramType: 'PROCESS_STRUCTURE',
          nodes: [
            { elementId: 'el_nav_proc_create', x: 180, y: 100, width: 175, height: 80 }
          ],
          edges: []
        },
        {
          id: 'dg_proc_flow',
          packageId: 'pkg_proc',
          name: 'CreateContact Workflow',
          diagramType: 'PROCESS_FLOW',
          nodes: [
            { elementId: 'el_pf_init', x: 65, y: 135, width: 36, height: 36 },
            { elementId: 'el_pf_user', x: 175, y: 110, width: 185, height: 82 },
            { elementId: 'el_pf_sys', x: 445, y: 110, width: 185, height: 82 },
            { elementId: 'el_pf_final', x: 705, y: 135, width: 38, height: 38 }
          ],
          edges: ['rel_pf_1', 'rel_pf_2', 'rel_pf_3']
        },
        {
          id: 'dg_uc',
          packageId: 'pkg_req',
          name: 'Use Case Diagram',
          diagramType: 'USE_CASE',
          nodes: [
            { elementId: 'el_actor_user', x: 90, y: 130, width: 90, height: 110 },
            { elementId: 'el_uc_view', x: 340, y: 45, width: 185, height: 75 },
            { elementId: 'el_uc_search', x: 340, y: 150, width: 185, height: 75 },
            { elementId: 'el_uc_create', x: 340, y: 255, width: 185, height: 75 }
          ],
          edges: ['rel_uc_1', 'rel_uc_2', 'rel_uc_3']
        },
        {
          id: 'dg_nav_states',
          packageId: 'pkg_navst',
          name: 'Navigation States Diagram',
          diagramType: 'NAVIGATION_STATES',
          nodes: [
            { elementId: 'el_ns_session', x: 65, y: 105, width: 195, height: 90 },
            { elementId: 'el_ns_list', x: 345, y: 105, width: 195, height: 90 },
            { elementId: 'el_ns_detail', x: 625, y: 105, width: 195, height: 90 }
          ],
          edges: ['rel_ns_1', 'rel_ns_2']
        }
      ]
    };
  }

  function createMusicPortalDemoModel() {
    return {
      name: "Simple Music Portal (UWE Sevilla 2010)",
      packages: [
        { id: "pkg_req", name: "Requirements", stereotype: "requirementsModel" },
        { id: "pkg_con", name: "Content", stereotype: "contentModel" },
        { id: "pkg_nav", name: "Navigation", stereotype: "navigationModel" },
        { id: "pkg_pres", name: "Presentation", stereotype: "presentationModel" },
        { id: "pkg_proc", name: "Process", stereotype: "processModel" },
        { id: "pkg_navst", name: "NavigationStates", stereotype: "navigationStatesModel" },
        { id: "pkg_usr", name: "UserModel", stereotype: "userModel" },
        { id: "pkg_br", name: "BasicRights", stereotype: "basicRightsModel" }
      ],
      elements: [
        // Requirements (slide 16)
        { id: "el_mp_user", packageId: "pkg_req", umlType: "Actor", stereotype: "", name: "User", attributes: [], operations: [], tags: {} },
        { id: "el_mp_reg_user", packageId: "pkg_req", umlType: "Actor", stereotype: "", name: "RegisteredUser", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_register", packageId: "pkg_req", umlType: "UseCase", stereotype: "", name: "register", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_login", packageId: "pkg_req", umlType: "UseCase", stereotype: "", name: "login", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_search_song", packageId: "pkg_req", umlType: "UseCase", stereotype: "browsing", name: "search song", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_search_perf", packageId: "pkg_req", umlType: "UseCase", stereotype: "browsing", name: "search performer", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_search_alb", packageId: "pkg_req", umlType: "UseCase", stereotype: "browsing", name: "search album", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_view_alb", packageId: "pkg_req", umlType: "UseCase", stereotype: "browsing", name: "view album", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_logout", packageId: "pkg_req", umlType: "UseCase", stereotype: "", name: "logout", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_buy_alb", packageId: "pkg_req", umlType: "UseCase", stereotype: "processing", name: "buy album", attributes: [], operations: [], tags: { personalized: "true" } },
        { id: "el_mp_uc_recharge", packageId: "pkg_req", umlType: "UseCase", stereotype: "processing", name: "recharge", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_download", packageId: "pkg_req", umlType: "UseCase", stereotype: "processing", name: "download album", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_view_usr", packageId: "pkg_req", umlType: "UseCase", stereotype: "browsing", name: "view user detail", attributes: [], operations: [], tags: {} },
        { id: "el_mp_uc_browse_usr_alb", packageId: "pkg_req", umlType: "UseCase", stereotype: "browsing", name: "browse user own albums", attributes: [], operations: [], tags: {} },

        // Content (slide 17)
        {
          id: "el_mp_con_album", packageId: "pkg_con", umlType: "Class", stereotype: "", name: "Album",
          attributes: ["-title : String", "-price : float", "-recorded : Date", "-cover : String", "-description : String", "-downloadURL : String"],
          operations: [], tags: {}
        },
        {
          id: "el_mp_con_track", packageId: "pkg_con", umlType: "Class", stereotype: "", name: "Track",
          attributes: ["-number : int", "-length : Integer"], operations: [], tags: {}
        },
        {
          id: "el_mp_con_song", packageId: "pkg_con", umlType: "Class", stereotype: "", name: "Song",
          attributes: ["-title : String"], operations: [], tags: {}
        },
        {
          id: "el_mp_con_genre", packageId: "pkg_con", umlType: "Class", stereotype: "", name: "Genre",
          attributes: ["+name : String"], operations: [], tags: {}
        },
        {
          id: "el_mp_con_perf", packageId: "pkg_con", umlType: "Class", stereotype: "", name: "Performer",
          attributes: ["-description : String"], operations: [], tags: { isAbstract: "true" }
        },
        {
          id: "el_mp_con_group", packageId: "pkg_con", umlType: "Class", stereotype: "", name: "Group",
          attributes: ["-name : String", "-formed : Date [0..1]", "-disbanded : Date [0..1]"], operations: [], tags: {}
        },
        {
          id: "el_mp_con_artist", packageId: "pkg_con", umlType: "Class", stereotype: "", name: "Artist",
          attributes: ["-lastName : String", "-firstName : String", "-born : Date", "-died : Date [0..1]"], operations: [], tags: {}
        },

        // User Model (slide 18)
        {
          id: "el_mp_usr_session", packageId: "pkg_usr", umlType: "Class", stereotype: "visitClass", name: "Session",
          attributes: [], operations: [], tags: {}
        },
        {
          id: "el_mp_usr_user", packageId: "pkg_usr", umlType: "Class", stereotype: "", name: "User",
          attributes: ["-userName : String", "-password : String", "-firstName : String", "-lastName : String", "-gender : GenderType", "-credits : Integer", "«evaluatedProperty» -fullName : String", "-eMail : String"],
          operations: [], tags: { evaluatedProperty: 'firstName + " " + lastName' }
        },
        {
          id: "el_mp_usr_gender", packageId: "pkg_usr", umlType: "Class", stereotype: "enumeration", name: "GenderType",
          attributes: ["female", "male"], operations: [], tags: {}
        },

        // Navigation (slides 22, 23, 26)
        { id: "el_mp_nav_welcome", packageId: "pkg_nav", umlType: "Class", stereotype: "navigationClass", name: "Welcome", attributes: [], operations: [], tags: { isHome: "true" } },
        { id: "el_mp_nav_main_menu", packageId: "pkg_nav", umlType: "Class", stereotype: "menu", name: "MainMenu", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_q_song", packageId: "pkg_nav", umlType: "Class", stereotype: "query", name: "SearchSong", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_q_perf", packageId: "pkg_nav", umlType: "Class", stereotype: "query", name: "SearchPerformer", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_q_alb", packageId: "pkg_nav", umlType: "Class", stereotype: "query", name: "SearchAlbum", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_idx_song", packageId: "pkg_nav", umlType: "Class", stereotype: "index", name: "SongIndex", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_idx_perfalb", packageId: "pkg_nav", umlType: "Class", stereotype: "index", name: "PerformerAlbumIndex", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_idx_album", packageId: "pkg_nav", umlType: "Class", stereotype: "index", name: "AlbumIndex", attributes: [], operations: [], tags: { itemType: "content::Album" } },
        { id: "el_mp_nav_idx_group", packageId: "pkg_nav", umlType: "Class", stereotype: "index", name: "GroupMemberIndex", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_idx_perf", packageId: "pkg_nav", umlType: "Class", stereotype: "index", name: "PerformerIndex", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_genre", packageId: "pkg_nav", umlType: "Class", stereotype: "navigationClass", name: "Genre", attributes: [], operations: [], tags: { contentClass: "content::Genre" } },
        { id: "el_mp_nav_perf", packageId: "pkg_nav", umlType: "Class", stereotype: "navigationClass", name: "Performer", attributes: [], operations: [], tags: { contentClass: "content::Performer" } },
        { id: "el_mp_nav_album", packageId: "pkg_nav", umlType: "Class", stereotype: "navigationClass", name: "Album", attributes: [], operations: [], tags: { contentClass: "content::Album" } },
        { id: "el_mp_nav_user", packageId: "pkg_nav", umlType: "Class", stereotype: "navigationClass", name: "User", attributes: [], operations: [], tags: { contentClass: "userModel::User", guard: "session.currentUser != null" } },
        { id: "el_mp_nav_album_menu", packageId: "pkg_nav", umlType: "Class", stereotype: "menu", name: "AlbumMenu", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_pr_login", packageId: "pkg_nav", umlType: "Class", stereotype: "processClass", name: "Login", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_pr_logout", packageId: "pkg_nav", umlType: "Class", stereotype: "processClass", name: "Logout", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_pr_register", packageId: "pkg_nav", umlType: "Class", stereotype: "processClass", name: "Register", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_pr_recharge", packageId: "pkg_nav", umlType: "Class", stereotype: "processClass", name: "Recharge", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_pr_buy", packageId: "pkg_nav", umlType: "Class", stereotype: "processClass", name: "BuyAlbum", attributes: [], operations: [], tags: {} },
        { id: "el_mp_nav_pr_search_method", packageId: "pkg_nav", umlType: "Class", stereotype: "processClass", name: "SelectSearchMethod", attributes: [], operations: [], tags: {} },

        // Process (slide 28 Login Activity)
        { id: "el_mp_proc_init", packageId: "pkg_proc", umlType: "Action", stereotype: "", name: "Start", attributes: [], operations: [], tags: {} },
        { id: "el_mp_proc_login_act", packageId: "pkg_proc", umlType: "Action", stereotype: "userAction", name: "Login", attributes: ["userName : out", "password : out"], operations: [], tags: {} },
        { id: "el_mp_proc_dec_login", packageId: "pkg_proc", umlType: "Action", stereotype: "", name: "Choice_Login", attributes: [], operations: [], tags: {} },
        { id: "el_mp_proc_validate", packageId: "pkg_proc", umlType: "Action", stereotype: "systemAction", name: "ValidateLogin", attributes: ["userName : in", "password : in", "result : out"], operations: [], tags: {} },
        { id: "el_mp_proc_register_sub", packageId: "pkg_proc", umlType: "Action", stereotype: "processClass", name: ": Register", attributes: ["result : out", "outcome : out"], operations: [], tags: {} },
        { id: "el_mp_proc_obj_user", packageId: "pkg_proc", umlType: "Class", stereotype: "", name: "newUser : User", attributes: [], operations: [], tags: {} },
        { id: "el_mp_proc_obj_valid", packageId: "pkg_proc", umlType: "Class", stereotype: "", name: "loginValid : Boolean", attributes: [], operations: [], tags: {} },
        { id: "el_mp_proc_dec_val", packageId: "pkg_proc", umlType: "Action", stereotype: "", name: "Choice_Validate", attributes: [], operations: [], tags: {} },
        { id: "el_mp_proc_final_ok", packageId: "pkg_proc", umlType: "Action", stereotype: "", name: "OK", attributes: [], operations: [], tags: {} },
        { id: "el_mp_proc_final_cancel", packageId: "pkg_proc", umlType: "Action", stereotype: "", name: "CANCEL", attributes: [], operations: [], tags: {} },
        { id: "el_mp_proc_obj_out", packageId: "pkg_proc", umlType: "Class", stereotype: "", name: "registerOutcome : String", attributes: [], operations: [], tags: {} },
        { id: "el_mp_proc_dec_reg", packageId: "pkg_proc", umlType: "Action", stereotype: "", name: "Choice_Register", attributes: [], operations: [], tags: {} },

        // Presentation (slides 30, 31)
        { id: "el_mp_pres_login", packageId: "pkg_pres", umlType: "Class", stereotype: "presentationGroup", name: "Login", attributes: [], operations: [], tags: { navigationNode: "process::Login" } },
        { id: "el_mp_pres_header", packageId: "pkg_pres", parentId: "el_mp_pres_login", umlType: "Property", stereotype: "text", name: ": LoginHeader", attributes: [], operations: [], tags: { styleClass: "header" } },
        { id: "el_mp_pres_datapanel", packageId: "pkg_pres", parentId: "el_mp_pres_login", umlType: "Property", stereotype: "presentationGroup", name: ": LoginDataPanel", attributes: [], operations: [], tags: {} },
        { id: "el_mp_pres_logininput", packageId: "pkg_pres", parentId: "el_mp_pres_datapanel", umlType: "Property", stereotype: "presentationGroup", name: ": LoginInput", attributes: [], operations: [], tags: { autoCompletion: "true", liveValidation: "true" } },
        { id: "el_mp_pres_lbl_user", packageId: "pkg_pres", parentId: "el_mp_pres_logininput", umlType: "Property", stereotype: "text", name: ": UserNameLabel", attributes: [], operations: [], tags: {} },
        { id: "el_mp_pres_in_user", packageId: "pkg_pres", parentId: "el_mp_pres_logininput", umlType: "Property", stereotype: "textInput", name: ": userName", attributes: [], operations: [], tags: {} },
        { id: "el_mp_pres_lbl_pass", packageId: "pkg_pres", parentId: "el_mp_pres_logininput", umlType: "Property", stereotype: "text", name: ": PasswordLabel", attributes: [], operations: [], tags: {} },
        { id: "el_mp_pres_in_pass", packageId: "pkg_pres", parentId: "el_mp_pres_logininput", umlType: "Property", stereotype: "textInput", name: ": password", attributes: [], operations: [], tags: {} },
        { id: "el_mp_pres_btnpanel", packageId: "pkg_pres", parentId: "el_mp_pres_login", umlType: "Property", stereotype: "presentationGroup", name: ": ButtonPanel", attributes: [], operations: [], tags: {} },
        { id: "el_mp_pres_btn_reg", packageId: "pkg_pres", parentId: "el_mp_pres_btnpanel", umlType: "Property", stereotype: "button", name: ": REGISTER", attributes: [], operations: [], tags: {} },
        { id: "el_mp_pres_btn_can", packageId: "pkg_pres", parentId: "el_mp_pres_btnpanel", umlType: "Property", stereotype: "button", name: ": CANCEL", attributes: [], operations: [], tags: {} },
        { id: "el_mp_pres_btn_ok", packageId: "pkg_pres", parentId: "el_mp_pres_btnpanel", umlType: "Property", stereotype: "button", name: ": OK", attributes: [], operations: [], tags: {} }
      ],
      relationships: [
        // Requirements
        { id: "rel_mp_uc_gen", sourceId: "el_mp_reg_user", targetId: "el_mp_user", umlType: "Generalization", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_u1", sourceId: "el_mp_user", targetId: "el_mp_uc_register", umlType: "Association", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_u2", sourceId: "el_mp_user", targetId: "el_mp_uc_login", umlType: "Association", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_u3", sourceId: "el_mp_user", targetId: "el_mp_uc_search_song", umlType: "Association", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_u4", sourceId: "el_mp_user", targetId: "el_mp_uc_search_perf", umlType: "Association", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_u5", sourceId: "el_mp_user", targetId: "el_mp_uc_search_alb", umlType: "Association", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_ext_alb", sourceId: "el_mp_uc_search_alb", targetId: "el_mp_uc_view_alb", umlType: "Dependency", stereotype: "", name: "«extend»", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_r1", sourceId: "el_mp_reg_user", targetId: "el_mp_uc_logout", umlType: "Association", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_r2", sourceId: "el_mp_reg_user", targetId: "el_mp_uc_buy_alb", umlType: "Association", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_r3", sourceId: "el_mp_reg_user", targetId: "el_mp_uc_recharge", umlType: "Association", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_r4", sourceId: "el_mp_reg_user", targetId: "el_mp_uc_download", umlType: "Association", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_r5", sourceId: "el_mp_reg_user", targetId: "el_mp_uc_view_usr", umlType: "Association", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_ext_buy1", sourceId: "el_mp_uc_view_alb", targetId: "el_mp_uc_buy_alb", umlType: "Dependency", stereotype: "", name: "«extend»", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_ext_buy2", sourceId: "el_mp_uc_download", targetId: "el_mp_uc_buy_alb", umlType: "Dependency", stereotype: "", name: "«extend»", sourceMult: "", targetMult: "" },
        { id: "rel_mp_uc_ext_usr", sourceId: "el_mp_uc_browse_usr_alb", targetId: "el_mp_uc_view_usr", umlType: "Dependency", stereotype: "", name: "«extend»", sourceMult: "", targetMult: "" },

        // Content
        { id: "rel_mp_con_alb_trk", sourceId: "el_mp_con_album", targetId: "el_mp_con_track", umlType: "Composition", stereotype: "", name: "-tracks", sourceMult: "0..1", targetMult: "1..*" },
        { id: "rel_mp_con_trk_sng", sourceId: "el_mp_con_track", targetId: "el_mp_con_song", umlType: "Association", stereotype: "", name: "-song", sourceMult: "*", targetMult: "1" },
        { id: "rel_mp_con_alb_gnr", sourceId: "el_mp_con_album", targetId: "el_mp_con_genre", umlType: "Association", stereotype: "", name: "-genres", sourceMult: "*", targetMult: "*" },
        { id: "rel_mp_con_sng_gnr", sourceId: "el_mp_con_song", targetId: "el_mp_con_genre", umlType: "Association", stereotype: "", name: "-genres", sourceMult: "*", targetMult: "*" },
        { id: "rel_mp_con_alb_prf", sourceId: "el_mp_con_album", targetId: "el_mp_con_perf", umlType: "Association", stereotype: "", name: "-performers", sourceMult: "*", targetMult: "1..*" },
        { id: "rel_mp_con_sng_prf", sourceId: "el_mp_con_song", targetId: "el_mp_con_perf", umlType: "Association", stereotype: "", name: "-performers", sourceMult: "*", targetMult: "1..*" },
        { id: "rel_mp_con_sng_art", sourceId: "el_mp_con_song", targetId: "el_mp_con_artist", umlType: "Association", stereotype: "", name: "-composers", sourceMult: "*", targetMult: "1..*" },
        { id: "rel_mp_con_grp_art", sourceId: "el_mp_con_group", targetId: "el_mp_con_artist", umlType: "Association", stereotype: "", name: "-members", sourceMult: "*", targetMult: "*" },
        { id: "rel_mp_con_grp_gen", sourceId: "el_mp_con_group", targetId: "el_mp_con_perf", umlType: "Generalization", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_con_art_gen", sourceId: "el_mp_con_artist", targetId: "el_mp_con_perf", umlType: "Generalization", stereotype: "", name: "", sourceMult: "", targetMult: "" },

        // User Model
        { id: "rel_mp_usr_sess_usr", sourceId: "el_mp_usr_session", targetId: "el_mp_usr_user", umlType: "DirectedAssociation", stereotype: "", name: "-currentUser", sourceMult: "", targetMult: "0..1" },
        { id: "rel_mp_usr_usr_alb", sourceId: "el_mp_usr_user", targetId: "el_mp_con_album", umlType: "Association", stereotype: "", name: "-ownedAlbums", sourceMult: "", targetMult: "*" },

        // Navigation
        { id: "rel_mp_nav_wel_menu", sourceId: "el_mp_nav_welcome", targetId: "el_mp_nav_main_menu", umlType: "Composition", stereotype: "navigationLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_menu_srchm", sourceId: "el_mp_nav_main_menu", targetId: "el_mp_nav_pr_search_method", umlType: "DirectedAssociation", stereotype: "processLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_menu_log", sourceId: "el_mp_nav_main_menu", targetId: "el_mp_nav_pr_login", umlType: "DirectedAssociation", stereotype: "processLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_menu_out", sourceId: "el_mp_nav_main_menu", targetId: "el_mp_nav_pr_logout", umlType: "DirectedAssociation", stereotype: "processLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_menu_usr", sourceId: "el_mp_nav_main_menu", targetId: "el_mp_nav_user", umlType: "DirectedAssociation", stereotype: "navigationLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_usr_rech", sourceId: "el_mp_nav_user", targetId: "el_mp_nav_pr_recharge", umlType: "DirectedAssociation", stereotype: "processLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_usr_reg", sourceId: "el_mp_nav_user", targetId: "el_mp_nav_pr_register", umlType: "DirectedAssociation", stereotype: "processLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_usr_albs", sourceId: "el_mp_nav_user", targetId: "el_mp_nav_idx_album", umlType: "DirectedAssociation", stereotype: "navigationLink", name: "-UserAlbums", sourceMult: "1", targetMult: "*" },
        { id: "rel_mp_nav_sm_alb", sourceId: "el_mp_nav_pr_search_method", targetId: "el_mp_nav_q_alb", umlType: "DirectedAssociation", stereotype: "processLink", name: "[result == 'album']", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_sm_sng", sourceId: "el_mp_nav_pr_search_method", targetId: "el_mp_nav_q_song", umlType: "DirectedAssociation", stereotype: "processLink", name: "[result == 'song']", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_sm_prf", sourceId: "el_mp_nav_pr_search_method", targetId: "el_mp_nav_q_perf", umlType: "DirectedAssociation", stereotype: "processLink", name: "[result == 'performer']", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_qa_idx", sourceId: "el_mp_nav_q_alb", targetId: "el_mp_nav_idx_album", umlType: "DirectedAssociation", stereotype: "navigationLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_qs_idx", sourceId: "el_mp_nav_q_song", targetId: "el_mp_nav_idx_song", umlType: "DirectedAssociation", stereotype: "navigationLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_qp_idx", sourceId: "el_mp_nav_q_perf", targetId: "el_mp_nav_idx_perf", umlType: "DirectedAssociation", stereotype: "navigationLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_ia_alb", sourceId: "el_mp_nav_idx_album", targetId: "el_mp_nav_album", umlType: "DirectedAssociation", stereotype: "navigationLink", name: "-Album [1..*]", sourceMult: "1", targetMult: "*" },
        { id: "rel_mp_nav_alb_menu", sourceId: "el_mp_nav_album", targetId: "el_mp_nav_album_menu", umlType: "Composition", stereotype: "navigationLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_am_buy", sourceId: "el_mp_nav_album_menu", targetId: "el_mp_nav_pr_buy", umlType: "DirectedAssociation", stereotype: "processLink", name: "[guard: loggedIn]", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_prf_pfa", sourceId: "el_mp_nav_perf", targetId: "el_mp_nav_idx_perfalb", umlType: "DirectedAssociation", stereotype: "navigationLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_pfa_alb", sourceId: "el_mp_nav_idx_perfalb", targetId: "el_mp_nav_album", umlType: "DirectedAssociation", stereotype: "navigationLink", name: "", sourceMult: "1", targetMult: "1" },
        { id: "rel_mp_nav_gnr_albs", sourceId: "el_mp_nav_genre", targetId: "el_mp_nav_idx_album", umlType: "DirectedAssociation", stereotype: "navigationLink", name: "-AlbumsByGenre", sourceMult: "1", targetMult: "*" },

        // Process Flow
        { id: "rel_mp_pf_1", sourceId: "el_mp_proc_init", targetId: "el_mp_proc_login_act", umlType: "ControlFlow", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_2", sourceId: "el_mp_proc_login_act", targetId: "el_mp_proc_dec_login", umlType: "ControlFlow", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_3", sourceId: "el_mp_proc_dec_login", targetId: "el_mp_proc_validate", umlType: "ControlFlow", stereotype: "", name: "[OK]", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_4", sourceId: "el_mp_proc_dec_login", targetId: "el_mp_proc_final_cancel", umlType: "ControlFlow", stereotype: "", name: "[CANCEL]", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_5", sourceId: "el_mp_proc_dec_login", targetId: "el_mp_proc_register_sub", umlType: "ControlFlow", stereotype: "", name: "[REGISTER]", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_6", sourceId: "el_mp_proc_validate", targetId: "el_mp_proc_obj_valid", umlType: "ControlFlow", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_7", sourceId: "el_mp_proc_obj_valid", targetId: "el_mp_proc_dec_val", umlType: "ControlFlow", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_8", sourceId: "el_mp_proc_dec_val", targetId: "el_mp_proc_final_ok", umlType: "ControlFlow", stereotype: "", name: "[loginValid == true]", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_9", sourceId: "el_mp_proc_dec_val", targetId: "el_mp_proc_login_act", umlType: "ControlFlow", stereotype: "", name: "[else]", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_10", sourceId: "el_mp_proc_register_sub", targetId: "el_mp_proc_obj_user", umlType: "ControlFlow", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_11", sourceId: "el_mp_proc_obj_user", targetId: "el_mp_proc_validate", umlType: "ControlFlow", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_12", sourceId: "el_mp_proc_register_sub", targetId: "el_mp_proc_obj_out", umlType: "ControlFlow", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_13", sourceId: "el_mp_proc_obj_out", targetId: "el_mp_proc_dec_reg", umlType: "ControlFlow", stereotype: "", name: "", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_14", sourceId: "el_mp_proc_dec_reg", targetId: "el_mp_proc_login_act", umlType: "ControlFlow", stereotype: "", name: "[registerOutcome == 'CANCEL']", sourceMult: "", targetMult: "" },
        { id: "rel_mp_pf_15", sourceId: "el_mp_proc_dec_reg", targetId: "el_mp_proc_validate", umlType: "ControlFlow", stereotype: "", name: "[else]", sourceMult: "", targetMult: "" }
      ],
      diagrams: [
        {
          id: "dg_mp_req",
          packageId: "pkg_req",
          name: "Requirements Diagram",
          diagramType: "USE_CASE",
          nodes: [
            { elementId: "el_mp_user", x: 60, y: 160, width: 85, height: 110 },
            { elementId: "el_mp_reg_user", x: 60, y: 440, width: 95, height: 110 },
            { elementId: "el_mp_uc_register", x: 250, y: 30, width: 165, height: 65 },
            { elementId: "el_mp_uc_login", x: 250, y: 110, width: 165, height: 65 },
            { elementId: "el_mp_uc_search_song", x: 250, y: 190, width: 175, height: 65 },
            { elementId: "el_mp_uc_search_perf", x: 250, y: 270, width: 185, height: 65 },
            { elementId: "el_mp_uc_search_alb", x: 250, y: 350, width: 175, height: 65 },
            { elementId: "el_mp_uc_logout", x: 250, y: 430, width: 165, height: 65 },
            { elementId: "el_mp_uc_buy_alb", x: 530, y: 460, width: 185, height: 65 },
            { elementId: "el_mp_uc_recharge", x: 250, y: 510, width: 165, height: 65 },
            { elementId: "el_mp_uc_download", x: 250, y: 590, width: 180, height: 65 },
            { elementId: "el_mp_uc_view_alb", x: 530, y: 350, width: 175, height: 65 },
            { elementId: "el_mp_uc_view_usr", x: 250, y: 670, width: 185, height: 65 },
            { elementId: "el_mp_uc_browse_usr_alb", x: 530, y: 670, width: 220, height: 65 }
          ],
          edges: [
            "rel_mp_uc_gen", "rel_mp_uc_u1", "rel_mp_uc_u2", "rel_mp_uc_u3", "rel_mp_uc_u4", "rel_mp_uc_u5",
            "rel_mp_uc_ext_alb", "rel_mp_uc_r1", "rel_mp_uc_r2", "rel_mp_uc_r3", "rel_mp_uc_r4", "rel_mp_uc_r5",
            "rel_mp_uc_ext_buy1", "rel_mp_uc_ext_buy2", "rel_mp_uc_ext_usr"
          ]
        },
        {
          id: "dg_mp_con",
          packageId: "pkg_con",
          name: "Content Diagram",
          diagramType: "CONTENT",
          nodes: [
            { elementId: "el_mp_con_album", x: 60, y: 50, width: 215, height: 165 },
            { elementId: "el_mp_con_track", x: 340, y: 70, width: 175, height: 95 },
            { elementId: "el_mp_con_song", x: 590, y: 70, width: 175, height: 85 },
            { elementId: "el_mp_con_genre", x: 590, y: 210, width: 175, height: 75 },
            { elementId: "el_mp_con_perf", x: 340, y: 235, width: 185, height: 90 },
            { elementId: "el_mp_con_group", x: 170, y: 395, width: 205, height: 110 },
            { elementId: "el_mp_con_artist", x: 440, y: 395, width: 215, height: 120 }
          ],
          edges: [
            "rel_mp_con_alb_trk", "rel_mp_con_trk_sng", "rel_mp_con_alb_gnr", "rel_mp_con_sng_gnr",
            "rel_mp_con_alb_prf", "rel_mp_con_sng_prf", "rel_mp_con_sng_art", "rel_mp_con_grp_art",
            "rel_mp_con_grp_gen", "rel_mp_con_art_gen"
          ]
        },
        {
          id: "dg_mp_usr",
          packageId: "pkg_usr",
          name: "User Model Diagram",
          diagramType: "CONTENT",
          nodes: [
            { elementId: "el_mp_usr_session", x: 70, y: 85, width: 180, height: 85 },
            { elementId: "el_mp_usr_user", x: 350, y: 50, width: 245, height: 195 },
            { elementId: "el_mp_usr_gender", x: 70, y: 230, width: 180, height: 105 }
          ],
          edges: ["rel_mp_usr_sess_usr"]
        },
        {
          id: "dg_mp_nav",
          packageId: "pkg_nav",
          name: "Navigation Diagram",
          diagramType: "NAVIGATION",
          nodes: [
            { elementId: "el_mp_nav_welcome", x: 360, y: 25, width: 170, height: 75 },
            { elementId: "el_mp_nav_main_menu", x: 360, y: 135, width: 170, height: 85 },
            { elementId: "el_mp_nav_pr_logout", x: 95, y: 115, width: 165, height: 65 },
            { elementId: "el_mp_nav_pr_login", x: 95, y: 195, width: 165, height: 65 },
            { elementId: "el_mp_nav_user", x: 630, y: 85, width: 230, height: 95 },
            { elementId: "el_mp_nav_pr_recharge", x: 920, y: 85, width: 160, height: 65 },
            { elementId: "el_mp_nav_pr_register", x: 670, y: 215, width: 160, height: 65 },
            { elementId: "el_mp_nav_pr_search_method", x: 340, y: 255, width: 210, height: 75 },
            { elementId: "el_mp_nav_q_alb", x: 180, y: 375, width: 175, height: 75 },
            { elementId: "el_mp_nav_q_song", x: 720, y: 375, width: 175, height: 75 },
            { elementId: "el_mp_nav_q_perf", x: 720, y: 640, width: 175, height: 75 },
            { elementId: "el_mp_nav_idx_album", x: 180, y: 485, width: 200, height: 85 },
            { elementId: "el_mp_nav_idx_song", x: 720, y: 485, width: 175, height: 80 },
            { elementId: "el_mp_nav_genre", x: 40, y: 600, width: 180, height: 85 },
            { elementId: "el_mp_nav_album", x: 260, y: 630, width: 190, height: 85 },
            { elementId: "el_mp_nav_album_menu", x: 70, y: 730, width: 160, height: 70 },
            { elementId: "el_mp_nav_pr_buy", x: 70, y: 820, width: 160, height: 65 },
            { elementId: "el_mp_nav_perf", x: 490, y: 515, width: 190, height: 85 },
            { elementId: "el_mp_nav_idx_perfalb", x: 470, y: 665, width: 190, height: 75 },
            { elementId: "el_mp_nav_idx_group", x: 500, y: 395, width: 180, height: 75 }
          ],
          edges: [
            "rel_mp_nav_wel_menu", "rel_mp_nav_menu_srchm", "rel_mp_nav_menu_log", "rel_mp_nav_menu_out",
            "rel_mp_nav_menu_usr", "rel_mp_nav_usr_rech", "rel_mp_nav_usr_reg", "rel_mp_nav_usr_albs",
            "rel_mp_nav_sm_alb", "rel_mp_nav_sm_sng", "rel_mp_nav_sm_prf", "rel_mp_nav_qa_idx",
            "rel_mp_nav_qs_idx", "rel_mp_nav_qp_idx", "rel_mp_nav_ia_alb", "rel_mp_nav_alb_menu",
            "rel_mp_nav_am_buy", "rel_mp_nav_prf_pfa", "rel_mp_nav_pfa_alb", "rel_mp_nav_gnr_albs"
          ]
        },
        {
          id: "dg_mp_proc",
          packageId: "pkg_proc",
          name: "Login Workflow (Activity Diagram)",
          diagramType: "PROCESS_FLOW",
          nodes: [
            { elementId: "el_mp_proc_init", x: 330, y: 30, width: 36, height: 36 },
            { elementId: "el_mp_proc_login_act", x: 260, y: 95, width: 175, height: 80 },
            { elementId: "el_mp_proc_dec_login", x: 330, y: 210, width: 36, height: 36 },
            { elementId: "el_mp_proc_validate", x: 240, y: 300, width: 185, height: 95 },
            { elementId: "el_mp_proc_final_cancel", x: 460, y: 300, width: 36, height: 36 },
            { elementId: "el_mp_proc_register_sub", x: 570, y: 200, width: 175, height: 75 },
            { elementId: "el_mp_proc_obj_user", x: 540, y: 320, width: 155, height: 50 },
            { elementId: "el_mp_proc_obj_valid", x: 240, y: 445, width: 185, height: 50 },
            { elementId: "el_mp_proc_dec_val", x: 120, y: 445, width: 36, height: 36 },
            { elementId: "el_mp_proc_final_ok", x: 120, y: 535, width: 36, height: 36 },
            { elementId: "el_mp_proc_obj_out", x: 650, y: 395, width: 195, height: 50 },
            { elementId: "el_mp_proc_dec_reg", x: 790, y: 245, width: 36, height: 36 }
          ],
          edges: [
            "rel_mp_pf_1", "rel_mp_pf_2", "rel_mp_pf_3", "rel_mp_pf_4", "rel_mp_pf_5",
            "rel_mp_pf_6", "rel_mp_pf_7", "rel_mp_pf_8", "rel_mp_pf_9", "rel_mp_pf_10",
            "rel_mp_pf_11", "rel_mp_pf_12", "rel_mp_pf_13", "rel_mp_pf_14", "rel_mp_pf_15"
          ]
        },
        {
          id: "dg_mp_pres",
          packageId: "pkg_pres",
          name: "Login Presentation Diagram",
          diagramType: "PRESENTATION",
          nodes: [
            { elementId: "el_mp_pres_login", x: 60, y: 40, width: 570, height: 470, zIndex: 1 },
            { elementId: "el_mp_pres_header", x: 80, y: 95, width: 155, height: 50, zIndex: 2 },
            { elementId: "el_mp_pres_datapanel", x: 80, y: 165, width: 525, height: 185, zIndex: 2 },
            { elementId: "el_mp_pres_logininput", x: 100, y: 195, width: 485, height: 135, zIndex: 3 },
            { elementId: "el_mp_pres_lbl_user", x: 115, y: 215, width: 145, height: 45, zIndex: 4 },
            { elementId: "el_mp_pres_in_user", x: 275, y: 215, width: 165, height: 45, zIndex: 4 },
            { elementId: "el_mp_pres_lbl_pass", x: 115, y: 270, width: 145, height: 45, zIndex: 4 },
            { elementId: "el_mp_pres_in_pass", x: 275, y: 270, width: 165, height: 45, zIndex: 4 },
            { elementId: "el_mp_pres_btnpanel", x: 80, y: 370, width: 525, height: 95, zIndex: 2 },
            { elementId: "el_mp_pres_btn_reg", x: 110, y: 395, width: 135, height: 50, zIndex: 3 },
            { elementId: "el_mp_pres_btn_can", x: 270, y: 395, width: 135, height: 50, zIndex: 3 },
            { elementId: "el_mp_pres_btn_ok", x: 430, y: 395, width: 125, height: 50, zIndex: 3 }
          ],
          edges: []
        }
      ]
    };
  }

  function createBlankUWEModel(name) {
    return {
      name: name || "Proyecto UWE en Blanco",
      packages: [
        { id: "pkg_req", name: "Requirements", stereotype: "requirementsModel" },
        { id: "pkg_con", name: "Content", stereotype: "contentModel" },
        { id: "pkg_nav", name: "Navigation", stereotype: "navigationModel" },
        { id: "pkg_pres", name: "Presentation", stereotype: "presentationModel" },
        { id: "pkg_proc", name: "Process", stereotype: "processModel" },
        { id: "pkg_navst", name: "NavigationStates", stereotype: "navigationStatesModel" },
        { id: "pkg_usr", name: "UserModel", stereotype: "userModel" },
        { id: "pkg_br", name: "BasicRights", stereotype: "basicRightsModel" }
      ],
      elements: [],
      relationships: [],
      diagrams: [
        { id: "dg_req_1", packageId: "pkg_req", name: "Requirements Diagram", diagramType: "USE_CASE", nodes: [], edges: [] },
        { id: "dg_con_1", packageId: "pkg_con", name: "Content Diagram", diagramType: "CONTENT", nodes: [], edges: [] },
        { id: "dg_nav_1", packageId: "pkg_nav", name: "Navigation Diagram", diagramType: "NAVIGATION", nodes: [], edges: [] },
        { id: "dg_pres_1", packageId: "pkg_pres", name: "Presentation Diagram", diagramType: "PRESENTATION", nodes: [], edges: [] },
        { id: "dg_proc_1", packageId: "pkg_proc", name: "Process Structure Diagram", diagramType: "PROCESS_STRUCTURE", nodes: [], edges: [] },
        { id: "dg_usr_1", packageId: "pkg_usr", name: "User Model Diagram", diagramType: "CONTENT", nodes: [], edges: [] }
      ]
    };
  }

  function getExampleProjects() {
    return [
      {
        id: "music_portal",
        name: "Simple Music Portal (UWE Sevilla 2010 - Nora Koch)",
        badge: "Recomendado — Manual UWE",
        isRecommended: true,
        icon: "🎵",
        category: "Manual UWE Sevilla (Nora Koch)",
        description: "Caso de estudio completo de la presentación de Nora Koch (LMU Múnich) en Sevilla. Incluye los 5 modelos canónicos: Requisitos con casos de uso («browsing», «processing»), Contenido (Álbumes, Canciones, Artistas), Modelo de Usuario, Estructura de Navegación con Procesos Web, Flujo de Proceso Login (Activity Diagram) y Presentación RIA.",
        stats: "8 paquetes • 41 elementos • 6 diagramas",
        pdfUrl: "/manual/UWE_27042010_sevilla.pdf#page=15",
        pdfLabel: "Ver especificación completa en PDF (pág. 15-38)",
        create: createMusicPortalDemoModel
      },
      {
        id: "address_book",
        name: "Libreta de Contactos (AddressBook Tutorial)",
        badge: "Tutorial MagicUWE",
        isRecommended: false,
        icon: "📇",
        category: "Tutorial MagicDraw / MagicUWE",
        description: "El clásico proyecto tutorial de MagicDraw y MagicUWE con modelos de Requisitos, Contenido de contactos y categorías, Navegación con índices/consultas y formulario interactivo de presentación.",
        stats: "8 paquetes • 24 elementos • 7 diagramas",
        pdfUrl: "/manual/UWE_27042010_sevilla.pdf#page=56",
        pdfLabel: "Ver captura en MagicDraw en PDF (pág. 56)",
        create: createAddressBookDemoModel
      },
      {
        id: "blank",
        name: "Proyecto en Blanco",
        badge: "Lienzo Vacío",
        isRecommended: false,
        icon: "📄",
        category: "Plantilla Estándar UWE 3.0",
        description: "Estructura estándar completa con los 8 paquetes de la metodología UWE (Requirements, Content, Navigation, Presentation, Process, UserModel, NavigationStates, BasicRights) lista para comenzar a modelar desde cero.",
        stats: "8 paquetes limpios • 6 diagramas base",
        create: createBlankUWEModel
      }
    ];
  }

  function escapeXml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Bi-directional Model -> XML (UWE XMI 2.4 / MagicDraw 18 Compatible Structure)
  function modelToXml(arg1, arg2) {
    let projectName = 'UWE_Project';
    let model = arg1;

    // Handle polymorphic call: modelToXml(model) OR modelToXml(projectName, model)
    if (typeof arg1 === 'string' && arg2 && typeof arg2 === 'object') {
      projectName = arg1;
      model = arg2;
    } else if (arg1 && typeof arg1 === 'object') {
      model = arg1;
      projectName = arg1.name || (typeof arg2 === 'string' ? arg2 : 'UWE_Project');
    }
    model = model || { packages: [], elements: [], relationships: [], diagrams: [] };

    const lines = [];
    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    lines.push(`<xmi:XMI xmi:version="2.4.1" xmlns:xmi="http://www.omg.org/spec/XMI/20131001" xmlns:uml="http://www.omg.org/spec/UML/20131001" xmlns:UWE="http://uwe.pst.ifi.lmu.de/profile/3.0">`);
    lines.push(`  <xmi:Documentation exporter="MagicUWE Web (LMU Profile 3.0)" exporterVersion="1.5.0" projectName="${escapeXml(projectName || 'UWE_Project')}" />`);
    lines.push(`  <uml:Model xmi:id="model_root" name="Data">`);

    for (const pkg of (model.packages || [])) {
      lines.push(`    <packagedElement xmi:type="uml:Model" xmi:id="${escapeXml(pkg.id)}" name="${escapeXml(pkg.name)}" stereotype="${escapeXml(pkg.stereotype || '')}">`);
      const pkgElements = (model.elements || []).filter(e => e.packageId === pkg.id && !e.parentId);
      for (const el of pkgElements) {
        writeElementXml(lines, el, model.elements || [], '      ');
      }
      lines.push(`    </packagedElement>`);
    }

    if ((model.relationships || []).length > 0) {
      lines.push(`    <UWE:Relationships>`);
      for (const rel of model.relationships) {
        const tagsStr = rel.tags && Object.keys(rel.tags).length
          ? ` tags="${escapeXml(JSON.stringify(rel.tags))}"`
          : '';
        lines.push(
          `      <relationship xmi:id="${escapeXml(rel.id)}" umlType="${escapeXml(rel.umlType || 'Association')}" stereotype="${escapeXml(rel.stereotype || '')}" source="${escapeXml(rel.sourceId)}" target="${escapeXml(rel.targetId)}" name="${escapeXml(rel.name || '')}" sourceMult="${escapeXml(rel.sourceMult || '')}" targetMult="${escapeXml(rel.targetMult || '')}"${tagsStr} />`
        );
      }
      lines.push(`    </UWE:Relationships>`);
    }

    lines.push(`    <UWE:Diagrams>`);
    for (const dg of (model.diagrams || [])) {
      lines.push(`      <ownedDiagram xmi:id="${escapeXml(dg.id)}" packageId="${escapeXml(dg.packageId)}" name="${escapeXml(dg.name)}" diagramType="${escapeXml(dg.diagramType)}">`);
      for (const n of (dg.nodes || [])) {
        const zAttr = n.zIndex ? ` zIndex="${n.zIndex}"` : '';
        const grpAttr = n.groupId ? ` groupId="${escapeXml(n.groupId)}"` : '';
        lines.push(`        <mdElement elementId="${escapeXml(n.elementId)}" x="${Math.round(n.x)}" y="${Math.round(n.y)}" width="${Math.round(n.width || 165)}" height="${Math.round(n.height || 85)}"${zAttr}${grpAttr} />`);
      }
      for (const edgeId of (dg.edges || [])) {
        lines.push(`        <mdEdge relationshipId="${escapeXml(edgeId)}" />`);
      }
      lines.push(`      </ownedDiagram>`);
    }
    lines.push(`    </UWE:Diagrams>`);
    lines.push(`  </uml:Model>`);
    lines.push(`</xmi:XMI>`);
    return lines.join('\n');
  }

  function writeElementXml(lines, el, allElements, indent) {
    const children = allElements.filter(c => c.parentId === el.id);
    const hasInner = (el.attributes && el.attributes.length) ||
      (el.operations && el.operations.length) ||
      (el.tags && Object.keys(el.tags).length) ||
      children.length > 0;

    const head = `${indent}<packagedElement xmi:type="uml:${escapeXml(el.umlType || 'Class')}" xmi:id="${escapeXml(el.id)}" name="${escapeXml(el.name)}" stereotype="${escapeXml(el.stereotype || '')}"`;
    if (!hasInner) {
      lines.push(`${head} />`);
      return;
    }
    lines.push(`${head}>`);
    for (const attr of (el.attributes || [])) {
      lines.push(`${indent}  <ownedAttribute value="${escapeXml(attr)}" />`);
    }
    for (const op of (el.operations || [])) {
      lines.push(`${indent}  <ownedOperation value="${escapeXml(op)}" />`);
    }
    if (el.tags) {
      for (const [k, v] of Object.entries(el.tags)) {
        if (v !== '' && v !== null && v !== undefined) {
          lines.push(`${indent}  <taggedValue tag="${escapeXml(k)}" value="${escapeXml(String(v))}" />`);
        }
      }
    }
    for (const child of children) {
      writeElementXml(lines, child, allElements, indent + '  ');
    }
    lines.push(`${indent}</packagedElement>`);
  }

  // Bi-directional XML -> Model Parser
  function xmlToModel(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const parseErr = doc.querySelector('parsererror');
    if (parseErr) {
      throw new Error('Error de sintaxis XML: ' + parseErr.textContent.slice(0, 180));
    }

    const packages = [];
    const elements = [];
    const relationships = [];
    const diagrams = [];

    const docEl = doc.getElementsByTagName('xmi:Documentation')[0] || doc.getElementsByTagName('Documentation')[0];
    const projectName = docEl ? (docEl.getAttribute('projectName') || 'Proyecto UWE') : 'Proyecto UWE';

    const modelRoot = doc.getElementsByTagName('uml:Model')[0] || doc.getElementsByTagName('Model')[0] || doc.documentElement;
    const topPkgNodes = Array.from(modelRoot.children).filter(
      ch => ch.localName === 'packagedElement' && (ch.getAttribute('xmi:type') === 'uml:Model' || ch.getAttribute('xmi:type') === 'uml:Package' || ch.getAttribute('stereotype')?.endsWith('Model'))
    );

    function parseNestedElement(node, pkgId, parentId) {
      const id = node.getAttribute('xmi:id') || node.getAttribute('id') || ('el_' + Math.random().toString(36).slice(2, 9));
      const rawType = node.getAttribute('xmi:type') || node.getAttribute('umlType') || 'uml:Class';
      const umlType = rawType.replace(/^uml:/, '');
      const name = node.getAttribute('name') || 'Unnamed';
      const stereotype = node.getAttribute('stereotype') || '';
      const attributes = [];
      const operations = [];
      const tags = {};

      for (const child of Array.from(node.children)) {
        if (child.localName === 'ownedAttribute') {
          const val = child.getAttribute('value') || child.getAttribute('name') || child.textContent.trim();
          if (val) attributes.push(val);
        } else if (child.localName === 'ownedOperation') {
          const val = child.getAttribute('value') || child.getAttribute('name') || child.textContent.trim();
          if (val) operations.push(val);
        } else if (child.localName === 'taggedValue') {
          const k = child.getAttribute('tag') || child.getAttribute('name');
          const v = child.getAttribute('value') ?? child.textContent.trim();
          if (k) tags[k] = v;
        } else if (child.localName === 'packagedElement') {
          parseNestedElement(child, pkgId, id);
        }
      }

      elements.push({
        id,
        packageId: pkgId,
        parentId: parentId || null,
        umlType,
        stereotype,
        name,
        attributes,
        operations,
        tags
      });
    }

    for (const pkgNode of topPkgNodes) {
      const pkgId = pkgNode.getAttribute('xmi:id') || pkgNode.getAttribute('id') || ('pkg_' + Math.random().toString(36).slice(2, 8));
      const pkgName = pkgNode.getAttribute('name') || 'Package';
      const pkgSt = pkgNode.getAttribute('stereotype') || 'contentModel';
      packages.push({ id: pkgId, name: pkgName, stereotype: pkgSt });

      for (const child of Array.from(pkgNode.children)) {
        if (child.localName === 'packagedElement') {
          parseNestedElement(child, pkgId, null);
        }
      }
    }

    const relNodes = Array.from(doc.getElementsByTagName('relationship'));
    for (const rNode of relNodes) {
      let tags = {};
      if (rNode.getAttribute('tags')) {
        try { tags = JSON.parse(rNode.getAttribute('tags')); } catch (_e) {}
      }
      relationships.push({
        id: rNode.getAttribute('xmi:id') || rNode.getAttribute('id') || ('rel_' + Math.random().toString(36).slice(2, 9)),
        umlType: rNode.getAttribute('umlType') || 'Association',
        stereotype: rNode.getAttribute('stereotype') || '',
        sourceId: rNode.getAttribute('source') || '',
        targetId: rNode.getAttribute('target') || '',
        name: rNode.getAttribute('name') || '',
        sourceMult: rNode.getAttribute('sourceMult') || '',
        targetMult: rNode.getAttribute('targetMult') || '',
        tags
      });
    }

    const dgNodes = Array.from(doc.getElementsByTagName('ownedDiagram'));
    for (const dNode of dgNodes) {
      const dgId = dNode.getAttribute('xmi:id') || dNode.getAttribute('id') || ('dg_' + Math.random().toString(36).slice(2, 8));
      const packageId = dNode.getAttribute('packageId') || (packages[0] ? packages[0].id : 'pkg_con');
      const name = dNode.getAttribute('name') || 'Diagram';
      const diagramType = dNode.getAttribute('diagramType') || 'CONTENT';
      const nodes = [];
      const edges = [];

      for (const ch of Array.from(dNode.children)) {
        if (ch.localName === 'mdElement') {
          nodes.push({
            elementId: ch.getAttribute('elementId'),
            x: Number(ch.getAttribute('x') || 60),
            y: Number(ch.getAttribute('y') || 60),
            width: Number(ch.getAttribute('width') || 165),
            height: Number(ch.getAttribute('height') || 85),
            zIndex: Number(ch.getAttribute('zIndex') || 1),
            groupId: ch.getAttribute('groupId') || null
          });
        } else if (ch.localName === 'mdEdge') {
          const eid = ch.getAttribute('relationshipId');
          if (eid) edges.push(eid);
        }
      }
      diagrams.push({ id: dgId, packageId, name, diagramType, nodes, edges });
    }

    const parsedModel = {
      name: projectName,
      packages,
      elements,
      relationships,
      diagrams
    };
    parsedModel.model = parsedModel;
    parsedModel.projectName = projectName;
    return parsedModel;
  }

  // MagicUWE 8 Model-to-Model Transformations
  function executeTransformation(model, transformationKey) {
    const clone = JSON.parse(JSON.stringify(model));
    const ensurePackage = (name, stereotype) => {
      let pkg = clone.packages.find(p => p.stereotype === stereotype || p.name === name);
      if (!pkg) {
        pkg = { id: 'pkg_' + Math.random().toString(36).slice(2, 8), name, stereotype };
        clone.packages.push(pkg);
      }
      return pkg;
    };

    let summary = '';

    if (transformationKey === 'CONTENT_2_NAVIGATION') {
      const conPkg = clone.packages.find(p => p.stereotype === 'contentModel' || p.name === 'Content');
      const navPkg = ensurePackage('Navigation', 'navigationModel');
      const conDg = clone.diagrams.find(d => d.diagramType === 'CONTENT');
      const conClasses = clone.elements.filter(e => e.packageId === (conPkg && conPkg.id) && e.umlType === 'Class');

      const newDgId = 'dg_nav_' + Date.now().toString(36).slice(-4);
      const newDg = {
        id: newDgId,
        packageId: navPkg.id,
        name: 'Navigation Diagram (Transformed)',
        diagramType: 'NAVIGATION',
        nodes: [],
        edges: []
      };

      const idMap = {};
      conClasses.forEach((cls, idx) => {
        const newId = 'el_nav_' + Math.random().toString(36).slice(2, 8);
        idMap[cls.id] = newId;
        clone.elements.push({
          id: newId,
          packageId: navPkg.id,
          parentId: null,
          umlType: 'Class',
          stereotype: 'navigationClass',
          name: cls.name,
          attributes: [],
          operations: [],
          tags: idx === 0 ? { isHome: 'true', contentClass: cls.name } : { contentClass: cls.name }
        });
        const origNode = conDg && conDg.nodes.find(n => n.elementId === cls.id);
        newDg.nodes.push({
          elementId: newId,
          x: origNode ? origNode.x : 80 + (idx % 3) * 230,
          y: origNode ? origNode.y : 80 + Math.floor(idx / 3) * 140,
          width: 170,
          height: 85
        });
      });

      let assocCount = 0;
      clone.relationships.forEach(rel => {
        if (idMap[rel.sourceId] && idMap[rel.targetId]) {
          const newRelId = 'rel_nav_' + Math.random().toString(36).slice(2, 8);
          clone.relationships.push({
            id: newRelId,
            sourceId: idMap[rel.sourceId],
            targetId: idMap[rel.targetId],
            umlType: 'DirectedAssociation',
            stereotype: 'navigationLink',
            name: rel.name || '',
            sourceMult: rel.sourceMult || '1',
            targetMult: rel.targetMult || '*'
          });
          newDg.edges.push(newRelId);
          assocCount++;
        }
      });

      clone.diagrams.push(newDg);
      summary = `Content -> Navigation: ${conClasses.length} clases «navigationClass» y ${assocCount} enlaces «navigationLink» generados.`;
      return { model: clone, activeDiagramId: newDgId, summary };
    }

    if (transformationKey === 'NAVIGATION_2_PRESENTATION') {
      const navPkg = clone.packages.find(p => p.stereotype === 'navigationModel' || p.name === 'Navigation');
      const presPkg = ensurePackage('Presentation', 'presentationModel');
      const navClasses = clone.elements.filter(
        e => e.packageId === (navPkg && navPkg.id) && ['navigationClass', 'menu', 'index', 'query', 'guidedTour'].includes(e.stereotype)
      );

      const newDgId = 'dg_pres_' + Date.now().toString(36).slice(-4);
      const newDg = {
        id: newDgId,
        packageId: presPkg.id,
        name: 'Presentation Diagram (Transformed)',
        diagramType: 'PRESENTATION',
        nodes: [],
        edges: []
      };

      navClasses.forEach((cls, idx) => {
        const newId = 'el_pres_' + Math.random().toString(36).slice(2, 8);
        const st = cls.tags && cls.tags.isHome === 'true' ? 'presentationPage' : 'presentationGroup';
        clone.elements.push({
          id: newId,
          packageId: presPkg.id,
          parentId: null,
          umlType: 'Class',
          stereotype: st,
          name: cls.name + (st === 'presentationPage' ? 'Page' : 'Group'),
          attributes: [],
          operations: [],
          tags: { navigationNode: cls.name }
        });
        // Add a default nested property inside each transformed presentation group
        const childPropId = 'el_prop_' + Math.random().toString(36).slice(2, 8);
        clone.elements.push({
          id: childPropId,
          packageId: presPkg.id,
          parentId: newId,
          umlType: 'Property',
          stereotype: cls.stereotype === 'query' ? 'inputForm' : cls.stereotype === 'menu' ? 'anchor' : 'text',
          name: cls.stereotype === 'query' ? 'searchForm : Form' : cls.stereotype === 'menu' ? 'navItem : Anchor' : 'title : Text',
          attributes: [],
          operations: [],
          tags: {}
        });
        newDg.nodes.push({
          elementId: newId,
          x: 60 + (idx % 2) * 340,
          y: 55 + Math.floor(idx / 2) * 190,
          width: 295,
          height: 155
        });
      });

      clone.diagrams.push(newDg);
      summary = `Navigation -> Presentation: ${navClasses.length} elementos de presentación creados con propiedades anidadas.`;
      return { model: clone, activeDiagramId: newDgId, summary };
    }

    if (transformationKey === 'NAVIGATION_2_PROCESS_STRUCTURE') {
      const procPkg = ensurePackage('Process', 'processModel');
      const procClasses = clone.elements.filter(e => e.stereotype === 'processClass');
      const newDgId = 'dg_procs_' + Date.now().toString(36).slice(-4);
      const newDg = {
        id: newDgId,
        packageId: procPkg.id,
        name: 'Process Structure (Transformed)',
        diagramType: 'PROCESS_STRUCTURE',
        nodes: procClasses.map((c, idx) => ({
          elementId: c.id,
          x: 90 + (idx % 3) * 220,
          y: 90 + Math.floor(idx / 3) * 130,
          width: 175,
          height: 80
        })),
        edges: []
      };
      clone.diagrams.push(newDg);
      summary = `Navigation -> Process Structure: ${procClasses.length} clases «processClass» añadidas al diagrama estructural.`;
      return { model: clone, activeDiagramId: newDgId, summary };
    }

    if (transformationKey === 'NAVIGATION_2_PROCESS_FLOWS') {
      const procPkg = ensurePackage('Process', 'processModel');
      const procClasses = clone.elements.filter(e => e.stereotype === 'processClass');
      let lastDgId = clone.diagrams[0] ? clone.diagrams[0].id : '';

      procClasses.forEach(pCls => {
        const dgId = 'dg_pflow_' + Math.random().toString(36).slice(2, 7);
        lastDgId = dgId;
        const initId = 'el_pfi_' + Math.random().toString(36).slice(2, 7);
        const usrId = 'el_pfu_' + Math.random().toString(36).slice(2, 7);
        const sysId = 'el_pfs_' + Math.random().toString(36).slice(2, 7);
        const finId = 'el_pff_' + Math.random().toString(36).slice(2, 7);

        clone.elements.push(
          { id: initId, packageId: procPkg.id, umlType: 'InitialNode', stereotype: '', name: 'Start', attributes: [], operations: [], tags: {} },
          { id: usrId, packageId: procPkg.id, umlType: 'Action', stereotype: 'userAction', name: `Input_${pCls.name}`, attributes: [], operations: [], tags: { validated: 'true' } },
          { id: sysId, packageId: procPkg.id, umlType: 'Action', stereotype: 'systemAction', name: `Execute_${pCls.name}`, attributes: [], operations: [], tags: { confirmed: 'true' } },
          { id: finId, packageId: procPkg.id, umlType: 'FinalNode', stereotype: '', name: 'End', attributes: [], operations: [], tags: {} }
        );

        const r1 = 'rel_pf_' + Math.random().toString(36).slice(2, 7);
        const r2 = 'rel_pf_' + Math.random().toString(36).slice(2, 7);
        const r3 = 'rel_pf_' + Math.random().toString(36).slice(2, 7);
        clone.relationships.push(
          { id: r1, sourceId: initId, targetId: usrId, umlType: 'ControlFlow', stereotype: '', name: '', sourceMult: '', targetMult: '' },
          { id: r2, sourceId: usrId, targetId: sysId, umlType: 'ControlFlow', stereotype: '', name: '[ok]', sourceMult: '', targetMult: '' },
          { id: r3, sourceId: sysId, targetId: finId, umlType: 'ControlFlow', stereotype: '', name: '', sourceMult: '', targetMult: '' }
        );

        clone.diagrams.push({
          id: dgId,
          packageId: procPkg.id,
          name: `${pCls.name} Workflow`,
          diagramType: 'PROCESS_FLOW',
          nodes: [
            { elementId: initId, x: 60, y: 125, width: 36, height: 36 },
            { elementId: usrId, x: 165, y: 100, width: 180, height: 80 },
            { elementId: sysId, x: 425, y: 100, width: 180, height: 80 },
            { elementId: finId, x: 675, y: 125, width: 38, height: 38 }
          ],
          edges: [r1, r2, r3]
        });
      });

      summary = `Navigation -> Process Flows: ${procClasses.length} diagramas Workflow («userAction» + «systemAction») generados.`;
      return { model: clone, activeDiagramId: lastDgId, summary };
    }

    // Requirements -> Content / Navigation / Presentation / Process
    if (transformationKey.startsWith('REQUIREMENTS_2_')) {
      const reqPkg = clone.packages.find(p => p.stereotype === 'requirementsModel' || p.name === 'Requirements');
      const useCases = clone.elements.filter(e => e.packageId === (reqPkg && reqPkg.id) && e.umlType === 'UseCase');
      const targetType = transformationKey.replace('REQUIREMENTS_2_', '');

      if (targetType === 'CONTENT') {
        const conPkg = ensurePackage('Content', 'contentModel');
        const dgId = 'dg_req2con_' + Date.now().toString(36).slice(-4);
        const nodes = [];
        useCases.forEach((uc, idx) => {
          const entityName = uc.name.replace(/^(View|Search|Create|Edit|Delete|Manage)/i, '') || uc.name;
          const elId = 'el_con_' + Math.random().toString(36).slice(2, 8);
          clone.elements.push({
            id: elId,
            packageId: conPkg.id,
            umlType: 'Class',
            stereotype: '',
            name: entityName,
            attributes: ['-id : String'],
            operations: [],
            tags: {}
          });
          nodes.push({ elementId: elId, x: 80 + idx * 210, y: 95, width: 170, height: 85 });
        });
        clone.diagrams.push({ id: dgId, packageId: conPkg.id, name: 'Content from Requirements', diagramType: 'CONTENT', nodes, edges: [] });
        return { model: clone, activeDiagramId: dgId, summary: `Requirements -> Content: ${useCases.length} clases de dominio generadas desde Casos de Uso.` };
      }

      if (targetType === 'NAVIGATION' || targetType === 'PROCESS' || targetType === 'PRESENTATION') {
        const navPkg = ensurePackage('Navigation', 'navigationModel');
        const dgId = 'dg_req2nav_' + Date.now().toString(36).slice(-4);
        const nodes = [];
        useCases.forEach((uc, idx) => {
          const isProc = uc.stereotype === 'processing';
          const elId = 'el_rnav_' + Math.random().toString(36).slice(2, 8);
          clone.elements.push({
            id: elId,
            packageId: navPkg.id,
            umlType: 'Class',
            stereotype: isProc ? 'processClass' : 'navigationClass',
            name: uc.name,
            attributes: [],
            operations: [],
            tags: idx === 0 ? { isHome: 'true' } : {}
          });
          nodes.push({ elementId: elId, x: 80 + idx * 215, y: 95, width: 175, height: 85 });
        });
        clone.diagrams.push({ id: dgId, packageId: navPkg.id, name: 'Navigation from Requirements', diagramType: 'NAVIGATION', nodes, edges: [] });
        return { model: clone, activeDiagramId: dgId, summary: `Requirements -> ${targetType}: ${useCases.length} elementos generados desde Casos de Uso.` };
      }
    }

    return { model: clone, activeDiagramId: clone.diagrams[0]?.id, summary: 'Transformación completada.' };
  }

  window.UWE_ENGINE = {
    DIAGRAM_TYPES,
    RIA_TAGS,
    createAddressBookDemoModel,
    createMusicPortalDemoModel,
    createBlankUWEModel,
    getExampleProjects,
    modelToXml,
    xmlToModel,
    executeTransformation
  };
})();

