var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// obsidian---linkflowz/src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => LinkFlowz
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// obsidian---linkflowz/src/Settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  language: "fr",
  dubApiKey: "",
  dubWorkspaceId: "",
  domainFolderMappings: [],
  viewMode: "tab"
};
var Settings = class {
  static initialize(plugin) {
    this.plugin = plugin;
  }
  static async loadSettings() {
    const savedData = await this.plugin.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData || {});
    return this.settings;
  }
  static async saveSettings(settings) {
    this.settings = Object.assign(this.settings || DEFAULT_SETTINGS, settings);
    await this.plugin.saveData(this.settings);
  }
  static async fetchDomains(apiKey, workspaceId) {
    var _a;
    try {
      console.log("Fetching domains with API key:", apiKey.substring(0, 4) + "...");
      if (workspaceId) {
        console.log("Using workspace ID:", workspaceId);
      }
      const url = workspaceId ? `https://api.dub.co/domains?projectId=${workspaceId}` : "https://api.dub.co/domains";
      console.log("Requesting URL:", url);
      const response = await (0, import_obsidian.requestUrl)({
        url,
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });
      console.log("Response status:", response.status);
      if (response.status === 200) {
        const domains = Array.isArray(response.json) ? response.json : [];
        console.log("Parsed domains:", domains);
        return domains.map((domain) => domain.slug);
      }
      console.error("Error response:", response.json);
      throw new Error(((_a = response.json) == null ? void 0 : _a.error) || `Failed to fetch domains (status: ${response.status})`);
    } catch (error) {
      console.error("Error fetching domains:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error;
    }
  }
};
var SettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin, settings, translations2) {
    super(app, plugin);
    this.plugin = plugin;
    this.translations = translations2;
    this.domains = ["dub.co"];
    this.settings = settings;
  }
  async loadDomains() {
    if (this.settings.dubApiKey) {
      try {
        this.domains = ["dub.co", ...await Settings.fetchDomains(
          this.settings.dubApiKey,
          this.settings.dubWorkspaceId
        )];
        this.display();
      } catch (error) {
        new import_obsidian.Notice(this.translations.t("notices.error").replace("{message}", error.message));
      }
    }
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "dub.co" });
    new import_obsidian.Setting(containerEl).setName(this.translations.t("settings.dubApiKey")).setDesc(this.translations.t("settings.dubApiKeyDesc")).addText((text) => text.setPlaceholder("Entrez votre cl\xE9 API").setValue(this.settings.dubApiKey).onChange(async (value) => {
      this.settings.dubApiKey = value;
      await Settings.saveSettings({ dubApiKey: value });
      new import_obsidian.Notice(this.translations.t("notices.saved"));
      if (value) {
        await this.loadDomains();
      }
    }));
    new import_obsidian.Setting(containerEl).setName(this.translations.t("settings.dubWorkspaceId")).setDesc(this.translations.t("settings.dubWorkspaceIdDesc")).addText((text) => text.setPlaceholder("Entrez votre ID de workspace").setValue(this.settings.dubWorkspaceId).onChange(async (value) => {
      this.settings.dubWorkspaceId = value;
      await Settings.saveSettings({ dubWorkspaceId: value });
      new import_obsidian.Notice(this.translations.t("notices.saved"));
      if (this.settings.dubApiKey) {
        await this.loadDomains();
      }
    }));
    containerEl.createEl("h2", { text: this.translations.t("settings.domainFolderMappings") });
    const descriptionLine = new import_obsidian.Setting(containerEl).setName(this.translations.t("settings.domainFolderMappingsDesc")).addButton((button) => button.setIcon("plus").setButtonText(this.translations.t("settings.addMapping")).setCta().onClick(async () => {
      this.settings.domainFolderMappings.push({
        domain: this.domains[0],
        folder: ""
      });
      await Settings.saveSettings({ domainFolderMappings: this.settings.domainFolderMappings });
      new import_obsidian.Notice(this.translations.t("notices.saved"));
      this.display();
    }));
    descriptionLine.settingEl.addClass("description-with-button");
    const mappingsContainer = containerEl.createEl("div");
    const createMappingElement = (mapping, index) => {
      const mappingDiv = mappingsContainer.createEl("div", { cls: "mapping-container" });
      const mappingLine = new import_obsidian.Setting(mappingDiv).setClass("compact-setting").addText((text) => {
        text.inputEl.addClass("label-text");
        text.setValue(this.translations.t("settings.domain"));
        text.setDisabled(true);
        return text;
      }).addDropdown((dropdown) => {
        this.domains.forEach((domain) => {
          dropdown.addOption(domain, domain);
        });
        dropdown.setValue(mapping.domain);
        dropdown.onChange((value) => {
          this.settings.domainFolderMappings[index].domain = value;
        });
        dropdown.selectEl.addClass("domain-dropdown");
        return dropdown;
      }).addButton((button) => button.setButtonText(mapping.folder || this.translations.t("settings.folder")).onClick((e) => {
        const menu = new import_obsidian.Menu();
        this.buildFolderMenu(menu, this.app.vault.getRoot(), index);
        menu.showAtMouseEvent(e);
      })).addButton((button) => button.setIcon("checkmark").setTooltip(this.translations.t("settings.save")).setCta().onClick(async () => {
        await Settings.saveSettings({ domainFolderMappings: this.settings.domainFolderMappings });
        new import_obsidian.Notice(this.translations.t("notices.saved"));
      })).addButton((button) => button.setIcon("trash").setTooltip(this.translations.t("settings.remove")).onClick(async () => {
        this.settings.domainFolderMappings.splice(index, 1);
        await Settings.saveSettings({ domainFolderMappings: this.settings.domainFolderMappings });
        new import_obsidian.Notice(this.translations.t("notices.saved"));
        this.display();
      }));
      mappingLine.settingEl.addClass("mapping-line");
    };
    this.settings.domainFolderMappings.forEach((mapping, index) => {
      createMappingElement(mapping, index);
    });
    containerEl.createEl("h2", { text: this.translations.t("settings.viewMode") });
    new import_obsidian.Setting(containerEl).setName(this.translations.t("settings.defaultViewMode")).setDesc(this.translations.t("settings.defaultViewModeDesc")).addDropdown((dropdown) => dropdown.addOption("tab", this.translations.t("settings.tab")).addOption("sidebar", this.translations.t("settings.sidebar")).addOption("overlay", this.translations.t("settings.overlay")).setValue(this.settings.viewMode).onChange(async (value) => {
      this.settings.viewMode = value;
      await Settings.saveSettings({ viewMode: value });
      new import_obsidian.Notice(this.translations.t("notices.saved"));
    }));
    if (this.settings.dubApiKey && this.domains.length === 1) {
      this.loadDomains();
    }
  }
  // Construire le menu hiérarchique des dossiers
  buildFolderMenu(menu, folder, mappingIndex, level = 0) {
    const subFolders = folder.children.filter((child) => child instanceof import_obsidian.TFolder);
    subFolders.forEach((subFolder) => {
      const hasChildren = subFolder.children.some((child) => child instanceof import_obsidian.TFolder);
      if (hasChildren) {
        menu.addItem((item) => {
          var _a;
          const titleEl = createSpan({ cls: "menu-item-title" });
          titleEl.appendText(subFolder.name);
          titleEl.appendChild(createSpan({ cls: "menu-item-arrow", text: " \u2192" }));
          (_a = item.dom.querySelector(".menu-item-title")) == null ? void 0 : _a.replaceWith(titleEl);
          item.setIcon("folder");
          const subMenu = new import_obsidian.Menu();
          this.buildFolderMenu(subMenu, subFolder, mappingIndex, level + 1);
          const itemDom = item.dom;
          if (itemDom) {
            let isOverItem = false;
            let isOverMenu = false;
            let hideTimeout;
            const showSubMenu = () => {
              const rect = itemDom.getBoundingClientRect();
              subMenu.showAtPosition({
                x: rect.right,
                y: rect.top
              });
            };
            const hideSubMenu = () => {
              hideTimeout = setTimeout(() => {
                if (!isOverItem && !isOverMenu) {
                  subMenu.hide();
                }
              }, 100);
            };
            itemDom.addEventListener("mouseenter", () => {
              isOverItem = true;
              if (hideTimeout)
                clearTimeout(hideTimeout);
              showSubMenu();
            });
            itemDom.addEventListener("mouseleave", () => {
              isOverItem = false;
              hideSubMenu();
            });
            const subMenuEl = subMenu.dom;
            if (subMenuEl) {
              subMenuEl.addEventListener("mouseenter", () => {
                isOverMenu = true;
                if (hideTimeout)
                  clearTimeout(hideTimeout);
              });
              subMenuEl.addEventListener("mouseleave", () => {
                isOverMenu = false;
                hideSubMenu();
              });
            }
          }
          item.onClick(async () => {
            this.settings.domainFolderMappings[mappingIndex].folder = subFolder.path;
            await Settings.saveSettings({ domainFolderMappings: this.settings.domainFolderMappings });
            new import_obsidian.Notice(this.translations.t("notices.saved"));
            this.display();
          });
        });
      } else {
        menu.addItem((item) => {
          item.setTitle(subFolder.name).setIcon("folder").onClick(async () => {
            this.settings.domainFolderMappings[mappingIndex].folder = subFolder.path;
            await Settings.saveSettings({ domainFolderMappings: this.settings.domainFolderMappings });
            new import_obsidian.Notice(this.translations.t("notices.saved"));
            this.display();
          });
        });
      }
    });
  }
};

// obsidian---linkflowz/src/Translations.ts
var translations = {
  en: {
    // Notices
    "notices.saved": "\u2705 Settings saved",
    "notices.error": "\u274C Error: {message}",
    "notices.success": "\u2705 Operation successful",
    "notices.linkCreated": "\u2705 Short link created successfully",
    "notices.urlRequired": "\u274C Destination URL is required",
    // Modal
    "modal.createShortLink": "Create Short Link",
    "modal.destinationUrl": "Destination URL",
    "modal.destinationUrlDesc": "The URL you want to shorten",
    "modal.customSlug": "Custom Slug",
    "modal.customSlugDesc": "Custom part of the short URL (optional)",
    "modal.domain": "Domain",
    "modal.domainDesc": "Choose the domain for your short link",
    "modal.create": "Create",
    // Settings dub.co
    "settings.dubApiKey": "dub.co API Key",
    "settings.dubApiKeyDesc": "Your dub.co API key for authentication",
    "settings.dubWorkspaceId": "dub.co Workspace ID",
    "settings.dubWorkspaceIdDesc": "Optional: The ID of the workspace where you want to create links (found in the URL: app.dub.co/[workspace-id]). If not set, links will be created in your default workspace.",
    "settings.dubCustomDomains": "Custom Domains",
    "settings.dubCustomDomainsDesc": "List of your custom domains (one per line)",
    "settings.domainFolderMappings": "Domain-Folder Mappings",
    "settings.domainFolderMappingsDesc": "Configure which domain to use for each folder",
    "settings.addMapping": "Add New Mapping",
    "settings.domain": "Domain",
    "settings.folder": "Folder",
    "settings.remove": "Remove",
    // Settings ViewMode
    "settings.viewMode": "View Mode",
    "settings.defaultViewMode": "Default View Mode",
    "settings.defaultViewModeDesc": "Choose how the link details will be displayed",
    "settings.tab": "New Tab",
    "settings.sidebar": "Right Sidebar",
    "settings.overlay": "Overlay",
    // Dashboard
    "dashboard.title": "LinkFlowz Dashboard",
    "dashboard.noLinks": "No short links created yet",
    "dashboard.loading": "Loading your links...",
    "dashboard.error": "Error loading links: {message}",
    "settings.domainAndFolder": "Domain and Folder Mapping",
    "settings.folderPlaceholder": "Folder",
    "settings.save": "Save"
  },
  fr: {
    // Notices
    "notices.saved": "\u2705 Param\xE8tres sauvegard\xE9s",
    "notices.error": "\u274C Erreur: {message}",
    "notices.success": "\u2705 Op\xE9ration r\xE9ussie",
    "notices.linkCreated": "\u2705 Lien court cr\xE9\xE9 avec succ\xE8s",
    "notices.urlRequired": "\u274C L'URL de destination est requise",
    // Modal
    "modal.createShortLink": "Cr\xE9er un lien court",
    "modal.destinationUrl": "URL de destination",
    "modal.destinationUrlDesc": "L'URL que vous souhaitez raccourcir",
    "modal.customSlug": "Slug personnalis\xE9",
    "modal.customSlugDesc": "Partie personnalis\xE9e de l'URL courte (optionnel)",
    "modal.domain": "Domaine",
    "modal.domainDesc": "Choisissez le domaine pour votre lien court",
    "modal.create": "Cr\xE9er",
    // Settings dub.co
    "settings.dubApiKey": "Cl\xE9 API dub.co",
    "settings.dubApiKeyDesc": "Votre cl\xE9 API dub.co pour l'authentification",
    "settings.dubWorkspaceId": "ID Workspace dub.co",
    "settings.dubWorkspaceIdDesc": "Optionnel : L'ID du workspace o\xF9 vous souhaitez cr\xE9er vos liens (visible dans l'URL : app.dub.co/[workspace-id]). Si non renseign\xE9, les liens seront cr\xE9\xE9s dans votre workspace par d\xE9faut.",
    "settings.dubCustomDomains": "Domaines personnalis\xE9s",
    "settings.dubCustomDomainsDesc": "Liste de vos domaines personnalis\xE9s (un par ligne)",
    "settings.domainFolderMappings": "Associations Domaines-Dossiers",
    "settings.domainFolderMappingsDesc": "Configurez quel domaine utiliser pour chaque dossier",
    "settings.addMapping": "Ajouter une nouvelle association",
    "settings.domain": "Domaine",
    "settings.folder": "Dossier",
    "settings.remove": "Supprimer",
    // Settings ViewMode
    "settings.viewMode": "Mode d'affichage",
    "settings.defaultViewMode": "Mode d'affichage par d\xE9faut",
    "settings.defaultViewModeDesc": "Choisissez comment les d\xE9tails des liens seront affich\xE9s",
    "settings.tab": "Nouvel onglet",
    "settings.sidebar": "Barre lat\xE9rale",
    "settings.overlay": "Superposition",
    // Dashboard
    "dashboard.title": "Tableau de bord LinkFlowz",
    "dashboard.noLinks": "Aucun lien court cr\xE9\xE9 pour le moment",
    "dashboard.loading": "Chargement de vos liens...",
    "dashboard.error": "Erreur lors du chargement des liens : {message}",
    "settings.domainAndFolder": "Association Domaine et Dossier",
    "settings.folderPlaceholder": "Dossier",
    "settings.save": "Sauvegarder"
  }
};
var Translations = class {
  constructor(initialLang = "fr") {
    this.currentLang = initialLang;
  }
  setLanguage(lang) {
    this.currentLang = lang;
  }
  t(key) {
    var _a;
    return ((_a = translations[this.currentLang]) == null ? void 0 : _a[key]) || translations["en"][key] || key;
  }
};

// obsidian---linkflowz/src/Hotkeys.ts
var import_obsidian3 = require("obsidian");

// obsidian---linkflowz/src/ShortLinkModal.ts
var import_obsidian2 = require("obsidian");
var CreateShortLinkModal = class extends import_obsidian2.Modal {
  constructor(app, plugin, settings, translations2, onSubmit) {
    super(app);
    this.plugin = plugin;
    this.settings = settings;
    this.translations = translations2;
    this.onSubmit = onSubmit;
    this.url = "";
    this.slug = "";
    this.selectedDomain = "";
  }
  getDomainForCurrentFile() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile)
      return "dub.co";
    const filePath = activeFile.path;
    let bestMatch = { domain: "dub.co", depth: -1 };
    this.settings.domainFolderMappings.forEach((mapping) => {
      if (filePath.startsWith(mapping.folder)) {
        const depth = mapping.folder.split("/").length;
        if (depth > bestMatch.depth) {
          bestMatch = {
            domain: mapping.domain,
            depth
          };
        }
      }
    });
    return bestMatch.domain;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.translations.t("modal.createShortLink") });
    new import_obsidian2.Setting(contentEl).setName(this.translations.t("modal.destinationUrl")).setDesc(this.translations.t("modal.destinationUrlDesc")).addText((text) => text.setPlaceholder("https://exemple.com/page-longue").onChange((value) => this.url = value));
    new import_obsidian2.Setting(contentEl).setName(this.translations.t("modal.customSlug")).setDesc(this.translations.t("modal.customSlugDesc")).addText((text) => text.setPlaceholder("mon-lien").onChange((value) => this.slug = value));
    const defaultDomain = this.getDomainForCurrentFile();
    new import_obsidian2.Setting(contentEl).setName(this.translations.t("modal.domain")).setDesc(this.translations.t("modal.domainDesc")).addDropdown((dropdown) => {
      dropdown.addOption("dub.co", "dub.co");
      const uniqueDomains = [...new Set(this.settings.domainFolderMappings.map((m) => m.domain))];
      uniqueDomains.forEach((domain) => {
        if (domain !== "dub.co") {
          dropdown.addOption(domain, domain);
        }
      });
      dropdown.setValue(defaultDomain);
      dropdown.onChange((value) => this.selectedDomain = value);
    });
    const buttonContainer = contentEl.createEl("div", { cls: "modal-button-container" });
    buttonContainer.createEl("button", { text: "Annuler" }).addEventListener("click", () => this.close());
    const createButton = buttonContainer.createEl("button", {
      text: this.translations.t("modal.create"),
      cls: "mod-cta"
    });
    createButton.addEventListener("click", () => {
      if (!this.url) {
        new import_obsidian2.Notice(this.translations.t("notices.urlRequired"));
        return;
      }
      this.onSubmit(this.url, this.slug, this.selectedDomain || defaultDomain);
      this.close();
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// obsidian---linkflowz/src/Hotkeys.ts
var Hotkeys = class {
  constructor(plugin, settings, translations2) {
    this.plugin = plugin;
    this.settings = settings;
    this.translations = translations2;
  }
  async createShortLink(url, slug, domain) {
    var _a;
    try {
      const response = await (0, import_obsidian3.requestUrl)({
        url: "https://api.dub.co/v1/links",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.settings.dubApiKey}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          url,
          ...slug && { key: slug },
          ...domain && { domain },
          ...this.settings.dubWorkspaceId && { workspaceId: this.settings.dubWorkspaceId }
        })
      });
      if (response.status === 200) {
        const shortUrl = `https://${domain || "dub.co"}/${slug || response.json.key}`;
        const activeView = this.plugin.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
        if (activeView) {
          const editor = activeView.editor;
          const file = activeView.file;
          if (editor && file) {
            const markdownLink = `[${url}](${shortUrl})`;
            const cursor = editor.getCursor();
            editor.replaceRange(markdownLink, cursor);
            this.plugin.app.metadataCache.getFileCache(file);
            this.plugin.app.vault.modify(file, editor.getValue());
          }
        }
        new import_obsidian3.Notice(this.translations.t("notices.linkCreated"));
      } else {
        new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", ((_a = response.json) == null ? void 0 : _a.error) || "Unknown error"));
      }
    } catch (error) {
      console.error("Erreur lors de la cr\xE9ation du lien court:", error);
      new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", error.message));
    }
  }
  registerHotkeys() {
    this.plugin.addCommand({
      id: "create-short-link",
      name: this.translations.t("modal.createShortLink"),
      callback: () => {
        if (!this.settings.dubApiKey) {
          new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", "API key not configured"));
          return;
        }
        new CreateShortLinkModal(
          this.plugin.app,
          this.plugin,
          this.settings,
          this.translations,
          (url, slug, domain) => this.createShortLink(url, slug, domain)
        ).open();
      },
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "l" }]
    });
  }
};

// obsidian---linkflowz/src/Dashboard.ts
var import_obsidian4 = require("obsidian");
var VIEW_TYPE_DASHBOARD = "linkflowz-dashboard";
var DashboardView = class extends import_obsidian4.ItemView {
  constructor(leaf, plugin, translations2) {
    super(leaf);
    this.plugin = plugin;
    this.translations = translations2;
  }
  getViewType() {
    return VIEW_TYPE_DASHBOARD;
  }
  getDisplayText() {
    return this.translations.t("dashboard.title");
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h2", { text: this.translations.t("dashboard.title") });
    const linksContainer = container.createEl("div", { cls: "linkflowz-links" });
  }
  async onClose() {
  }
};
var DashboardManager = class {
  constructor(plugin, translations2) {
    this.plugin = plugin;
    this.translations = translations2;
  }
  async openDashboard(mode) {
    const existingLeaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD);
    if (existingLeaves.length > 0) {
      this.plugin.app.workspace.revealLeaf(existingLeaves[0]);
      return;
    }
    const viewMode = this.plugin.viewMode;
    await viewMode.setView(mode);
  }
  getCurrentLeaf() {
    const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD);
    return leaves.length > 0 ? leaves[0] : null;
  }
};

// obsidian---linkflowz/src/ViewMode.ts
var ViewMode = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.currentMode = "tab";
    this.currentLeaf = null;
  }
  async setView(mode) {
    var _a, _b;
    this.currentMode = mode;
    if (this.currentLeaf) {
      this.currentLeaf.detach();
    }
    const workspace = this.plugin.app.workspace;
    let leaf;
    switch (mode) {
      case "sidebar":
        leaf = (_a = workspace.getRightLeaf(false)) != null ? _a : workspace.getLeaf("split");
        break;
      case "overlay":
        const activeLeaf = (_b = workspace.getMostRecentLeaf()) != null ? _b : workspace.getLeaf("split");
        leaf = workspace.createLeafBySplit(activeLeaf, "horizontal", true);
        break;
      case "tab":
      default:
        leaf = workspace.getLeaf("split");
        break;
    }
    await leaf.setViewState({
      type: VIEW_TYPE_DASHBOARD,
      active: true
    });
    this.currentLeaf = leaf;
    this.plugin.app.workspace.revealLeaf(leaf);
  }
  getCurrentMode() {
    return this.currentMode;
  }
  getCurrentLeaf() {
    return this.currentLeaf;
  }
};

// obsidian---linkflowz/src/styles.ts
var STYLES = `
   .description-with-button {
      margin-bottom: 12px;
   }
   .description-with-button .setting-item-control {
      margin-left: 8px;
   }
   .description-with-button .setting-item-description {
      margin-bottom: 0;
   }
   .mapping-line {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
   }
   .mapping-line .setting-item-control {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-grow: 1;
   }
   .mapping-line .label-text {
      width: 60px !important;
      background: none !important;
      border: none !important;
      box-shadow: none !important;
      font-size: 13px;
      color: var(--text-muted);
      padding: 0 !important;
      cursor: default;
   }
   .mapping-line .domain-dropdown {
      min-width: 200px;
   }
   .folder-container {
      display: flex;
      align-items: center;
      gap: 4px;
   }
   .folder-label {
      font-size: 13px;
      color: var(--text-muted);
   }
   .mapping-line .search-input-container {
      min-width: 150px;
   }
   .add-mapping-button {
      margin-top: 6px;
   }
   .add-mapping-button .setting-item-control {
      justify-content: flex-start;
   }
   .add-mapping-button .setting-item-info {
      display: none;
   }
   .compact-setting .setting-item-info {
      display: none;
   }
`;
function registerStyles() {
  const styleEl = document.createElement("style");
  styleEl.id = "linkflowz-styles";
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);
}
function unregisterStyles() {
  const styleEl = document.getElementById("linkflowz-styles");
  if (styleEl) {
    styleEl.remove();
  }
}

// obsidian---linkflowz/src/main.ts
var LinkFlowz = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    this.translations = new Translations();
  }
  async onload() {
    Settings.initialize(this);
    const settings = await Settings.loadSettings();
    this.settings = settings;
    this.loadLanguage();
    registerStyles();
    this.hotkeys = new Hotkeys(this, this.settings, this.translations);
    this.hotkeys.registerHotkeys();
    this.app.workspace.onLayoutReady(() => {
      this.viewMode = new ViewMode(this);
      this.registerView(
        VIEW_TYPE_DASHBOARD,
        (leaf) => new DashboardView(leaf, this, this.translations)
      );
      this.dashboardManager = new DashboardManager(this, this.translations);
      this.addRibbonIcon("layout-dashboard", "Open LinkFlowz Dashboard", () => {
        this.dashboardManager.openDashboard(this.settings.viewMode);
      });
    });
    this.addSettingTab(new SettingsTab(
      this.app,
      this,
      settings,
      this.translations
    ));
  }
  loadLanguage() {
    var _a;
    const locale = ((_a = document.documentElement.lang) == null ? void 0 : _a.toLowerCase().startsWith("fr")) ? "fr" : "en";
    this.translations.setLanguage(locale);
  }
  onunload() {
    var _a;
    unregisterStyles();
    const leaf = (_a = this.dashboardManager) == null ? void 0 : _a.getCurrentLeaf();
    if (leaf) {
      leaf.detach();
    }
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL1NldHRpbmdzLnRzIiwgInNyYy9UcmFuc2xhdGlvbnMudHMiLCAic3JjL0hvdGtleXMudHMiLCAic3JjL1Nob3J0TGlua01vZGFsLnRzIiwgInNyYy9EYXNoYm9hcmQudHMiLCAic3JjL1ZpZXdNb2RlLnRzIiwgInNyYy9zdHlsZXMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBsdWdpbiB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IFNldHRpbmdzLCBTZXR0aW5nc1RhYiwgREVGQVVMVF9TRVRUSU5HUywgRGVmYXVsdFNldHRpbmdzIH0gZnJvbSAnLi9TZXR0aW5ncyc7XG5pbXBvcnQgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL1RyYW5zbGF0aW9ucyc7XG5pbXBvcnQgeyBIb3RrZXlzIH0gZnJvbSAnLi9Ib3RrZXlzJztcbmltcG9ydCB7IFZpZXdNb2RlIH0gZnJvbSAnLi9WaWV3TW9kZSc7XG5pbXBvcnQgeyBEYXNoYm9hcmRWaWV3LCBEYXNoYm9hcmRNYW5hZ2VyLCBWSUVXX1RZUEVfREFTSEJPQVJEIH0gZnJvbSAnLi9EYXNoYm9hcmQnO1xuaW1wb3J0IHsgcmVnaXN0ZXJTdHlsZXMsIHVucmVnaXN0ZXJTdHlsZXMgfSBmcm9tICcuL3N0eWxlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbmtGbG93eiBleHRlbmRzIFBsdWdpbiB7XG4gICBzZXR0aW5ncyE6IERlZmF1bHRTZXR0aW5ncztcbiAgIHByaXZhdGUgdHJhbnNsYXRpb25zOiBUcmFuc2xhdGlvbnMgPSBuZXcgVHJhbnNsYXRpb25zKCk7XG4gICBwcml2YXRlIGhvdGtleXMhOiBIb3RrZXlzO1xuICAgcHJpdmF0ZSB2aWV3TW9kZSE6IFZpZXdNb2RlO1xuICAgcHJpdmF0ZSBkYXNoYm9hcmRNYW5hZ2VyITogRGFzaGJvYXJkTWFuYWdlcjtcblxuICAgYXN5bmMgb25sb2FkKCkge1xuICAgICAgLy8gSW5pdGlhbGlzYXRpb24gZGVzIHBhcmFtXHUwMEU4dHJlcyBldCB0cmFkdWN0aW9uc1xuICAgICAgU2V0dGluZ3MuaW5pdGlhbGl6ZSh0aGlzKTtcbiAgICAgIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgU2V0dGluZ3MubG9hZFNldHRpbmdzKCk7XG4gICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICB0aGlzLmxvYWRMYW5ndWFnZSgpO1xuXG4gICAgICAvLyBFbnJlZ2lzdHJlciBsZXMgc3R5bGVzIENTU1xuICAgICAgcmVnaXN0ZXJTdHlsZXMoKTtcblxuICAgICAgLy8gSW5pdGlhbGlzYXRpb24gZGVzIGhvdGtleXNcbiAgICAgIHRoaXMuaG90a2V5cyA9IG5ldyBIb3RrZXlzKHRoaXMsIHRoaXMuc2V0dGluZ3MsIHRoaXMudHJhbnNsYXRpb25zKTtcbiAgICAgIHRoaXMuaG90a2V5cy5yZWdpc3RlckhvdGtleXMoKTtcbiAgICAgIFxuICAgICAgLy8gQXR0ZW5kcmUgcXVlIGxlIHdvcmtzcGFjZSBzb2l0IHByXHUwMEVBdFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uTGF5b3V0UmVhZHkoKCkgPT4ge1xuICAgICAgICAgLy8gSW5pdGlhbGlzYXRpb24gZGUgVmlld01vZGVcbiAgICAgICAgIHRoaXMudmlld01vZGUgPSBuZXcgVmlld01vZGUodGhpcyk7XG5cbiAgICAgICAgIC8vIEVucmVnaXN0cmVtZW50IGRlIGxhIHZ1ZSBkYXNoYm9hcmRcbiAgICAgICAgIHRoaXMucmVnaXN0ZXJWaWV3KFxuICAgICAgICAgICAgVklFV19UWVBFX0RBU0hCT0FSRCxcbiAgICAgICAgICAgIChsZWFmKSA9PiBuZXcgRGFzaGJvYXJkVmlldyhsZWFmLCB0aGlzLCB0aGlzLnRyYW5zbGF0aW9ucylcbiAgICAgICAgICk7XG5cbiAgICAgICAgIC8vIEluaXRpYWxpc2F0aW9uIGR1IGRhc2hib2FyZCBtYW5hZ2VyXG4gICAgICAgICB0aGlzLmRhc2hib2FyZE1hbmFnZXIgPSBuZXcgRGFzaGJvYXJkTWFuYWdlcih0aGlzLCB0aGlzLnRyYW5zbGF0aW9ucyk7XG5cbiAgICAgICAgIC8vIEFqb3V0IGR1IGJvdXRvbiBkYW5zIGxhIGJhcnJlIGxhdFx1MDBFOXJhbGVcbiAgICAgICAgIHRoaXMuYWRkUmliYm9uSWNvbignbGF5b3V0LWRhc2hib2FyZCcsICdPcGVuIExpbmtGbG93eiBEYXNoYm9hcmQnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRhc2hib2FyZE1hbmFnZXIub3BlbkRhc2hib2FyZCh0aGlzLnNldHRpbmdzLnZpZXdNb2RlKTtcbiAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEFqb3V0IGRlIGxhIHBhZ2UgZGUgcGFyYW1cdTAwRTh0cmVzXG4gICAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNldHRpbmdzVGFiKFxuICAgICAgICAgdGhpcy5hcHAsXG4gICAgICAgICB0aGlzLFxuICAgICAgICAgc2V0dGluZ3MsXG4gICAgICAgICB0aGlzLnRyYW5zbGF0aW9uc1xuICAgICAgKSk7XG4gICB9XG5cbiAgIHByaXZhdGUgbG9hZExhbmd1YWdlKCk6IHZvaWQge1xuICAgICAgY29uc3QgbG9jYWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lmxhbmc/LnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZnInKSA/ICdmcicgOiAnZW4nO1xuICAgICAgdGhpcy50cmFuc2xhdGlvbnMuc2V0TGFuZ3VhZ2UobG9jYWxlKTtcbiAgIH1cblxuICAgb251bmxvYWQoKSB7XG4gICAgICAvLyBTdXBwcmltZXIgbGVzIHN0eWxlc1xuICAgICAgdW5yZWdpc3RlclN0eWxlcygpO1xuICAgICAgXG4gICAgICAvLyBGZXJtZXIgbGEgdnVlIHNpIGVsbGUgZXN0IG91dmVydGVcbiAgICAgIGNvbnN0IGxlYWYgPSB0aGlzLmRhc2hib2FyZE1hbmFnZXI/LmdldEN1cnJlbnRMZWFmKCk7XG4gICAgICBpZiAobGVhZikge1xuICAgICAgICAgbGVhZi5kZXRhY2goKTtcbiAgICAgIH1cbiAgIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBQbHVnaW4sIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIE5vdGljZSwgcmVxdWVzdFVybCwgTWVudSwgVEZvbGRlciB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcblxuZXhwb3J0IGludGVyZmFjZSBEb21haW5Gb2xkZXJNYXBwaW5nIHtcbiAgIGRvbWFpbjogc3RyaW5nO1xuICAgZm9sZGVyOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVmYXVsdFNldHRpbmdzIHtcbiAgIGxhbmd1YWdlOiBzdHJpbmc7XG4gICBkdWJBcGlLZXk6IHN0cmluZztcbiAgIGR1YldvcmtzcGFjZUlkOiBzdHJpbmc7XG4gICBkb21haW5Gb2xkZXJNYXBwaW5nczogRG9tYWluRm9sZGVyTWFwcGluZ1tdO1xuICAgdmlld01vZGU6ICd0YWInIHwgJ3NpZGViYXInIHwgJ292ZXJsYXknO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogRGVmYXVsdFNldHRpbmdzID0ge1xuICAgbGFuZ3VhZ2U6ICdmcicsXG4gICBkdWJBcGlLZXk6ICcnLFxuICAgZHViV29ya3NwYWNlSWQ6ICcnLFxuICAgZG9tYWluRm9sZGVyTWFwcGluZ3M6IFtdLFxuICAgdmlld01vZGU6ICd0YWInXG59O1xuXG5leHBvcnQgY2xhc3MgU2V0dGluZ3Mge1xuICAgcHJpdmF0ZSBzdGF0aWMgcGx1Z2luOiBQbHVnaW47XG4gICBwcml2YXRlIHN0YXRpYyBzZXR0aW5nczogRGVmYXVsdFNldHRpbmdzO1xuXG4gICBzdGF0aWMgaW5pdGlhbGl6ZShwbHVnaW46IFBsdWdpbikge1xuICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICB9XG5cbiAgIHN0YXRpYyBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTxEZWZhdWx0U2V0dGluZ3M+IHtcbiAgICAgIGNvbnN0IHNhdmVkRGF0YSA9IGF3YWl0IHRoaXMucGx1Z2luLmxvYWREYXRhKCk7XG4gICAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgc2F2ZWREYXRhIHx8IHt9KTtcbiAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzO1xuICAgfVxuXG4gICBzdGF0aWMgYXN5bmMgc2F2ZVNldHRpbmdzKHNldHRpbmdzOiBQYXJ0aWFsPERlZmF1bHRTZXR0aW5ncz4pIHtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHRoaXMuc2V0dGluZ3MgfHwgREVGQVVMVF9TRVRUSU5HUywgc2V0dGluZ3MpO1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICB9XG5cbiAgIHN0YXRpYyBhc3luYyBmZXRjaERvbWFpbnMoYXBpS2V5OiBzdHJpbmcsIHdvcmtzcGFjZUlkPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgIGNvbnNvbGUubG9nKCdGZXRjaGluZyBkb21haW5zIHdpdGggQVBJIGtleTonLCBhcGlLZXkuc3Vic3RyaW5nKDAsIDQpICsgJy4uLicpO1xuICAgICAgICAgaWYgKHdvcmtzcGFjZUlkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnVXNpbmcgd29ya3NwYWNlIElEOicsIHdvcmtzcGFjZUlkKTtcbiAgICAgICAgIH1cblxuICAgICAgICAgY29uc3QgdXJsID0gd29ya3NwYWNlSWQgXG4gICAgICAgICAgICA/IGBodHRwczovL2FwaS5kdWIuY28vZG9tYWlucz9wcm9qZWN0SWQ9JHt3b3Jrc3BhY2VJZH1gXG4gICAgICAgICAgICA6ICdodHRwczovL2FwaS5kdWIuY28vZG9tYWlucyc7XG5cbiAgICAgICAgIGNvbnNvbGUubG9nKCdSZXF1ZXN0aW5nIFVSTDonLCB1cmwpO1xuXG4gICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgICAgICAgdXJsLFxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke2FwaUtleX1gLFxuICAgICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG5cbiAgICAgICAgIGNvbnNvbGUubG9nKCdSZXNwb25zZSBzdGF0dXM6JywgcmVzcG9uc2Uuc3RhdHVzKTtcblxuICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAvLyBMYSByXHUwMEU5cG9uc2UgZXN0IHVuIHRhYmxlYXUgZGUgZG9tYWluZXNcbiAgICAgICAgICAgIGNvbnN0IGRvbWFpbnMgPSBBcnJheS5pc0FycmF5KHJlc3BvbnNlLmpzb24pID8gcmVzcG9uc2UuanNvbiA6IFtdO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1BhcnNlZCBkb21haW5zOicsIGRvbWFpbnMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBFeHRyYWlyZSBsZXMgc2x1Z3MgZGVzIGRvbWFpbmVzXG4gICAgICAgICAgICByZXR1cm4gZG9tYWlucy5tYXAoKGRvbWFpbjogYW55KSA9PiBkb21haW4uc2x1Zyk7XG4gICAgICAgICB9XG5cbiAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHJlc3BvbnNlOicsIHJlc3BvbnNlLmpzb24pO1xuICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3BvbnNlLmpzb24/LmVycm9yIHx8IGBGYWlsZWQgdG8gZmV0Y2ggZG9tYWlucyAoc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c30pYCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgZG9tYWluczonLCBlcnJvcik7XG4gICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZGV0YWlsczonLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN0YWNrOicsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgIH1cbiAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2V0dGluZ3NUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgIHNldHRpbmdzOiBEZWZhdWx0U2V0dGluZ3M7XG4gICBwcml2YXRlIGRvbWFpbnM6IHN0cmluZ1tdID0gWydkdWIuY28nXTtcblxuICAgY29uc3RydWN0b3IoXG4gICAgICBhcHA6IEFwcCwgXG4gICAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luLCBcbiAgICAgIHNldHRpbmdzOiBEZWZhdWx0U2V0dGluZ3MsXG4gICAgICBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zXG4gICApIHtcbiAgICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgIH1cblxuICAgYXN5bmMgbG9hZERvbWFpbnMoKSB7XG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5kdWJBcGlLZXkpIHtcbiAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmRvbWFpbnMgPSBbJ2R1Yi5jbycsIC4uLmF3YWl0IFNldHRpbmdzLmZldGNoRG9tYWlucyhcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5LFxuICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZFxuICAgICAgICAgICAgKV07XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCBlcnJvci5tZXNzYWdlKSk7XG4gICAgICAgICB9XG4gICAgICB9XG4gICB9XG5cbiAgIGRpc3BsYXkoKSB7XG4gICAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgICAgLy8gU2VjdGlvbiBkdWIuY29cbiAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogJ2R1Yi5jbycgfSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZHViQXBpS2V5JykpXG4gICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kdWJBcGlLZXlEZXNjJykpXG4gICAgICAgICAuYWRkVGV4dCh0ZXh0ID0+IHRleHRcbiAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcignRW50cmV6IHZvdHJlIGNsXHUwMEU5IEFQSScpXG4gICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5zZXR0aW5ncy5kdWJBcGlLZXkpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmR1YkFwaUtleSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZHViQXBpS2V5OiB2YWx1ZSB9KTtcbiAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zYXZlZCcpKTtcbiAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkRG9tYWlucygpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgIC5zZXROYW1lKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkJykpXG4gICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZERlc2MnKSlcbiAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdFbnRyZXogdm90cmUgSUQgZGUgd29ya3NwYWNlJylcbiAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmR1YldvcmtzcGFjZUlkKVxuICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZHViV29ya3NwYWNlSWQ6IHZhbHVlIH0pO1xuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5KSB7XG4gICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWREb21haW5zKCk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgIC8vIFNlY3Rpb24gTWFwcGFnZXMgRG9tYWluZS1Eb3NzaWVyXG4gICAgICBjb250YWluZXJFbC5jcmVhdGVFbCgnaDInLCB7IHRleHQ6IHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzJykgfSk7XG4gICAgICBcbiAgICAgIC8vIExpZ25lIGRlIGRlc2NyaXB0aW9uIGF2ZWMgbGUgYm91dG9uIGQnYWpvdXRcbiAgICAgIGNvbnN0IGRlc2NyaXB0aW9uTGluZSA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3NEZXNjJykpXG4gICAgICAgICAuYWRkQnV0dG9uKGJ1dHRvbiA9PiBidXR0b25cbiAgICAgICAgICAgIC5zZXRJY29uKCdwbHVzJylcbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmFkZE1hcHBpbmcnKSlcbiAgICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIGRvbWFpbjogdGhpcy5kb21haW5zWzBdLFxuICAgICAgICAgICAgICAgICAgZm9sZGVyOiAnJ1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkb21haW5Gb2xkZXJNYXBwaW5nczogdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncyB9KTtcbiAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zYXZlZCcpKTtcbiAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgXG4gICAgICBkZXNjcmlwdGlvbkxpbmUuc2V0dGluZ0VsLmFkZENsYXNzKCdkZXNjcmlwdGlvbi13aXRoLWJ1dHRvbicpO1xuXG4gICAgICAvLyBDb250ZW5ldXIgcG91ciBsZXMgbWFwcGFnZXMgZXhpc3RhbnRzXG4gICAgICBjb25zdCBtYXBwaW5nc0NvbnRhaW5lciA9IGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdkaXYnKTtcbiAgICAgIFxuICAgICAgLy8gRm9uY3Rpb24gcG91ciBjclx1MDBFOWVyIHVuIG5vdXZlYXUgbWFwcGluZ1xuICAgICAgY29uc3QgY3JlYXRlTWFwcGluZ0VsZW1lbnQgPSAobWFwcGluZzogRG9tYWluRm9sZGVyTWFwcGluZywgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgY29uc3QgbWFwcGluZ0RpdiA9IG1hcHBpbmdzQ29udGFpbmVyLmNyZWF0ZUVsKCdkaXYnLCB7IGNsczogJ21hcHBpbmctY29udGFpbmVyJyB9KTtcbiAgICAgICAgIFxuICAgICAgICAgLy8gQ29udGVuZXVyIHBvdXIgbGEgbGlnbmUgZGUgbWFwcGluZ1xuICAgICAgICAgY29uc3QgbWFwcGluZ0xpbmUgPSBuZXcgU2V0dGluZyhtYXBwaW5nRGl2KVxuICAgICAgICAgICAgLnNldENsYXNzKCdjb21wYWN0LXNldHRpbmcnKVxuICAgICAgICAgICAgLy8gTGFiZWwgXCJEb21haW5lXCJcbiAgICAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4ge1xuICAgICAgICAgICAgICAgdGV4dC5pbnB1dEVsLmFkZENsYXNzKCdsYWJlbC10ZXh0Jyk7XG4gICAgICAgICAgICAgICB0ZXh0LnNldFZhbHVlKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmRvbWFpbicpKTtcbiAgICAgICAgICAgICAgIHRleHQuc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgICAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAvLyBEcm9wZG93biBkZXMgZG9tYWluZXNcbiAgICAgICAgICAgIC5hZGREcm9wZG93bihkcm9wZG93biA9PiB7XG4gICAgICAgICAgICAgICB0aGlzLmRvbWFpbnMuZm9yRWFjaChkb21haW4gPT4ge1xuICAgICAgICAgICAgICAgICAgZHJvcGRvd24uYWRkT3B0aW9uKGRvbWFpbiwgZG9tYWluKTtcbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgZHJvcGRvd24uc2V0VmFsdWUobWFwcGluZy5kb21haW4pO1xuICAgICAgICAgICAgICAgZHJvcGRvd24ub25DaGFuZ2UodmFsdWUgPT4ge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5nc1tpbmRleF0uZG9tYWluID0gdmFsdWU7XG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgIGRyb3Bkb3duLnNlbGVjdEVsLmFkZENsYXNzKCdkb21haW4tZHJvcGRvd24nKTtcbiAgICAgICAgICAgICAgIHJldHVybiBkcm9wZG93bjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAvLyBDaGFtcCBkZSBzYWlzaWUgZHUgZG9zc2llciBhdmVjIHNvbiBsYWJlbFxuICAgICAgICAgICAgLmFkZEJ1dHRvbihidXR0b24gPT4gYnV0dG9uXG4gICAgICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChtYXBwaW5nLmZvbGRlciB8fCB0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5mb2xkZXInKSlcbiAgICAgICAgICAgICAgIC5vbkNsaWNrKChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAvLyBDclx1MDBFOWVyIGxlIG1lbnUgZGUgc1x1MDBFOWxlY3Rpb24gcHJpbmNpcGFsXG4gICAgICAgICAgICAgICAgICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgLy8gQ29uc3RydWlyZSBsYSBoaVx1MDBFOXJhcmNoaWUgZGVzIGRvc3NpZXJzIFx1MDBFMCBwYXJ0aXIgZGUgbGEgcmFjaW5lXG4gICAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkRm9sZGVyTWVudShtZW51LCB0aGlzLmFwcC52YXVsdC5nZXRSb290KCksIGluZGV4KTtcblxuICAgICAgICAgICAgICAgICAgLy8gQWZmaWNoZXIgbGUgbWVudSBcdTAwRTAgbGEgcG9zaXRpb24gZHUgY2xpY1xuICAgICAgICAgICAgICAgICAgbWVudS5zaG93QXRNb3VzZUV2ZW50KGUpO1xuICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAvLyBCb3V0b25zIGQnYWN0aW9uXG4gICAgICAgICAgICAuYWRkQnV0dG9uKGJ1dHRvbiA9PiBidXR0b25cbiAgICAgICAgICAgICAgIC5zZXRJY29uKCdjaGVja21hcmsnKVxuICAgICAgICAgICAgICAgLnNldFRvb2x0aXAodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3Muc2F2ZScpKVxuICAgICAgICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkb21haW5Gb2xkZXJNYXBwaW5nczogdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncyB9KTtcbiAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zYXZlZCcpKTtcbiAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgLmFkZEJ1dHRvbihidXR0b24gPT4gYnV0dG9uXG4gICAgICAgICAgICAgICAuc2V0SWNvbigndHJhc2gnKVxuICAgICAgICAgICAgICAgLnNldFRvb2x0aXAodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MucmVtb3ZlJykpXG4gICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkb21haW5Gb2xkZXJNYXBwaW5nczogdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncyB9KTtcbiAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zYXZlZCcpKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAvLyBBam91dGVyIGRlcyBzdHlsZXMgcG91ciBhbGlnbmVyIGxlcyBcdTAwRTlsXHUwMEU5bWVudHNcbiAgICAgICAgIG1hcHBpbmdMaW5lLnNldHRpbmdFbC5hZGRDbGFzcygnbWFwcGluZy1saW5lJyk7XG4gICAgICB9O1xuXG4gICAgICAvLyBBZmZpY2hlciBsZXMgbWFwcGFnZXMgZXhpc3RhbnRzXG4gICAgICB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzLmZvckVhY2goKG1hcHBpbmcsIGluZGV4KSA9PiB7XG4gICAgICAgICBjcmVhdGVNYXBwaW5nRWxlbWVudChtYXBwaW5nLCBpbmRleCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU2VjdGlvbiBNb2RlIGQnYWZmaWNoYWdlXG4gICAgICBjb250YWluZXJFbC5jcmVhdGVFbCgnaDInLCB7IHRleHQ6IHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLnZpZXdNb2RlJykgfSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlJykpXG4gICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGVEZXNjJykpXG4gICAgICAgICAuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4gZHJvcGRvd25cbiAgICAgICAgICAgIC5hZGRPcHRpb24oJ3RhYicsIHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLnRhYicpKVxuICAgICAgICAgICAgLmFkZE9wdGlvbignc2lkZWJhcicsIHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLnNpZGViYXInKSlcbiAgICAgICAgICAgIC5hZGRPcHRpb24oJ292ZXJsYXknLCB0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5vdmVybGF5JykpXG4gICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5zZXR0aW5ncy52aWV3TW9kZSlcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWU6ICd0YWInIHwgJ3NpZGViYXInIHwgJ292ZXJsYXknKSA9PiB7XG4gICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLnZpZXdNb2RlID0gdmFsdWU7XG4gICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyB2aWV3TW9kZTogdmFsdWUgfSk7XG4gICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgIC8vIENoYXJnZXIgbGVzIGRvbWFpbmVzIGF1IGRcdTAwRTltYXJyYWdlIHNpIHVuZSBjbFx1MDBFOSBBUEkgZXN0IHByXHUwMEU5c2VudGVcbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLmR1YkFwaUtleSAmJiB0aGlzLmRvbWFpbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICB0aGlzLmxvYWREb21haW5zKCk7XG4gICAgICB9XG4gICB9XG5cbiAgIC8vIENvbnN0cnVpcmUgbGUgbWVudSBoaVx1MDBFOXJhcmNoaXF1ZSBkZXMgZG9zc2llcnNcbiAgIHByaXZhdGUgYnVpbGRGb2xkZXJNZW51KG1lbnU6IE1lbnUsIGZvbGRlcjogVEZvbGRlciwgbWFwcGluZ0luZGV4OiBudW1iZXIsIGxldmVsOiBudW1iZXIgPSAwKSB7XG4gICAgICBjb25zdCBzdWJGb2xkZXJzID0gZm9sZGVyLmNoaWxkcmVuLmZpbHRlcigoY2hpbGQpOiBjaGlsZCBpcyBURm9sZGVyID0+IGNoaWxkIGluc3RhbmNlb2YgVEZvbGRlcik7XG4gICAgICBcbiAgICAgIHN1YkZvbGRlcnMuZm9yRWFjaChzdWJGb2xkZXIgPT4ge1xuICAgICAgICAgY29uc3QgaGFzQ2hpbGRyZW4gPSBzdWJGb2xkZXIuY2hpbGRyZW4uc29tZShjaGlsZCA9PiBjaGlsZCBpbnN0YW5jZW9mIFRGb2xkZXIpO1xuICAgICAgICAgXG4gICAgICAgICBpZiAoaGFzQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgIC8vIFBvdXIgbGVzIGRvc3NpZXJzIGF2ZWMgZGVzIGVuZmFudHMsIGNyXHUwMEU5ZXIgdW4gc291cy1tZW51XG4gICAgICAgICAgICBtZW51LmFkZEl0ZW0oaXRlbSA9PiB7XG4gICAgICAgICAgICAgICBjb25zdCB0aXRsZUVsID0gY3JlYXRlU3Bhbih7IGNsczogJ21lbnUtaXRlbS10aXRsZScgfSk7XG4gICAgICAgICAgICAgICB0aXRsZUVsLmFwcGVuZFRleHQoc3ViRm9sZGVyLm5hbWUpO1xuICAgICAgICAgICAgICAgdGl0bGVFbC5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKHsgY2xzOiAnbWVudS1pdGVtLWFycm93JywgdGV4dDogJyBcdTIxOTInIH0pKTtcblxuICAgICAgICAgICAgICAgaXRlbS5kb20ucXVlcnlTZWxlY3RvcignLm1lbnUtaXRlbS10aXRsZScpPy5yZXBsYWNlV2l0aCh0aXRsZUVsKTtcbiAgICAgICAgICAgICAgIGl0ZW0uc2V0SWNvbignZm9sZGVyJyk7XG5cbiAgICAgICAgICAgICAgIC8vIENyXHUwMEU5ZXIgbGUgc291cy1tZW51XG4gICAgICAgICAgICAgICBjb25zdCBzdWJNZW51ID0gbmV3IE1lbnUoKTtcbiAgICAgICAgICAgICAgIHRoaXMuYnVpbGRGb2xkZXJNZW51KHN1Yk1lbnUsIHN1YkZvbGRlciwgbWFwcGluZ0luZGV4LCBsZXZlbCArIDEpO1xuXG4gICAgICAgICAgICAgICAvLyBDb25maWd1cmVyIGwnXHUwMEU5dlx1MDBFOW5lbWVudCBkZSBzdXJ2b2xcbiAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1Eb20gPSAoaXRlbSBhcyBhbnkpLmRvbSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgICAgIGlmIChpdGVtRG9tKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgaXNPdmVySXRlbSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgbGV0IGlzT3Zlck1lbnUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGxldCBoaWRlVGltZW91dDogTm9kZUpTLlRpbWVvdXQ7XG5cbiAgICAgICAgICAgICAgICAgIGNvbnN0IHNob3dTdWJNZW51ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVjdCA9IGl0ZW1Eb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICBzdWJNZW51LnNob3dBdFBvc2l0aW9uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHJlY3QucmlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiByZWN0LnRvcFxuICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICBjb25zdCBoaWRlU3ViTWVudSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgIGhpZGVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzT3Zlckl0ZW0gJiYgIWlzT3Zlck1lbnUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Yk1lbnUuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgIGl0ZW1Eb20uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgIGlzT3Zlckl0ZW0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgaWYgKGhpZGVUaW1lb3V0KSBjbGVhclRpbWVvdXQoaGlkZVRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgICAgc2hvd1N1Yk1lbnUoKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICBpdGVtRG9tLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICBpc092ZXJJdGVtID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICBoaWRlU3ViTWVudSgpO1xuICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgIC8vIEdcdTAwRTlyZXIgbGUgc3Vydm9sIGR1IHNvdXMtbWVudSBsdWktbVx1MDBFQW1lXG4gICAgICAgICAgICAgICAgICBjb25zdCBzdWJNZW51RWwgPSAoc3ViTWVudSBhcyBhbnkpLmRvbTtcbiAgICAgICAgICAgICAgICAgIGlmIChzdWJNZW51RWwpIHtcbiAgICAgICAgICAgICAgICAgICAgIHN1Yk1lbnVFbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNPdmVyTWVudSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGlkZVRpbWVvdXQpIGNsZWFyVGltZW91dChoaWRlVGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgc3ViTWVudUVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc092ZXJNZW51ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBoaWRlU3ViTWVudSgpO1xuICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIEFqb3V0ZXIgXHUwMEU5Z2FsZW1lbnQgdW4gZ2VzdGlvbm5haXJlIGRlIGNsaWMgcG91ciBsZSBkb3NzaWVyIHBhcmVudFxuICAgICAgICAgICAgICAgaXRlbS5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3NbbWFwcGluZ0luZGV4XS5mb2xkZXIgPSBzdWJGb2xkZXIucGF0aDtcbiAgICAgICAgICAgICAgICAgIGF3YWl0IFNldHRpbmdzLnNhdmVTZXR0aW5ncyh7IGRvbWFpbkZvbGRlck1hcHBpbmdzOiB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzIH0pO1xuICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFBvdXIgbGVzIGRvc3NpZXJzIHNhbnMgZW5mYW50cywgYWpvdXRlciBzaW1wbGVtZW50IHVuIFx1MDBFOWxcdTAwRTltZW50IGRlIG1lbnVcbiAgICAgICAgICAgIG1lbnUuYWRkSXRlbShpdGVtID0+IHtcbiAgICAgICAgICAgICAgIGl0ZW0uc2V0VGl0bGUoc3ViRm9sZGVyLm5hbWUpXG4gICAgICAgICAgICAgICAgICAuc2V0SWNvbignZm9sZGVyJylcbiAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3NbbWFwcGluZ0luZGV4XS5mb2xkZXIgPSBzdWJGb2xkZXIucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgIGF3YWl0IFNldHRpbmdzLnNhdmVTZXR0aW5ncyh7IGRvbWFpbkZvbGRlck1hcHBpbmdzOiB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzIH0pO1xuICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgfVxuICAgICAgfSk7XG4gICB9XG59IiwgImV4cG9ydCB0eXBlIFRyYW5zbGF0aW9uS2V5ID0gXHJcbiAgIC8vIE5vdGljZXNcclxuICAgfCAnbm90aWNlcy5zYXZlZCdcclxuICAgfCAnbm90aWNlcy5lcnJvcidcclxuICAgfCAnbm90aWNlcy5zdWNjZXNzJ1xyXG4gICB8ICdub3RpY2VzLmxpbmtDcmVhdGVkJ1xyXG4gICB8ICdub3RpY2VzLnVybFJlcXVpcmVkJ1xyXG4gICAvLyBNb2RhbFxyXG4gICB8ICdtb2RhbC5jcmVhdGVTaG9ydExpbmsnXHJcbiAgIHwgJ21vZGFsLmRlc3RpbmF0aW9uVXJsJ1xyXG4gICB8ICdtb2RhbC5kZXN0aW5hdGlvblVybERlc2MnXHJcbiAgIHwgJ21vZGFsLmN1c3RvbVNsdWcnXHJcbiAgIHwgJ21vZGFsLmN1c3RvbVNsdWdEZXNjJ1xyXG4gICB8ICdtb2RhbC5kb21haW4nXHJcbiAgIHwgJ21vZGFsLmRvbWFpbkRlc2MnXHJcbiAgIHwgJ21vZGFsLmNyZWF0ZSdcclxuICAgLy8gU2V0dGluZ3MgZHViLmNvXHJcbiAgIHwgJ3NldHRpbmdzLmR1YkFwaUtleSdcclxuICAgfCAnc2V0dGluZ3MuZHViQXBpS2V5RGVzYydcclxuICAgfCAnc2V0dGluZ3MuZHViV29ya3NwYWNlSWQnXHJcbiAgIHwgJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkRGVzYydcclxuICAgfCAnc2V0dGluZ3MuZHViQ3VzdG9tRG9tYWlucydcclxuICAgfCAnc2V0dGluZ3MuZHViQ3VzdG9tRG9tYWluc0Rlc2MnXHJcbiAgIHwgJ3NldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzJ1xyXG4gICB8ICdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5nc0Rlc2MnXHJcbiAgIHwgJ3NldHRpbmdzLmFkZE1hcHBpbmcnXHJcbiAgIHwgJ3NldHRpbmdzLmRvbWFpbidcclxuICAgfCAnc2V0dGluZ3MuZm9sZGVyJ1xyXG4gICB8ICdzZXR0aW5ncy5yZW1vdmUnXHJcbiAgIC8vIFNldHRpbmdzIFZpZXdNb2RlXHJcbiAgIHwgJ3NldHRpbmdzLnZpZXdNb2RlJ1xyXG4gICB8ICdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGUnXHJcbiAgIHwgJ3NldHRpbmdzLmRlZmF1bHRWaWV3TW9kZURlc2MnXHJcbiAgIHwgJ3NldHRpbmdzLnRhYidcclxuICAgfCAnc2V0dGluZ3Muc2lkZWJhcidcclxuICAgfCAnc2V0dGluZ3Mub3ZlcmxheSdcclxuICAgLy8gRGFzaGJvYXJkXHJcbiAgIHwgJ2Rhc2hib2FyZC50aXRsZSdcclxuICAgfCAnZGFzaGJvYXJkLm5vTGlua3MnXHJcbiAgIHwgJ2Rhc2hib2FyZC5sb2FkaW5nJ1xyXG4gICB8ICdkYXNoYm9hcmQuZXJyb3InXHJcbiAgIHwgJ3NldHRpbmdzLmRvbWFpbkFuZEZvbGRlcidcclxuICAgfCAnc2V0dGluZ3MuZm9sZGVyUGxhY2Vob2xkZXInXHJcbiAgIHwgJ3NldHRpbmdzLnNhdmUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHRyYW5zbGF0aW9uczogeyBbbGFuZzogc3RyaW5nXTogUmVjb3JkPFRyYW5zbGF0aW9uS2V5LCBzdHJpbmc+IH0gPSB7XHJcbiAgIGVuOiB7XHJcbiAgICAgIC8vIE5vdGljZXNcclxuICAgICAgJ25vdGljZXMuc2F2ZWQnOiAnXHUyNzA1IFNldHRpbmdzIHNhdmVkJyxcclxuICAgICAgJ25vdGljZXMuZXJyb3InOiAnXHUyNzRDIEVycm9yOiB7bWVzc2FnZX0nLFxyXG4gICAgICAnbm90aWNlcy5zdWNjZXNzJzogJ1x1MjcwNSBPcGVyYXRpb24gc3VjY2Vzc2Z1bCcsXHJcbiAgICAgICdub3RpY2VzLmxpbmtDcmVhdGVkJzogJ1x1MjcwNSBTaG9ydCBsaW5rIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgJ25vdGljZXMudXJsUmVxdWlyZWQnOiAnXHUyNzRDIERlc3RpbmF0aW9uIFVSTCBpcyByZXF1aXJlZCcsXHJcbiAgICAgIC8vIE1vZGFsXHJcbiAgICAgICdtb2RhbC5jcmVhdGVTaG9ydExpbmsnOiAnQ3JlYXRlIFNob3J0IExpbmsnLFxyXG4gICAgICAnbW9kYWwuZGVzdGluYXRpb25VcmwnOiAnRGVzdGluYXRpb24gVVJMJyxcclxuICAgICAgJ21vZGFsLmRlc3RpbmF0aW9uVXJsRGVzYyc6ICdUaGUgVVJMIHlvdSB3YW50IHRvIHNob3J0ZW4nLFxyXG4gICAgICAnbW9kYWwuY3VzdG9tU2x1Zyc6ICdDdXN0b20gU2x1ZycsXHJcbiAgICAgICdtb2RhbC5jdXN0b21TbHVnRGVzYyc6ICdDdXN0b20gcGFydCBvZiB0aGUgc2hvcnQgVVJMIChvcHRpb25hbCknLFxyXG4gICAgICAnbW9kYWwuZG9tYWluJzogJ0RvbWFpbicsXHJcbiAgICAgICdtb2RhbC5kb21haW5EZXNjJzogJ0Nob29zZSB0aGUgZG9tYWluIGZvciB5b3VyIHNob3J0IGxpbmsnLFxyXG4gICAgICAnbW9kYWwuY3JlYXRlJzogJ0NyZWF0ZScsXHJcbiAgICAgIC8vIFNldHRpbmdzIGR1Yi5jb1xyXG4gICAgICAnc2V0dGluZ3MuZHViQXBpS2V5JzogJ2R1Yi5jbyBBUEkgS2V5JyxcclxuICAgICAgJ3NldHRpbmdzLmR1YkFwaUtleURlc2MnOiAnWW91ciBkdWIuY28gQVBJIGtleSBmb3IgYXV0aGVudGljYXRpb24nLFxyXG4gICAgICAnc2V0dGluZ3MuZHViV29ya3NwYWNlSWQnOiAnZHViLmNvIFdvcmtzcGFjZSBJRCcsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZERlc2MnOiAnT3B0aW9uYWw6IFRoZSBJRCBvZiB0aGUgd29ya3NwYWNlIHdoZXJlIHlvdSB3YW50IHRvIGNyZWF0ZSBsaW5rcyAoZm91bmQgaW4gdGhlIFVSTDogYXBwLmR1Yi5jby9bd29ya3NwYWNlLWlkXSkuIElmIG5vdCBzZXQsIGxpbmtzIHdpbGwgYmUgY3JlYXRlZCBpbiB5b3VyIGRlZmF1bHQgd29ya3NwYWNlLicsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJDdXN0b21Eb21haW5zJzogJ0N1c3RvbSBEb21haW5zJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YkN1c3RvbURvbWFpbnNEZXNjJzogJ0xpc3Qgb2YgeW91ciBjdXN0b20gZG9tYWlucyAob25lIHBlciBsaW5lKScsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncyc6ICdEb21haW4tRm9sZGVyIE1hcHBpbmdzJyxcclxuICAgICAgJ3NldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzRGVzYyc6ICdDb25maWd1cmUgd2hpY2ggZG9tYWluIHRvIHVzZSBmb3IgZWFjaCBmb2xkZXInLFxyXG4gICAgICAnc2V0dGluZ3MuYWRkTWFwcGluZyc6ICdBZGQgTmV3IE1hcHBpbmcnLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluJzogJ0RvbWFpbicsXHJcbiAgICAgICdzZXR0aW5ncy5mb2xkZXInOiAnRm9sZGVyJyxcclxuICAgICAgJ3NldHRpbmdzLnJlbW92ZSc6ICdSZW1vdmUnLFxyXG4gICAgICAvLyBTZXR0aW5ncyBWaWV3TW9kZVxyXG4gICAgICAnc2V0dGluZ3Mudmlld01vZGUnOiAnVmlldyBNb2RlJyxcclxuICAgICAgJ3NldHRpbmdzLmRlZmF1bHRWaWV3TW9kZSc6ICdEZWZhdWx0IFZpZXcgTW9kZScsXHJcbiAgICAgICdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGVEZXNjJzogJ0Nob29zZSBob3cgdGhlIGxpbmsgZGV0YWlscyB3aWxsIGJlIGRpc3BsYXllZCcsXHJcbiAgICAgICdzZXR0aW5ncy50YWInOiAnTmV3IFRhYicsXHJcbiAgICAgICdzZXR0aW5ncy5zaWRlYmFyJzogJ1JpZ2h0IFNpZGViYXInLFxyXG4gICAgICAnc2V0dGluZ3Mub3ZlcmxheSc6ICdPdmVybGF5JyxcclxuICAgICAgLy8gRGFzaGJvYXJkXHJcbiAgICAgICdkYXNoYm9hcmQudGl0bGUnOiAnTGlua0Zsb3d6IERhc2hib2FyZCcsXHJcbiAgICAgICdkYXNoYm9hcmQubm9MaW5rcyc6ICdObyBzaG9ydCBsaW5rcyBjcmVhdGVkIHlldCcsXHJcbiAgICAgICdkYXNoYm9hcmQubG9hZGluZyc6ICdMb2FkaW5nIHlvdXIgbGlua3MuLi4nLFxyXG4gICAgICAnZGFzaGJvYXJkLmVycm9yJzogJ0Vycm9yIGxvYWRpbmcgbGlua3M6IHttZXNzYWdlfScsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5BbmRGb2xkZXInOiAnRG9tYWluIGFuZCBGb2xkZXIgTWFwcGluZycsXHJcbiAgICAgICdzZXR0aW5ncy5mb2xkZXJQbGFjZWhvbGRlcic6ICdGb2xkZXInLFxyXG4gICAgICAnc2V0dGluZ3Muc2F2ZSc6ICdTYXZlJ1xyXG4gICB9LFxyXG4gICBmcjoge1xyXG4gICAgICAvLyBOb3RpY2VzXHJcbiAgICAgICdub3RpY2VzLnNhdmVkJzogJ1x1MjcwNSBQYXJhbVx1MDBFOHRyZXMgc2F1dmVnYXJkXHUwMEU5cycsXHJcbiAgICAgICdub3RpY2VzLmVycm9yJzogJ1x1Mjc0QyBFcnJldXI6IHttZXNzYWdlfScsXHJcbiAgICAgICdub3RpY2VzLnN1Y2Nlc3MnOiAnXHUyNzA1IE9wXHUwMEU5cmF0aW9uIHJcdTAwRTl1c3NpZScsXHJcbiAgICAgICdub3RpY2VzLmxpbmtDcmVhdGVkJzogJ1x1MjcwNSBMaWVuIGNvdXJ0IGNyXHUwMEU5XHUwMEU5IGF2ZWMgc3VjY1x1MDBFOHMnLFxyXG4gICAgICAnbm90aWNlcy51cmxSZXF1aXJlZCc6ICdcdTI3NEMgTFxcJ1VSTCBkZSBkZXN0aW5hdGlvbiBlc3QgcmVxdWlzZScsXHJcbiAgICAgIC8vIE1vZGFsXHJcbiAgICAgICdtb2RhbC5jcmVhdGVTaG9ydExpbmsnOiAnQ3JcdTAwRTllciB1biBsaWVuIGNvdXJ0JyxcclxuICAgICAgJ21vZGFsLmRlc3RpbmF0aW9uVXJsJzogJ1VSTCBkZSBkZXN0aW5hdGlvbicsXHJcbiAgICAgICdtb2RhbC5kZXN0aW5hdGlvblVybERlc2MnOiAnTFxcJ1VSTCBxdWUgdm91cyBzb3VoYWl0ZXogcmFjY291cmNpcicsXHJcbiAgICAgICdtb2RhbC5jdXN0b21TbHVnJzogJ1NsdWcgcGVyc29ubmFsaXNcdTAwRTknLFxyXG4gICAgICAnbW9kYWwuY3VzdG9tU2x1Z0Rlc2MnOiAnUGFydGllIHBlcnNvbm5hbGlzXHUwMEU5ZSBkZSBsXFwnVVJMIGNvdXJ0ZSAob3B0aW9ubmVsKScsXHJcbiAgICAgICdtb2RhbC5kb21haW4nOiAnRG9tYWluZScsXHJcbiAgICAgICdtb2RhbC5kb21haW5EZXNjJzogJ0Nob2lzaXNzZXogbGUgZG9tYWluZSBwb3VyIHZvdHJlIGxpZW4gY291cnQnLFxyXG4gICAgICAnbW9kYWwuY3JlYXRlJzogJ0NyXHUwMEU5ZXInLFxyXG4gICAgICAvLyBTZXR0aW5ncyBkdWIuY29cclxuICAgICAgJ3NldHRpbmdzLmR1YkFwaUtleSc6ICdDbFx1MDBFOSBBUEkgZHViLmNvJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YkFwaUtleURlc2MnOiAnVm90cmUgY2xcdTAwRTkgQVBJIGR1Yi5jbyBwb3VyIGxcXCdhdXRoZW50aWZpY2F0aW9uJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkJzogJ0lEIFdvcmtzcGFjZSBkdWIuY28nLFxyXG4gICAgICAnc2V0dGluZ3MuZHViV29ya3NwYWNlSWREZXNjJzogJ09wdGlvbm5lbCA6IExcXCdJRCBkdSB3b3Jrc3BhY2Ugb1x1MDBGOSB2b3VzIHNvdWhhaXRleiBjclx1MDBFOWVyIHZvcyBsaWVucyAodmlzaWJsZSBkYW5zIGxcXCdVUkwgOiBhcHAuZHViLmNvL1t3b3Jrc3BhY2UtaWRdKS4gU2kgbm9uIHJlbnNlaWduXHUwMEU5LCBsZXMgbGllbnMgc2Vyb250IGNyXHUwMEU5XHUwMEU5cyBkYW5zIHZvdHJlIHdvcmtzcGFjZSBwYXIgZFx1MDBFOWZhdXQuJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YkN1c3RvbURvbWFpbnMnOiAnRG9tYWluZXMgcGVyc29ubmFsaXNcdTAwRTlzJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YkN1c3RvbURvbWFpbnNEZXNjJzogJ0xpc3RlIGRlIHZvcyBkb21haW5lcyBwZXJzb25uYWxpc1x1MDBFOXMgKHVuIHBhciBsaWduZSknLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MnOiAnQXNzb2NpYXRpb25zIERvbWFpbmVzLURvc3NpZXJzJyxcclxuICAgICAgJ3NldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzRGVzYyc6ICdDb25maWd1cmV6IHF1ZWwgZG9tYWluZSB1dGlsaXNlciBwb3VyIGNoYXF1ZSBkb3NzaWVyJyxcclxuICAgICAgJ3NldHRpbmdzLmFkZE1hcHBpbmcnOiAnQWpvdXRlciB1bmUgbm91dmVsbGUgYXNzb2NpYXRpb24nLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluJzogJ0RvbWFpbmUnLFxyXG4gICAgICAnc2V0dGluZ3MuZm9sZGVyJzogJ0Rvc3NpZXInLFxyXG4gICAgICAnc2V0dGluZ3MucmVtb3ZlJzogJ1N1cHByaW1lcicsXHJcbiAgICAgIC8vIFNldHRpbmdzIFZpZXdNb2RlXHJcbiAgICAgICdzZXR0aW5ncy52aWV3TW9kZSc6ICdNb2RlIGRcXCdhZmZpY2hhZ2UnLFxyXG4gICAgICAnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlJzogJ01vZGUgZFxcJ2FmZmljaGFnZSBwYXIgZFx1MDBFOWZhdXQnLFxyXG4gICAgICAnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlRGVzYyc6ICdDaG9pc2lzc2V6IGNvbW1lbnQgbGVzIGRcdTAwRTl0YWlscyBkZXMgbGllbnMgc2Vyb250IGFmZmljaFx1MDBFOXMnLFxyXG4gICAgICAnc2V0dGluZ3MudGFiJzogJ05vdXZlbCBvbmdsZXQnLFxyXG4gICAgICAnc2V0dGluZ3Muc2lkZWJhcic6ICdCYXJyZSBsYXRcdTAwRTlyYWxlJyxcclxuICAgICAgJ3NldHRpbmdzLm92ZXJsYXknOiAnU3VwZXJwb3NpdGlvbicsXHJcbiAgICAgIC8vIERhc2hib2FyZFxyXG4gICAgICAnZGFzaGJvYXJkLnRpdGxlJzogJ1RhYmxlYXUgZGUgYm9yZCBMaW5rRmxvd3onLFxyXG4gICAgICAnZGFzaGJvYXJkLm5vTGlua3MnOiAnQXVjdW4gbGllbiBjb3VydCBjclx1MDBFOVx1MDBFOSBwb3VyIGxlIG1vbWVudCcsXHJcbiAgICAgICdkYXNoYm9hcmQubG9hZGluZyc6ICdDaGFyZ2VtZW50IGRlIHZvcyBsaWVucy4uLicsXHJcbiAgICAgICdkYXNoYm9hcmQuZXJyb3InOiAnRXJyZXVyIGxvcnMgZHUgY2hhcmdlbWVudCBkZXMgbGllbnMgOiB7bWVzc2FnZX0nLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluQW5kRm9sZGVyJzogJ0Fzc29jaWF0aW9uIERvbWFpbmUgZXQgRG9zc2llcicsXHJcbiAgICAgICdzZXR0aW5ncy5mb2xkZXJQbGFjZWhvbGRlcic6ICdEb3NzaWVyJyxcclxuICAgICAgJ3NldHRpbmdzLnNhdmUnOiAnU2F1dmVnYXJkZXInXHJcbiAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBjbGFzcyBUcmFuc2xhdGlvbnMge1xyXG4gICBwcml2YXRlIGN1cnJlbnRMYW5nOiBzdHJpbmc7XHJcblxyXG4gICBjb25zdHJ1Y3Rvcihpbml0aWFsTGFuZzogc3RyaW5nID0gJ2ZyJykge1xyXG4gICAgICB0aGlzLmN1cnJlbnRMYW5nID0gaW5pdGlhbExhbmc7XHJcbiAgIH1cclxuXHJcbiAgIHNldExhbmd1YWdlKGxhbmc6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgICB0aGlzLmN1cnJlbnRMYW5nID0gbGFuZztcclxuICAgfVxyXG5cclxuICAgdChrZXk6IFRyYW5zbGF0aW9uS2V5KTogc3RyaW5nIHtcclxuICAgICAgcmV0dXJuIHRyYW5zbGF0aW9uc1t0aGlzLmN1cnJlbnRMYW5nXT8uW2tleV0gfHwgdHJhbnNsYXRpb25zWydlbiddW2tleV0gfHwga2V5O1xyXG4gICB9XHJcbn1cclxuIiwgImltcG9ydCB7IFBsdWdpbiwgTm90aWNlLCBNb2RhbCwgU2V0dGluZywgQXBwLCBNYXJrZG93blZpZXcsIHJlcXVlc3RVcmwsIFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgU2V0dGluZ3MsIERlZmF1bHRTZXR0aW5ncywgRG9tYWluRm9sZGVyTWFwcGluZyB9IGZyb20gJy4vU2V0dGluZ3MnO1xuaW1wb3J0IHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi9UcmFuc2xhdGlvbnMnO1xuaW1wb3J0IHsgQ3JlYXRlU2hvcnRMaW5rTW9kYWwgfSBmcm9tICcuL1Nob3J0TGlua01vZGFsJztcblxuZXhwb3J0IGNsYXNzIEhvdGtleXMge1xuICAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luLFxuICAgICAgcHJpdmF0ZSBzZXR0aW5nczogRGVmYXVsdFNldHRpbmdzLFxuICAgICAgcHJpdmF0ZSB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9uc1xuICAgKSB7fVxuXG4gICBhc3luYyBjcmVhdGVTaG9ydExpbmsodXJsOiBzdHJpbmcsIHNsdWc6IHN0cmluZywgZG9tYWluOiBzdHJpbmcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9hcGkuZHViLmNvL3YxL2xpbmtzJyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7dGhpcy5zZXR0aW5ncy5kdWJBcGlLZXl9YCxcbiAgICAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgIC4uLihzbHVnICYmIHsga2V5OiBzbHVnIH0pLFxuICAgICAgICAgICAgICAgLi4uKGRvbWFpbiAmJiB7IGRvbWFpbjogZG9tYWluIH0pLFxuICAgICAgICAgICAgICAgLi4uKHRoaXMuc2V0dGluZ3MuZHViV29ya3NwYWNlSWQgJiYgeyB3b3Jrc3BhY2VJZDogdGhpcy5zZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZCB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIGNvbnN0IHNob3J0VXJsID0gYGh0dHBzOi8vJHtkb21haW4gfHwgJ2R1Yi5jbyd9LyR7c2x1ZyB8fCByZXNwb25zZS5qc29uLmtleX1gO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlVmlldyA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoYWN0aXZlVmlldykge1xuICAgICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYWN0aXZlVmlldy5lZGl0b3I7XG4gICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYWN0aXZlVmlldy5maWxlO1xuXG4gICAgICAgICAgICAgICBpZiAoZWRpdG9yICYmIGZpbGUpIHtcbiAgICAgICAgICAgICAgICAgIC8vIENyXHUwMEU5ZXIgbGUgbm91dmVhdSBsaWVuIE1hcmtkb3duXG4gICAgICAgICAgICAgICAgICBjb25zdCBtYXJrZG93bkxpbmsgPSBgWyR7dXJsfV0oJHtzaG9ydFVybH0pYDtcbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgLy8gT2J0ZW5pciBsYSBwb3NpdGlvbiBkdSBjdXJzZXVyXG4gICAgICAgICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yKCk7XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIC8vIEluc1x1MDBFOXJlciBsZSBsaWVuIFx1MDBFMCBsYSBwb3NpdGlvbiBkdSBjdXJzZXVyXG4gICAgICAgICAgICAgICAgICBlZGl0b3IucmVwbGFjZVJhbmdlKG1hcmtkb3duTGluaywgY3Vyc29yKTtcbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgLy8gTWV0dHJlIFx1MDBFMCBqb3VyIGxlcyBsaWVucyBkYW5zIGxlIGNhY2hlIGQnT2JzaWRpYW5cbiAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgLy8gRFx1MDBFOWNsZW5jaGVyIHVuIFx1MDBFOXZcdTAwRTluZW1lbnQgZGUgbW9kaWZpY2F0aW9uIHBvdXIgcXVlIE9ic2lkaWFuIG1ldHRlIFx1MDBFMCBqb3VyIHNlcyBsaWVuc1xuICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBlZGl0b3IuZ2V0VmFsdWUoKSk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5saW5rQ3JlYXRlZCcpKTtcbiAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCByZXNwb25zZS5qc29uPy5lcnJvciB8fCAnVW5rbm93biBlcnJvcicpKTtcbiAgICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJldXIgbG9ycyBkZSBsYSBjclx1MDBFOWF0aW9uIGR1IGxpZW4gY291cnQ6JywgZXJyb3IpO1xuICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgZXJyb3IubWVzc2FnZSkpO1xuICAgICAgfVxuICAgfVxuXG4gICByZWdpc3RlckhvdGtleXMoKSB7XG4gICAgICAvLyBDb21tYW5kZSBwb3VyIGNyXHUwMEU5ZXIgdW4gbm91dmVhdSBsaWVuIGNvdXJ0XG4gICAgICB0aGlzLnBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICAgICAgIGlkOiAnY3JlYXRlLXNob3J0LWxpbmsnLFxuICAgICAgICAgbmFtZTogdGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuY3JlYXRlU2hvcnRMaW5rJyksXG4gICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLmR1YkFwaUtleSkge1xuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgJ0FQSSBrZXkgbm90IGNvbmZpZ3VyZWQnKSk7XG4gICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5ldyBDcmVhdGVTaG9ydExpbmtNb2RhbChcbiAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcCxcbiAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLFxuICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncyxcbiAgICAgICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25zLFxuICAgICAgICAgICAgICAgKHVybCwgc2x1ZywgZG9tYWluKSA9PiB0aGlzLmNyZWF0ZVNob3J0TGluayh1cmwsIHNsdWcsIGRvbWFpbilcbiAgICAgICAgICAgICkub3BlbigpO1xuICAgICAgICAgfSxcbiAgICAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiQ3RybFwiLCBcIlNoaWZ0XCJdLCBrZXk6IFwibFwiIH1dXG4gICAgICB9KTtcbiAgIH1cbn1cbiIsICJpbXBvcnQgeyBNb2RhbCwgU2V0dGluZywgQXBwLCBQbHVnaW4sIE5vdGljZSB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IHsgRGVmYXVsdFNldHRpbmdzIH0gZnJvbSAnLi9TZXR0aW5ncyc7XHJcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcclxuXHJcbmV4cG9ydCBjbGFzcyBDcmVhdGVTaG9ydExpbmtNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuICAgcHJpdmF0ZSB1cmw6IHN0cmluZyA9ICcnO1xyXG4gICBwcml2YXRlIHNsdWc6IHN0cmluZyA9ICcnO1xyXG4gICBwcml2YXRlIHNlbGVjdGVkRG9tYWluOiBzdHJpbmcgPSAnJztcclxuXHJcbiAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICBhcHA6IEFwcCxcclxuICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcclxuICAgICAgcHJpdmF0ZSBzZXR0aW5nczogRGVmYXVsdFNldHRpbmdzLFxyXG4gICAgICBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zLFxyXG4gICAgICBwcml2YXRlIG9uU3VibWl0OiAodXJsOiBzdHJpbmcsIHNsdWc6IHN0cmluZywgZG9tYWluOiBzdHJpbmcpID0+IHZvaWRcclxuICAgKSB7XHJcbiAgICAgIHN1cGVyKGFwcCk7XHJcbiAgIH1cclxuXHJcbiAgIHByaXZhdGUgZ2V0RG9tYWluRm9yQ3VycmVudEZpbGUoKTogc3RyaW5nIHtcclxuICAgICAgY29uc3QgYWN0aXZlRmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XHJcbiAgICAgIGlmICghYWN0aXZlRmlsZSkgcmV0dXJuICdkdWIuY28nO1xyXG5cclxuICAgICAgLy8gUlx1MDBFOWN1cFx1MDBFOXJlciBsZSBjaGVtaW4gZHUgZmljaGllciBhY3RpZlxyXG4gICAgICBjb25zdCBmaWxlUGF0aCA9IGFjdGl2ZUZpbGUucGF0aDtcclxuXHJcbiAgICAgIC8vIFRyb3V2ZXIgbGUgbWFwcGluZyBsZSBwbHVzIHNwXHUwMEU5Y2lmaXF1ZSBxdWkgY29ycmVzcG9uZCBhdSBjaGVtaW4gZHUgZmljaGllclxyXG4gICAgICBsZXQgYmVzdE1hdGNoOiB7IGRvbWFpbjogc3RyaW5nLCBkZXB0aDogbnVtYmVyIH0gPSB7IGRvbWFpbjogJ2R1Yi5jbycsIGRlcHRoOiAtMSB9O1xyXG5cclxuICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncy5mb3JFYWNoKG1hcHBpbmcgPT4ge1xyXG4gICAgICAgICAvLyBTaSBsZSBmaWNoaWVyIGVzdCBkYW5zIGNlIGRvc3NpZXIgb3UgdW4gc291cy1kb3NzaWVyXHJcbiAgICAgICAgIGlmIChmaWxlUGF0aC5zdGFydHNXaXRoKG1hcHBpbmcuZm9sZGVyKSkge1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxlciBsYSBwcm9mb25kZXVyIGR1IGRvc3NpZXIgbWFwcFx1MDBFOVxyXG4gICAgICAgICAgICBjb25zdCBkZXB0aCA9IG1hcHBpbmcuZm9sZGVyLnNwbGl0KCcvJykubGVuZ3RoO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gU2kgYydlc3QgbGUgbWFwcGluZyBsZSBwbHVzIHNwXHUwMEU5Y2lmaXF1ZSB0cm91dlx1MDBFOSBqdXNxdSdcdTAwRTAgcHJcdTAwRTlzZW50XHJcbiAgICAgICAgICAgIGlmIChkZXB0aCA+IGJlc3RNYXRjaC5kZXB0aCkge1xyXG4gICAgICAgICAgICAgICBiZXN0TWF0Y2ggPSB7XHJcbiAgICAgICAgICAgICAgICAgIGRvbWFpbjogbWFwcGluZy5kb21haW4sXHJcbiAgICAgICAgICAgICAgICAgIGRlcHRoOiBkZXB0aFxyXG4gICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gYmVzdE1hdGNoLmRvbWFpbjtcclxuICAgfVxyXG5cclxuICAgb25PcGVuKCkge1xyXG4gICAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcclxuICAgICAgY29udGVudEVsLmVtcHR5KCk7XHJcblxyXG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmNyZWF0ZVNob3J0TGluaycpIH0pO1xyXG5cclxuICAgICAgLy8gVVJMIGRlIGRlc3RpbmF0aW9uXHJcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcclxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuZGVzdGluYXRpb25VcmwnKSlcclxuICAgICAgICAgLnNldERlc2ModGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuZGVzdGluYXRpb25VcmxEZXNjJykpXHJcbiAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxyXG4gICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ2h0dHBzOi8vZXhlbXBsZS5jb20vcGFnZS1sb25ndWUnKVxyXG4gICAgICAgICAgICAub25DaGFuZ2UodmFsdWUgPT4gdGhpcy51cmwgPSB2YWx1ZSkpO1xyXG5cclxuICAgICAgLy8gU2x1ZyBwZXJzb25uYWxpc1x1MDBFOVxyXG4gICAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXHJcbiAgICAgICAgIC5zZXROYW1lKHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmN1c3RvbVNsdWcnKSlcclxuICAgICAgICAgLnNldERlc2ModGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuY3VzdG9tU2x1Z0Rlc2MnKSlcclxuICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XHJcbiAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcignbW9uLWxpZW4nKVxyXG4gICAgICAgICAgICAub25DaGFuZ2UodmFsdWUgPT4gdGhpcy5zbHVnID0gdmFsdWUpKTtcclxuXHJcbiAgICAgIC8vIERvbWFpbmUgcGVyc29ubmFsaXNcdTAwRTlcclxuICAgICAgY29uc3QgZGVmYXVsdERvbWFpbiA9IHRoaXMuZ2V0RG9tYWluRm9yQ3VycmVudEZpbGUoKTtcclxuICAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxyXG4gICAgICAgICAuc2V0TmFtZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5kb21haW4nKSlcclxuICAgICAgICAgLnNldERlc2ModGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuZG9tYWluRGVzYycpKVxyXG4gICAgICAgICAuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4ge1xyXG4gICAgICAgICAgICAvLyBBam91dGVyIGR1Yi5jbyBjb21tZSBvcHRpb24gcGFyIGRcdTAwRTlmYXV0XHJcbiAgICAgICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbignZHViLmNvJywgJ2R1Yi5jbycpO1xyXG4gICAgICAgICAgICAvLyBBam91dGVyIGxlcyBkb21haW5lcyBkZXMgbWFwcGFnZXNcclxuICAgICAgICAgICAgY29uc3QgdW5pcXVlRG9tYWlucyA9IFsuLi5uZXcgU2V0KHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MubWFwKG0gPT4gbS5kb21haW4pKV07XHJcbiAgICAgICAgICAgIHVuaXF1ZURvbWFpbnMuZm9yRWFjaChkb21haW4gPT4ge1xyXG4gICAgICAgICAgICAgICBpZiAoZG9tYWluICE9PSAnZHViLmNvJykge1xyXG4gICAgICAgICAgICAgICAgICBkcm9wZG93bi5hZGRPcHRpb24oZG9tYWluLCBkb21haW4pO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBkcm9wZG93bi5zZXRWYWx1ZShkZWZhdWx0RG9tYWluKTtcclxuICAgICAgICAgICAgZHJvcGRvd24ub25DaGFuZ2UodmFsdWUgPT4gdGhpcy5zZWxlY3RlZERvbWFpbiA9IHZhbHVlKTtcclxuICAgICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBCb3V0b25zXHJcbiAgICAgIGNvbnN0IGJ1dHRvbkNvbnRhaW5lciA9IGNvbnRlbnRFbC5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdtb2RhbC1idXR0b24tY29udGFpbmVyJyB9KTtcclxuICAgICAgXHJcbiAgICAgIC8vIEJvdXRvbiBBbm51bGVyXHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiAnQW5udWxlcicgfSlcclxuICAgICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jbG9zZSgpKTtcclxuICAgICAgXHJcbiAgICAgIC8vIEJvdXRvbiBDclx1MDBFOWVyXHJcbiAgICAgIGNvbnN0IGNyZWF0ZUJ1dHRvbiA9IGJ1dHRvbkNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywge1xyXG4gICAgICAgICB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5jcmVhdGUnKSxcclxuICAgICAgICAgY2xzOiAnbW9kLWN0YSdcclxuICAgICAgfSk7XHJcbiAgICAgIGNyZWF0ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgaWYgKCF0aGlzLnVybCkge1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMudXJsUmVxdWlyZWQnKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgfVxyXG4gICAgICAgICB0aGlzLm9uU3VibWl0KHRoaXMudXJsLCB0aGlzLnNsdWcsIHRoaXMuc2VsZWN0ZWREb21haW4gfHwgZGVmYXVsdERvbWFpbik7XHJcbiAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgfSk7XHJcbiAgIH1cclxuXHJcbiAgIG9uQ2xvc2UoKSB7XHJcbiAgICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xyXG4gICAgICBjb250ZW50RWwuZW1wdHkoKTtcclxuICAgfVxyXG59IiwgImltcG9ydCB7IFBsdWdpbiwgV29ya3NwYWNlTGVhZiwgSXRlbVZpZXcgfSBmcm9tICdvYnNpZGlhbic7XHJcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcclxuXHJcbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfREFTSEJPQVJEID0gXCJsaW5rZmxvd3otZGFzaGJvYXJkXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGFzaGJvYXJkVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcclxuICAgY29uc3RydWN0b3IoXHJcbiAgICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXHJcbiAgICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sXHJcbiAgICAgIHByaXZhdGUgdHJhbnNsYXRpb25zOiBUcmFuc2xhdGlvbnNcclxuICAgKSB7XHJcbiAgICAgIHN1cGVyKGxlYWYpO1xyXG4gICB9XHJcblxyXG4gICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xyXG4gICAgICByZXR1cm4gVklFV19UWVBFX0RBU0hCT0FSRDtcclxuICAgfVxyXG5cclxuICAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHtcclxuICAgICAgcmV0dXJuIHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC50aXRsZScpO1xyXG4gICB9XHJcblxyXG4gICBhc3luYyBvbk9wZW4oKSB7XHJcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV07XHJcbiAgICAgIGNvbnRhaW5lci5lbXB0eSgpO1xyXG4gICAgICBjb250YWluZXIuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC50aXRsZScpIH0pO1xyXG4gICAgICBcclxuICAgICAgLy8gQ29udGVuZXVyIHBvdXIgbGEgbGlzdGUgZGVzIGxpZW5zXHJcbiAgICAgIGNvbnN0IGxpbmtzQ29udGFpbmVyID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImxpbmtmbG93ei1saW5rc1wiIH0pO1xyXG4gICAgICBcclxuICAgICAgLy8gVE9ETzogQ2hhcmdlciBldCBhZmZpY2hlciBsZXMgbGllbnMgZGVwdWlzIGR1Yi5jb1xyXG4gICB9XHJcblxyXG4gICBhc3luYyBvbkNsb3NlKCkge1xyXG4gICAgICAvLyBOZXR0b3lhZ2Ugc2kgblx1MDBFOWNlc3NhaXJlXHJcbiAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERhc2hib2FyZE1hbmFnZXIge1xyXG4gICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogUGx1Z2luLCBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zKSB7fVxyXG5cclxuICAgYXN5bmMgb3BlbkRhc2hib2FyZChtb2RlOiAndGFiJyB8ICdzaWRlYmFyJyB8ICdvdmVybGF5Jykge1xyXG4gICAgICAvLyBDaGVyY2hlciB1bmUgdnVlIGRhc2hib2FyZCBleGlzdGFudGVcclxuICAgICAgY29uc3QgZXhpc3RpbmdMZWF2ZXMgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfREFTSEJPQVJEKTtcclxuICAgICAgaWYgKGV4aXN0aW5nTGVhdmVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgLy8gU2kgdW5lIHZ1ZSBleGlzdGUgZFx1MDBFOWpcdTAwRTAsIGxhIHJcdTAwRTl2XHUwMEU5bGVyXHJcbiAgICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihleGlzdGluZ0xlYXZlc1swXSk7XHJcbiAgICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gU2kgYXVjdW5lIHZ1ZSBuJ2V4aXN0ZSwgZW4gY3JcdTAwRTllciB1bmUgbm91dmVsbGUgdmlhIFZpZXdNb2RlXHJcbiAgICAgIGNvbnN0IHZpZXdNb2RlID0gdGhpcy5wbHVnaW4udmlld01vZGU7XHJcbiAgICAgIGF3YWl0IHZpZXdNb2RlLnNldFZpZXcobW9kZSk7XHJcbiAgIH1cclxuXHJcbiAgIGdldEN1cnJlbnRMZWFmKCk6IFdvcmtzcGFjZUxlYWYgfCBudWxsIHtcclxuICAgICAgY29uc3QgbGVhdmVzID0gdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0RBU0hCT0FSRCk7XHJcbiAgICAgIHJldHVybiBsZWF2ZXMubGVuZ3RoID4gMCA/IGxlYXZlc1swXSA6IG51bGw7XHJcbiAgIH1cclxufSAiLCAiaW1wb3J0IHsgUGx1Z2luLCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBWSUVXX1RZUEVfREFTSEJPQVJEIH0gZnJvbSAnLi9EYXNoYm9hcmQnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFZpZXdNb2RlIHtcclxuICAgcHJpdmF0ZSBjdXJyZW50TW9kZTogJ3RhYicgfCAnc2lkZWJhcicgfCAnb3ZlcmxheScgPSAndGFiJztcclxuICAgcHJpdmF0ZSBjdXJyZW50TGVhZjogV29ya3NwYWNlTGVhZiB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IFBsdWdpbikge31cclxuXHJcbiAgIGFzeW5jIHNldFZpZXcobW9kZTogJ3RhYicgfCAnc2lkZWJhcicgfCAnb3ZlcmxheScpIHtcclxuICAgICAgdGhpcy5jdXJyZW50TW9kZSA9IG1vZGU7XHJcblxyXG4gICAgICAvLyBGZXJtZXIgbGEgdnVlIGFjdHVlbGxlIHNpIGVsbGUgZXhpc3RlXHJcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRMZWFmKSB7XHJcbiAgICAgICAgIHRoaXMuY3VycmVudExlYWYuZGV0YWNoKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHdvcmtzcGFjZSA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2U7XHJcbiAgICAgIGxldCBsZWFmOiBXb3Jrc3BhY2VMZWFmO1xyXG5cclxuICAgICAgLy8gQ3JcdTAwRTllciBsYSBub3V2ZWxsZSB2dWUgc2Vsb24gbGUgbW9kZVxyXG4gICAgICBzd2l0Y2ggKG1vZGUpIHtcclxuICAgICAgICAgY2FzZSAnc2lkZWJhcic6XHJcbiAgICAgICAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKSA/PyB3b3Jrc3BhY2UuZ2V0TGVhZignc3BsaXQnKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgIGNhc2UgJ292ZXJsYXknOlxyXG4gICAgICAgICAgICBjb25zdCBhY3RpdmVMZWFmID0gd29ya3NwYWNlLmdldE1vc3RSZWNlbnRMZWFmKCkgPz8gd29ya3NwYWNlLmdldExlYWYoJ3NwbGl0Jyk7XHJcbiAgICAgICAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuY3JlYXRlTGVhZkJ5U3BsaXQoYWN0aXZlTGVhZiwgJ2hvcml6b250YWwnLCB0cnVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgIGNhc2UgJ3RhYic6XHJcbiAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZignc3BsaXQnKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENvbmZpZ3VyZXIgbGEgbm91dmVsbGUgdnVlXHJcbiAgICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcclxuICAgICAgICAgdHlwZTogVklFV19UWVBFX0RBU0hCT0FSRCxcclxuICAgICAgICAgYWN0aXZlOiB0cnVlXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5jdXJyZW50TGVhZiA9IGxlYWY7XHJcbiAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcclxuICAgfVxyXG5cclxuICAgZ2V0Q3VycmVudE1vZGUoKTogJ3RhYicgfCAnc2lkZWJhcicgfCAnb3ZlcmxheScge1xyXG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TW9kZTtcclxuICAgfVxyXG5cclxuICAgZ2V0Q3VycmVudExlYWYoKTogV29ya3NwYWNlTGVhZiB8IG51bGwge1xyXG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TGVhZjtcclxuICAgfVxyXG59ICIsICJjb25zdCBTVFlMRVMgPSBgXHJcbiAgIC5kZXNjcmlwdGlvbi13aXRoLWJ1dHRvbiB7XHJcbiAgICAgIG1hcmdpbi1ib3R0b206IDEycHg7XHJcbiAgIH1cclxuICAgLmRlc2NyaXB0aW9uLXdpdGgtYnV0dG9uIC5zZXR0aW5nLWl0ZW0tY29udHJvbCB7XHJcbiAgICAgIG1hcmdpbi1sZWZ0OiA4cHg7XHJcbiAgIH1cclxuICAgLmRlc2NyaXB0aW9uLXdpdGgtYnV0dG9uIC5zZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb24ge1xyXG4gICAgICBtYXJnaW4tYm90dG9tOiAwO1xyXG4gICB9XHJcbiAgIC5tYXBwaW5nLWxpbmUge1xyXG4gICAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgICBnYXA6IDhweDtcclxuICAgICAgcGFkZGluZzogNnB4IDA7XHJcbiAgIH1cclxuICAgLm1hcHBpbmctbGluZSAuc2V0dGluZy1pdGVtLWNvbnRyb2wge1xyXG4gICAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgICBnYXA6IDhweDtcclxuICAgICAgZmxleC1ncm93OiAxO1xyXG4gICB9XHJcbiAgIC5tYXBwaW5nLWxpbmUgLmxhYmVsLXRleHQge1xyXG4gICAgICB3aWR0aDogNjBweCAhaW1wb3J0YW50O1xyXG4gICAgICBiYWNrZ3JvdW5kOiBub25lICFpbXBvcnRhbnQ7XHJcbiAgICAgIGJvcmRlcjogbm9uZSAhaW1wb3J0YW50O1xyXG4gICAgICBib3gtc2hhZG93OiBub25lICFpbXBvcnRhbnQ7XHJcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcclxuICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xyXG4gICAgICBwYWRkaW5nOiAwICFpbXBvcnRhbnQ7XHJcbiAgICAgIGN1cnNvcjogZGVmYXVsdDtcclxuICAgfVxyXG4gICAubWFwcGluZy1saW5lIC5kb21haW4tZHJvcGRvd24ge1xyXG4gICAgICBtaW4td2lkdGg6IDIwMHB4O1xyXG4gICB9XHJcbiAgIC5mb2xkZXItY29udGFpbmVyIHtcclxuICAgICAgZGlzcGxheTogZmxleDtcclxuICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcclxuICAgICAgZ2FwOiA0cHg7XHJcbiAgIH1cclxuICAgLmZvbGRlci1sYWJlbCB7XHJcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcclxuICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xyXG4gICB9XHJcbiAgIC5tYXBwaW5nLWxpbmUgLnNlYXJjaC1pbnB1dC1jb250YWluZXIge1xyXG4gICAgICBtaW4td2lkdGg6IDE1MHB4O1xyXG4gICB9XHJcbiAgIC5hZGQtbWFwcGluZy1idXR0b24ge1xyXG4gICAgICBtYXJnaW4tdG9wOiA2cHg7XHJcbiAgIH1cclxuICAgLmFkZC1tYXBwaW5nLWJ1dHRvbiAuc2V0dGluZy1pdGVtLWNvbnRyb2wge1xyXG4gICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7XHJcbiAgIH1cclxuICAgLmFkZC1tYXBwaW5nLWJ1dHRvbiAuc2V0dGluZy1pdGVtLWluZm8ge1xyXG4gICAgICBkaXNwbGF5OiBub25lO1xyXG4gICB9XHJcbiAgIC5jb21wYWN0LXNldHRpbmcgLnNldHRpbmctaXRlbS1pbmZvIHtcclxuICAgICAgZGlzcGxheTogbm9uZTtcclxuICAgfVxyXG5gO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyU3R5bGVzKCkge1xyXG4gICBjb25zdCBzdHlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICAgc3R5bGVFbC5pZCA9ICdsaW5rZmxvd3otc3R5bGVzJztcclxuICAgc3R5bGVFbC50ZXh0Q29udGVudCA9IFNUWUxFUztcclxuICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZUVsKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVucmVnaXN0ZXJTdHlsZXMoKSB7XHJcbiAgIGNvbnN0IHN0eWxlRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlua2Zsb3d6LXN0eWxlcycpO1xyXG4gICBpZiAoc3R5bGVFbCkge1xyXG4gICAgICBzdHlsZUVsLnJlbW92ZSgpO1xyXG4gICB9XHJcbn0gIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxtQkFBdUI7OztBQ0F2QixzQkFBMEY7QUFnQm5GLElBQU0sbUJBQW9DO0FBQUEsRUFDOUMsVUFBVTtBQUFBLEVBQ1YsV0FBVztBQUFBLEVBQ1gsZ0JBQWdCO0FBQUEsRUFDaEIsc0JBQXNCLENBQUM7QUFBQSxFQUN2QixVQUFVO0FBQ2I7QUFFTyxJQUFNLFdBQU4sTUFBZTtBQUFBLEVBSW5CLE9BQU8sV0FBVyxRQUFnQjtBQUMvQixTQUFLLFNBQVM7QUFBQSxFQUNqQjtBQUFBLEVBRUEsYUFBYSxlQUF5QztBQUNuRCxVQUFNLFlBQVksTUFBTSxLQUFLLE9BQU8sU0FBUztBQUM3QyxTQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxrQkFBa0IsYUFBYSxDQUFDLENBQUM7QUFDbkUsV0FBTyxLQUFLO0FBQUEsRUFDZjtBQUFBLEVBRUEsYUFBYSxhQUFhLFVBQW9DO0FBQzNELFNBQUssV0FBVyxPQUFPLE9BQU8sS0FBSyxZQUFZLGtCQUFrQixRQUFRO0FBQ3pFLFVBQU0sS0FBSyxPQUFPLFNBQVMsS0FBSyxRQUFRO0FBQUEsRUFDM0M7QUFBQSxFQUVBLGFBQWEsYUFBYSxRQUFnQixhQUF5QztBQTNDdEY7QUE0Q00sUUFBSTtBQUNELGNBQVEsSUFBSSxrQ0FBa0MsT0FBTyxVQUFVLEdBQUcsQ0FBQyxJQUFJLEtBQUs7QUFDNUUsVUFBSSxhQUFhO0FBQ2QsZ0JBQVEsSUFBSSx1QkFBdUIsV0FBVztBQUFBLE1BQ2pEO0FBRUEsWUFBTSxNQUFNLGNBQ1Asd0NBQXdDLFdBQVcsS0FDbkQ7QUFFTCxjQUFRLElBQUksbUJBQW1CLEdBQUc7QUFFbEMsWUFBTSxXQUFXLFVBQU0sNEJBQVc7QUFB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
