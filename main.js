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
var import_obsidian6 = require("obsidian");

// obsidian---linkflowz/src/Settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  language: "fr",
  dubApiKey: "",
  dubWorkspaceId: "",
  domainFolderMappings: [],
  viewMode: "tab",
  cachedDomains: [],
  lastDomainsFetch: 0
};
var Settings = class {
  // 24 heures en millisecondes
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
  static async getCachedDomains(apiKey, workspaceId, forceRefresh = false) {
    const now = Date.now();
    const cacheAge = now - this.settings.lastDomainsFetch;
    if (!forceRefresh && cacheAge < this.CACHE_DURATION && this.settings.cachedDomains.length > 0) {
      console.log("Using cached domains");
      return this.settings.cachedDomains;
    }
    console.log("Cache expired or empty or force refresh requested, fetching fresh domains");
    const domains = await this.fetchDomains(apiKey, workspaceId);
    await this.saveSettings({
      cachedDomains: domains,
      lastDomainsFetch: now
    });
    return domains;
  }
  static async fetchDomains(apiKey, workspaceId) {
    try {
      console.log("Fetching custom domains...");
      const customDomainsResponse = await (0, import_obsidian.requestUrl)({
        url: "https://api.dub.co/domains",
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });
      console.log("Fetching default domains...");
      const defaultDomainsResponse = await (0, import_obsidian.requestUrl)({
        url: "https://api.dub.co/domains/default",
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });
      let domains = [];
      if (customDomainsResponse.status === 200) {
        const customDomains = Array.isArray(customDomainsResponse.json) ? customDomainsResponse.json : [];
        domains = domains.concat(customDomains.map((domain) => domain.slug));
      }
      if (defaultDomainsResponse.status === 200) {
        const defaultDomains = defaultDomainsResponse.json;
        if (Array.isArray(defaultDomains)) {
          domains = domains.concat(defaultDomains);
        }
      }
      console.log("Available domains:", domains);
      return domains;
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
Settings.CACHE_DURATION = 24 * 60 * 60 * 1e3;
var SettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin, settings, translations2) {
    super(app, plugin);
    this.plugin = plugin;
    this.translations = translations2;
    this.domains = ["dub.sh"];
    this.settings = settings;
  }
  async loadDomains() {
    if (this.settings.dubApiKey) {
      try {
        this.domains = await Settings.getCachedDomains(
          this.settings.dubApiKey,
          this.settings.dubWorkspaceId
        );
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
    new import_obsidian.Setting(containerEl).setName(this.translations.t("settings.refreshDomains")).setDesc(this.translations.t("settings.refreshDomainsDesc")).addButton((button) => button.setButtonText(this.translations.t("settings.refresh")).onClick(async () => {
      if (!this.settings.dubApiKey) {
        new import_obsidian.Notice(this.translations.t("notices.error").replace("{message}", "API key required"));
        return;
      }
      await Settings.saveSettings({ lastDomainsFetch: 0 });
      await this.loadDomains();
      new import_obsidian.Notice(this.translations.t("notices.domainsRefreshed"));
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
    "modal.anchor": "Link Text",
    "modal.anchorDesc": "The text that will be displayed for the link",
    "modal.anchorPlaceholder": "Click here",
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
    "settings.save": "Save",
    "settings.refreshDomains": "Refresh Domains",
    "settings.refreshDomainsDesc": "Refresh the list of available domains from dub.co",
    "settings.refresh": "Refresh",
    "notices.domainsRefreshed": "\u2705 Domains list refreshed"
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
    "modal.anchor": "Texte du lien",
    "modal.anchorDesc": "Le texte qui sera affich\xE9 pour le lien",
    "modal.anchorPlaceholder": "Cliquez ici",
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
    "settings.save": "Sauvegarder",
    "settings.refreshDomains": "Rafra\xEEchir les domaines",
    "settings.refreshDomainsDesc": "Actualiser la liste des domaines disponibles depuis dub.co",
    "settings.refresh": "Rafra\xEEchir",
    "notices.domainsRefreshed": "\u2705 Liste des domaines actualis\xE9e"
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
var import_obsidian4 = require("obsidian");

// obsidian---linkflowz/src/ShortLinkModal.ts
var import_obsidian3 = require("obsidian");

// obsidian---linkflowz/src/DomainValidations.ts
var import_obsidian2 = require("obsidian");
var DOMAIN_VALIDATIONS = {
  "git.new": {
    allowedDomains: ["github.com"],
    errorMessage: "Le domaine git.new ne peut \xEAtre utilis\xE9 qu'avec des URLs github.com"
  },
  "chatg.pt": {
    allowedDomains: ["openai.com", "chatgpt.com"],
    errorMessage: "Le domaine chatg.pt ne peut \xEAtre utilis\xE9 qu'avec des URLs openai.com ou chatgpt.com"
  },
  "amzn.id": {
    allowedDomains: [
      "amazon.com",
      "amazon.co.uk",
      "amazon.ca",
      "amazon.es",
      "amazon.fr"
    ],
    errorMessage: "Le domaine amzn.id ne peut \xEAtre utilis\xE9 qu'avec des URLs Amazon (com, co.uk, ca, es, fr)"
  },
  "cal.link": {
    allowedDomains: [
      "cal.com",
      "calendly.com",
      "calendar.app.google",
      "chillipiper.com",
      "hubspot.com",
      "savvycal.com",
      "tidycal.com",
      "zcal.co"
    ],
    errorMessage: "Le domaine cal.link ne peut \xEAtre utilis\xE9 qu'avec des URLs de services de calendrier autoris\xE9s (cal.com, calendly.com, etc.)"
  },
  "fig.page": {
    allowedDomains: ["figma.com"],
    errorMessage: "Le domaine fig.page ne peut \xEAtre utilis\xE9 qu'avec des URLs figma.com"
  },
  "ggl.link": {
    allowedDomains: [
      "google.com",
      "google.co.uk",
      "google.co.id",
      "google.ca",
      "google.es",
      "google.fr",
      "googleblog.com",
      "blog.google",
      "g.co",
      "g.page",
      "youtube.com",
      "youtu.be"
    ],
    errorMessage: "Le domaine ggl.link ne peut \xEAtre utilis\xE9 qu'avec des URLs Google (google.com, youtube.com, etc.)"
  },
  "spti.fi": {
    allowedDomains: ["spotify.com"],
    errorMessage: "Le domaine spti.fi ne peut \xEAtre utilis\xE9 qu'avec des URLs spotify.com"
  }
};
function validateDomainUrl(domain, url, translations2) {
  const validation = DOMAIN_VALIDATIONS[domain];
  if (!validation)
    return true;
  try {
    const urlObj = new URL(url);
    const isValid = validation.allowedDomains.some(
      (d) => urlObj.hostname === d || urlObj.hostname.endsWith("." + d)
    );
    if (!isValid) {
      new import_obsidian2.Notice(translations2.t("notices.error").replace("{message}", validation.errorMessage));
      return false;
    }
    return true;
  } catch (error) {
    new import_obsidian2.Notice(translations2.t("notices.error").replace("{message}", "URL invalide"));
    return false;
  }
}

// obsidian---linkflowz/src/ShortLinkModal.ts
var CreateShortLinkModal = class extends import_obsidian3.Modal {
  constructor(app, plugin, settings, translations2) {
    super(app);
    this.plugin = plugin;
    this.settings = settings;
    this.translations = translations2;
    this.url = "";
    this.slug = "";
    this.selectedDomain = "";
    this.anchor = "";
    this.domains = [];
  }
  async onOpen() {
    try {
      this.domains = await Settings.getCachedDomains(
        this.settings.dubApiKey,
        this.settings.dubWorkspaceId
      );
    } catch (error) {
      console.error("Error loading domains:", error);
      new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", "Failed to load available domains"));
      this.close();
      return;
    }
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.translations.t("modal.createShortLink") });
    new import_obsidian3.Setting(contentEl).setName(this.translations.t("modal.destinationUrl")).setDesc(this.translations.t("modal.destinationUrlDesc")).addText((text) => text.setPlaceholder("https://exemple.com/page-longue").onChange((value) => this.url = value));
    new import_obsidian3.Setting(contentEl).setName(this.translations.t("modal.anchor")).setDesc(this.translations.t("modal.anchorDesc")).addText((text) => text.setPlaceholder(this.translations.t("modal.anchorPlaceholder")).onChange((value) => this.anchor = value));
    new import_obsidian3.Setting(contentEl).setName(this.translations.t("modal.customSlug")).setDesc(this.translations.t("modal.customSlugDesc")).addText((text) => text.setPlaceholder("mon-lien").onChange((value) => this.slug = value));
    const defaultDomain = this.getDomainForCurrentFile();
    new import_obsidian3.Setting(contentEl).setName(this.translations.t("modal.domain")).setDesc(this.translations.t("modal.domainDesc")).addDropdown((dropdown) => {
      this.domains.forEach((domain) => {
        dropdown.addOption(domain, domain);
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
        new import_obsidian3.Notice(this.translations.t("notices.urlRequired"));
        return;
      }
      this.createShortLink(this.url, this.slug, this.selectedDomain || defaultDomain);
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
  getDomainForCurrentFile() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile)
      return this.domains[0] || "dub.sh";
    const filePath = activeFile.path;
    let bestMatch = { domain: this.domains[0] || "dub.sh", depth: -1 };
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
  async createShortLink(url, slug, domain) {
    var _a, _b, _c, _d, _e, _f;
    try {
      console.log("Creating short link with:", { url, slug, domain });
      if (!domain) {
        domain = "dub.sh";
      }
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      if (!validateDomainUrl(domain, url, this.translations)) {
        return;
      }
      if (slug) {
        const slugRegex = /^[a-zA-Z0-9-]+$/;
        if (!slugRegex.test(slug)) {
          new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", "Le slug ne peut contenir que des lettres, des chiffres et des tirets"));
          return;
        }
        if (slug.length < 4) {
          new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", "Le slug doit contenir au moins 4 caract\xE8res avec le plan gratuit"));
          return;
        }
      }
      if (!this.domains.includes(domain)) {
        new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", `Le domaine ${domain} n'est pas disponible. Veuillez en choisir un autre.`));
        return;
      }
      const payload = {
        url,
        domain,
        ...slug && { key: slug },
        ...this.settings.dubWorkspaceId && { projectId: this.settings.dubWorkspaceId }
      };
      console.log("Request payload:", payload);
      const response = await (0, import_obsidian3.requestUrl)({
        url: "https://api.dub.co/links",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.settings.dubApiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      console.log("Response status:", response.status);
      console.log("Response body:", response.json);
      console.log("Response headers:", response.headers);
      if (response.status === 200 || response.status === 201) {
        const shortLink = response.json.shortLink;
        console.log("Created short link:", shortLink);
        const activeView = this.plugin.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
        if (activeView) {
          const editor = activeView.editor;
          const file = activeView.file;
          if (editor && file) {
            const linkText = this.anchor || url;
            const markdownLink = `[${linkText}](${shortLink})`;
            console.log("Inserting markdown link:", markdownLink);
            const cursor = editor.getCursor();
            editor.replaceRange(markdownLink, cursor);
            this.plugin.app.metadataCache.getFileCache(file);
          }
        }
        new import_obsidian3.Notice(this.translations.t("notices.linkCreated"));
        this.close();
      } else {
        console.error("Error response:", response);
        console.error("Error response body:", response.json);
        let errorMessage = ((_a = response.json) == null ? void 0 : _a.error) || ((_b = response.json) == null ? void 0 : _b.message) || "Unknown error";
        if (response.status === 409) {
          errorMessage = "Ce slug est d\xE9j\xE0 utilis\xE9. Veuillez en choisir un autre.";
        } else if (response.status === 400) {
          errorMessage = "URL invalide ou param\xE8tres incorrects.";
        } else if (response.status === 401) {
          errorMessage = "Cl\xE9 API invalide ou expir\xE9e.";
        } else if (response.status === 403) {
          errorMessage = "Acc\xE8s refus\xE9. V\xE9rifiez vos permissions.";
        } else if (response.status === 422) {
          console.error("422 Error details:", response.json);
          if (((_c = response.json) == null ? void 0 : _c.code) === "domain_not_found") {
            errorMessage = `Le domaine ${domain} n'est pas disponible. Veuillez en choisir un autre.`;
            this.domains = await Settings.getCachedDomains(
              this.settings.dubApiKey,
              this.settings.dubWorkspaceId,
              true
              // forcer le rafraîchissement
            );
          } else if (((_d = response.json) == null ? void 0 : _d.code) === "domain_not_allowed") {
            errorMessage = `Vous n'avez pas acc\xE8s au domaine ${domain}. Veuillez en choisir un autre.`;
          } else if (((_e = response.json) == null ? void 0 : _e.code) === "invalid_domain") {
            errorMessage = `Le domaine ${domain} n'est pas valide.`;
          } else {
            errorMessage = ((_f = response.json) == null ? void 0 : _f.message) || "Les donn\xE9es fournies sont invalides. V\xE9rifiez l'URL et le slug.";
          }
        }
        new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", `${errorMessage}`));
      }
    } catch (error) {
      console.error("Erreur lors de la cr\xE9ation du lien court:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
      let errorMessage = error.message;
      if (errorMessage.includes("status 409")) {
        errorMessage = "Ce slug est d\xE9j\xE0 utilis\xE9. Veuillez en choisir un autre.";
      } else if (errorMessage.includes("status 422")) {
        errorMessage = "Les donn\xE9es fournies sont invalides. V\xE9rifiez l'URL et le domaine.";
      }
      new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", errorMessage));
    }
  }
};

// obsidian---linkflowz/src/Hotkeys.ts
var Hotkeys = class {
  constructor(plugin, settings, translations2) {
    this.plugin = plugin;
    this.settings = settings;
    this.translations = translations2;
  }
  registerHotkeys() {
    this.plugin.addCommand({
      id: "create-short-link",
      name: this.translations.t("modal.createShortLink"),
      callback: () => {
        if (!this.settings.dubApiKey) {
          new import_obsidian4.Notice(this.translations.t("notices.error").replace("{message}", "API key not configured"));
          return;
        }
        new CreateShortLinkModal(
          this.plugin.app,
          this.plugin,
          this.settings,
          this.translations
        ).open();
      },
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "l" }]
    });
  }
};

// obsidian---linkflowz/src/Dashboard.ts
var import_obsidian5 = require("obsidian");
var VIEW_TYPE_DASHBOARD = "linkflowz-dashboard";
var DashboardView = class extends import_obsidian5.ItemView {
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
var LinkFlowz = class extends import_obsidian6.Plugin {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL1NldHRpbmdzLnRzIiwgInNyYy9UcmFuc2xhdGlvbnMudHMiLCAic3JjL0hvdGtleXMudHMiLCAic3JjL1Nob3J0TGlua01vZGFsLnRzIiwgInNyYy9Eb21haW5WYWxpZGF0aW9ucy50cyIsICJzcmMvRGFzaGJvYXJkLnRzIiwgInNyYy9WaWV3TW9kZS50cyIsICJzcmMvc3R5bGVzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBTZXR0aW5ncywgU2V0dGluZ3NUYWIsIERFRkFVTFRfU0VUVElOR1MsIERlZmF1bHRTZXR0aW5ncyB9IGZyb20gJy4vU2V0dGluZ3MnO1xuaW1wb3J0IHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi9UcmFuc2xhdGlvbnMnO1xuaW1wb3J0IHsgSG90a2V5cyB9IGZyb20gJy4vSG90a2V5cyc7XG5pbXBvcnQgeyBWaWV3TW9kZSB9IGZyb20gJy4vVmlld01vZGUnO1xuaW1wb3J0IHsgRGFzaGJvYXJkVmlldywgRGFzaGJvYXJkTWFuYWdlciwgVklFV19UWVBFX0RBU0hCT0FSRCB9IGZyb20gJy4vRGFzaGJvYXJkJztcbmltcG9ydCB7IHJlZ2lzdGVyU3R5bGVzLCB1bnJlZ2lzdGVyU3R5bGVzIH0gZnJvbSAnLi9zdHlsZXMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaW5rRmxvd3ogZXh0ZW5kcyBQbHVnaW4ge1xuICAgc2V0dGluZ3MhOiBEZWZhdWx0U2V0dGluZ3M7XG4gICBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zID0gbmV3IFRyYW5zbGF0aW9ucygpO1xuICAgcHJpdmF0ZSBob3RrZXlzITogSG90a2V5cztcbiAgIHByaXZhdGUgdmlld01vZGUhOiBWaWV3TW9kZTtcbiAgIHByaXZhdGUgZGFzaGJvYXJkTWFuYWdlciE6IERhc2hib2FyZE1hbmFnZXI7XG5cbiAgIGFzeW5jIG9ubG9hZCgpIHtcbiAgICAgIC8vIEluaXRpYWxpc2F0aW9uIGRlcyBwYXJhbVx1MDBFOHRyZXMgZXQgdHJhZHVjdGlvbnNcbiAgICAgIFNldHRpbmdzLmluaXRpYWxpemUodGhpcyk7XG4gICAgICBjb25zdCBzZXR0aW5ncyA9IGF3YWl0IFNldHRpbmdzLmxvYWRTZXR0aW5ncygpO1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgdGhpcy5sb2FkTGFuZ3VhZ2UoKTtcblxuICAgICAgLy8gRW5yZWdpc3RyZXIgbGVzIHN0eWxlcyBDU1NcbiAgICAgIHJlZ2lzdGVyU3R5bGVzKCk7XG5cbiAgICAgIC8vIEluaXRpYWxpc2F0aW9uIGRlcyBob3RrZXlzXG4gICAgICB0aGlzLmhvdGtleXMgPSBuZXcgSG90a2V5cyh0aGlzLCB0aGlzLnNldHRpbmdzLCB0aGlzLnRyYW5zbGF0aW9ucyk7XG4gICAgICB0aGlzLmhvdGtleXMucmVnaXN0ZXJIb3RrZXlzKCk7XG4gICAgICBcbiAgICAgIC8vIEF0dGVuZHJlIHF1ZSBsZSB3b3Jrc3BhY2Ugc29pdCBwclx1MDBFQXRcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbkxheW91dFJlYWR5KCgpID0+IHtcbiAgICAgICAgIC8vIEluaXRpYWxpc2F0aW9uIGRlIFZpZXdNb2RlXG4gICAgICAgICB0aGlzLnZpZXdNb2RlID0gbmV3IFZpZXdNb2RlKHRoaXMpO1xuXG4gICAgICAgICAvLyBFbnJlZ2lzdHJlbWVudCBkZSBsYSB2dWUgZGFzaGJvYXJkXG4gICAgICAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgICAgICAgIFZJRVdfVFlQRV9EQVNIQk9BUkQsXG4gICAgICAgICAgICAobGVhZikgPT4gbmV3IERhc2hib2FyZFZpZXcobGVhZiwgdGhpcywgdGhpcy50cmFuc2xhdGlvbnMpXG4gICAgICAgICApO1xuXG4gICAgICAgICAvLyBJbml0aWFsaXNhdGlvbiBkdSBkYXNoYm9hcmQgbWFuYWdlclxuICAgICAgICAgdGhpcy5kYXNoYm9hcmRNYW5hZ2VyID0gbmV3IERhc2hib2FyZE1hbmFnZXIodGhpcywgdGhpcy50cmFuc2xhdGlvbnMpO1xuXG4gICAgICAgICAvLyBBam91dCBkdSBib3V0b24gZGFucyBsYSBiYXJyZSBsYXRcdTAwRTlyYWxlXG4gICAgICAgICB0aGlzLmFkZFJpYmJvbkljb24oJ2xheW91dC1kYXNoYm9hcmQnLCAnT3BlbiBMaW5rRmxvd3ogRGFzaGJvYXJkJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kYXNoYm9hcmRNYW5hZ2VyLm9wZW5EYXNoYm9hcmQodGhpcy5zZXR0aW5ncy52aWV3TW9kZSk7XG4gICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBam91dCBkZSBsYSBwYWdlIGRlIHBhcmFtXHUwMEU4dHJlc1xuICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTZXR0aW5nc1RhYihcbiAgICAgICAgIHRoaXMuYXBwLFxuICAgICAgICAgdGhpcyxcbiAgICAgICAgIHNldHRpbmdzLFxuICAgICAgICAgdGhpcy50cmFuc2xhdGlvbnNcbiAgICAgICkpO1xuICAgfVxuXG4gICBwcml2YXRlIGxvYWRMYW5ndWFnZSgpOiB2b2lkIHtcbiAgICAgIGNvbnN0IGxvY2FsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nPy50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2ZyJykgPyAnZnInIDogJ2VuJztcbiAgICAgIHRoaXMudHJhbnNsYXRpb25zLnNldExhbmd1YWdlKGxvY2FsZSk7XG4gICB9XG5cbiAgIG9udW5sb2FkKCkge1xuICAgICAgLy8gU3VwcHJpbWVyIGxlcyBzdHlsZXNcbiAgICAgIHVucmVnaXN0ZXJTdHlsZXMoKTtcbiAgICAgIFxuICAgICAgLy8gRmVybWVyIGxhIHZ1ZSBzaSBlbGxlIGVzdCBvdXZlcnRlXG4gICAgICBjb25zdCBsZWFmID0gdGhpcy5kYXNoYm9hcmRNYW5hZ2VyPy5nZXRDdXJyZW50TGVhZigpO1xuICAgICAgaWYgKGxlYWYpIHtcbiAgICAgICAgIGxlYWYuZGV0YWNoKCk7XG4gICAgICB9XG4gICB9XG59IiwgImltcG9ydCB7IEFwcCwgUGx1Z2luLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBOb3RpY2UsIHJlcXVlc3RVcmwsIE1lbnUsIFRGb2xkZXIgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL1RyYW5zbGF0aW9ucyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG9tYWluRm9sZGVyTWFwcGluZyB7XG4gICBkb21haW46IHN0cmluZztcbiAgIGZvbGRlcjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlZmF1bHRTZXR0aW5ncyB7XG4gICBsYW5ndWFnZTogc3RyaW5nO1xuICAgZHViQXBpS2V5OiBzdHJpbmc7XG4gICBkdWJXb3Jrc3BhY2VJZDogc3RyaW5nO1xuICAgZG9tYWluRm9sZGVyTWFwcGluZ3M6IERvbWFpbkZvbGRlck1hcHBpbmdbXTtcbiAgIHZpZXdNb2RlOiAndGFiJyB8ICdzaWRlYmFyJyB8ICdvdmVybGF5JztcbiAgIGNhY2hlZERvbWFpbnM6IHN0cmluZ1tdO1xuICAgbGFzdERvbWFpbnNGZXRjaDogbnVtYmVyO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogRGVmYXVsdFNldHRpbmdzID0ge1xuICAgbGFuZ3VhZ2U6ICdmcicsXG4gICBkdWJBcGlLZXk6ICcnLFxuICAgZHViV29ya3NwYWNlSWQ6ICcnLFxuICAgZG9tYWluRm9sZGVyTWFwcGluZ3M6IFtdLFxuICAgdmlld01vZGU6ICd0YWInLFxuICAgY2FjaGVkRG9tYWluczogW10sXG4gICBsYXN0RG9tYWluc0ZldGNoOiAwXG59O1xuXG5leHBvcnQgY2xhc3MgU2V0dGluZ3Mge1xuICAgcHJpdmF0ZSBzdGF0aWMgcGx1Z2luOiBQbHVnaW47XG4gICBwcml2YXRlIHN0YXRpYyBzZXR0aW5nczogRGVmYXVsdFNldHRpbmdzO1xuICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQ0FDSEVfRFVSQVRJT04gPSAyNCAqIDYwICogNjAgKiAxMDAwOyAvLyAyNCBoZXVyZXMgZW4gbWlsbGlzZWNvbmRlc1xuXG4gICBzdGF0aWMgaW5pdGlhbGl6ZShwbHVnaW46IFBsdWdpbikge1xuICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICB9XG5cbiAgIHN0YXRpYyBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTxEZWZhdWx0U2V0dGluZ3M+IHtcbiAgICAgIGNvbnN0IHNhdmVkRGF0YSA9IGF3YWl0IHRoaXMucGx1Z2luLmxvYWREYXRhKCk7XG4gICAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgc2F2ZWREYXRhIHx8IHt9KTtcbiAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzO1xuICAgfVxuXG4gICBzdGF0aWMgYXN5bmMgc2F2ZVNldHRpbmdzKHNldHRpbmdzOiBQYXJ0aWFsPERlZmF1bHRTZXR0aW5ncz4pIHtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHRoaXMuc2V0dGluZ3MgfHwgREVGQVVMVF9TRVRUSU5HUywgc2V0dGluZ3MpO1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICB9XG5cbiAgIHN0YXRpYyBhc3luYyBnZXRDYWNoZWREb21haW5zKGFwaUtleTogc3RyaW5nLCB3b3Jrc3BhY2VJZD86IHN0cmluZywgZm9yY2VSZWZyZXNoOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgY2FjaGVBZ2UgPSBub3cgLSB0aGlzLnNldHRpbmdzLmxhc3REb21haW5zRmV0Y2g7XG5cbiAgICAgIC8vIFNpIGxlIGNhY2hlIGVzdCB2YWxpZGUgZXQgbm9uIHZpZGUsIGV0IHF1J29uIG5lIGZvcmNlIHBhcyBsZSByYWZyYVx1MDBFRWNoaXNzZW1lbnRcbiAgICAgIGlmICghZm9yY2VSZWZyZXNoICYmIGNhY2hlQWdlIDwgdGhpcy5DQUNIRV9EVVJBVElPTiAmJiB0aGlzLnNldHRpbmdzLmNhY2hlZERvbWFpbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgY29uc29sZS5sb2coJ1VzaW5nIGNhY2hlZCBkb21haW5zJyk7XG4gICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5jYWNoZWREb21haW5zO1xuICAgICAgfVxuXG4gICAgICAvLyBTaW5vbiwgclx1MDBFOWN1cFx1MDBFOXJlciBsZXMgZG9tYWluZXMgZGVwdWlzIGwnQVBJXG4gICAgICBjb25zb2xlLmxvZygnQ2FjaGUgZXhwaXJlZCBvciBlbXB0eSBvciBmb3JjZSByZWZyZXNoIHJlcXVlc3RlZCwgZmV0Y2hpbmcgZnJlc2ggZG9tYWlucycpO1xuICAgICAgY29uc3QgZG9tYWlucyA9IGF3YWl0IHRoaXMuZmV0Y2hEb21haW5zKGFwaUtleSwgd29ya3NwYWNlSWQpO1xuICAgICAgXG4gICAgICAvLyBNZXR0cmUgXHUwMEUwIGpvdXIgbGUgY2FjaGVcbiAgICAgIGF3YWl0IHRoaXMuc2F2ZVNldHRpbmdzKHtcbiAgICAgICAgIGNhY2hlZERvbWFpbnM6IGRvbWFpbnMsXG4gICAgICAgICBsYXN0RG9tYWluc0ZldGNoOiBub3dcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZG9tYWlucztcbiAgIH1cblxuICAgc3RhdGljIGFzeW5jIGZldGNoRG9tYWlucyhhcGlLZXk6IHN0cmluZywgd29ya3NwYWNlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICB0cnkge1xuICAgICAgICAgY29uc29sZS5sb2coJ0ZldGNoaW5nIGN1c3RvbSBkb21haW5zLi4uJyk7XG4gICAgICAgICBcbiAgICAgICAgIC8vIFJcdTAwRTljdXBcdTAwRTlyZXIgZCdhYm9yZCBsZXMgZG9tYWluZXMgcGVyc29ubmFsaXNcdTAwRTlzXG4gICAgICAgICBjb25zdCBjdXN0b21Eb21haW5zUmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vYXBpLmR1Yi5jby9kb21haW5zJyxcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHthcGlLZXl9YCxcbiAgICAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH0pO1xuXG4gICAgICAgICAvLyBSXHUwMEU5Y3VwXHUwMEU5cmVyIGxlcyBkb21haW5lcyBwYXIgZFx1MDBFOWZhdXQgZGlzcG9uaWJsZXNcbiAgICAgICAgIGNvbnNvbGUubG9nKCdGZXRjaGluZyBkZWZhdWx0IGRvbWFpbnMuLi4nKTtcbiAgICAgICAgIGNvbnN0IGRlZmF1bHREb21haW5zUmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vYXBpLmR1Yi5jby9kb21haW5zL2RlZmF1bHQnLFxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke2FwaUtleX1gLFxuICAgICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG5cbiAgICAgICAgIGxldCBkb21haW5zOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgICAvLyBBam91dGVyIGxlcyBkb21haW5lcyBwZXJzb25uYWxpc1x1MDBFOXMgcydpbHMgZXhpc3RlbnRcbiAgICAgICAgIGlmIChjdXN0b21Eb21haW5zUmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIGNvbnN0IGN1c3RvbURvbWFpbnMgPSBBcnJheS5pc0FycmF5KGN1c3RvbURvbWFpbnNSZXNwb25zZS5qc29uKSA/IGN1c3RvbURvbWFpbnNSZXNwb25zZS5qc29uIDogW107XG4gICAgICAgICAgICBkb21haW5zID0gZG9tYWlucy5jb25jYXQoY3VzdG9tRG9tYWlucy5tYXAoKGRvbWFpbjogYW55KSA9PiBkb21haW4uc2x1ZykpO1xuICAgICAgICAgfVxuXG4gICAgICAgICAvLyBBam91dGVyIGxlcyBkb21haW5lcyBwYXIgZFx1MDBFOWZhdXRcbiAgICAgICAgIGlmIChkZWZhdWx0RG9tYWluc1Jlc3BvbnNlLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAvLyBMYSByXHUwMEU5cG9uc2UgZXN0IGRpcmVjdGVtZW50IHVuIHRhYmxlYXUgZGUgc3RyaW5ncyBwb3VyIGxlcyBkb21haW5lcyBwYXIgZFx1MDBFOWZhdXRcbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHREb21haW5zID0gZGVmYXVsdERvbWFpbnNSZXNwb25zZS5qc29uO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGVmYXVsdERvbWFpbnMpKSB7XG4gICAgICAgICAgICAgICBkb21haW5zID0gZG9tYWlucy5jb25jYXQoZGVmYXVsdERvbWFpbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgfVxuXG4gICAgICAgICBjb25zb2xlLmxvZygnQXZhaWxhYmxlIGRvbWFpbnM6JywgZG9tYWlucyk7XG4gICAgICAgICByZXR1cm4gZG9tYWlucztcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBkb21haW5zOicsIGVycm9yKTtcbiAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkZXRhaWxzOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RhY2s6JywgZXJyb3Iuc3RhY2spO1xuICAgICAgICAgfVxuICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXR0aW5nc1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICAgc2V0dGluZ3M6IERlZmF1bHRTZXR0aW5ncztcbiAgIHByaXZhdGUgZG9tYWluczogc3RyaW5nW10gPSBbJ2R1Yi5zaCddO1xuXG4gICBjb25zdHJ1Y3RvcihcbiAgICAgIGFwcDogQXBwLCBcbiAgICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sIFxuICAgICAgc2V0dGluZ3M6IERlZmF1bHRTZXR0aW5ncyxcbiAgICAgIHByaXZhdGUgdHJhbnNsYXRpb25zOiBUcmFuc2xhdGlvbnNcbiAgICkge1xuICAgICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgfVxuXG4gICBhc3luYyBsb2FkRG9tYWlucygpIHtcbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLmR1YkFwaUtleSkge1xuICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuZG9tYWlucyA9IGF3YWl0IFNldHRpbmdzLmdldENhY2hlZERvbWFpbnMoXG4gICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmR1YkFwaUtleSxcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZHViV29ya3NwYWNlSWRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCBlcnJvci5tZXNzYWdlKSk7XG4gICAgICAgICB9XG4gICAgICB9XG4gICB9XG5cbiAgIGRpc3BsYXkoKSB7XG4gICAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgICAgLy8gU2VjdGlvbiBkdWIuY29cbiAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogJ2R1Yi5jbycgfSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZHViQXBpS2V5JykpXG4gICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kdWJBcGlLZXlEZXNjJykpXG4gICAgICAgICAuYWRkVGV4dCh0ZXh0ID0+IHRleHRcbiAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcignRW50cmV6IHZvdHJlIGNsXHUwMEU5IEFQSScpXG4gICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5zZXR0aW5ncy5kdWJBcGlLZXkpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmR1YkFwaUtleSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZHViQXBpS2V5OiB2YWx1ZSB9KTtcbiAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zYXZlZCcpKTtcbiAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkRG9tYWlucygpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgIC5zZXROYW1lKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkJykpXG4gICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZERlc2MnKSlcbiAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdFbnRyZXogdm90cmUgSUQgZGUgd29ya3NwYWNlJylcbiAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmR1YldvcmtzcGFjZUlkKVxuICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZHViV29ya3NwYWNlSWQ6IHZhbHVlIH0pO1xuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5KSB7XG4gICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWREb21haW5zKCk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgIC8vIEJvdXRvbiBkZSByYWZyYVx1MDBFRWNoaXNzZW1lbnQgZGVzIGRvbWFpbmVzXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgIC5zZXROYW1lKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLnJlZnJlc2hEb21haW5zJykpXG4gICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5yZWZyZXNoRG9tYWluc0Rlc2MnKSlcbiAgICAgICAgIC5hZGRCdXR0b24oYnV0dG9uID0+IGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MucmVmcmVzaCcpKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLmR1YkFwaUtleSkge1xuICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgJ0FQSSBrZXkgcmVxdWlyZWQnKSk7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAvLyBGb3JjZXIgbGUgcmFmcmFcdTAwRUVjaGlzc2VtZW50IGVuIGludmFsaWRhbnQgbGUgY2FjaGVcbiAgICAgICAgICAgICAgIGF3YWl0IFNldHRpbmdzLnNhdmVTZXR0aW5ncyh7IGxhc3REb21haW5zRmV0Y2g6IDAgfSk7XG4gICAgICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWREb21haW5zKCk7XG4gICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZG9tYWluc1JlZnJlc2hlZCcpKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgLy8gU2VjdGlvbiBNYXBwYWdlcyBEb21haW5lLURvc3NpZXJcbiAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MnKSB9KTtcbiAgICAgIFxuICAgICAgLy8gTGlnbmUgZGUgZGVzY3JpcHRpb24gYXZlYyBsZSBib3V0b24gZCdham91dFxuICAgICAgY29uc3QgZGVzY3JpcHRpb25MaW5lID0gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAuc2V0TmFtZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5nc0Rlc2MnKSlcbiAgICAgICAgIC5hZGRCdXR0b24oYnV0dG9uID0+IGJ1dHRvblxuICAgICAgICAgICAgLnNldEljb24oJ3BsdXMnKVxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuYWRkTWFwcGluZycpKVxuICAgICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgZG9tYWluOiB0aGlzLmRvbWFpbnNbMF0sXG4gICAgICAgICAgICAgICAgICBmb2xkZXI6ICcnXG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgIGF3YWl0IFNldHRpbmdzLnNhdmVTZXR0aW5ncyh7IGRvbWFpbkZvbGRlck1hcHBpbmdzOiB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzIH0pO1xuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICBcbiAgICAgIGRlc2NyaXB0aW9uTGluZS5zZXR0aW5nRWwuYWRkQ2xhc3MoJ2Rlc2NyaXB0aW9uLXdpdGgtYnV0dG9uJyk7XG5cbiAgICAgIC8vIENvbnRlbmV1ciBwb3VyIGxlcyBtYXBwYWdlcyBleGlzdGFudHNcbiAgICAgIGNvbnN0IG1hcHBpbmdzQ29udGFpbmVyID0gY29udGFpbmVyRWwuY3JlYXRlRWwoJ2RpdicpO1xuICAgICAgXG4gICAgICAvLyBGb25jdGlvbiBwb3VyIGNyXHUwMEU5ZXIgdW4gbm91dmVhdSBtYXBwaW5nXG4gICAgICBjb25zdCBjcmVhdGVNYXBwaW5nRWxlbWVudCA9IChtYXBwaW5nOiBEb21haW5Gb2xkZXJNYXBwaW5nLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICBjb25zdCBtYXBwaW5nRGl2ID0gbWFwcGluZ3NDb250YWluZXIuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnbWFwcGluZy1jb250YWluZXInIH0pO1xuICAgICAgICAgXG4gICAgICAgICAvLyBDb250ZW5ldXIgcG91ciBsYSBsaWduZSBkZSBtYXBwaW5nXG4gICAgICAgICBjb25zdCBtYXBwaW5nTGluZSA9IG5ldyBTZXR0aW5nKG1hcHBpbmdEaXYpXG4gICAgICAgICAgICAuc2V0Q2xhc3MoJ2NvbXBhY3Qtc2V0dGluZycpXG4gICAgICAgICAgICAvLyBMYWJlbCBcIkRvbWFpbmVcIlxuICAgICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB7XG4gICAgICAgICAgICAgICB0ZXh0LmlucHV0RWwuYWRkQ2xhc3MoJ2xhYmVsLXRleHQnKTtcbiAgICAgICAgICAgICAgIHRleHQuc2V0VmFsdWUodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZG9tYWluJykpO1xuICAgICAgICAgICAgICAgdGV4dC5zZXREaXNhYmxlZCh0cnVlKTtcbiAgICAgICAgICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC8vIERyb3Bkb3duIGRlcyBkb21haW5lc1xuICAgICAgICAgICAgLmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IHtcbiAgICAgICAgICAgICAgIHRoaXMuZG9tYWlucy5mb3JFYWNoKGRvbWFpbiA9PiB7XG4gICAgICAgICAgICAgICAgICBkcm9wZG93bi5hZGRPcHRpb24oZG9tYWluLCBkb21haW4pO1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICBkcm9wZG93bi5zZXRWYWx1ZShtYXBwaW5nLmRvbWFpbik7XG4gICAgICAgICAgICAgICBkcm9wZG93bi5vbkNoYW5nZSh2YWx1ZSA9PiB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzW2luZGV4XS5kb21haW4gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgZHJvcGRvd24uc2VsZWN0RWwuYWRkQ2xhc3MoJ2RvbWFpbi1kcm9wZG93bicpO1xuICAgICAgICAgICAgICAgcmV0dXJuIGRyb3Bkb3duO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC8vIENoYW1wIGRlIHNhaXNpZSBkdSBkb3NzaWVyIGF2ZWMgc29uIGxhYmVsXG4gICAgICAgICAgICAuYWRkQnV0dG9uKGJ1dHRvbiA9PiBidXR0b25cbiAgICAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KG1hcHBpbmcuZm9sZGVyIHx8IHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmZvbGRlcicpKVxuICAgICAgICAgICAgICAgLm9uQ2xpY2soKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vIENyXHUwMEU5ZXIgbGUgbWVudSBkZSBzXHUwMEU5bGVjdGlvbiBwcmluY2lwYWxcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAvLyBDb25zdHJ1aXJlIGxhIGhpXHUwMEU5cmFyY2hpZSBkZXMgZG9zc2llcnMgXHUwMEUwIHBhcnRpciBkZSBsYSByYWNpbmVcbiAgICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRGb2xkZXJNZW51KG1lbnUsIHRoaXMuYXBwLnZhdWx0LmdldFJvb3QoKSwgaW5kZXgpO1xuXG4gICAgICAgICAgICAgICAgICAvLyBBZmZpY2hlciBsZSBtZW51IFx1MDBFMCBsYSBwb3NpdGlvbiBkdSBjbGljXG4gICAgICAgICAgICAgICAgICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZSk7XG4gICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIC8vIEJvdXRvbnMgZCdhY3Rpb25cbiAgICAgICAgICAgIC5hZGRCdXR0b24oYnV0dG9uID0+IGJ1dHRvblxuICAgICAgICAgICAgICAgLnNldEljb24oJ2NoZWNrbWFyaycpXG4gICAgICAgICAgICAgICAuc2V0VG9vbHRpcCh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5zYXZlJykpXG4gICAgICAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGF3YWl0IFNldHRpbmdzLnNhdmVTZXR0aW5ncyh7IGRvbWFpbkZvbGRlck1hcHBpbmdzOiB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzIH0pO1xuICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAuYWRkQnV0dG9uKGJ1dHRvbiA9PiBidXR0b25cbiAgICAgICAgICAgICAgIC5zZXRJY29uKCd0cmFzaCcpXG4gICAgICAgICAgICAgICAuc2V0VG9vbHRpcCh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5yZW1vdmUnKSlcbiAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgIGF3YWl0IFNldHRpbmdzLnNhdmVTZXR0aW5ncyh7IGRvbWFpbkZvbGRlck1hcHBpbmdzOiB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzIH0pO1xuICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgIC8vIEFqb3V0ZXIgZGVzIHN0eWxlcyBwb3VyIGFsaWduZXIgbGVzIFx1MDBFOWxcdTAwRTltZW50c1xuICAgICAgICAgbWFwcGluZ0xpbmUuc2V0dGluZ0VsLmFkZENsYXNzKCdtYXBwaW5nLWxpbmUnKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEFmZmljaGVyIGxlcyBtYXBwYWdlcyBleGlzdGFudHNcbiAgICAgIHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MuZm9yRWFjaCgobWFwcGluZywgaW5kZXgpID0+IHtcbiAgICAgICAgIGNyZWF0ZU1hcHBpbmdFbGVtZW50KG1hcHBpbmcsIGluZGV4KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBTZWN0aW9uIE1vZGUgZCdhZmZpY2hhZ2VcbiAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3Mudmlld01vZGUnKSB9KTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAuc2V0TmFtZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGUnKSlcbiAgICAgICAgIC5zZXREZXNjKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmRlZmF1bHRWaWV3TW9kZURlc2MnKSlcbiAgICAgICAgIC5hZGREcm9wZG93bihkcm9wZG93biA9PiBkcm9wZG93blxuICAgICAgICAgICAgLmFkZE9wdGlvbigndGFiJywgdGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MudGFiJykpXG4gICAgICAgICAgICAuYWRkT3B0aW9uKCdzaWRlYmFyJywgdGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3Muc2lkZWJhcicpKVxuICAgICAgICAgICAgLmFkZE9wdGlvbignb3ZlcmxheScsIHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLm92ZXJsYXknKSlcbiAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLnZpZXdNb2RlKVxuICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogJ3RhYicgfCAnc2lkZWJhcicgfCAnb3ZlcmxheScpID0+IHtcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3Mudmlld01vZGUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgIGF3YWl0IFNldHRpbmdzLnNhdmVTZXR0aW5ncyh7IHZpZXdNb2RlOiB2YWx1ZSB9KTtcbiAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zYXZlZCcpKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgLy8gQ2hhcmdlciBsZXMgZG9tYWluZXMgYXUgZFx1MDBFOW1hcnJhZ2Ugc2kgdW5lIGNsXHUwMEU5IEFQSSBlc3QgcHJcdTAwRTlzZW50ZVxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5ICYmIHRoaXMuZG9tYWlucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgIHRoaXMubG9hZERvbWFpbnMoKTtcbiAgICAgIH1cbiAgIH1cblxuICAgLy8gQ29uc3RydWlyZSBsZSBtZW51IGhpXHUwMEU5cmFyY2hpcXVlIGRlcyBkb3NzaWVyc1xuICAgcHJpdmF0ZSBidWlsZEZvbGRlck1lbnUobWVudTogTWVudSwgZm9sZGVyOiBURm9sZGVyLCBtYXBwaW5nSW5kZXg6IG51bWJlciwgbGV2ZWw6IG51bWJlciA9IDApIHtcbiAgICAgIGNvbnN0IHN1YkZvbGRlcnMgPSBmb2xkZXIuY2hpbGRyZW4uZmlsdGVyKChjaGlsZCk6IGNoaWxkIGlzIFRGb2xkZXIgPT4gY2hpbGQgaW5zdGFuY2VvZiBURm9sZGVyKTtcbiAgICAgIFxuICAgICAgc3ViRm9sZGVycy5mb3JFYWNoKHN1YkZvbGRlciA9PiB7XG4gICAgICAgICBjb25zdCBoYXNDaGlsZHJlbiA9IHN1YkZvbGRlci5jaGlsZHJlbi5zb21lKGNoaWxkID0+IGNoaWxkIGluc3RhbmNlb2YgVEZvbGRlcik7XG4gICAgICAgICBcbiAgICAgICAgIGlmIChoYXNDaGlsZHJlbikge1xuICAgICAgICAgICAgLy8gUG91ciBsZXMgZG9zc2llcnMgYXZlYyBkZXMgZW5mYW50cywgY3JcdTAwRTllciB1biBzb3VzLW1lbnVcbiAgICAgICAgICAgIG1lbnUuYWRkSXRlbShpdGVtID0+IHtcbiAgICAgICAgICAgICAgIGNvbnN0IHRpdGxlRWwgPSBjcmVhdGVTcGFuKHsgY2xzOiAnbWVudS1pdGVtLXRpdGxlJyB9KTtcbiAgICAgICAgICAgICAgIHRpdGxlRWwuYXBwZW5kVGV4dChzdWJGb2xkZXIubmFtZSk7XG4gICAgICAgICAgICAgICB0aXRsZUVsLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4oeyBjbHM6ICdtZW51LWl0ZW0tYXJyb3cnLCB0ZXh0OiAnIFx1MjE5MicgfSkpO1xuXG4gICAgICAgICAgICAgICBpdGVtLmRvbS5xdWVyeVNlbGVjdG9yKCcubWVudS1pdGVtLXRpdGxlJyk/LnJlcGxhY2VXaXRoKHRpdGxlRWwpO1xuICAgICAgICAgICAgICAgaXRlbS5zZXRJY29uKCdmb2xkZXInKTtcblxuICAgICAgICAgICAgICAgLy8gQ3JcdTAwRTllciBsZSBzb3VzLW1lbnVcbiAgICAgICAgICAgICAgIGNvbnN0IHN1Yk1lbnUgPSBuZXcgTWVudSgpO1xuICAgICAgICAgICAgICAgdGhpcy5idWlsZEZvbGRlck1lbnUoc3ViTWVudSwgc3ViRm9sZGVyLCBtYXBwaW5nSW5kZXgsIGxldmVsICsgMSk7XG5cbiAgICAgICAgICAgICAgIC8vIENvbmZpZ3VyZXIgbCdcdTAwRTl2XHUwMEU5bmVtZW50IGRlIHN1cnZvbFxuICAgICAgICAgICAgICAgY29uc3QgaXRlbURvbSA9IChpdGVtIGFzIGFueSkuZG9tIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgICAgaWYgKGl0ZW1Eb20pIHtcbiAgICAgICAgICAgICAgICAgIGxldCBpc092ZXJJdGVtID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBsZXQgaXNPdmVyTWVudSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgbGV0IGhpZGVUaW1lb3V0OiBOb2RlSlMuVGltZW91dDtcblxuICAgICAgICAgICAgICAgICAgY29uc3Qgc2hvd1N1Yk1lbnUgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICBjb25zdCByZWN0ID0gaXRlbURvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgIHN1Yk1lbnUuc2hvd0F0UG9zaXRpb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgeDogcmVjdC5yaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHJlY3QudG9wXG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgIGNvbnN0IGhpZGVTdWJNZW51ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgaGlkZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNPdmVySXRlbSAmJiAhaXNPdmVyTWVudSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViTWVudS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgaXRlbURvbS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgaXNPdmVySXRlbSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICBpZiAoaGlkZVRpbWVvdXQpIGNsZWFyVGltZW91dChoaWRlVGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgICBzaG93U3ViTWVudSgpO1xuICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgIGl0ZW1Eb20uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgIGlzT3Zlckl0ZW0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgIGhpZGVTdWJNZW51KCk7XG4gICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgLy8gR1x1MDBFOXJlciBsZSBzdXJ2b2wgZHUgc291cy1tZW51IGx1aS1tXHUwMEVBbWVcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHN1Yk1lbnVFbCA9IChzdWJNZW51IGFzIGFueSkuZG9tO1xuICAgICAgICAgICAgICAgICAgaWYgKHN1Yk1lbnVFbCkge1xuICAgICAgICAgICAgICAgICAgICAgc3ViTWVudUVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc092ZXJNZW51ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoaWRlVGltZW91dCkgY2xlYXJUaW1lb3V0KGhpZGVUaW1lb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICBzdWJNZW51RWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzT3Zlck1lbnUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZGVTdWJNZW51KCk7XG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgLy8gQWpvdXRlciBcdTAwRTlnYWxlbWVudCB1biBnZXN0aW9ubmFpcmUgZGUgY2xpYyBwb3VyIGxlIGRvc3NpZXIgcGFyZW50XG4gICAgICAgICAgICAgICBpdGVtLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5nc1ttYXBwaW5nSW5kZXhdLmZvbGRlciA9IHN1YkZvbGRlci5wYXRoO1xuICAgICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZG9tYWluRm9sZGVyTWFwcGluZ3M6IHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MgfSk7XG4gICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gUG91ciBsZXMgZG9zc2llcnMgc2FucyBlbmZhbnRzLCBham91dGVyIHNpbXBsZW1lbnQgdW4gXHUwMEU5bFx1MDBFOW1lbnQgZGUgbWVudVxuICAgICAgICAgICAgbWVudS5hZGRJdGVtKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgaXRlbS5zZXRUaXRsZShzdWJGb2xkZXIubmFtZSlcbiAgICAgICAgICAgICAgICAgIC5zZXRJY29uKCdmb2xkZXInKVxuICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5nc1ttYXBwaW5nSW5kZXhdLmZvbGRlciA9IHN1YkZvbGRlci5wYXRoO1xuICAgICAgICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZG9tYWluRm9sZGVyTWFwcGluZ3M6IHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MgfSk7XG4gICAgICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICB9XG4gICAgICB9KTtcbiAgIH1cbn0iLCAiZXhwb3J0IHR5cGUgVHJhbnNsYXRpb25LZXkgPSBcclxuICAgLy8gTm90aWNlc1xyXG4gICB8ICdub3RpY2VzLnNhdmVkJ1xyXG4gICB8ICdub3RpY2VzLmVycm9yJ1xyXG4gICB8ICdub3RpY2VzLnN1Y2Nlc3MnXHJcbiAgIHwgJ25vdGljZXMubGlua0NyZWF0ZWQnXHJcbiAgIHwgJ25vdGljZXMudXJsUmVxdWlyZWQnXHJcbiAgIC8vIE1vZGFsXHJcbiAgIHwgJ21vZGFsLmNyZWF0ZVNob3J0TGluaydcclxuICAgfCAnbW9kYWwuZGVzdGluYXRpb25VcmwnXHJcbiAgIHwgJ21vZGFsLmRlc3RpbmF0aW9uVXJsRGVzYydcclxuICAgfCAnbW9kYWwuYW5jaG9yJ1xyXG4gICB8ICdtb2RhbC5hbmNob3JEZXNjJ1xyXG4gICB8ICdtb2RhbC5hbmNob3JQbGFjZWhvbGRlcidcclxuICAgfCAnbW9kYWwuY3VzdG9tU2x1ZydcclxuICAgfCAnbW9kYWwuY3VzdG9tU2x1Z0Rlc2MnXHJcbiAgIHwgJ21vZGFsLmRvbWFpbidcclxuICAgfCAnbW9kYWwuZG9tYWluRGVzYydcclxuICAgfCAnbW9kYWwuY3JlYXRlJ1xyXG4gICAvLyBTZXR0aW5ncyBkdWIuY29cclxuICAgfCAnc2V0dGluZ3MuZHViQXBpS2V5J1xyXG4gICB8ICdzZXR0aW5ncy5kdWJBcGlLZXlEZXNjJ1xyXG4gICB8ICdzZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZCdcclxuICAgfCAnc2V0dGluZ3MuZHViV29ya3NwYWNlSWREZXNjJ1xyXG4gICB8ICdzZXR0aW5ncy5kdWJDdXN0b21Eb21haW5zJ1xyXG4gICB8ICdzZXR0aW5ncy5kdWJDdXN0b21Eb21haW5zRGVzYydcclxuICAgfCAnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MnXHJcbiAgIHwgJ3NldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzRGVzYydcclxuICAgfCAnc2V0dGluZ3MuYWRkTWFwcGluZydcclxuICAgfCAnc2V0dGluZ3MuZG9tYWluJ1xyXG4gICB8ICdzZXR0aW5ncy5mb2xkZXInXHJcbiAgIHwgJ3NldHRpbmdzLnJlbW92ZSdcclxuICAgLy8gU2V0dGluZ3MgVmlld01vZGVcclxuICAgfCAnc2V0dGluZ3Mudmlld01vZGUnXHJcbiAgIHwgJ3NldHRpbmdzLmRlZmF1bHRWaWV3TW9kZSdcclxuICAgfCAnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlRGVzYydcclxuICAgfCAnc2V0dGluZ3MudGFiJ1xyXG4gICB8ICdzZXR0aW5ncy5zaWRlYmFyJ1xyXG4gICB8ICdzZXR0aW5ncy5vdmVybGF5J1xyXG4gICAvLyBEYXNoYm9hcmRcclxuICAgfCAnZGFzaGJvYXJkLnRpdGxlJ1xyXG4gICB8ICdkYXNoYm9hcmQubm9MaW5rcydcclxuICAgfCAnZGFzaGJvYXJkLmxvYWRpbmcnXHJcbiAgIHwgJ2Rhc2hib2FyZC5lcnJvcidcclxuICAgfCAnc2V0dGluZ3MuZG9tYWluQW5kRm9sZGVyJ1xyXG4gICB8ICdzZXR0aW5ncy5mb2xkZXJQbGFjZWhvbGRlcidcclxuICAgfCAnc2V0dGluZ3Muc2F2ZSdcclxuICAgfCAnc2V0dGluZ3MucmVmcmVzaERvbWFpbnMnXHJcbiAgIHwgJ3NldHRpbmdzLnJlZnJlc2hEb21haW5zRGVzYydcclxuICAgfCAnc2V0dGluZ3MucmVmcmVzaCdcclxuICAgfCAnbm90aWNlcy5kb21haW5zUmVmcmVzaGVkJztcclxuXHJcbmV4cG9ydCBjb25zdCB0cmFuc2xhdGlvbnM6IHsgW2xhbmc6IHN0cmluZ106IFJlY29yZDxUcmFuc2xhdGlvbktleSwgc3RyaW5nPiB9ID0ge1xyXG4gICBlbjoge1xyXG4gICAgICAvLyBOb3RpY2VzXHJcbiAgICAgICdub3RpY2VzLnNhdmVkJzogJ1x1MjcwNSBTZXR0aW5ncyBzYXZlZCcsXHJcbiAgICAgICdub3RpY2VzLmVycm9yJzogJ1x1Mjc0QyBFcnJvcjoge21lc3NhZ2V9JyxcclxuICAgICAgJ25vdGljZXMuc3VjY2Vzcyc6ICdcdTI3MDUgT3BlcmF0aW9uIHN1Y2Nlc3NmdWwnLFxyXG4gICAgICAnbm90aWNlcy5saW5rQ3JlYXRlZCc6ICdcdTI3MDUgU2hvcnQgbGluayBjcmVhdGVkIHN1Y2Nlc3NmdWxseScsXHJcbiAgICAgICdub3RpY2VzLnVybFJlcXVpcmVkJzogJ1x1Mjc0QyBEZXN0aW5hdGlvbiBVUkwgaXMgcmVxdWlyZWQnLFxyXG4gICAgICAvLyBNb2RhbFxyXG4gICAgICAnbW9kYWwuY3JlYXRlU2hvcnRMaW5rJzogJ0NyZWF0ZSBTaG9ydCBMaW5rJyxcclxuICAgICAgJ21vZGFsLmRlc3RpbmF0aW9uVXJsJzogJ0Rlc3RpbmF0aW9uIFVSTCcsXHJcbiAgICAgICdtb2RhbC5kZXN0aW5hdGlvblVybERlc2MnOiAnVGhlIFVSTCB5b3Ugd2FudCB0byBzaG9ydGVuJyxcclxuICAgICAgJ21vZGFsLmFuY2hvcic6ICdMaW5rIFRleHQnLFxyXG4gICAgICAnbW9kYWwuYW5jaG9yRGVzYyc6ICdUaGUgdGV4dCB0aGF0IHdpbGwgYmUgZGlzcGxheWVkIGZvciB0aGUgbGluaycsXHJcbiAgICAgICdtb2RhbC5hbmNob3JQbGFjZWhvbGRlcic6ICdDbGljayBoZXJlJyxcclxuICAgICAgJ21vZGFsLmN1c3RvbVNsdWcnOiAnQ3VzdG9tIFNsdWcnLFxyXG4gICAgICAnbW9kYWwuY3VzdG9tU2x1Z0Rlc2MnOiAnQ3VzdG9tIHBhcnQgb2YgdGhlIHNob3J0IFVSTCAob3B0aW9uYWwpJyxcclxuICAgICAgJ21vZGFsLmRvbWFpbic6ICdEb21haW4nLFxyXG4gICAgICAnbW9kYWwuZG9tYWluRGVzYyc6ICdDaG9vc2UgdGhlIGRvbWFpbiBmb3IgeW91ciBzaG9ydCBsaW5rJyxcclxuICAgICAgJ21vZGFsLmNyZWF0ZSc6ICdDcmVhdGUnLFxyXG4gICAgICAvLyBTZXR0aW5ncyBkdWIuY29cclxuICAgICAgJ3NldHRpbmdzLmR1YkFwaUtleSc6ICdkdWIuY28gQVBJIEtleScsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJBcGlLZXlEZXNjJzogJ1lvdXIgZHViLmNvIEFQSSBrZXkgZm9yIGF1dGhlbnRpY2F0aW9uJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkJzogJ2R1Yi5jbyBXb3Jrc3BhY2UgSUQnLFxyXG4gICAgICAnc2V0dGluZ3MuZHViV29ya3NwYWNlSWREZXNjJzogJ09wdGlvbmFsOiBUaGUgSUQgb2YgdGhlIHdvcmtzcGFjZSB3aGVyZSB5b3Ugd2FudCB0byBjcmVhdGUgbGlua3MgKGZvdW5kIGluIHRoZSBVUkw6IGFwcC5kdWIuY28vW3dvcmtzcGFjZS1pZF0pLiBJZiBub3Qgc2V0LCBsaW5rcyB3aWxsIGJlIGNyZWF0ZWQgaW4geW91ciBkZWZhdWx0IHdvcmtzcGFjZS4nLFxyXG4gICAgICAnc2V0dGluZ3MuZHViQ3VzdG9tRG9tYWlucyc6ICdDdXN0b20gRG9tYWlucycsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJDdXN0b21Eb21haW5zRGVzYyc6ICdMaXN0IG9mIHlvdXIgY3VzdG9tIGRvbWFpbnMgKG9uZSBwZXIgbGluZSknLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MnOiAnRG9tYWluLUZvbGRlciBNYXBwaW5ncycsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5nc0Rlc2MnOiAnQ29uZmlndXJlIHdoaWNoIGRvbWFpbiB0byB1c2UgZm9yIGVhY2ggZm9sZGVyJyxcclxuICAgICAgJ3NldHRpbmdzLmFkZE1hcHBpbmcnOiAnQWRkIE5ldyBNYXBwaW5nJyxcclxuICAgICAgJ3NldHRpbmdzLmRvbWFpbic6ICdEb21haW4nLFxyXG4gICAgICAnc2V0dGluZ3MuZm9sZGVyJzogJ0ZvbGRlcicsXHJcbiAgICAgICdzZXR0aW5ncy5yZW1vdmUnOiAnUmVtb3ZlJyxcclxuICAgICAgLy8gU2V0dGluZ3MgVmlld01vZGVcclxuICAgICAgJ3NldHRpbmdzLnZpZXdNb2RlJzogJ1ZpZXcgTW9kZScsXHJcbiAgICAgICdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGUnOiAnRGVmYXVsdCBWaWV3IE1vZGUnLFxyXG4gICAgICAnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlRGVzYyc6ICdDaG9vc2UgaG93IHRoZSBsaW5rIGRldGFpbHMgd2lsbCBiZSBkaXNwbGF5ZWQnLFxyXG4gICAgICAnc2V0dGluZ3MudGFiJzogJ05ldyBUYWInLFxyXG4gICAgICAnc2V0dGluZ3Muc2lkZWJhcic6ICdSaWdodCBTaWRlYmFyJyxcclxuICAgICAgJ3NldHRpbmdzLm92ZXJsYXknOiAnT3ZlcmxheScsXHJcbiAgICAgIC8vIERhc2hib2FyZFxyXG4gICAgICAnZGFzaGJvYXJkLnRpdGxlJzogJ0xpbmtGbG93eiBEYXNoYm9hcmQnLFxyXG4gICAgICAnZGFzaGJvYXJkLm5vTGlua3MnOiAnTm8gc2hvcnQgbGlua3MgY3JlYXRlZCB5ZXQnLFxyXG4gICAgICAnZGFzaGJvYXJkLmxvYWRpbmcnOiAnTG9hZGluZyB5b3VyIGxpbmtzLi4uJyxcclxuICAgICAgJ2Rhc2hib2FyZC5lcnJvcic6ICdFcnJvciBsb2FkaW5nIGxpbmtzOiB7bWVzc2FnZX0nLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluQW5kRm9sZGVyJzogJ0RvbWFpbiBhbmQgRm9sZGVyIE1hcHBpbmcnLFxyXG4gICAgICAnc2V0dGluZ3MuZm9sZGVyUGxhY2Vob2xkZXInOiAnRm9sZGVyJyxcclxuICAgICAgJ3NldHRpbmdzLnNhdmUnOiAnU2F2ZScsXHJcbiAgICAgICdzZXR0aW5ncy5yZWZyZXNoRG9tYWlucyc6ICdSZWZyZXNoIERvbWFpbnMnLFxyXG4gICAgICAnc2V0dGluZ3MucmVmcmVzaERvbWFpbnNEZXNjJzogJ1JlZnJlc2ggdGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGRvbWFpbnMgZnJvbSBkdWIuY28nLFxyXG4gICAgICAnc2V0dGluZ3MucmVmcmVzaCc6ICdSZWZyZXNoJyxcclxuICAgICAgJ25vdGljZXMuZG9tYWluc1JlZnJlc2hlZCc6ICdcdTI3MDUgRG9tYWlucyBsaXN0IHJlZnJlc2hlZCdcclxuICAgfSxcclxuICAgZnI6IHtcclxuICAgICAgLy8gTm90aWNlc1xyXG4gICAgICAnbm90aWNlcy5zYXZlZCc6ICdcdTI3MDUgUGFyYW1cdTAwRTh0cmVzIHNhdXZlZ2FyZFx1MDBFOXMnLFxyXG4gICAgICAnbm90aWNlcy5lcnJvcic6ICdcdTI3NEMgRXJyZXVyOiB7bWVzc2FnZX0nLFxyXG4gICAgICAnbm90aWNlcy5zdWNjZXNzJzogJ1x1MjcwNSBPcFx1MDBFOXJhdGlvbiByXHUwMEU5dXNzaWUnLFxyXG4gICAgICAnbm90aWNlcy5saW5rQ3JlYXRlZCc6ICdcdTI3MDUgTGllbiBjb3VydCBjclx1MDBFOVx1MDBFOSBhdmVjIHN1Y2NcdTAwRThzJyxcclxuICAgICAgJ25vdGljZXMudXJsUmVxdWlyZWQnOiAnXHUyNzRDIExcXCdVUkwgZGUgZGVzdGluYXRpb24gZXN0IHJlcXVpc2UnLFxyXG4gICAgICAvLyBNb2RhbFxyXG4gICAgICAnbW9kYWwuY3JlYXRlU2hvcnRMaW5rJzogJ0NyXHUwMEU5ZXIgdW4gbGllbiBjb3VydCcsXHJcbiAgICAgICdtb2RhbC5kZXN0aW5hdGlvblVybCc6ICdVUkwgZGUgZGVzdGluYXRpb24nLFxyXG4gICAgICAnbW9kYWwuZGVzdGluYXRpb25VcmxEZXNjJzogJ0xcXCdVUkwgcXVlIHZvdXMgc291aGFpdGV6IHJhY2NvdXJjaXInLFxyXG4gICAgICAnbW9kYWwuYW5jaG9yJzogJ1RleHRlIGR1IGxpZW4nLFxyXG4gICAgICAnbW9kYWwuYW5jaG9yRGVzYyc6ICdMZSB0ZXh0ZSBxdWkgc2VyYSBhZmZpY2hcdTAwRTkgcG91ciBsZSBsaWVuJyxcclxuICAgICAgJ21vZGFsLmFuY2hvclBsYWNlaG9sZGVyJzogJ0NsaXF1ZXogaWNpJyxcclxuICAgICAgJ21vZGFsLmN1c3RvbVNsdWcnOiAnU2x1ZyBwZXJzb25uYWxpc1x1MDBFOScsXHJcbiAgICAgICdtb2RhbC5jdXN0b21TbHVnRGVzYyc6ICdQYXJ0aWUgcGVyc29ubmFsaXNcdTAwRTllIGRlIGxcXCdVUkwgY291cnRlIChvcHRpb25uZWwpJyxcclxuICAgICAgJ21vZGFsLmRvbWFpbic6ICdEb21haW5lJyxcclxuICAgICAgJ21vZGFsLmRvbWFpbkRlc2MnOiAnQ2hvaXNpc3NleiBsZSBkb21haW5lIHBvdXIgdm90cmUgbGllbiBjb3VydCcsXHJcbiAgICAgICdtb2RhbC5jcmVhdGUnOiAnQ3JcdTAwRTllcicsXHJcbiAgICAgIC8vIFNldHRpbmdzIGR1Yi5jb1xyXG4gICAgICAnc2V0dGluZ3MuZHViQXBpS2V5JzogJ0NsXHUwMEU5IEFQSSBkdWIuY28nLFxyXG4gICAgICAnc2V0dGluZ3MuZHViQXBpS2V5RGVzYyc6ICdWb3RyZSBjbFx1MDBFOSBBUEkgZHViLmNvIHBvdXIgbFxcJ2F1dGhlbnRpZmljYXRpb24nLFxyXG4gICAgICAnc2V0dGluZ3MuZHViV29ya3NwYWNlSWQnOiAnSUQgV29ya3NwYWNlIGR1Yi5jbycsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZERlc2MnOiAnT3B0aW9ubmVsIDogTFxcJ0lEIGR1IHdvcmtzcGFjZSBvXHUwMEY5IHZvdXMgc291aGFpdGV6IGNyXHUwMEU5ZXIgdm9zIGxpZW5zICh2aXNpYmxlIGRhbnMgbFxcJ1VSTCA6IGFwcC5kdWIuY28vW3dvcmtzcGFjZS1pZF0pLiBTaSBub24gcmVuc2VpZ25cdTAwRTksIGxlcyBsaWVucyBzZXJvbnQgY3JcdTAwRTlcdTAwRTlzIGRhbnMgdm90cmUgd29ya3NwYWNlIHBhciBkXHUwMEU5ZmF1dC4nLFxyXG4gICAgICAnc2V0dGluZ3MuZHViQ3VzdG9tRG9tYWlucyc6ICdEb21haW5lcyBwZXJzb25uYWxpc1x1MDBFOXMnLFxyXG4gICAgICAnc2V0dGluZ3MuZHViQ3VzdG9tRG9tYWluc0Rlc2MnOiAnTGlzdGUgZGUgdm9zIGRvbWFpbmVzIHBlcnNvbm5hbGlzXHUwMEU5cyAodW4gcGFyIGxpZ25lKScsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncyc6ICdBc3NvY2lhdGlvbnMgRG9tYWluZXMtRG9zc2llcnMnLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3NEZXNjJzogJ0NvbmZpZ3VyZXogcXVlbCBkb21haW5lIHV0aWxpc2VyIHBvdXIgY2hhcXVlIGRvc3NpZXInLFxyXG4gICAgICAnc2V0dGluZ3MuYWRkTWFwcGluZyc6ICdBam91dGVyIHVuZSBub3V2ZWxsZSBhc3NvY2lhdGlvbicsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW4nOiAnRG9tYWluZScsXHJcbiAgICAgICdzZXR0aW5ncy5mb2xkZXInOiAnRG9zc2llcicsXHJcbiAgICAgICdzZXR0aW5ncy5yZW1vdmUnOiAnU3VwcHJpbWVyJyxcclxuICAgICAgLy8gU2V0dGluZ3MgVmlld01vZGVcclxuICAgICAgJ3NldHRpbmdzLnZpZXdNb2RlJzogJ01vZGUgZFxcJ2FmZmljaGFnZScsXHJcbiAgICAgICdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGUnOiAnTW9kZSBkXFwnYWZmaWNoYWdlIHBhciBkXHUwMEU5ZmF1dCcsXHJcbiAgICAgICdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGVEZXNjJzogJ0Nob2lzaXNzZXogY29tbWVudCBsZXMgZFx1MDBFOXRhaWxzIGRlcyBsaWVucyBzZXJvbnQgYWZmaWNoXHUwMEU5cycsXHJcbiAgICAgICdzZXR0aW5ncy50YWInOiAnTm91dmVsIG9uZ2xldCcsXHJcbiAgICAgICdzZXR0aW5ncy5zaWRlYmFyJzogJ0JhcnJlIGxhdFx1MDBFOXJhbGUnLFxyXG4gICAgICAnc2V0dGluZ3Mub3ZlcmxheSc6ICdTdXBlcnBvc2l0aW9uJyxcclxuICAgICAgLy8gRGFzaGJvYXJkXHJcbiAgICAgICdkYXNoYm9hcmQudGl0bGUnOiAnVGFibGVhdSBkZSBib3JkIExpbmtGbG93eicsXHJcbiAgICAgICdkYXNoYm9hcmQubm9MaW5rcyc6ICdBdWN1biBsaWVuIGNvdXJ0IGNyXHUwMEU5XHUwMEU5IHBvdXIgbGUgbW9tZW50JyxcclxuICAgICAgJ2Rhc2hib2FyZC5sb2FkaW5nJzogJ0NoYXJnZW1lbnQgZGUgdm9zIGxpZW5zLi4uJyxcclxuICAgICAgJ2Rhc2hib2FyZC5lcnJvcic6ICdFcnJldXIgbG9ycyBkdSBjaGFyZ2VtZW50IGRlcyBsaWVucyA6IHttZXNzYWdlfScsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5BbmRGb2xkZXInOiAnQXNzb2NpYXRpb24gRG9tYWluZSBldCBEb3NzaWVyJyxcclxuICAgICAgJ3NldHRpbmdzLmZvbGRlclBsYWNlaG9sZGVyJzogJ0Rvc3NpZXInLFxyXG4gICAgICAnc2V0dGluZ3Muc2F2ZSc6ICdTYXV2ZWdhcmRlcicsXHJcbiAgICAgICdzZXR0aW5ncy5yZWZyZXNoRG9tYWlucyc6ICdSYWZyYVx1MDBFRWNoaXIgbGVzIGRvbWFpbmVzJyxcclxuICAgICAgJ3NldHRpbmdzLnJlZnJlc2hEb21haW5zRGVzYyc6ICdBY3R1YWxpc2VyIGxhIGxpc3RlIGRlcyBkb21haW5lcyBkaXNwb25pYmxlcyBkZXB1aXMgZHViLmNvJyxcclxuICAgICAgJ3NldHRpbmdzLnJlZnJlc2gnOiAnUmFmcmFcdTAwRUVjaGlyJyxcclxuICAgICAgJ25vdGljZXMuZG9tYWluc1JlZnJlc2hlZCc6ICdcdTI3MDUgTGlzdGUgZGVzIGRvbWFpbmVzIGFjdHVhbGlzXHUwMEU5ZSdcclxuICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNsYXNzIFRyYW5zbGF0aW9ucyB7XHJcbiAgIHByaXZhdGUgY3VycmVudExhbmc6IHN0cmluZztcclxuXHJcbiAgIGNvbnN0cnVjdG9yKGluaXRpYWxMYW5nOiBzdHJpbmcgPSAnZnInKSB7XHJcbiAgICAgIHRoaXMuY3VycmVudExhbmcgPSBpbml0aWFsTGFuZztcclxuICAgfVxyXG5cclxuICAgc2V0TGFuZ3VhZ2UobGFuZzogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgIHRoaXMuY3VycmVudExhbmcgPSBsYW5nO1xyXG4gICB9XHJcblxyXG4gICB0KGtleTogVHJhbnNsYXRpb25LZXkpOiBzdHJpbmcge1xyXG4gICAgICByZXR1cm4gdHJhbnNsYXRpb25zW3RoaXMuY3VycmVudExhbmddPy5ba2V5XSB8fCB0cmFuc2xhdGlvbnNbJ2VuJ11ba2V5XSB8fCBrZXk7XHJcbiAgIH1cclxufVxyXG4iLCAiaW1wb3J0IHsgUGx1Z2luLCBOb3RpY2UgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBEZWZhdWx0U2V0dGluZ3MgfSBmcm9tICcuL1NldHRpbmdzJztcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcbmltcG9ydCB7IENyZWF0ZVNob3J0TGlua01vZGFsIH0gZnJvbSAnLi9TaG9ydExpbmtNb2RhbCc7XG5cbmV4cG9ydCBjbGFzcyBIb3RrZXlzIHtcbiAgIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcbiAgICAgIHByaXZhdGUgc2V0dGluZ3M6IERlZmF1bHRTZXR0aW5ncyxcbiAgICAgIHByaXZhdGUgdHJhbnNsYXRpb25zOiBUcmFuc2xhdGlvbnNcbiAgICkge31cblxuICAgcmVnaXN0ZXJIb3RrZXlzKCkge1xuICAgICAgLy8gQ29tbWFuZGUgcG91ciBjclx1MDBFOWVyIHVuIG5vdXZlYXUgbGllbiBjb3VydFxuICAgICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgICAgICBpZDogJ2NyZWF0ZS1zaG9ydC1saW5rJyxcbiAgICAgICAgIG5hbWU6IHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmNyZWF0ZVNob3J0TGluaycpLFxuICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5kdWJBcGlLZXkpIHtcbiAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsICdBUEkga2V5IG5vdCBjb25maWd1cmVkJykpO1xuICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBuZXcgQ3JlYXRlU2hvcnRMaW5rTW9kYWwoXG4gICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXG4gICAgICAgICAgICAgICB0aGlzLnBsdWdpbixcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgICAgICAgICB0aGlzLnRyYW5zbGF0aW9uc1xuICAgICAgICAgICAgKS5vcGVuKCk7XG4gICAgICAgICB9LFxuICAgICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJDdHJsXCIsIFwiU2hpZnRcIl0sIGtleTogXCJsXCIgfV1cbiAgICAgIH0pO1xuICAgfVxufVxuIiwgImltcG9ydCB7IE1vZGFsLCBTZXR0aW5nLCBBcHAsIFBsdWdpbiwgTm90aWNlLCBNYXJrZG93blZpZXcsIHJlcXVlc3RVcmwgfSBmcm9tICdvYnNpZGlhbic7XHJcbmltcG9ydCB7IERlZmF1bHRTZXR0aW5ncywgU2V0dGluZ3MgfSBmcm9tICcuL1NldHRpbmdzJztcclxuaW1wb3J0IHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi9UcmFuc2xhdGlvbnMnO1xyXG5pbXBvcnQgeyB2YWxpZGF0ZURvbWFpblVybCB9IGZyb20gJy4vRG9tYWluVmFsaWRhdGlvbnMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIENyZWF0ZVNob3J0TGlua01vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG4gICBwcml2YXRlIHVybDogc3RyaW5nID0gJyc7XHJcbiAgIHByaXZhdGUgc2x1Zzogc3RyaW5nID0gJyc7XHJcbiAgIHByaXZhdGUgc2VsZWN0ZWREb21haW46IHN0cmluZyA9ICcnO1xyXG4gICBwcml2YXRlIGFuY2hvcjogc3RyaW5nID0gJyc7XHJcbiAgIHByaXZhdGUgZG9tYWluczogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICBhcHA6IEFwcCxcclxuICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcclxuICAgICAgcHJpdmF0ZSBzZXR0aW5nczogRGVmYXVsdFNldHRpbmdzLFxyXG4gICAgICBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zXHJcbiAgICkge1xyXG4gICAgICBzdXBlcihhcHApO1xyXG4gICB9XHJcblxyXG4gICBhc3luYyBvbk9wZW4oKSB7XHJcbiAgICAgIC8vIENoYXJnZXIgbGVzIGRvbWFpbmVzIGRpc3BvbmlibGVzXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgIHRoaXMuZG9tYWlucyA9IGF3YWl0IFNldHRpbmdzLmdldENhY2hlZERvbWFpbnMoXHJcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5LFxyXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLmR1YldvcmtzcGFjZUlkXHJcbiAgICAgICAgICk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgZG9tYWluczonLCBlcnJvcik7XHJcbiAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsICdGYWlsZWQgdG8gbG9hZCBhdmFpbGFibGUgZG9tYWlucycpKTtcclxuICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xyXG4gICAgICBjb250ZW50RWwuZW1wdHkoKTtcclxuXHJcbiAgICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuY3JlYXRlU2hvcnRMaW5rJykgfSk7XHJcblxyXG4gICAgICAvLyBVUkwgZGUgZGVzdGluYXRpb25cclxuICAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxyXG4gICAgICAgICAuc2V0TmFtZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5kZXN0aW5hdGlvblVybCcpKVxyXG4gICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5kZXN0aW5hdGlvblVybERlc2MnKSlcclxuICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XHJcbiAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcignaHR0cHM6Ly9leGVtcGxlLmNvbS9wYWdlLWxvbmd1ZScpXHJcbiAgICAgICAgICAgIC5vbkNoYW5nZSh2YWx1ZSA9PiB0aGlzLnVybCA9IHZhbHVlKSk7XHJcblxyXG4gICAgICAvLyBUZXh0ZSBkdSBsaWVuIChhbmNyZSlcclxuICAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxyXG4gICAgICAgICAuc2V0TmFtZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5hbmNob3InKSlcclxuICAgICAgICAgLnNldERlc2ModGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuYW5jaG9yRGVzYycpKVxyXG4gICAgICAgICAuYWRkVGV4dCh0ZXh0ID0+IHRleHRcclxuICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmFuY2hvclBsYWNlaG9sZGVyJykpXHJcbiAgICAgICAgICAgIC5vbkNoYW5nZSh2YWx1ZSA9PiB0aGlzLmFuY2hvciA9IHZhbHVlKSk7XHJcblxyXG4gICAgICAvLyBTbHVnIHBlcnNvbm5hbGlzXHUwMEU5XHJcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcclxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuY3VzdG9tU2x1ZycpKVxyXG4gICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5jdXN0b21TbHVnRGVzYycpKVxyXG4gICAgICAgICAuYWRkVGV4dCh0ZXh0ID0+IHRleHRcclxuICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdtb24tbGllbicpXHJcbiAgICAgICAgICAgIC5vbkNoYW5nZSh2YWx1ZSA9PiB0aGlzLnNsdWcgPSB2YWx1ZSkpO1xyXG5cclxuICAgICAgLy8gRG9tYWluZSBwZXJzb25uYWxpc1x1MDBFOVxyXG4gICAgICBjb25zdCBkZWZhdWx0RG9tYWluID0gdGhpcy5nZXREb21haW5Gb3JDdXJyZW50RmlsZSgpO1xyXG4gICAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXHJcbiAgICAgICAgIC5zZXROYW1lKHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmRvbWFpbicpKVxyXG4gICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5kb21haW5EZXNjJykpXHJcbiAgICAgICAgIC5hZGREcm9wZG93bihkcm9wZG93biA9PiB7XHJcbiAgICAgICAgICAgIC8vIEFqb3V0ZXIgdG91cyBsZXMgZG9tYWluZXMgZGlzcG9uaWJsZXNcclxuICAgICAgICAgICAgdGhpcy5kb21haW5zLmZvckVhY2goZG9tYWluID0+IHtcclxuICAgICAgICAgICAgICAgZHJvcGRvd24uYWRkT3B0aW9uKGRvbWFpbiwgZG9tYWluKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGRyb3Bkb3duLnNldFZhbHVlKGRlZmF1bHREb21haW4pO1xyXG4gICAgICAgICAgICBkcm9wZG93bi5vbkNoYW5nZSh2YWx1ZSA9PiB0aGlzLnNlbGVjdGVkRG9tYWluID0gdmFsdWUpO1xyXG4gICAgICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEJvdXRvbnNcclxuICAgICAgY29uc3QgYnV0dG9uQ29udGFpbmVyID0gY29udGVudEVsLmNyZWF0ZUVsKCdkaXYnLCB7IGNsczogJ21vZGFsLWJ1dHRvbi1jb250YWluZXInIH0pO1xyXG4gICAgICBcclxuICAgICAgLy8gQm91dG9uIEFubnVsZXJcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IHRleHQ6ICdBbm51bGVyJyB9KVxyXG4gICAgICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xyXG4gICAgICBcclxuICAgICAgLy8gQm91dG9uIENyXHUwMEU5ZXJcclxuICAgICAgY29uc3QgY3JlYXRlQnV0dG9uID0gYnV0dG9uQ29udGFpbmVyLmNyZWF0ZUVsKCdidXR0b24nLCB7XHJcbiAgICAgICAgIHRleHQ6IHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmNyZWF0ZScpLFxyXG4gICAgICAgICBjbHM6ICdtb2QtY3RhJ1xyXG4gICAgICB9KTtcclxuICAgICAgY3JlYXRlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICBpZiAoIXRoaXMudXJsKSB7XHJcbiAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy51cmxSZXF1aXJlZCcpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIHRoaXMuY3JlYXRlU2hvcnRMaW5rKHRoaXMudXJsLCB0aGlzLnNsdWcsIHRoaXMuc2VsZWN0ZWREb21haW4gfHwgZGVmYXVsdERvbWFpbik7XHJcbiAgICAgIH0pO1xyXG4gICB9XHJcblxyXG4gICBvbkNsb3NlKCkge1xyXG4gICAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcclxuICAgICAgY29udGVudEVsLmVtcHR5KCk7XHJcbiAgIH1cclxuXHJcbiAgIHByaXZhdGUgZ2V0RG9tYWluRm9yQ3VycmVudEZpbGUoKTogc3RyaW5nIHtcclxuICAgICAgY29uc3QgYWN0aXZlRmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XHJcbiAgICAgIGlmICghYWN0aXZlRmlsZSkgcmV0dXJuIHRoaXMuZG9tYWluc1swXSB8fCAnZHViLnNoJztcclxuXHJcbiAgICAgIC8vIFJcdTAwRTljdXBcdTAwRTlyZXIgbGUgY2hlbWluIGR1IGZpY2hpZXIgYWN0aWZcclxuICAgICAgY29uc3QgZmlsZVBhdGggPSBhY3RpdmVGaWxlLnBhdGg7XHJcblxyXG4gICAgICAvLyBUcm91dmVyIGxlIG1hcHBpbmcgbGUgcGx1cyBzcFx1MDBFOWNpZmlxdWUgcXVpIGNvcnJlc3BvbmQgYXUgY2hlbWluIGR1IGZpY2hpZXJcclxuICAgICAgbGV0IGJlc3RNYXRjaDogeyBkb21haW46IHN0cmluZywgZGVwdGg6IG51bWJlciB9ID0geyBkb21haW46IHRoaXMuZG9tYWluc1swXSB8fCAnZHViLnNoJywgZGVwdGg6IC0xIH07XHJcblxyXG4gICAgICB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzLmZvckVhY2gobWFwcGluZyA9PiB7XHJcbiAgICAgICAgIC8vIFNpIGxlIGZpY2hpZXIgZXN0IGRhbnMgY2UgZG9zc2llciBvdSB1biBzb3VzLWRvc3NpZXJcclxuICAgICAgICAgaWYgKGZpbGVQYXRoLnN0YXJ0c1dpdGgobWFwcGluZy5mb2xkZXIpKSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGVyIGxhIHByb2ZvbmRldXIgZHUgZG9zc2llciBtYXBwXHUwMEU5XHJcbiAgICAgICAgICAgIGNvbnN0IGRlcHRoID0gbWFwcGluZy5mb2xkZXIuc3BsaXQoJy8nKS5sZW5ndGg7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBTaSBjJ2VzdCBsZSBtYXBwaW5nIGxlIHBsdXMgc3BcdTAwRTljaWZpcXVlIHRyb3V2XHUwMEU5IGp1c3F1J1x1MDBFMCBwclx1MDBFOXNlbnRcclxuICAgICAgICAgICAgaWYgKGRlcHRoID4gYmVzdE1hdGNoLmRlcHRoKSB7XHJcbiAgICAgICAgICAgICAgIGJlc3RNYXRjaCA9IHtcclxuICAgICAgICAgICAgICAgICAgZG9tYWluOiBtYXBwaW5nLmRvbWFpbixcclxuICAgICAgICAgICAgICAgICAgZGVwdGg6IGRlcHRoXHJcbiAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBiZXN0TWF0Y2guZG9tYWluO1xyXG4gICB9XHJcblxyXG4gICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNob3J0TGluayh1cmw6IHN0cmluZywgc2x1Zzogc3RyaW5nLCBkb21haW46IHN0cmluZykge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgICBjb25zb2xlLmxvZygnQ3JlYXRpbmcgc2hvcnQgbGluayB3aXRoOicsIHsgdXJsLCBzbHVnLCBkb21haW4gfSk7XHJcbiAgICAgICAgIFxyXG4gICAgICAgICAvLyBTJ2Fzc3VyZXIgcXVlIGxlIGRvbWFpbmUgZXN0IGRcdTAwRTlmaW5pXHJcbiAgICAgICAgIGlmICghZG9tYWluKSB7XHJcbiAgICAgICAgICAgIGRvbWFpbiA9ICdkdWIuc2gnO1xyXG4gICAgICAgICB9XHJcblxyXG4gICAgICAgICAvLyBWYWxpZGVyIGV0IGZvcm1hdGVyIGwnVVJMXHJcbiAgICAgICAgIGlmICghdXJsLnN0YXJ0c1dpdGgoJ2h0dHA6Ly8nKSAmJiAhdXJsLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykpIHtcclxuICAgICAgICAgICAgdXJsID0gJ2h0dHBzOi8vJyArIHVybDtcclxuICAgICAgICAgfVxyXG5cclxuICAgICAgICAgLy8gVmFsaWRlciBsYSBjb21iaW5haXNvbiBkb21haW5lL1VSTFxyXG4gICAgICAgICBpZiAoIXZhbGlkYXRlRG9tYWluVXJsKGRvbWFpbiwgdXJsLCB0aGlzLnRyYW5zbGF0aW9ucykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIFxyXG4gICAgICAgICAvLyBWYWxpZGVyIGxlIHNsdWdcclxuICAgICAgICAgaWYgKHNsdWcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2x1Z1JlZ2V4ID0gL15bYS16QS1aMC05LV0rJC87XHJcbiAgICAgICAgICAgIGlmICghc2x1Z1JlZ2V4LnRlc3Qoc2x1ZykpIHtcclxuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgJ0xlIHNsdWcgbmUgcGV1dCBjb250ZW5pciBxdWUgZGVzIGxldHRyZXMsIGRlcyBjaGlmZnJlcyBldCBkZXMgdGlyZXRzJykpO1xyXG4gICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gVlx1MDBFOXJpZmllciBsYSBsb25ndWV1ciBtaW5pbWFsZSBkdSBzbHVnICg0IGNhcmFjdFx1MDBFOHJlcyBwb3VyIGxlIHBsYW4gZ3JhdHVpdClcclxuICAgICAgICAgICAgaWYgKHNsdWcubGVuZ3RoIDwgNCkge1xyXG4gICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCAnTGUgc2x1ZyBkb2l0IGNvbnRlbmlyIGF1IG1vaW5zIDQgY2FyYWN0XHUwMEU4cmVzIGF2ZWMgbGUgcGxhbiBncmF0dWl0JykpO1xyXG4gICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgfVxyXG5cclxuICAgICAgICAgLy8gVlx1MDBFOXJpZmllciBzaSBsZSBkb21haW5lIGVzdCBkYW5zIGxhIGxpc3RlIGRlcyBkb21haW5lcyBkaXNwb25pYmxlc1xyXG4gICAgICAgICBpZiAoIXRoaXMuZG9tYWlucy5pbmNsdWRlcyhkb21haW4pKSB7XHJcbiAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsIGBMZSBkb21haW5lICR7ZG9tYWlufSBuJ2VzdCBwYXMgZGlzcG9uaWJsZS4gVmV1aWxsZXogZW4gY2hvaXNpciB1biBhdXRyZS5gKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgfVxyXG4gICAgICAgICBcclxuICAgICAgICAgY29uc3QgcGF5bG9hZCA9IHtcclxuICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgIGRvbWFpbjogZG9tYWluLFxyXG4gICAgICAgICAgICAuLi4oc2x1ZyAmJiB7IGtleTogc2x1ZyB9KSxcclxuICAgICAgICAgICAgLi4uKHRoaXMuc2V0dGluZ3MuZHViV29ya3NwYWNlSWQgJiYgeyBwcm9qZWN0SWQ6IHRoaXMuc2V0dGluZ3MuZHViV29ya3NwYWNlSWQgfSlcclxuICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgIGNvbnNvbGUubG9nKCdSZXF1ZXN0IHBheWxvYWQ6JywgcGF5bG9hZCk7XHJcbiAgICAgICAgIFxyXG4gICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xyXG4gICAgICAgICAgICB1cmw6ICdodHRwczovL2FwaS5kdWIuY28vbGlua3MnLFxyXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHt0aGlzLnNldHRpbmdzLmR1YkFwaUtleX1gLFxyXG4gICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXHJcbiAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgY29uc29sZS5sb2coJ1Jlc3BvbnNlIHN0YXR1czonLCByZXNwb25zZS5zdGF0dXMpO1xyXG4gICAgICAgICBjb25zb2xlLmxvZygnUmVzcG9uc2UgYm9keTonLCByZXNwb25zZS5qc29uKTtcclxuICAgICAgICAgY29uc29sZS5sb2coJ1Jlc3BvbnNlIGhlYWRlcnM6JywgcmVzcG9uc2UuaGVhZGVycyk7XHJcblxyXG4gICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDAgfHwgcmVzcG9uc2Uuc3RhdHVzID09PSAyMDEpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2hvcnRMaW5rID0gcmVzcG9uc2UuanNvbi5zaG9ydExpbms7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDcmVhdGVkIHNob3J0IGxpbms6Jywgc2hvcnRMaW5rKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZVZpZXcgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChhY3RpdmVWaWV3KSB7XHJcbiAgICAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGFjdGl2ZVZpZXcuZWRpdG9yO1xyXG4gICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYWN0aXZlVmlldy5maWxlO1xyXG5cclxuICAgICAgICAgICAgICAgaWYgKGVkaXRvciAmJiBmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFV0aWxpc2VyIGwnYW5jcmUgc2kgZWxsZSBlc3QgZFx1MDBFOWZpbmllLCBzaW5vbiB1dGlsaXNlciBsJ1VSTCBkZSBkZXN0aW5hdGlvblxyXG4gICAgICAgICAgICAgICAgICBjb25zdCBsaW5rVGV4dCA9IHRoaXMuYW5jaG9yIHx8IHVybDtcclxuICAgICAgICAgICAgICAgICAgLy8gQ3JcdTAwRTllciBsZSBub3V2ZWF1IGxpZW4gTWFya2Rvd25cclxuICAgICAgICAgICAgICAgICAgY29uc3QgbWFya2Rvd25MaW5rID0gYFske2xpbmtUZXh0fV0oJHtzaG9ydExpbmt9KWA7XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSW5zZXJ0aW5nIG1hcmtkb3duIGxpbms6JywgbWFya2Rvd25MaW5rKTtcclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIC8vIE9idGVuaXIgbGEgcG9zaXRpb24gZHUgY3Vyc2V1clxyXG4gICAgICAgICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yKCk7XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAvLyBJbnNcdTAwRTlyZXIgbGUgbGllbiBcdTAwRTAgbGEgcG9zaXRpb24gZHUgY3Vyc2V1clxyXG4gICAgICAgICAgICAgICAgICBlZGl0b3IucmVwbGFjZVJhbmdlKG1hcmtkb3duTGluaywgY3Vyc29yKTtcclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIC8vIE1ldHRyZSBcdTAwRTAgam91ciBsZXMgbGllbnMgZGFucyBsZSBjYWNoZSBkJ09ic2lkaWFuXHJcbiAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMubGlua0NyZWF0ZWQnKSk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcmVzcG9uc2U6JywgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZXNwb25zZSBib2R5OicsIHJlc3BvbnNlLmpzb24pO1xyXG4gICAgICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gcmVzcG9uc2UuanNvbj8uZXJyb3IgfHwgcmVzcG9uc2UuanNvbj8ubWVzc2FnZSB8fCAnVW5rbm93biBlcnJvcic7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBHXHUwMEU5cmVyIGxlcyBlcnJldXJzIHNwXHUwMEU5Y2lmaXF1ZXNcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDA5KSB7XHJcbiAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9ICdDZSBzbHVnIGVzdCBkXHUwMEU5alx1MDBFMCB1dGlsaXNcdTAwRTkuIFZldWlsbGV6IGVuIGNob2lzaXIgdW4gYXV0cmUuJztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCkge1xyXG4gICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSAnVVJMIGludmFsaWRlIG91IHBhcmFtXHUwMEU4dHJlcyBpbmNvcnJlY3RzLic7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gJ0NsXHUwMEU5IEFQSSBpbnZhbGlkZSBvdSBleHBpclx1MDBFOWUuJztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMykge1xyXG4gICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSAnQWNjXHUwMEU4cyByZWZ1c1x1MDBFOS4gVlx1MDBFOXJpZmlleiB2b3MgcGVybWlzc2lvbnMuJztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQyMikge1xyXG4gICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCc0MjIgRXJyb3IgZGV0YWlsczonLCByZXNwb25zZS5qc29uKTtcclxuICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmpzb24/LmNvZGUgPT09ICdkb21haW5fbm90X2ZvdW5kJykge1xyXG4gICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBgTGUgZG9tYWluZSAke2RvbWFpbn0gbidlc3QgcGFzIGRpc3BvbmlibGUuIFZldWlsbGV6IGVuIGNob2lzaXIgdW4gYXV0cmUuYDtcclxuICAgICAgICAgICAgICAgICAgLy8gUmFmcmFcdTAwRUVjaGlyIGxhIGxpc3RlIGRlcyBkb21haW5lc1xyXG4gICAgICAgICAgICAgICAgICB0aGlzLmRvbWFpbnMgPSBhd2FpdCBTZXR0aW5ncy5nZXRDYWNoZWREb21haW5zKFxyXG4gICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmR1YkFwaUtleSxcclxuICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZCxcclxuICAgICAgICAgICAgICAgICAgICAgdHJ1ZSAvLyBmb3JjZXIgbGUgcmFmcmFcdTAwRUVjaGlzc2VtZW50XHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UuanNvbj8uY29kZSA9PT0gJ2RvbWFpbl9ub3RfYWxsb3dlZCcpIHtcclxuICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gYFZvdXMgbidhdmV6IHBhcyBhY2NcdTAwRThzIGF1IGRvbWFpbmUgJHtkb21haW59LiBWZXVpbGxleiBlbiBjaG9pc2lyIHVuIGF1dHJlLmA7XHJcbiAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UuanNvbj8uY29kZSA9PT0gJ2ludmFsaWRfZG9tYWluJykge1xyXG4gICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBgTGUgZG9tYWluZSAke2RvbWFpbn0gbidlc3QgcGFzIHZhbGlkZS5gO1xyXG4gICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSByZXNwb25zZS5qc29uPy5tZXNzYWdlIHx8ICdMZXMgZG9ublx1MDBFOWVzIGZvdXJuaWVzIHNvbnQgaW52YWxpZGVzLiBWXHUwMEU5cmlmaWV6IGxcXCdVUkwgZXQgbGUgc2x1Zy4nO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsIGAke2Vycm9yTWVzc2FnZX1gKSk7XHJcbiAgICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgY29uc29sZS5lcnJvcignRXJyZXVyIGxvcnMgZGUgbGEgY3JcdTAwRTlhdGlvbiBkdSBsaWVuIGNvdXJ0OicsIGVycm9yKTtcclxuICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZGV0YWlsczonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RhY2s6JywgZXJyb3Iuc3RhY2spO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIFxyXG4gICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcclxuICAgICAgICAgaWYgKGVycm9yTWVzc2FnZS5pbmNsdWRlcygnc3RhdHVzIDQwOScpKSB7XHJcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9ICdDZSBzbHVnIGVzdCBkXHUwMEU5alx1MDBFMCB1dGlsaXNcdTAwRTkuIFZldWlsbGV6IGVuIGNob2lzaXIgdW4gYXV0cmUuJztcclxuICAgICAgICAgfSBlbHNlIGlmIChlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ3N0YXR1cyA0MjInKSkge1xyXG4gICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSAnTGVzIGRvbm5cdTAwRTllcyBmb3VybmllcyBzb250IGludmFsaWRlcy4gVlx1MDBFOXJpZmlleiBsXFwnVVJMIGV0IGxlIGRvbWFpbmUuJztcclxuICAgICAgICAgfVxyXG4gICAgICAgICBcclxuICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgZXJyb3JNZXNzYWdlKSk7XHJcbiAgICAgIH1cclxuICAgfVxyXG59IiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi9UcmFuc2xhdGlvbnMnO1xyXG5cclxuaW50ZXJmYWNlIERvbWFpblZhbGlkYXRpb24ge1xyXG4gICBhbGxvd2VkRG9tYWluczogc3RyaW5nW107XHJcbiAgIGVycm9yTWVzc2FnZTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgRE9NQUlOX1ZBTElEQVRJT05TOiB7IFtrZXk6IHN0cmluZ106IERvbWFpblZhbGlkYXRpb24gfSA9IHtcclxuICAgJ2dpdC5uZXcnOiB7XHJcbiAgICAgIGFsbG93ZWREb21haW5zOiBbJ2dpdGh1Yi5jb20nXSxcclxuICAgICAgZXJyb3JNZXNzYWdlOiAnTGUgZG9tYWluZSBnaXQubmV3IG5lIHBldXQgXHUwMEVBdHJlIHV0aWxpc1x1MDBFOSBxdVxcJ2F2ZWMgZGVzIFVSTHMgZ2l0aHViLmNvbSdcclxuICAgfSxcclxuICAgJ2NoYXRnLnB0Jzoge1xyXG4gICAgICBhbGxvd2VkRG9tYWluczogWydvcGVuYWkuY29tJywgJ2NoYXRncHQuY29tJ10sXHJcbiAgICAgIGVycm9yTWVzc2FnZTogJ0xlIGRvbWFpbmUgY2hhdGcucHQgbmUgcGV1dCBcdTAwRUF0cmUgdXRpbGlzXHUwMEU5IHF1XFwnYXZlYyBkZXMgVVJMcyBvcGVuYWkuY29tIG91IGNoYXRncHQuY29tJ1xyXG4gICB9LFxyXG4gICAnYW16bi5pZCc6IHtcclxuICAgICAgYWxsb3dlZERvbWFpbnM6IFtcclxuICAgICAgICAgJ2FtYXpvbi5jb20nLFxyXG4gICAgICAgICAnYW1hem9uLmNvLnVrJyxcclxuICAgICAgICAgJ2FtYXpvbi5jYScsXHJcbiAgICAgICAgICdhbWF6b24uZXMnLFxyXG4gICAgICAgICAnYW1hem9uLmZyJ1xyXG4gICAgICBdLFxyXG4gICAgICBlcnJvck1lc3NhZ2U6ICdMZSBkb21haW5lIGFtem4uaWQgbmUgcGV1dCBcdTAwRUF0cmUgdXRpbGlzXHUwMEU5IHF1XFwnYXZlYyBkZXMgVVJMcyBBbWF6b24gKGNvbSwgY28udWssIGNhLCBlcywgZnIpJ1xyXG4gICB9LFxyXG4gICAnY2FsLmxpbmsnOiB7XHJcbiAgICAgIGFsbG93ZWREb21haW5zOiBbXHJcbiAgICAgICAgICdjYWwuY29tJyxcclxuICAgICAgICAgJ2NhbGVuZGx5LmNvbScsXHJcbiAgICAgICAgICdjYWxlbmRhci5hcHAuZ29vZ2xlJyxcclxuICAgICAgICAgJ2NoaWxsaXBpcGVyLmNvbScsXHJcbiAgICAgICAgICdodWJzcG90LmNvbScsXHJcbiAgICAgICAgICdzYXZ2eWNhbC5jb20nLFxyXG4gICAgICAgICAndGlkeWNhbC5jb20nLFxyXG4gICAgICAgICAnemNhbC5jbydcclxuICAgICAgXSxcclxuICAgICAgZXJyb3JNZXNzYWdlOiAnTGUgZG9tYWluZSBjYWwubGluayBuZSBwZXV0IFx1MDBFQXRyZSB1dGlsaXNcdTAwRTkgcXVcXCdhdmVjIGRlcyBVUkxzIGRlIHNlcnZpY2VzIGRlIGNhbGVuZHJpZXIgYXV0b3Jpc1x1MDBFOXMgKGNhbC5jb20sIGNhbGVuZGx5LmNvbSwgZXRjLiknXHJcbiAgIH0sXHJcbiAgICdmaWcucGFnZSc6IHtcclxuICAgICAgYWxsb3dlZERvbWFpbnM6IFsnZmlnbWEuY29tJ10sXHJcbiAgICAgIGVycm9yTWVzc2FnZTogJ0xlIGRvbWFpbmUgZmlnLnBhZ2UgbmUgcGV1dCBcdTAwRUF0cmUgdXRpbGlzXHUwMEU5IHF1XFwnYXZlYyBkZXMgVVJMcyBmaWdtYS5jb20nXHJcbiAgIH0sXHJcbiAgICdnZ2wubGluayc6IHtcclxuICAgICAgYWxsb3dlZERvbWFpbnM6IFtcclxuICAgICAgICAgJ2dvb2dsZS5jb20nLFxyXG4gICAgICAgICAnZ29vZ2xlLmNvLnVrJyxcclxuICAgICAgICAgJ2dvb2dsZS5jby5pZCcsXHJcbiAgICAgICAgICdnb29nbGUuY2EnLFxyXG4gICAgICAgICAnZ29vZ2xlLmVzJyxcclxuICAgICAgICAgJ2dvb2dsZS5mcicsXHJcbiAgICAgICAgICdnb29nbGVibG9nLmNvbScsXHJcbiAgICAgICAgICdibG9nLmdvb2dsZScsXHJcbiAgICAgICAgICdnLmNvJyxcclxuICAgICAgICAgJ2cucGFnZScsXHJcbiAgICAgICAgICd5b3V0dWJlLmNvbScsXHJcbiAgICAgICAgICd5b3V0dS5iZSdcclxuICAgICAgXSxcclxuICAgICAgZXJyb3JNZXNzYWdlOiAnTGUgZG9tYWluZSBnZ2wubGluayBuZSBwZXV0IFx1MDBFQXRyZSB1dGlsaXNcdTAwRTkgcXVcXCdhdmVjIGRlcyBVUkxzIEdvb2dsZSAoZ29vZ2xlLmNvbSwgeW91dHViZS5jb20sIGV0Yy4pJ1xyXG4gICB9LFxyXG4gICAnc3B0aS5maSc6IHtcclxuICAgICAgYWxsb3dlZERvbWFpbnM6IFsnc3BvdGlmeS5jb20nXSxcclxuICAgICAgZXJyb3JNZXNzYWdlOiAnTGUgZG9tYWluZSBzcHRpLmZpIG5lIHBldXQgXHUwMEVBdHJlIHV0aWxpc1x1MDBFOSBxdVxcJ2F2ZWMgZGVzIFVSTHMgc3BvdGlmeS5jb20nXHJcbiAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZURvbWFpblVybChkb21haW46IHN0cmluZywgdXJsOiBzdHJpbmcsIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zKTogYm9vbGVhbiB7XHJcbiAgIGNvbnN0IHZhbGlkYXRpb24gPSBET01BSU5fVkFMSURBVElPTlNbZG9tYWluXTtcclxuICAgaWYgKCF2YWxpZGF0aW9uKSByZXR1cm4gdHJ1ZTsgLy8gU2kgcGFzIGRlIHZhbGlkYXRpb24gc3BcdTAwRTljaWZpcXVlLCBvbiBhY2NlcHRlXHJcblxyXG4gICB0cnkge1xyXG4gICAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHVybCk7XHJcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSB2YWxpZGF0aW9uLmFsbG93ZWREb21haW5zLnNvbWUoZCA9PiBcclxuICAgICAgICAgdXJsT2JqLmhvc3RuYW1lID09PSBkIHx8IHVybE9iai5ob3N0bmFtZS5lbmRzV2l0aCgnLicgKyBkKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKCFpc1ZhbGlkKSB7XHJcbiAgICAgICAgIG5ldyBOb3RpY2UodHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCB2YWxpZGF0aW9uLmVycm9yTWVzc2FnZSkpO1xyXG4gICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBuZXcgTm90aWNlKHRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgJ1VSTCBpbnZhbGlkZScpKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICB9XHJcbn0gIiwgImltcG9ydCB7IFBsdWdpbiwgV29ya3NwYWNlTGVhZiwgSXRlbVZpZXcgfSBmcm9tICdvYnNpZGlhbic7XHJcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcclxuXHJcbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfREFTSEJPQVJEID0gXCJsaW5rZmxvd3otZGFzaGJvYXJkXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGFzaGJvYXJkVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcclxuICAgY29uc3RydWN0b3IoXHJcbiAgICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXHJcbiAgICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sXHJcbiAgICAgIHByaXZhdGUgdHJhbnNsYXRpb25zOiBUcmFuc2xhdGlvbnNcclxuICAgKSB7XHJcbiAgICAgIHN1cGVyKGxlYWYpO1xyXG4gICB9XHJcblxyXG4gICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xyXG4gICAgICByZXR1cm4gVklFV19UWVBFX0RBU0hCT0FSRDtcclxuICAgfVxyXG5cclxuICAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHtcclxuICAgICAgcmV0dXJuIHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC50aXRsZScpO1xyXG4gICB9XHJcblxyXG4gICBhc3luYyBvbk9wZW4oKSB7XHJcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV07XHJcbiAgICAgIGNvbnRhaW5lci5lbXB0eSgpO1xyXG4gICAgICBjb250YWluZXIuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC50aXRsZScpIH0pO1xyXG4gICAgICBcclxuICAgICAgLy8gQ29udGVuZXVyIHBvdXIgbGEgbGlzdGUgZGVzIGxpZW5zXHJcbiAgICAgIGNvbnN0IGxpbmtzQ29udGFpbmVyID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImxpbmtmbG93ei1saW5rc1wiIH0pO1xyXG4gICAgICBcclxuICAgICAgLy8gVE9ETzogQ2hhcmdlciBldCBhZmZpY2hlciBsZXMgbGllbnMgZGVwdWlzIGR1Yi5jb1xyXG4gICB9XHJcblxyXG4gICBhc3luYyBvbkNsb3NlKCkge1xyXG4gICAgICAvLyBOZXR0b3lhZ2Ugc2kgblx1MDBFOWNlc3NhaXJlXHJcbiAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERhc2hib2FyZE1hbmFnZXIge1xyXG4gICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogUGx1Z2luLCBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zKSB7fVxyXG5cclxuICAgYXN5bmMgb3BlbkRhc2hib2FyZChtb2RlOiAndGFiJyB8ICdzaWRlYmFyJyB8ICdvdmVybGF5Jykge1xyXG4gICAgICAvLyBDaGVyY2hlciB1bmUgdnVlIGRhc2hib2FyZCBleGlzdGFudGVcclxuICAgICAgY29uc3QgZXhpc3RpbmdMZWF2ZXMgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfREFTSEJPQVJEKTtcclxuICAgICAgaWYgKGV4aXN0aW5nTGVhdmVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgLy8gU2kgdW5lIHZ1ZSBleGlzdGUgZFx1MDBFOWpcdTAwRTAsIGxhIHJcdTAwRTl2XHUwMEU5bGVyXHJcbiAgICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihleGlzdGluZ0xlYXZlc1swXSk7XHJcbiAgICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gU2kgYXVjdW5lIHZ1ZSBuJ2V4aXN0ZSwgZW4gY3JcdTAwRTllciB1bmUgbm91dmVsbGUgdmlhIFZpZXdNb2RlXHJcbiAgICAgIGNvbnN0IHZpZXdNb2RlID0gdGhpcy5wbHVnaW4udmlld01vZGU7XHJcbiAgICAgIGF3YWl0IHZpZXdNb2RlLnNldFZpZXcobW9kZSk7XHJcbiAgIH1cclxuXHJcbiAgIGdldEN1cnJlbnRMZWFmKCk6IFdvcmtzcGFjZUxlYWYgfCBudWxsIHtcclxuICAgICAgY29uc3QgbGVhdmVzID0gdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0RBU0hCT0FSRCk7XHJcbiAgICAgIHJldHVybiBsZWF2ZXMubGVuZ3RoID4gMCA/IGxlYXZlc1swXSA6IG51bGw7XHJcbiAgIH1cclxufSAiLCAiaW1wb3J0IHsgUGx1Z2luLCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBWSUVXX1RZUEVfREFTSEJPQVJEIH0gZnJvbSAnLi9EYXNoYm9hcmQnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFZpZXdNb2RlIHtcclxuICAgcHJpdmF0ZSBjdXJyZW50TW9kZTogJ3RhYicgfCAnc2lkZWJhcicgfCAnb3ZlcmxheScgPSAndGFiJztcclxuICAgcHJpdmF0ZSBjdXJyZW50TGVhZjogV29ya3NwYWNlTGVhZiB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IFBsdWdpbikge31cclxuXHJcbiAgIGFzeW5jIHNldFZpZXcobW9kZTogJ3RhYicgfCAnc2lkZWJhcicgfCAnb3ZlcmxheScpIHtcclxuICAgICAgdGhpcy5jdXJyZW50TW9kZSA9IG1vZGU7XHJcblxyXG4gICAgICAvLyBGZXJtZXIgbGEgdnVlIGFjdHVlbGxlIHNpIGVsbGUgZXhpc3RlXHJcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRMZWFmKSB7XHJcbiAgICAgICAgIHRoaXMuY3VycmVudExlYWYuZGV0YWNoKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHdvcmtzcGFjZSA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2U7XHJcbiAgICAgIGxldCBsZWFmOiBXb3Jrc3BhY2VMZWFmO1xyXG5cclxuICAgICAgLy8gQ3JcdTAwRTllciBsYSBub3V2ZWxsZSB2dWUgc2Vsb24gbGUgbW9kZVxyXG4gICAgICBzd2l0Y2ggKG1vZGUpIHtcclxuICAgICAgICAgY2FzZSAnc2lkZWJhcic6XHJcbiAgICAgICAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKSA/PyB3b3Jrc3BhY2UuZ2V0TGVhZignc3BsaXQnKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgIGNhc2UgJ292ZXJsYXknOlxyXG4gICAgICAgICAgICBjb25zdCBhY3RpdmVMZWFmID0gd29ya3NwYWNlLmdldE1vc3RSZWNlbnRMZWFmKCkgPz8gd29ya3NwYWNlLmdldExlYWYoJ3NwbGl0Jyk7XHJcbiAgICAgICAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuY3JlYXRlTGVhZkJ5U3BsaXQoYWN0aXZlTGVhZiwgJ2hvcml6b250YWwnLCB0cnVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgIGNhc2UgJ3RhYic6XHJcbiAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZignc3BsaXQnKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENvbmZpZ3VyZXIgbGEgbm91dmVsbGUgdnVlXHJcbiAgICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcclxuICAgICAgICAgdHlwZTogVklFV19UWVBFX0RBU0hCT0FSRCxcclxuICAgICAgICAgYWN0aXZlOiB0cnVlXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5jdXJyZW50TGVhZiA9IGxlYWY7XHJcbiAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcclxuICAgfVxyXG5cclxuICAgZ2V0Q3VycmVudE1vZGUoKTogJ3RhYicgfCAnc2lkZWJhcicgfCAnb3ZlcmxheScge1xyXG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TW9kZTtcclxuICAgfVxyXG5cclxuICAgZ2V0Q3VycmVudExlYWYoKTogV29ya3NwYWNlTGVhZiB8IG51bGwge1xyXG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TGVhZjtcclxuICAgfVxyXG59ICIsICJjb25zdCBTVFlMRVMgPSBgXHJcbiAgIC5kZXNjcmlwdGlvbi13aXRoLWJ1dHRvbiB7XHJcbiAgICAgIG1hcmdpbi1ib3R0b206IDEycHg7XHJcbiAgIH1cclxuICAgLmRlc2NyaXB0aW9uLXdpdGgtYnV0dG9uIC5zZXR0aW5nLWl0ZW0tY29udHJvbCB7XHJcbiAgICAgIG1hcmdpbi1sZWZ0OiA4cHg7XHJcbiAgIH1cclxuICAgLmRlc2NyaXB0aW9uLXdpdGgtYnV0dG9uIC5zZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb24ge1xyXG4gICAgICBtYXJnaW4tYm90dG9tOiAwO1xyXG4gICB9XHJcbiAgIC5tYXBwaW5nLWxpbmUge1xyXG4gICAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgICBnYXA6IDhweDtcclxuICAgICAgcGFkZGluZzogNnB4IDA7XHJcbiAgIH1cclxuICAgLm1hcHBpbmctbGluZSAuc2V0dGluZy1pdGVtLWNvbnRyb2wge1xyXG4gICAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgICBnYXA6IDhweDtcclxuICAgICAgZmxleC1ncm93OiAxO1xyXG4gICB9XHJcbiAgIC5tYXBwaW5nLWxpbmUgLmxhYmVsLXRleHQge1xyXG4gICAgICB3aWR0aDogNjBweCAhaW1wb3J0YW50O1xyXG4gICAgICBiYWNrZ3JvdW5kOiBub25lICFpbXBvcnRhbnQ7XHJcbiAgICAgIGJvcmRlcjogbm9uZSAhaW1wb3J0YW50O1xyXG4gICAgICBib3gtc2hhZG93OiBub25lICFpbXBvcnRhbnQ7XHJcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcclxuICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xyXG4gICAgICBwYWRkaW5nOiAwICFpbXBvcnRhbnQ7XHJcbiAgICAgIGN1cnNvcjogZGVmYXVsdDtcclxuICAgfVxyXG4gICAubWFwcGluZy1saW5lIC5kb21haW4tZHJvcGRvd24ge1xyXG4gICAgICBtaW4td2lkdGg6IDIwMHB4O1xyXG4gICB9XHJcbiAgIC5mb2xkZXItY29udGFpbmVyIHtcclxuICAgICAgZGlzcGxheTogZmxleDtcclxuICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcclxuICAgICAgZ2FwOiA0cHg7XHJcbiAgIH1cclxuICAgLmZvbGRlci1sYWJlbCB7XHJcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcclxuICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xyXG4gICB9XHJcbiAgIC5tYXBwaW5nLWxpbmUgLnNlYXJjaC1pbnB1dC1jb250YWluZXIge1xyXG4gICAgICBtaW4td2lkdGg6IDE1MHB4O1xyXG4gICB9XHJcbiAgIC5hZGQtbWFwcGluZy1idXR0b24ge1xyXG4gICAgICBtYXJnaW4tdG9wOiA2cHg7XHJcbiAgIH1cclxuICAgLmFkZC1tYXBwaW5nLWJ1dHRvbiAuc2V0dGluZy1pdGVtLWNvbnRyb2wge1xyXG4gICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7XHJcbiAgIH1cclxuICAgLmFkZC1tYXBwaW5nLWJ1dHRvbiAuc2V0dGluZy1pdGVtLWluZm8ge1xyXG4gICAgICBkaXNwbGF5OiBub25lO1xyXG4gICB9XHJcbiAgIC5jb21wYWN0LXNldHRpbmcgLnNldHRpbmctaXRlbS1pbmZvIHtcclxuICAgICAgZGlzcGxheTogbm9uZTtcclxuICAgfVxyXG5gO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyU3R5bGVzKCkge1xyXG4gICBjb25zdCBzdHlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICAgc3R5bGVFbC5pZCA9ICdsaW5rZmxvd3otc3R5bGVzJztcclxuICAgc3R5bGVFbC50ZXh0Q29udGVudCA9IFNUWUxFUztcclxuICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZUVsKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVucmVnaXN0ZXJTdHlsZXMoKSB7XHJcbiAgIGNvbnN0IHN0eWxlRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlua2Zsb3d6LXN0eWxlcycpO1xyXG4gICBpZiAoc3R5bGVFbCkge1xyXG4gICAgICBzdHlsZUVsLnJlbW92ZSgpO1xyXG4gICB9XHJcbn0gIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxtQkFBdUI7OztBQ0F2QixzQkFBMEY7QUFrQm5GLElBQU0sbUJBQW9DO0FBQUEsRUFDOUMsVUFBVTtBQUFBLEVBQ1YsV0FBVztBQUFBLEVBQ1gsZ0JBQWdCO0FBQUEsRUFDaEIsc0JBQXNCLENBQUM7QUFBQSxFQUN2QixVQUFVO0FBQUEsRUFDVixlQUFlLENBQUM7QUFBQSxFQUNoQixrQkFBa0I7QUFDckI7QUFFTyxJQUFNLFdBQU4sTUFBZTtBQUFBO0FBQUEsRUFLbkIsT0FBTyxXQUFXLFFBQWdCO0FBQy9CLFNBQUssU0FBUztBQUFBLEVBQ2pCO0FBQUEsRUFFQSxhQUFhLGVBQXlDO0FBQ25ELFVBQU0sWUFBWSxNQUFNLEtBQUssT0FBTyxTQUFTO0FBQzdDLFNBQUssV0FBVyxPQUFPLE9BQU8sQ0FBQyxHQUFHLGtCQUFrQixhQUFhLENBQUMsQ0FBQztBQUNuRSxXQUFPLEtBQUs7QUFBQSxFQUNmO0FBQUEsRUFFQSxhQUFhLGFBQWEsVUFBb0M7QUFDM0QsU0FBSyxXQUFXLE9BQU8sT0FBTyxLQUFLLFlBQVksa0JBQWtCLFFBQVE7QUFDekUsVUFBTSxLQUFLLE9BQU8sU0FBUyxLQUFLLFFBQVE7QUFBQSxFQUMzQztBQUFBLEVBRUEsYUFBYSxpQkFBaUIsUUFBZ0IsYUFBc0IsZUFBd0IsT0FBMEI7QUFDbkgsVUFBTSxNQUFNLEtBQUssSUFBSTtBQUNyQixVQUFNLFdBQVcsTUFBTSxLQUFLLFNBQVM7QUFHckMsUUFBSSxDQUFDLGdCQUFnQixXQUFXLEtBQUssa0JBQWtCLEtBQUssU0FBUyxjQUFjLFNBQVMsR0FBRztBQUM1RixjQUFRLElBQUksc0JBQXNCO0FBQ2xDLGFBQU8sS0FBSyxTQUFTO0FBQUEsSUFDeEI7QUFHQSxZQUFRLElBQUksMkVBQTJFO0FBQ3ZGLFVBQU0sVUFBVSxNQUFNLEtBQUssYUFBYSxRQUFRLFdBQVc7QUFHM0QsVUFBTSxLQUFLLGFBQWE7QUFBQSxNQUNyQixlQUFlO0FBQUEsTUFDZixrQkFBa0I7QUFBQSxJQUNyQixDQUFDO0FBRUQsV0FBTztBQUFBLEVBQ1Y7QUFBQSxFQUVBLGFBQWEsYUFBYSxRQUFnQixhQUF5QztBQUNoRixRQUFJO0FBQ0QsY0FBUSxJQUFJLDRCQUE0QjtBQUd4QyxZQUFNLHdCQUF3QixVQUFNLDRCQUFXO0FBQUEsUUFDNUMsS0FBSztBQUFBLFFBQ0wsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ04saUJBQWlCLFVBQVUsTUFBTTtBQUFBLFVBQ2pDLFVBQVU7QUFBQSxRQUNiO0FBQUEsTUFDSCxDQUFDO0FBR0QsY0FBUSxJQUFJLDZCQUE2QjtBQUN6QyxZQUFNLHlCQUF5QixVQUFNLDRCQUFXO0FBQUEsUUFDN0MsS0FBSztBQUFBLFFBQ0wsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ04saUJBQWlCLFVBQVUsTUFBTTtBQUFBLFVBQ2pDLFVBQVU7QUFBQSxRQUNiO0FBQUEsTUFDSCxDQUFDO0FBRUQsVUFBSSxVQUFvQixDQUFDO0FBR3pCLFVBQUksc0JBQXNCLFdBQVcsS0FBSztBQUN2QyxjQUFNLGdCQUFnQixNQUFNLFFBQVEsc0JBQXNCLElBQUksSUFBSSxzQkFBc0IsT0FBTyxDQUFDO0FBQ2hHLGtCQUFVLFFBQVEsT0FBTyxjQUFjLElBQUksQ0FBQyxXQUFnQixPQUFPLElBQUksQ0FBQztBQUFBLE1BQzNFO0FBR0EsVUFBSSx1QkFBdUIsV0FBVyxLQUFLO0FBRXhDLGNBQU0saUJBQWlCLHVCQUF1QjtBQUM5QyxZQUFJLE1BQU0sUUFBUSxjQUFjLEdBQUc7QUFDaEMsb0JBQVUsUUFBUSxPQUFPLGNBQWM7QUFBQSxRQUMxQztBQUFBLE1BQ0g7QUFFQSxjQUFRLElBQUksc0JBQXNCLE9BQU87QUFDekMsYUFBTztBQUFBLElBQ1YsU0FBUyxPQUFPO0FBQ2IsY0FBUSxNQUFNLDJCQUEyQixLQUFLO0FBQzlDLFVBQUksaUJBQWlCLE9BQU87QUFDekIsZ0JBQVEsTUFBTSxrQkFBa0IsTUFBTSxPQUFPO0FBQzdDLGdCQUFRLE1BQU0sZ0JBQWdCLE1BQU0sS0FBSztBQUFBLE1BQzVDO0FBQ0EsWUFBTTtBQUFBLElBQ1Q7QUFBQSxFQUNIO0FBQ0g7QUFoR2EsU0FHYyxpQkFBaUIsS0FBSyxLQUFLLEtBQUs7QUErRnBELElBQU0sY0FBTixjQUEwQixpQ0FBaUI7QUFBQSxFQUkvQyxZQUNHLEtBQ1EsUUFDUixVQUNRQyxlQUNUO0FBQ0MsVUFBTSxLQUFLLE1BQU07QUFKVDtBQUVBLHdCQUFBQTtBQU5YLFNBQVEsVUFBb0IsQ0FBQyxRQUFRO0FBU2xDLFNBQUssV0FBVztBQUFBLEVBQ25CO0FBQUEsRUFFQSxNQUFNLGNBQWM7QUFDakIsUUFBSSxLQUFLLFNBQVMsV0FBVztBQUMxQixVQUFJO0FBQ0QsYUFBSyxVQUFVLE1BQU0sU0FBUztBQUFBLFVBQzNCLEtBQUssU0FBUztBQUFBLFVBQ2QsS0FBSyxTQUFTO0FBQUEsUUFDakI7QUFDQSxhQUFLLFFBQVE7QUFBQSxNQUNoQixTQUFTLE9BQU87QUFDYixZQUFJLHVCQUFPLEtBQUssYUFBYSxFQUFFLGVBQWUsRUFBRSxRQUFRLGFBQWEsTUFBTSxPQUFPLENBQUM7QUFBQSxNQUN0RjtBQUFBLElBQ0g7QUFBQSxFQUNIO0FBQUEsRUFFQSxVQUFVO0FBQ1AsVUFBTSxFQUFFLFlBQVksSUFBSTtBQUN4QixnQkFBWSxNQUFNO0FBR2xCLGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBRTdDLFFBQUksd0JBQVEsV0FBVyxFQUNuQixRQUFRLEtBQUssYUFBYSxFQUFFLG9CQUFvQixDQUFDLEVBQ2pELFFBQVEsS0FBSyxhQUFhLEVBQUUsd0JBQXdCLENBQUMsRUFDckQsUUFBUSxVQUFRLEtBQ2IsZUFBZSx5QkFBc0IsRUFDckMsU0FBUyxLQUFLLFNBQVMsU0FBUyxFQUNoQyxTQUFTLE9BQU8sVUFBVTtBQUN4QixXQUFLLFNBQVMsWUFBWTtBQUMxQixZQUFNLFNBQVMsYUFBYSxFQUFFLFdBQVcsTUFBTSxDQUFDO0FBQ2hELFVBQUksdUJBQU8sS0FBSyxhQUFhLEVBQUUsZUFBZSxDQUFDO0FBQy9DLFVBQUksT0FBTztBQUNSLGNBQU0sS0FBSyxZQUFZO0FBQUEsTUFDMUI7QUFBQSxJQUNILENBQUMsQ0FBQztBQUVSLFFBQUksd0JBQVEsV0FBVyxFQUNuQixRQUFRLEtBQUssYUFBYSxFQUFFLHlCQUF5QixDQUFDLEVBQ3RELFFBQVEsS0FBSyxhQUFhLEVBQUUsNkJBQTZCLENBQUMsRUFDMUQsUUFBUSxVQUFRLEtBQ2IsZUFBZSw4QkFBOEIsRUFDN0MsU0FBUyxLQUFLLFNBQVMsY0FBYyxFQUNyQyxTQUFTLE9BQU8sVUFBVTtBQUN4QixXQUFLLFNBQVMsaUJBQWlCO0FBQy9CLFlBQU0sU0FBUyxhQUFhLEVBQUUsZ0JBQWdCLE1BQU0sQ0FBQztBQUNyRCxVQUFJLHVCQUFPLEtBQUssYUFBYSxFQUFFLGVBQWUsQ0FBQztBQUMvQyxVQUFJLEtBQUssU0FBUyxXQUFXO0FBQzFCLGNBQU0sS0FBSyxZQUFZO0FBQUEsTUFDMUI7QUFBQSxJQUNILENBQUMsQ0FBQztBQUdSLFFBQUksd0JBQVEsV0FBVyxFQUNuQixRQUFRLEtBQUssYUFBYSxFQUFFLHlCQUF5QixDQUFDLEVBQ3RELFFBQVEsS0FBSyxhQUFhLEVBQUUsNkJBQTZCLENBQUMsRUFDMUQsVUFBVSxZQUFVLE9BQ2pCLGNBQWMsS0FBSyxhQUFhLEVBQUUsa0JBQWtCLENBQUMsRUFDckQsUUFBUSxZQUFZO0FBQ2xCLFVBQUksQ0FBQyxLQUFLLFNBQVMsV0FBVztBQUMzQixZQUFJLHVCQUFPLEtBQUssYUFBYSxFQUFFLGVBQWUsRUFBRSxRQUFRLGFBQWEsa0JBQWtCLENBQUM7QUFDeEY7QUFBQSxNQUNIO0FBRUEsWUFBTSxTQUFTLGFBQWEsRUFBRSxrQkFBa0IsRUFBRSxDQUFDO0FBQ25ELFlBQU0sS0FBSyxZQUFZO0FBQ3ZCLFVBQUksdUJBQU8sS0FBSyxhQUFhLEVBQUUsMEJBQTBCLENBQUM7QUFBQSxJQUM3RCxDQUFDLENBQUM7QUFHUixnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLEtBQUssYUFBYSxFQUFFLCtCQUErQixFQUFFLENBQUM7QUFHekYsVUFBTSxrQkFBa0IsSUFBSSx3QkFBUSxXQUFXLEVBQzNDLFFBQVEsS0FBSyxhQUFhLEVBQUUsbUNBQW1DLENBQUMsRUFDaEUsVUFBVSxZQUFVLE9BQ2pCLFFBQVEsTUFBTSxFQUNkLGNBQWMsS0FBSyxhQUFhLEVBQUUscUJBQXFCLENBQUMsRUFDeEQsT0FBTyxFQUNQLFFBQVEsWUFBWTtBQUNsQixXQUFLLFNBQVMscUJBQXFCLEtBQUs7QUFBQSxRQUNyQyxRQUFRLEtBQUssUUFBUSxDQUFDO0FBQUEsUUFDdEIsUUFBUTtBQUFBLE1BQ1gsQ0FBQztBQUNELFlBQU0sU0FBUyxhQUFhLEVBQUUsc0JBQXNCLEtBQUssU0FBUyxxQkFBcUIsQ0FBQztBQUN4RixVQUFJLHVCQUFPLEtBQUssYUFBYSxFQUFFLGVBQWUsQ0FBQztBQUMvQyxXQUFLLFFBQVE7QUFBQSxJQUNoQixDQUFDLENBQUM7QUFFUixvQkFBZ0IsVUFBVSxTQUFTLHlCQUF5QjtBQUc1RCxVQUFNLG9CQUFvQixZQUFZLFNBQVMsS0FBSztBQUdwRCxVQUFNLHVCQUF1QixDQUFDLFNBQThCLFVBQWtCO0FBQzNFLFlBQU0sYUFBYSxrQkFBa0IsU0FBUyxPQUFPLEVBQUUsS0FBSyxvQkFBb0IsQ0FBQztBQUdqRixZQUFNLGNBQWMsSUFBSSx3QkFBUSxVQUFVLEVBQ3RDLFNBQVMsaUJBQWlCLEVBRTFCLFFBQVEsVUFBUTtBQUNkLGFBQUssUUFBUSxTQUFTLFlBQVk7QUFDbEMsYUFBSyxTQUFTLEtBQUssYUFBYSxFQUFFLGlCQUFpQixDQUFDO0FBQ3BELGFBQUssWUFBWSxJQUFJO0FBQ3JCLGVBQU87QUFBQSxNQUNWLENBQUMsRUFFQSxZQUFZLGNBQVk7QUFDdEIsYUFBSyxRQUFRLFFBQVEsWUFBVTtBQUM1QixtQkFBUyxVQUFVLFFBQVEsTUFBTTtBQUFBLFFBQ3BDLENBQUM7QUFDRCxpQkFBUyxTQUFTLFFBQVEsTUFBTTtBQUNoQyxpQkFBUyxTQUFTLFdBQVM7QUFDeEIsZUFBSyxTQUFTLHFCQUFxQixLQUFLLEVBQUUsU0FBUztBQUFBLFFBQ3RELENBQUM7QUFDRCxpQkFBUyxTQUFTLFNBQVMsaUJBQWlCO0FBQzVDLGVBQU87QUFBQSxNQUNWLENBQUMsRUFFQSxVQUFVLFlBQVUsT0FDakIsY0FBYyxRQUFRLFVBQVUsS0FBSyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsRUFDdEUsUUFBUSxDQUFDLE1BQWtCO0FBRXpCLGNBQU0sT0FBTyxJQUFJLHFCQUFLO0FBR3RCLGFBQUssZ0JBQWdCLE1BQU0sS0FBSyxJQUFJLE1BQU0sUUFBUSxHQUFHLEtBQUs7QUFHMUQsYUFBSyxpQkFBaUIsQ0FBQztBQUFBLE1BQzFCLENBQUMsQ0FBQyxFQUVKLFVBQVUsWUFBVSxPQUNqQixRQUFRLFdBQVcsRUFDbkIsV0FBVyxLQUFLLGFBQWEsRUFBRSxlQUFlLENBQUMsRUFDL0MsT0FBTyxFQUNQLFFBQVEsWUFBWTtBQUNsQixjQUFNLFNBQVMsYUFBYSxFQUFFLHNCQUFzQixLQUFLLFNBQVMscUJBQXFCLENBQUM7QUFDeEYsWUFBSSx1QkFBTyxLQUFLLGFBQWEsRUFBRSxlQUFlLENBQUM7QUFBQSxNQUNsRCxDQUFDLENBQUMsRUFDSixVQUFVLFlBQVUsT0FDakIsUUFBUSxPQUFPLEVBQ2YsV0FBVyxLQUFLLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxFQUNqRCxRQUFRLFlBQVk7QUFDbEIsYUFBSyxTQUFTLHFCQUFxQixPQUFPLE9BQU8sQ0FBQztBQUNsRCxjQUFNLFNBQVMsYUFBYSxFQUFFLHNCQUFzQixLQUFLLFNBQVMscUJBQXFCLENBQUM7QUFDeEYsWUFBSSx1QkFBTyxLQUFLLGFBQWEsRUFBRSxlQUFlLENBQUM7QUFDL0MsYUFBSyxRQUFRO0FBQUEsTUFDaEIsQ0FBQyxDQUFDO0FBR1Isa0JBQVksVUFBVSxTQUFTLGNBQWM7QUFBQSxJQUNoRDtBQUdBLFNBQUssU0FBUyxxQkFBcUIsUUFBUSxDQUFDLFNBQVMsVUFBVTtBQUM1RCwyQkFBcUIsU0FBUyxLQUFLO0FBQUEsSUFDdEMsQ0FBQztBQUdELGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxhQUFhLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQztBQUU3RSxRQUFJLHdCQUFRLFdBQVcsRUFDbkIsUUFBUSxLQUFLLGFBQWEsRUFBRSwwQkFBMEIsQ0FBQyxFQUN2RCxRQUFRLEtBQUssYUFBYSxFQUFFLDhCQUE4QixDQUFDLEVBQzNELFlBQVksY0FBWSxTQUNyQixVQUFVLE9BQU8sS0FBSyxhQUFhLEVBQUUsY0FBYyxDQUFDLEVBQ3BELFVBQVUsV0FBVyxLQUFLLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxFQUM1RCxVQUFVLFdBQVcsS0FBSyxhQUFhLEVBQUUsa0JBQWtCLENBQUMsRUFDNUQsU0FBUyxLQUFLLFNBQVMsUUFBUSxFQUMvQixTQUFTLE9BQU8sVUFBeUM7QUFDdkQsV0FBSyxTQUFTLFdBQVc7QUFDekIsWUFBTSxTQUFTLGFBQWEsRUFBRSxVQUFVLE1BQU0sQ0FBQztBQUMvQyxVQUFJLHVCQUFPLEtBQUssYUFBYSxFQUFFLGVBQWUsQ0FBQztBQUFBLElBQ2xELENBQUMsQ0FBQztBQUdSLFFBQUksS0FBSyxTQUFTLGFBQWEsS0FBSyxRQUFRLFdBQVcsR0FBRztBQUN2RCxXQUFLLFlBQVk7QUFBQSxJQUNwQjtBQUFBLEVBQ0g7QUFBQTtBQUFBLEVBR1EsZ0JBQWdCLE1BQVksUUFBaUIsY0FBc0IsUUFBZ0IsR0FBRztBQUMzRixVQUFNLGFBQWEsT0FBTyxTQUFTLE9BQU8sQ0FBQyxVQUE0QixpQkFBaUIsdUJBQU87QUFFL0YsZUFBVyxRQUFRLGVBQWE7QUFDN0IsWUFBTSxjQUFjLFVBQVUsU0FBUyxLQUFLLFdBQVMsaUJBQWlCLHVCQUFPO0FBRTdFLFVBQUksYUFBYTtBQUVkLGFBQUssUUFBUSxVQUFRO0FBNVVqQztBQTZVZSxnQkFBTSxVQUFVLFdBQVcsRUFBRSxLQUFLLGtCQUFrQixDQUFDO0FBQ3JELGtCQUFRLFdBQVcsVUFBVSxJQUFJO0FBQ2pDLGtCQUFRLFlBQVksV0FBVyxFQUFFLEtBQUssbUJBQW1CLE1BQU0sVUFBSyxDQUFDLENBQUM7QUFFdEUscUJBQUssSUFBSSxjQUFjLGtCQUFrQixNQUF6QyxtQkFBNEMsWUFBWTtBQUN4RCxlQUFLLFFBQVEsUUFBUTtBQUdyQixnQkFBTSxVQUFVLElBQUkscUJBQUs7QUFDekIsZUFBSyxnQkFBZ0IsU0FBUyxXQUFXLGNBQWMsUUFBUSxDQUFDO0FBR2hFLGdCQUFNLFVBQVcsS0FBYTtBQUM5QixjQUFJLFNBQVM7QUFDVixnQkFBSSxhQUFhO0FBQ2pCLGdCQUFJLGFBQWE7QUFDakIsZ0JBQUk7QUFFSixrQkFBTSxjQUFjLE1BQU07QUFDdkIsb0JBQU0sT0FBTyxRQUFRLHNCQUFzQjtBQUMzQyxzQkFBUSxlQUFlO0FBQUEsZ0JBQ3BCLEdBQUcsS0FBSztBQUFBLGdCQUNSLEdBQUcsS0FBSztBQUFBLGNBQ1gsQ0FBQztBQUFBLFlBQ0o7QUFFQSxrQkFBTSxjQUFjLE1BQU07QUFDdkIsNEJBQWMsV0FBVyxNQUFNO0FBQzVCLG9CQUFJLENBQUMsY0FBYyxDQUFDLFlBQVk7QUFDN0IsMEJBQVEsS0FBSztBQUFBLGdCQUNoQjtBQUFBLGNBQ0gsR0FBRyxHQUFHO0FBQUEsWUFDVDtBQUVBLG9CQUFRLGlCQUFpQixjQUFjLE1BQU07QUFDMUMsMkJBQWE7QUFDYixrQkFBSTtBQUFhLDZCQUFhLFdBQVc7QUFDekMsMEJBQVk7QUFBQSxZQUNmLENBQUM7QUFFRCxvQkFBUSxpQkFBaUIsY0FBYyxNQUFNO0FBQzFDLDJCQUFhO0FBQ2IsMEJBQVk7QUFBQSxZQUNmLENBQUM7QUFHRCxrQkFBTSxZQUFhLFFBQWdCO0FBQ25DLGdCQUFJLFdBQVc7QUFDWix3QkFBVSxpQkFBaUIsY0FBYyxNQUFNO0FBQzVDLDZCQUFhO0FBQ2Isb0JBQUk7QUFBYSwrQkFBYSxXQUFXO0FBQUEsY0FDNUMsQ0FBQztBQUVELHdCQUFVLGlCQUFpQixjQUFjLE1BQU07QUFDNUMsNkJBQWE7QUFDYiw0QkFBWTtBQUFBLGNBQ2YsQ0FBQztBQUFBLFlBQ0o7QUFBQSxVQUNIO0FBR0EsZUFBSyxRQUFRLFlBQVk7QUFDdEIsaUJBQUssU0FBUyxxQkFBcUIsWUFBWSxFQUFFLFNBQVMsVUFBVTtBQUNwRSxrQkFBTSxTQUFTLGFBQWEsRUFBRSxzQkFBc0IsS0FBSyxTQUFTLHFCQUFxQixDQUFDO0FBQ3hGLGdCQUFJLHVCQUFPLEtBQUssYUFBYSxFQUFFLGVBQWUsQ0FBQztBQUMvQyxpQkFBSyxRQUFRO0FBQUEsVUFDaEIsQ0FBQztBQUFBLFFBQ0osQ0FBQztBQUFBLE1BQ0osT0FBTztBQUVKLGFBQUssUUFBUSxVQUFRO0FBQ2xCLGVBQUssU0FBUyxVQUFVLElBQUksRUFDeEIsUUFBUSxRQUFRLEVBQ2hCLFFBQVEsWUFBWTtBQUNsQixpQkFBSyxTQUFTLHFCQUFxQixZQUFZLEVBQUUsU0FBUyxVQUFVO0FBQ3BFLGtCQUFNLFNBQVMsYUFBYSxFQUFFLHNCQUFzQixLQUFLLFNBQVMscUJBQXFCLENBQUM7QUFDeEYsZ0JBQUksdUJBQU8sS0FBSyxhQUFhLEVBQUUsZUFBZSxDQUFDO0FBQy9DLGlCQUFLLFFBQVE7QUFBQSxVQUNoQixDQUFDO0FBQUEsUUFDUCxDQUFDO0FBQUEsTUFDSjtBQUFBLElBQ0gsQ0FBQztBQUFBLEVBQ0o7QUFDSDs7O0FDNVdPLElBQU0sZUFBbUU7QUFBQSxFQUM3RSxJQUFJO0FBQUE7QUFBQSxJQUVELGlCQUFpQjtBQUFBLElBQ2pCLGlCQUFpQjtBQUFBLElBQ2pCLG1CQUFtQjtBQUFBLElBQ25CLHVCQUF1QjtBQUFBLElBQ3ZCLHVCQUF1QjtBQUFBO0FBQUEsSUFFdkIseUJBQXlCO0FBQUEsSUFDekIsd0JBQXdCO0FBQUEsSUFDeEIsNEJBQTRCO0FBQUEsSUFDNUIsZ0JBQWdCO0FBQUEsSUFDaEIsb0JBQW9CO0FBQUEsSUFDcEIsMkJBQTJCO0FBQUEsSUFDM0Isb0JBQW9CO0FBQUEsSUFDcEIsd0JBQXdCO0FBQUEsSUFDeEIsZ0JBQWdCO0FBQUEsSUFDaEIsb0JBQW9CO0FBQUEsSUFDcEIsZ0JBQWdCO0FBQUE7QUFBQSxJQUVoQixzQkFBc0I7QUFBQSxJQUN0QiwwQkFBMEI7QUFBQSxJQUMxQiwyQkFBMkI7QUFBQSxJQUMzQiwrQkFBK0I7QUFBQSxJQUMvQiw2QkFBNkI7QUFBQSxJQUM3QixpQ0FBaUM7QUFBQSxJQUNqQyxpQ0FBaUM7QUFBQSxJQUNqQyxxQ0FBcUM7QUFBQSxJQUNyQyx1QkFBdUI7QUFBQSxJQUN2QixtQkFBbUI7QUFBQSxJQUNuQixtQkFBbUI7QUFBQSxJQUNuQixtQkFBbUI7QUFBQTtBQUFBLElBRW5CLHFCQUFxQjtBQUFBLElBQ3JCLDRCQUE0QjtBQUFBLElBQzVCLGdDQUFnQztBQUFBLElBQ2hDLGdCQUFnQjtBQUFBLElBQ2hCLG9CQUFvQjtBQUFBLElBQ3BCLG9CQUFvQjtBQUFBO0FBQUEsSUFFcEIsbUJBQW1CO0FBQUEsSUFDbkIscUJBQXFCO0FBQUEsSUFDckIscUJBQXFCO0FBQUEsSUFDckIsbUJBQW1CO0FBQUEsSUFDbkIsNEJBQTRCO0FBQUEsSUFDNUIsOEJBQThCO0FBQUEsSUFDOUIsaUJBQWlCO0FBQUEsSUFDakIsMkJBQTJCO0FBQUEsSUFDM0IsK0JBQStCO0FBQUEsSUFDL0Isb0JBQW9CO0FBQUEsSUFDcEIsNEJBQTRCO0FBQUEsRUFDL0I7QUFBQSxFQUNBLElBQUk7QUFBQTtBQUFBLElBRUQsaUJBQWlCO0FBQUEsSUFDakIsaUJBQWlCO0FBQUEsSUFDakIsbUJBQW1CO0FBQUEsSUFDbkIsdUJBQXVCO0FBQUEsSUFDdkIsdUJBQXVCO0FBQUE7QUFBQSxJQUV2Qix5QkFBeUI7QUFBQSxJQUN6Qix3QkFBd0I7QUFBQSxJQUN4Qiw0QkFBNEI7QUFBQSxJQUM1QixnQkFBZ0I7QUFBQSxJQUNoQixvQkFBb0I7QUFBQSxJQUNwQiwyQkFBMkI7QUFBQSxJQUMzQixvQkFBb0I7QUFBQSxJQUNwQix3QkFBd0I7QUFBQSxJQUN4QixnQkFBZ0I7QUFBQSxJQUNoQixvQkFBb0I7QUFBQSxJQUNwQixnQkFBZ0I7QUFBQTtBQUFBLElBRWhCLHNCQUFzQjtBQUFBLElBQ3RCLDBCQUEwQjtBQUFBLElBQzFCLDJCQUEyQjtBQUFBLElBQzNCLCtCQUErQjtBQUFBLElBQy9CLDZCQUE2QjtBQUFBLElBQzdCLGlDQUFpQztBQUFBLElBQ2pDLGlDQUFpQztBQUFBLElBQ2pDLHFDQUFxQztBQUFBLElBQ3JDLHVCQUF1QjtBQUFBLElBQ3ZCLG1CQUFtQjtBQUFBLElBQ25CLG1CQUFtQjtBQUFBLElBQ25CLG1CQUFtQjtBQUFBO0FBQUEsSUFFbkIscUJBQXFCO0FBQUEsSUFDckIsNEJBQTRCO0FBQUEsSUFDNUIsZ0NBQWdDO0FBQUEsSUFDaEMsZ0JBQWdCO0FBQUEsSUFDaEIsb0JBQW9CO0FBQUEsSUFDcEIsb0JBQW9CO0FBQUE7QUFBQSxJQUVwQixtQkFBbUI7QUFBQSxJQUNuQixxQkFBcUI7QUFBQSxJQUNyQixxQkFBcUI7QUFBQSxJQUNyQixtQkFBbUI7QUFBQSxJQUNuQiw0QkFBNEI7QUFBQSxJQUM1Qiw4QkFBOEI7QUFBQSxJQUM5QixpQkFBaUI7QUFBQSxJQUNqQiwyQkFBMkI7QUFBQSxJQUMzQiwrQkFBK0I7QUFBQSxJQUMvQixvQkFBb0I7QUFBQSxJQUNwQiw0QkFBNEI7QUFBQSxFQUMvQjtBQUNIO0FBRU8sSUFBTSxlQUFOLE1BQW1CO0FBQUEsRUFHdkIsWUFBWSxjQUFzQixNQUFNO0FBQ3JDLFNBQUssY0FBYztBQUFBLEVBQ3RCO0FBQUEsRUFFQSxZQUFZLE1BQW9CO0FBQzdCLFNBQUssY0FBYztBQUFBLEVBQ3RCO0FBQUEsRUFFQSxFQUFFLEtBQTZCO0FBMUtsQztBQTJLTSxhQUFPLGtCQUFhLEtBQUssV0FBVyxNQUE3QixtQkFBaUMsU0FBUSxhQUFhLElBQUksRUFBRSxHQUFHLEtBQUs7QUFBQSxFQUM5RTtBQUNIOzs7QUM3S0EsSUFBQUMsbUJBQStCOzs7QUNBL0IsSUFBQUMsbUJBQThFOzs7QUNBOUUsSUFBQUMsbUJBQXVCO0FBUWhCLElBQU0scUJBQTBEO0FBQUEsRUFDcEUsV0FBVztBQUFBLElBQ1IsZ0JBQWdCLENBQUMsWUFBWTtBQUFBLElBQzdCLGNBQWM7QUFBQSxFQUNqQjtBQUFBLEVBQ0EsWUFBWTtBQUFBLElBQ1QsZ0JBQWdCLENBQUMsY0FBYyxhQUFhO0FBQUEsSUFDNUMsY0FBYztBQUFBLEVBQ2pCO0FBQUEsRUFDQSxXQUFXO0FBQUEsSUFDUixnQkFBZ0I7QUFBQSxNQUNiO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0g7QUFBQSxJQUNBLGNBQWM7QUFBQSxFQUNqQjtBQUFBLEVBQ0EsWUFBWTtBQUFBLElBQ1QsZ0JBQWdCO0FBQUEsTUFDYjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNIO0FBQUEsSUFDQSxjQUFjO0FBQUEsRUFDakI7QUFBQSxFQUNBLFlBQVk7QUFBQSxJQUNULGdCQUFnQixDQUFDLFdBQVc7QUFBQSxJQUM1QixjQUFjO0FBQUEsRUFDakI7QUFBQSxFQUNBLFlBQVk7QUFBQSxJQUNULGdCQUFnQjtBQUFBLE1BQ2I7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0g7QUFBQSxJQUNBLGNBQWM7QUFBQSxFQUNqQjtBQUFBLEVBQ0EsV0FBVztBQUFBLElBQ1IsZ0JBQWdCLENBQUMsYUFBYTtBQUFBLElBQzlCLGNBQWM7QUFBQSxFQUNqQjtBQUNIO0FBRU8sU0FBUyxrQkFBa0IsUUFBZ0IsS0FBYUMsZUFBcUM7QUFDakcsUUFBTSxhQUFhLG1CQUFtQixNQUFNO0FBQzVDLE1BQUksQ0FBQztBQUFZLFdBQU87QUFFeEIsTUFBSTtBQUNELFVBQU0sU0FBUyxJQUFJLElBQUksR0FBRztBQUMxQixVQUFNLFVBQVUsV0FBVyxlQUFlO0FBQUEsTUFBSyxPQUM1QyxPQUFPLGFBQWEsS0FBSyxPQUFPLFNBQVMsU0FBUyxNQUFNLENBQUM7QUFBQSxJQUM1RDtBQUVBLFFBQUksQ0FBQyxTQUFTO0FBQ1gsVUFBSSx3QkFBT0EsY0FBYSxFQUFFLGVBQWUsRUFBRSxRQUFRLGFBQWEsV0FBVyxZQUFZLENBQUM7QUFDeEYsYUFBTztBQUFBLElBQ1Y7QUFFQSxXQUFPO0FBQUEsRUFDVixTQUFTLE9BQU87QUFDYixRQUFJLHdCQUFPQSxjQUFhLEVBQUUsZUFBZSxFQUFFLFFBQVEsYUFBYSxjQUFjLENBQUM7QUFDL0UsV0FBTztBQUFBLEVBQ1Y7QUFDSDs7O0FEbEZPLElBQU0sdUJBQU4sY0FBbUMsdUJBQU07QUFBQSxFQU83QyxZQUNHLEtBQ1EsUUFDQSxVQUNBQyxlQUNUO0FBQ0MsVUFBTSxHQUFHO0FBSkQ7QUFDQTtBQUNBLHdCQUFBQTtBQVZYLFNBQVEsTUFBYztBQUN0QixTQUFRLE9BQWU7QUFDdkIsU0FBUSxpQkFBeUI7QUFDakMsU0FBUSxTQUFpQjtBQUN6QixTQUFRLFVBQW9CLENBQUM7QUFBQSxFQVM3QjtBQUFBLEVBRUEsTUFBTSxTQUFTO0FBRVosUUFBSTtBQUNELFdBQUssVUFBVSxNQUFNLFNBQVM7QUFBQSxRQUMzQixLQUFLLFNBQVM7QUFBQSxRQUNkLEtBQUssU0FBUztBQUFBLE1BQ2pCO0FBQUEsSUFDSCxTQUFTLE9BQU87QUFDYixjQUFRLE1BQU0sMEJBQTBCLEtBQUs7QUFDN0MsVUFBSSx3QkFBTyxLQUFLLGFBQWEsRUFBRSxlQUFlLEVBQUUsUUFBUSxhQUFhLGtDQUFrQyxDQUFDO0FBQ3hHLFdBQUssTUFBTTtBQUNYO0FBQUEsSUFDSDtBQUVBLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFDdEIsY0FBVSxNQUFNO0FBRWhCLGNBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLGFBQWEsRUFBRSx1QkFBdUIsRUFBRSxDQUFDO0FBRy9FLFFBQUkseUJBQVEsU0FBUyxFQUNqQixRQUFRLEtBQUssYUFBYSxFQUFFLHNCQUFzQixDQUFDLEVBQ25ELFFBQVEsS0FBSyxhQUFhLEVBQUUsMEJBQTBCLENBQUMsRUFDdkQsUUFBUSxVQUFRLEtBQ2IsZUFBZSxpQ0FBaUMsRUFDaEQsU0FBUyxXQUFTLEtBQUssTUFBTSxLQUFLLENBQUM7QUFHMUMsUUFBSSx5QkFBUSxTQUFTLEVBQ2pCLFFBQVEsS0FBSyxhQUFhLEVBQUUsY0FBYyxDQUFDLEVBQzNDLFFBQVEsS0FBSyxhQUFhLEVBQUUsa0JBQWtCLENBQUMsRUFDL0MsUUFBUSxVQUFRLEtBQ2IsZUFBZSxLQUFLLGFBQWEsRUFBRSx5QkFBeUIsQ0FBQyxFQUM3RCxTQUFTLFdBQVMsS0FBSyxTQUFTLEtBQUssQ0FBQztBQUc3QyxRQUFJLHlCQUFRLFNBQVMsRUFDakIsUUFBUSxLQUFLLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxFQUMvQyxRQUFRLEtBQUssYUFBYSxFQUFFLHNCQUFzQixDQUFDLEVBQ25ELFFBQVEsVUFBUSxLQUNiLGVBQWUsVUFBVSxFQUN6QixTQUFTLFdBQVMsS0FBSyxPQUFPLEtBQUssQ0FBQztBQUczQyxVQUFNLGdCQUFnQixLQUFLLHdCQUF3QjtBQUNuRCxRQUFJLHlCQUFRLFNBQVMsRUFDakIsUUFBUSxLQUFLLGFBQWEsRUFBRSxjQUFjLENBQUMsRUFDM0MsUUFBUSxLQUFLLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxFQUMvQyxZQUFZLGNBQVk7QUFFdEIsV0FBSyxRQUFRLFFBQVEsWUFBVTtBQUM1QixpQkFBUyxVQUFVLFFBQVEsTUFBTTtBQUFBLE1BQ3BDLENBQUM7QUFDRCxlQUFTLFNBQVMsYUFBYTtBQUMvQixlQUFTLFNBQVMsV0FBUyxLQUFLLGlCQUFpQixLQUFLO0FBQUEsSUFDekQsQ0FBQztBQUdKLFVBQU0sa0JBQWtCLFVBQVUsU0FBUyxPQUFPLEVBQUUsS0FBSyx5QkFBeUIsQ0FBQztBQUduRixvQkFBZ0IsU0FBUyxVQUFVLEVBQUUsTUFBTSxVQUFVLENBQUMsRUFDbEQsaUJBQWlCLFNBQVMsTUFBTSxLQUFLLE1BQU0sQ0FBQztBQUdoRCxVQUFNLGVBQWUsZ0JBQWdCLFNBQVMsVUFBVTtBQUFBLE1BQ3JELE1BQU0sS0FBSyxhQUFhLEVBQUUsY0FBYztBQUFBLE1BQ3hDLEtBQUs7QUFBQSxJQUNSLENBQUM7QUFDRCxpQkFBYSxpQkFBaUIsU0FBUyxNQUFNO0FBQzFDLFVBQUksQ0FBQyxLQUFLLEtBQUs7QUFDWixZQUFJLHdCQUFPLEtBQUssYUFBYSxFQUFFLHFCQUFxQixDQUFDO0FBQ3JEO0FBQUEsTUFDSDtBQUNBLFdBQUssZ0JBQWdCLEtBQUssS0FBSyxLQUFLLE1BQU0sS0FBSyxrQkFBa0IsYUFBYTtBQUFBLElBQ2pGLENBQUM7QUFBQSxFQUNKO0FBQUEsRUFFQSxVQUFVO0FBQ1AsVUFBTSxFQUFFLFVBQVUsSUFBSTtBQUN0QixjQUFVLE1BQU07QUFBQSxFQUNuQjtBQUFBLEVBRVEsMEJBQWtDO0FBQ3ZDLFVBQU0sYUFBYSxLQUFLLElBQUksVUFBVSxjQUFjO0FBQ3BELFFBQUksQ0FBQztBQUFZLGFBQU8sS0FBSyxRQUFRLENBQUMsS0FBSztBQUczQyxVQUFNLFdBQVcsV0FBVztBQUc1QixRQUFJLFlBQStDLEVBQUUsUUFBUSxLQUFLLFFBQVEsQ0FBQyxLQUFLLFVBQVUsT0FBTyxHQUFHO0FBRXBHLFNBQUssU0FBUyxxQkFBcUIsUUFBUSxhQUFXO0FBRW5ELFVBQUksU0FBUyxXQUFXLFFBQVEsTUFBTSxHQUFHO0FBRXRDLGNBQU0sUUFBUSxRQUFRLE9BQU8sTUFBTSxHQUFHLEVBQUU7QUFHeEMsWUFBSSxRQUFRLFVBQVUsT0FBTztBQUMxQixzQkFBWTtBQUFBLFlBQ1QsUUFBUSxRQUFRO0FBQUEsWUFDaEI7QUFBQSxVQUNIO0FBQUEsUUFDSDtBQUFBLE1BQ0g7QUFBQSxJQUNILENBQUM7QUFFRCxXQUFPLFVBQVU7QUFBQSxFQUNwQjtBQUFBLEVBRUEsTUFBYyxnQkFBZ0IsS0FBYSxNQUFjLFFBQWdCO0FBckk1RTtBQXNJTSxRQUFJO0FBQ0QsY0FBUSxJQUFJLDZCQUE2QixFQUFFLEtBQUssTUFBTSxPQUFPLENBQUM7QUFHOUQsVUFBSSxDQUFDLFFBQVE7QUFDVixpQkFBUztBQUFBLE1BQ1o7QUFHQSxVQUFJLENBQUMsSUFBSSxXQUFXLFNBQVMsS0FBSyxDQUFDLElBQUksV0FBVyxVQUFVLEdBQUc7QUFDNUQsY0FBTSxhQUFhO0FBQUEsTUFDdEI7QUFHQSxVQUFJLENBQUMsa0JBQWtCLFFBQVEsS0FBSyxLQUFLLFlBQVksR0FBRztBQUNyRDtBQUFBLE1BQ0g7QUFHQSxVQUFJLE1BQU07QUFDUCxjQUFNLFlBQVk7QUFDbEIsWUFBSSxDQUFDLFVBQVUsS0FBSyxJQUFJLEdBQUc7QUFDeEIsY0FBSSx3QkFBTyxLQUFLLGFBQWEsRUFBRSxlQUFlLEVBQUUsUUFBUSxhQUFhLHNFQUFzRSxDQUFDO0FBQzVJO0FBQUEsUUFDSDtBQUVBLFlBQUksS0FBSyxTQUFTLEdBQUc7QUFDbEIsY0FBSSx3QkFBTyxLQUFLLGFBQWEsRUFBRSxlQUFlLEVBQUUsUUFBUSxhQUFhLHFFQUFrRSxDQUFDO0FBQ3hJO0FBQUEsUUFDSDtBQUFBLE1BQ0g7QUFHQSxVQUFJLENBQUMsS0FBSyxRQUFRLFNBQVMsTUFBTSxHQUFHO0FBQ2pDLFlBQUksd0JBQU8sS0FBSyxhQUFhLEVBQUUsZUFBZSxFQUFFLFFBQVEsYUFBYSxjQUFjLE1BQU0sc0RBQXNELENBQUM7QUFDaEo7QUFBQSxNQUNIO0FBRUEsWUFBTSxVQUFVO0FBQUEsUUFDYjtBQUFBLFFBQ0E7QUFBQSxRQUNBLEdBQUksUUFBUSxFQUFFLEtBQUssS0FBSztBQUFBLFFBQ3hCLEdBQUksS0FBSyxTQUFTLGtCQUFrQixFQUFFLFdBQVcsS0FBSyxTQUFTLGVBQWU7QUFBQSxNQUNqRjtBQUVBLGNBQVEsSUFBSSxvQkFBb0IsT0FBTztBQUV2QyxZQUFNLFdBQVcsVUFBTSw2QkFBVztBQUFBLFFBQy9CLEtBQUs7QUFBQSxRQUNMLFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxVQUNOLGlCQUFpQixVQUFVLEtBQUssU0FBUyxTQUFTO0FBQUEsVUFDbEQsZ0JBQWdCO0FBQUEsVUFDaEIsVUFBVTtBQUFBLFFBQ2I7QUFBQSxRQUNBLE1BQU0sS0FBSyxVQUFVLE9BQU87QUFBQSxNQUMvQixDQUFDO0FBRUQsY0FBUSxJQUFJLG9CQUFvQixTQUFTLE1BQU07QUFDL0MsY0FBUSxJQUFJLGtCQUFrQixTQUFTLElBQUk7QUFDM0MsY0FBUSxJQUFJLHFCQUFxQixTQUFTLE9BQU87QUFFakQsVUFBSSxTQUFTLFdBQVcsT0FBTyxTQUFTLFdBQVcsS0FBSztBQUNyRCxjQUFNLFlBQVksU0FBUyxLQUFLO0FBQ2hDLGdCQUFRLElBQUksdUJBQXVCLFNBQVM7QUFFNUMsY0FBTSxhQUFhLEtBQUssT0FBTyxJQUFJLFVBQVUsb0JBQW9CLDZCQUFZO0FBRTdFLFlBQUksWUFBWTtBQUNiLGdCQUFNLFNBQVMsV0FBVztBQUMxQixnQkFBTSxPQUFPLFdBQVc7QUFFeEIsY0FBSSxVQUFVLE1BQU07QUFFakIsa0JBQU0sV0FBVyxLQUFLLFVBQVU7QUFFaEMsa0JBQU0sZUFBZSxJQUFJLFFBQVEsS0FBSyxTQUFTO0FBRS9DLG9CQUFRLElBQUksNEJBQTRCLFlBQVk7QUFHcEQsa0JBQU0sU0FBUyxPQUFPLFVBQVU7QUFHaEMsbUJBQU8sYUFBYSxjQUFjLE1BQU07QUFHeEMsaUJBQUssT0FBTyxJQUFJLGNBQWMsYUFBYSxJQUFJO0FBQUEsVUFDbEQ7QUFBQSxRQUNIO0FBRUEsWUFBSSx3QkFBTyxLQUFLLGFBQWEsRUFBRSxxQkFBcUIsQ0FBQztBQUNyRCxhQUFLLE1BQU07QUFBQSxNQUNkLE9BQU87QUFDSixnQkFBUSxNQUFNLG1CQUFtQixRQUFRO0FBQ3pDLGdCQUFRLE1BQU0sd0JBQXdCLFNBQVMsSUFBSTtBQUNuRCxZQUFJLGlCQUFlLGNBQVMsU0FBVCxtQkFBZSxZQUFTLGNBQVMsU0FBVCxtQkFBZSxZQUFXO0FBR3JFLFlBQUksU0FBUyxXQUFXLEtBQUs7QUFDMUIseUJBQWU7QUFBQSxRQUNsQixXQUFXLFNBQVMsV0FBVyxLQUFLO0FBQ2pDLHlCQUFlO0FBQUEsUUFDbEIsV0FBVyxTQUFTLFdBQVcsS0FBSztBQUNqQyx5QkFBZTtBQUFBLFFBQ2xCLFdBQVcsU0FBUyxXQUFXLEtBQUs7QUFDakMseUJBQWU7QUFBQSxRQUNsQixXQUFXLFNBQVMsV0FBVyxLQUFLO0FBQ2pDLGtCQUFRLE1BQU0sc0JBQXNCLFNBQVMsSUFBSTtBQUNqRCxnQkFBSSxjQUFTLFNBQVQsbUJBQWUsVUFBUyxvQkFBb0I7QUFDN0MsMkJBQWUsY0FBYyxNQUFNO0FBRW5DLGlCQUFLLFVBQVUsTUFBTSxTQUFTO0FBQUEsY0FDM0IsS0FBSyxTQUFTO0FBQUEsY0FDZCxLQUFLLFNBQVM7QUFBQSxjQUNkO0FBQUE7QUFBQSxZQUNIO0FBQUEsVUFDSCxhQUFXLGNBQVMsU0FBVCxtQkFBZSxVQUFTLHNCQUFzQjtBQUN0RCwyQkFBZSx1Q0FBb0MsTUFBTTtBQUFBLFVBQzVELGFBQVcsY0FBUyxTQUFULG1CQUFlLFVBQVMsa0JBQWtCO0FBQ2xELDJCQUFlLGNBQWMsTUFBTTtBQUFBLFVBQ3RDLE9BQU87QUFDSiw2QkFBZSxjQUFTLFNBQVQsbUJBQWUsWUFBVztBQUFBLFVBQzVDO0FBQUEsUUFDSDtBQUVBLFlBQUksd0JBQU8sS0FBSyxhQUFhLEVBQUUsZUFBZSxFQUFFLFFBQVEsYUFBYSxHQUFHLFlBQVksRUFBRSxDQUFDO0FBQUEsTUFDMUY7QUFBQSxJQUNILFNBQVMsT0FBTztBQUNiLGNBQVEsTUFBTSxnREFBNkMsS0FBSztBQUNoRSxVQUFJLGlCQUFpQixPQUFPO0FBQ3pCLGdCQUFRLE1BQU0sa0JBQWtCLE1BQU0sT0FBTztBQUM3QyxnQkFBUSxNQUFNLGdCQUFnQixNQUFNLEtBQUs7QUFBQSxNQUM1QztBQUVBLFVBQUksZUFBZSxNQUFNO0FBQ3pCLFVBQUksYUFBYSxTQUFTLFlBQVksR0FBRztBQUN0Qyx1QkFBZTtBQUFBLE1BQ2xCLFdBQVcsYUFBYSxTQUFTLFlBQVksR0FBRztBQUM3Qyx1QkFBZTtBQUFBLE1BQ2xCO0FBRUEsVUFBSSx3QkFBTyxLQUFLLGFBQWEsRUFBRSxlQUFlLEVBQUUsUUFBUSxhQUFhLFlBQVksQ0FBQztBQUFBLElBQ3JGO0FBQUEsRUFDSDtBQUNIOzs7QURsUk8sSUFBTSxVQUFOLE1BQWM7QUFBQSxFQUNsQixZQUNXLFFBQ0EsVUFDQUMsZUFDVDtBQUhTO0FBQ0E7QUFDQSx3QkFBQUE7QUFBQSxFQUNSO0FBQUEsRUFFSCxrQkFBa0I7QUFFZixTQUFLLE9BQU8sV0FBVztBQUFBLE1BQ3BCLElBQUk7QUFBQSxNQUNKLE1BQU0sS0FBSyxhQUFhLEVBQUUsdUJBQXVCO0FBQUEsTUFDakQsVUFBVSxNQUFNO0FBQ2IsWUFBSSxDQUFDLEtBQUssU0FBUyxXQUFXO0FBQzNCLGNBQUksd0JBQU8sS0FBSyxhQUFhLEVBQUUsZUFBZSxFQUFFLFFBQVEsYUFBYSx3QkFBd0IsQ0FBQztBQUM5RjtBQUFBLFFBQ0g7QUFFQSxZQUFJO0FBQUEsVUFDRCxLQUFLLE9BQU87QUFBQSxVQUNaLEtBQUs7QUFBQSxVQUNMLEtBQUs7QUFBQSxVQUNMLEtBQUs7QUFBQSxRQUNSLEVBQUUsS0FBSztBQUFBLE1BQ1Y7QUFBQSxNQUNBLFNBQVMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxRQUFRLE9BQU8sR0FBRyxLQUFLLElBQUksQ0FBQztBQUFBLElBQ3ZELENBQUM7QUFBQSxFQUNKO0FBQ0g7OztBR2pDQSxJQUFBQyxtQkFBZ0Q7QUFHekMsSUFBTSxzQkFBc0I7QUFFNUIsSUFBTSxnQkFBTixjQUE0QiwwQkFBUztBQUFBLEVBQ3pDLFlBQ0csTUFDUSxRQUNBQyxlQUNUO0FBQ0MsVUFBTSxJQUFJO0FBSEY7QUFDQSx3QkFBQUE7QUFBQSxFQUdYO0FBQUEsRUFFQSxjQUFzQjtBQUNuQixXQUFPO0FBQUEsRUFDVjtBQUFBLEVBRUEsaUJBQXlCO0FBQ3RCLFdBQU8sS0FBSyxhQUFhLEVBQUUsaUJBQWlCO0FBQUEsRUFDL0M7QUFBQSxFQUVBLE1BQU0sU0FBUztBQUNaLFVBQU0sWUFBWSxLQUFLLFlBQVksU0FBUyxDQUFDO0FBQzdDLGNBQVUsTUFBTTtBQUNoQixjQUFVLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQztBQUd6RSxVQUFNLGlCQUFpQixVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssa0JBQWtCLENBQUM7QUFBQSxFQUc5RTtBQUFBLEVBRUEsTUFBTSxVQUFVO0FBQUEsRUFFaEI7QUFDSDtBQUVPLElBQU0sbUJBQU4sTUFBdUI7QUFBQSxFQUMzQixZQUFvQixRQUF3QkEsZUFBNEI7QUFBcEQ7QUFBd0Isd0JBQUFBO0FBQUEsRUFBNkI7QUFBQSxFQUV6RSxNQUFNLGNBQWMsTUFBcUM7QUFFdEQsVUFBTSxpQkFBaUIsS0FBSyxPQUFPLElBQUksVUFBVSxnQkFBZ0IsbUJBQW1CO0FBQ3BGLFFBQUksZUFBZSxTQUFTLEdBQUc7QUFFNUIsV0FBSyxPQUFPLElBQUksVUFBVSxXQUFXLGVBQWUsQ0FBQyxDQUFDO0FBQ3REO0FBQUEsSUFDSDtBQUdBLFVBQU0sV0FBVyxLQUFLLE9BQU87QUFDN0IsVUFBTSxTQUFTLFFBQVEsSUFBSTtBQUFBLEVBQzlCO0FBQUEsRUFFQSxpQkFBdUM7QUFDcEMsVUFBTSxTQUFTLEtBQUssT0FBTyxJQUFJLFVBQVUsZ0JBQWdCLG1CQUFtQjtBQUM1RSxXQUFPLE9BQU8sU0FBUyxJQUFJLE9BQU8sQ0FBQyxJQUFJO0FBQUEsRUFDMUM7QUFDSDs7O0FDeERPLElBQU0sV0FBTixNQUFlO0FBQUEsRUFJbkIsWUFBb0IsUUFBZ0I7QUFBaEI7QUFIcEIsU0FBUSxjQUE2QztBQUNyRCxTQUFRLGNBQW9DO0FBQUEsRUFFUDtBQUFBLEVBRXJDLE1BQU0sUUFBUSxNQUFxQztBQVR0RDtBQVVNLFNBQUssY0FBYztBQUduQixRQUFJLEtBQUssYUFBYTtBQUNuQixXQUFLLFlBQVksT0FBTztBQUFBLElBQzNCO0FBRUEsVUFBTSxZQUFZLEtBQUssT0FBTyxJQUFJO0FBQ2xDLFFBQUk7QUFHSixZQUFRLE1BQU07QUFBQSxNQUNYLEtBQUs7QUFDRixnQkFBTyxlQUFVLGFBQWEsS0FBSyxNQUE1QixZQUFpQyxVQUFVLFFBQVEsT0FBTztBQUNqRTtBQUFBLE1BQ0gsS0FBSztBQUNGLGNBQU0sY0FBYSxlQUFVLGtCQUFrQixNQUE1QixZQUFpQyxVQUFVLFFBQVEsT0FBTztBQUM3RSxlQUFPLFVBQVUsa0JBQWtCLFlBQVksY0FBYyxJQUFJO0FBQ2pFO0FBQUEsTUFDSCxLQUFLO0FBQUEsTUFDTDtBQUNHLGVBQU8sVUFBVSxRQUFRLE9BQU87QUFDaEM7QUFBQSxJQUNOO0FBR0EsVUFBTSxLQUFLLGFBQWE7QUFBQSxNQUNyQixNQUFNO0FBQUEsTUFDTixRQUFRO0FBQUEsSUFDWCxDQUFDO0FBRUQsU0FBSyxjQUFjO0FBQ25CLFNBQUssT0FBTyxJQUFJLFVBQVUsV0FBVyxJQUFJO0FBQUEsRUFDNUM7QUFBQSxFQUVBLGlCQUFnRDtBQUM3QyxXQUFPLEtBQUs7QUFBQSxFQUNmO0FBQUEsRUFFQSxpQkFBdUM7QUFDcEMsV0FBTyxLQUFLO0FBQUEsRUFDZjtBQUNIOzs7QUNwREEsSUFBTSxTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQTZEUixTQUFTLGlCQUFpQjtBQUM5QixRQUFNLFVBQVUsU0FBUyxjQUFjLE9BQU87QUFDOUMsVUFBUSxLQUFLO0FBQ2IsVUFBUSxjQUFjO0FBQ3RCLFdBQVMsS0FBSyxZQUFZLE9BQU87QUFDcEM7QUFFTyxTQUFTLG1CQUFtQjtBQUNoQyxRQUFNLFVBQVUsU0FBUyxlQUFlLGtCQUFrQjtBQUMxRCxNQUFJLFNBQVM7QUFDVixZQUFRLE9BQU87QUFBQSxFQUNsQjtBQUNIOzs7QVJqRUEsSUFBcUIsWUFBckIsY0FBdUMsd0JBQU87QUFBQSxFQUE5QztBQUFBO0FBRUcsU0FBUSxlQUE2QixJQUFJLGFBQWE7QUFBQTtBQUFBLEVBS3RELE1BQU0sU0FBUztBQUVaLGFBQVMsV0FBVyxJQUFJO0FBQ3hCLFVBQU0sV0FBVyxNQUFNLFNBQVMsYUFBYTtBQUM3QyxTQUFLLFdBQVc7QUFDaEIsU0FBSyxhQUFhO0FBR2xCLG1CQUFlO0FBR2YsU0FBSyxVQUFVLElBQUksUUFBUSxNQUFNLEtBQUssVUFBVSxLQUFLLFlBQVk7QUFDakUsU0FBSyxRQUFRLGdCQUFnQjtBQUc3QixTQUFLLElBQUksVUFBVSxjQUFjLE1BQU07QUFFcEMsV0FBSyxXQUFXLElBQUksU0FBUyxJQUFJO0FBR2pDLFdBQUs7QUFBQSxRQUNGO0FBQUEsUUFDQSxDQUFDLFNBQVMsSUFBSSxjQUFjLE1BQU0sTUFBTSxLQUFLLFlBQVk7QUFBQSxNQUM1RDtBQUdBLFdBQUssbUJBQW1CLElBQUksaUJBQWlCLE1BQU0sS0FBSyxZQUFZO0FBR3BFLFdBQUssY0FBYyxvQkFBb0IsNEJBQTRCLE1BQU07QUFDdEUsYUFBSyxpQkFBaUIsY0FBYyxLQUFLLFNBQVMsUUFBUTtBQUFBLE1BQzdELENBQUM7QUFBQSxJQUNKLENBQUM7QUFHRCxTQUFLLGNBQWMsSUFBSTtBQUFBLE1BQ3BCLEtBQUs7QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0EsS0FBSztBQUFBLElBQ1IsQ0FBQztBQUFBLEVBQ0o7QUFBQSxFQUVRLGVBQXFCO0FBMURoQztBQTJETSxVQUFNLFdBQVMsY0FBUyxnQkFBZ0IsU0FBekIsbUJBQStCLGNBQWMsV0FBVyxTQUFRLE9BQU87QUFDdEYsU0FBSyxhQUFhLFlBQVksTUFBTTtBQUFBLEVBQ3ZDO0FBQUEsRUFFQSxXQUFXO0FBL0RkO0FBaUVNLHFCQUFpQjtBQUdqQixVQUFNLFFBQU8sVUFBSyxxQkFBTCxtQkFBdUI7QUFDcEMsUUFBSSxNQUFNO0FBQ1AsV0FBSyxPQUFPO0FBQUEsSUFDZjtBQUFBLEVBQ0g7QUFDSDsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgInRyYW5zbGF0aW9ucyIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJ0cmFuc2xhdGlvbnMiLCAidHJhbnNsYXRpb25zIiwgInRyYW5zbGF0aW9ucyIsICJpbXBvcnRfb2JzaWRpYW4iLCAidHJhbnNsYXRpb25zIl0KfQo=
