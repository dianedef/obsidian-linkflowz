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
var import_obsidian8 = require("obsidian");

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
    "dashboard.refresh": "Refresh",
    "dashboard.viewModeTab": "Open in Tab",
    "dashboard.viewModeSidebar": "Open in Sidebar",
    "dashboard.viewModePopup": "Open as Popup",
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
    "dashboard.refresh": "Rafra\xEEchir",
    "dashboard.viewModeTab": "Ouvrir dans un onglet",
    "dashboard.viewModeSidebar": "Ouvrir dans la barre lat\xE9rale",
    "dashboard.viewModePopup": "Ouvrir en popup",
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
var import_obsidian6 = require("obsidian");

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

// obsidian---linkflowz/src/Dashboard.ts
var import_obsidian4 = require("obsidian");
var import_obsidian5 = require("obsidian");
var VIEW_TYPE_DASHBOARD = "linkflowz-view";
var DashboardView = class extends import_obsidian4.ItemView {
  constructor(leaf, plugin, translations2) {
    super(leaf);
    this.plugin = plugin;
    this.translations = translations2;
    this.links = [];
    this.filteredLinks = [];
    this.isLoading = false;
  }
  getViewType() {
    return VIEW_TYPE_DASHBOARD;
  }
  getDisplayText() {
    return this.translations.t("dashboard.title");
  }
  async onOpen() {
    const container = this.containerEl;
    container.empty();
    const dashboardContainer = container.createDiv({ cls: "linkflowz-container" });
    const header = dashboardContainer.createEl("div", { cls: "linkflowz-header" });
    const titleRow = header.createEl("div", { cls: "linkflowz-header-row" });
    titleRow.createEl("h2", { text: this.translations.t("dashboard.title") });
    const buttons = titleRow.createEl("div", { cls: "linkflowz-buttons" });
    const createButton = buttons.createEl("button", {
      cls: "linkflowz-button mod-cta",
      text: this.translations.t("modal.createShortLink")
    });
    (0, import_obsidian4.setIcon)(createButton, "plus");
    createButton.addEventListener("click", () => this.openCreateLinkModal());
    const refreshButton = buttons.createEl("button", {
      cls: "linkflowz-button",
      text: this.translations.t("dashboard.refresh")
    });
    (0, import_obsidian4.setIcon)(refreshButton, "refresh-cw");
    refreshButton.addEventListener("click", () => this.refresh());
    const searchRow = header.createEl("div", { cls: "linkflowz-header-row" });
    const searchContainer = searchRow.createEl("div", { cls: "linkflowz-search" });
    this.searchInput = searchContainer.createEl("input", {
      type: "text",
      cls: "linkflowz-search-input"
    });
    const searchIcon = searchContainer.createEl("span", { cls: "linkflowz-search-icon" });
    (0, import_obsidian4.setIcon)(searchIcon, "search");
    this.searchInput.addEventListener("input", () => {
      this.filterLinks();
    });
    const content = dashboardContainer.createEl("div", { cls: "linkflowz-content" });
    const linksList = content.createEl("div", { cls: "linkflowz-links-list" });
    await this.loadLinks(linksList);
  }
  async onClose() {
    this.containerEl.empty();
  }
  async refresh() {
    const content = this.containerEl.querySelector(".linkflowz-links-list");
    if (content) {
      content.addClass("fade-out");
      await new Promise((resolve) => setTimeout(resolve, 300));
      content.empty();
      content.removeClass("fade-out");
      await this.loadLinks(content);
    }
  }
  async loadLinks(container) {
    try {
      if (this.isLoading)
        return;
      this.isLoading = true;
      container.empty();
      const loader = container.createEl("div", {
        cls: "linkflowz-loading",
        text: this.translations.t("dashboard.loading")
      });
      const settings = await Settings.loadSettings();
      if (!settings.dubApiKey) {
        throw new Error("API key required");
      }
      const response = await (0, import_obsidian5.requestUrl)({
        url: `https://api.dub.co/links${settings.dubWorkspaceId ? `?workspaceId=${settings.dubWorkspaceId}` : ""}`,
        method: "GET",
        headers: {
          "Authorization": `Bearer ${settings.dubApiKey}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status !== 200) {
        throw new Error(`API Error: ${response.status} - ${response.text}`);
      }
      const links = await response.json;
      if (!Array.isArray(links)) {
        throw new Error("Invalid API response format: expected array");
      }
      this.links = links.map((link) => ({
        id: link.id,
        url: link.url,
        shortUrl: link.shortLink,
        domain: link.domain,
        createdAt: link.createdAt,
        clicks: link.clicks || 0
      }));
      loader.remove();
      if (this.links.length === 0) {
        container.createEl("div", {
          cls: "linkflowz-empty-state",
          text: this.translations.t("dashboard.noLinks")
        });
        return;
      }
      this.links.forEach((link) => this.createLinkElement(container, link));
    } catch (error) {
      console.error("Erreur lors du chargement des liens:", error);
      container.createEl("div", {
        cls: "linkflowz-error",
        text: this.translations.t("dashboard.error").replace("{message}", error.message)
      });
    } finally {
      this.isLoading = false;
    }
  }
  createLinkElement(container, link) {
    const linkEl = container.createEl("div", {
      cls: "linkflowz-link-item",
      attr: { tabindex: "0" }
    });
    linkEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        window.open(link.shortUrl, "_blank");
      } else if (e.key === "ArrowDown") {
        const next = linkEl.nextElementSibling;
        if (next)
          next.focus();
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        const prev = linkEl.previousElementSibling;
        if (prev)
          prev.focus();
        e.preventDefault();
      }
    });
    const header = linkEl.createEl("div", { cls: "linkflowz-link-header" });
    const shortUrlContainer = header.createEl("div", { cls: "linkflowz-short-url" });
    shortUrlContainer.createEl("a", {
      text: link.shortUrl,
      href: link.shortUrl,
      cls: "linkflowz-link"
    });
    const copyButton = shortUrlContainer.createEl("button", {
      cls: "linkflowz-button-icon",
      attr: {
        "aria-label": "Copy URL",
        "tabindex": "0"
      }
    });
    (0, import_obsidian4.setIcon)(copyButton, "copy");
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(link.shortUrl);
      new import_obsidian4.Notice("URL copied to clipboard");
    });
    const actionsButton = header.createEl("button", {
      cls: "linkflowz-button-icon",
      attr: {
        "aria-label": "Actions",
        "tabindex": "0"
      }
    });
    (0, import_obsidian4.setIcon)(actionsButton, "more-vertical");
    actionsButton.addEventListener("click", (event) => {
      const menu = new import_obsidian4.Menu();
      menu.addItem((item) => item.setIcon("pencil").setTitle("Edit").onClick(() => {
      }));
      menu.addItem((item) => item.setIcon("trash").setTitle("Delete").onClick(() => {
      }));
      menu.showAtMouseEvent(event);
    });
    const details = linkEl.createEl("div", { cls: "linkflowz-link-details" });
    details.createEl("div", {
      cls: "linkflowz-original-url",
      text: link.url
    });
    const stats = details.createEl("div", { cls: "linkflowz-link-stats" });
    stats.createEl("span", {
      cls: "linkflowz-stat",
      text: `${link.clicks} clicks`
    });
    stats.createEl("span", {
      cls: "linkflowz-stat",
      text: new Date(link.createdAt).toLocaleDateString()
    });
  }
  async openCreateLinkModal() {
    const settings = await Settings.loadSettings();
    const modal = new CreateShortLinkModal(
      this.app,
      this.plugin,
      settings,
      this.translations
    );
    modal.open();
  }
  filterLinks() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const content = this.containerEl.querySelector(".linkflowz-links-list");
    if (!content)
      return;
    content.empty();
    if (!searchTerm) {
      this.links.forEach((link) => this.createLinkElement(content, link));
      return;
    }
    const filtered = this.links.filter(
      (link) => link.url.toLowerCase().includes(searchTerm) || link.shortUrl.toLowerCase().includes(searchTerm) || link.domain.toLowerCase().includes(searchTerm)
    );
    if (filtered.length === 0) {
      content.createEl("div", {
        cls: "linkflowz-empty-state",
        text: this.translations.t("dashboard.noSearchResults")
      });
      return;
    }
    filtered.forEach((link) => this.createLinkElement(content, link));
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
    await this.plugin.viewMode.setView(mode);
  }
  getCurrentLeaf() {
    const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD);
    return leaves.length > 0 ? leaves[0] : null;
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
          new import_obsidian6.Notice(this.translations.t("notices.error").replace("{message}", "API key not configured"));
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
    this.plugin.addCommand({
      id: "focus-search",
      name: this.translations.t("dashboard.focusSearch"),
      checkCallback: (checking) => {
        const leaf = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD)[0];
        if (leaf) {
          if (!checking) {
            const searchInput = leaf.view.containerEl.querySelector(".linkflowz-search-input");
            if (searchInput) {
              searchInput.focus();
            }
          }
          return true;
        }
        return false;
      },
      hotkeys: [{ modifiers: ["Ctrl"], key: "k" }]
    });
  }
};

// obsidian---linkflowz/src/ViewMode.ts
var import_obsidian7 = require("obsidian");
var ViewMode = class extends import_obsidian7.Component {
  constructor(plugin) {
    super();
    this.plugin = plugin;
    this.currentView = null;
    this.currentMode = null;
    this.activeLeaf = null;
    this.leafId = null;
    this.translations = new Translations();
    Settings.loadSettings().then((settings) => {
      this.currentMode = settings.currentMode;
    });
    this.closeCurrentView();
  }
  async closeCurrentView() {
    if (this.currentView) {
      if (this.activeLeaf) {
        this.activeLeaf.detach();
      }
      const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD);
      leaves.forEach((leaf) => {
        if (leaf.view instanceof DashboardView) {
          leaf.detach();
        }
      });
      this.currentView = null;
      this.activeLeaf = null;
      this.leafId = null;
    }
  }
  async setView(mode) {
    var _a;
    if (mode === this.currentMode && this.currentView && mode !== "overlay") {
      return;
    }
    await this.closeCurrentView();
    const workspace = this.plugin.app.workspace;
    if (mode === "overlay") {
      const modal = new import_obsidian7.Modal(this.plugin.app);
      modal.titleEl.setText(this.translations.t("dashboard.title"));
      modal.containerEl.addClass("linkflowz-modal");
      const contentEl = modal.contentEl.createDiv("linkflowz-content");
      const view = new DashboardView(
        this.plugin.app.workspace.getLeaf("split"),
        this.plugin,
        this.translations
      );
      await view.onOpen();
      this.currentView = view;
      this.activeLeaf = null;
      modal.open();
    } else {
      let leaf = null;
      switch (mode) {
        case "sidebar":
          leaf = (_a = workspace.getRightLeaf(false)) != null ? _a : workspace.getLeaf("split");
          break;
        case "tab":
        default:
          leaf = workspace.getLeaf("split");
          break;
      }
      if (leaf) {
        await leaf.setViewState({
          type: VIEW_TYPE_DASHBOARD,
          active: true,
          state: {
            mode,
            leafId: this.leafId
          }
        });
        this.currentView = leaf.view;
        this.activeLeaf = leaf;
        this.plugin.app.workspace.revealLeaf(leaf);
      }
    }
    this.currentMode = mode;
    await Settings.saveSettings({ currentMode: mode });
  }
  getActiveLeaf() {
    return this.activeLeaf;
  }
  getCurrentLeafId() {
    return this.leafId;
  }
  getCurrentMode() {
    return this.currentMode;
  }
};

// obsidian---linkflowz/src/RegisterStyles.ts
function registerStyles() {
  const styleEl = document.createElement("style");
  styleEl.id = "linkflowz-styles";
  styleEl.textContent = `
    /* Animations */
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    /* Menu Hover Styles */
    .menu.linkflowz-menu {
        position: absolute;
        z-index: 1000;
    }

    /* Dashboard Container */
    .linkflowz-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 1rem;
        gap: 1rem;
    }

    /* Header Styles */
    .linkflowz-header {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--background-modifier-border);
    }

    .linkflowz-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .linkflowz-header h2 {
        margin: 0;
    }

    .linkflowz-buttons {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    /* Toolbar Styles */
    .linkflowz-toolbar {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        width: 100%;
    }

    .linkflowz-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        background-color: var(--interactive-normal);
        border: 1px solid var(--background-modifier-border);
        color: var(--text-normal);
    }

    .linkflowz-button:hover {
        background-color: var(--interactive-hover);
    }

    .linkflowz-button.mod-cta {
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
    }

    .linkflowz-button.mod-cta:hover {
        background-color: var(--interactive-accent-hover);
    }

    .linkflowz-button-icon {
        padding: 0.25rem;
        border-radius: 4px;
        cursor: pointer;
        background: none;
        border: none;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .linkflowz-button-icon:hover {
        color: var(--text-normal);
        background-color: var(--background-modifier-hover);
    }

    /* Content Styles */
    .linkflowz-content {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 0;
    }

    .linkflowz-links-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        animation: fadeIn 0.3s ease-in-out;
    }

    .linkflowz-links-list.fade-out {
        animation: fadeOut 0.3s ease-in-out;
    }

    /* Link Item Styles */
    .linkflowz-link-item {
        padding: 1rem;
        border-radius: 4px;
        background-color: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
    }

    .linkflowz-link-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .linkflowz-short-url {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .linkflowz-link {
        color: var(--text-accent);
        text-decoration: none;
    }

    .linkflowz-link:hover {
        text-decoration: underline;
    }

    .linkflowz-link-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .linkflowz-original-url {
        color: var(--text-muted);
        font-size: 0.9em;
        word-break: break-all;
    }

    .linkflowz-link-stats {
        display: flex;
        gap: 1rem;
        color: var(--text-muted);
        font-size: 0.9em;
    }

    /* Loading State */
    .linkflowz-loading {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
    }

    /* Empty State */
    .linkflowz-empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
    }

    /* Error State */
    .linkflowz-error {
        color: var(--text-error);
        padding: 1rem;
        text-align: center;
        background-color: var(--background-modifier-error);
        border-radius: 4px;
    }

    /* Modal Styles */
    .linkflowz-modal {
        max-width: 80vw;
        max-height: 80vh;
        width: 600px;
    }

    /* Search Styles */
    .linkflowz-search {
        width: 100%;
        display: flex;
        align-items: center;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background-color: var(--background-primary);
    }

    .linkflowz-search-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        color: var(--text-muted);
    }

    .linkflowz-search-input {
        flex: 1;
        padding: 0.5rem;
        border: none;
        background: none;
        color: var(--text-normal);
    }

    .linkflowz-search-input:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--background-modifier-border);
    }
`;
  document.head.appendChild(styleEl);
}
function unregisterStyles() {
  const styleEl = document.getElementById("linkflowz-styles");
  if (styleEl) {
    styleEl.remove();
  }
}

// obsidian---linkflowz/src/main.ts
var LinkFlowz = class extends import_obsidian8.Plugin {
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
      const ribbonIconEl = this.addRibbonIcon(
        "layout-dashboard",
        this.translations.t("dashboard.title"),
        async () => {
          try {
            const mode = await Settings.getViewMode();
            await this.viewMode.setView(mode);
          } catch (error) {
            console.error("[LinkFlowz]", error);
            new import_obsidian8.Notice(this.translations.t("notices.error"));
          }
        }
      );
      this.registerDomEvent(ribbonIconEl, "mouseenter", () => {
        const menu = new import_obsidian8.Menu();
        const createMenuItem = (title, icon, mode) => {
          menu.addItem((item) => {
            item.setTitle(title).setIcon(icon).onClick(async () => {
              try {
                await this.viewMode.setView(mode);
                await Settings.saveSettings({ currentMode: mode });
                new import_obsidian8.Notice(this.translations.t("notices.success"));
              } catch (error) {
                console.error("[LinkFlowz]", error);
                new import_obsidian8.Notice(this.translations.t("notices.error"));
              }
            });
          });
        };
        createMenuItem(this.translations.t("dashboard.viewModeTab"), "tab", "tab");
        createMenuItem(this.translations.t("dashboard.viewModeSidebar"), "layout-sidebar-right", "sidebar");
        createMenuItem(this.translations.t("dashboard.viewModePopup"), "layout-top", "overlay");
        const rect = ribbonIconEl.getBoundingClientRect();
        menu.showAtPosition({
          x: rect.left,
          y: rect.top
        });
        const closeMenu = (e) => {
          const target = e.relatedTarget;
          if (!(target == null ? void 0 : target.closest(".menu")) && !(target == null ? void 0 : target.closest(".clickable-icon"))) {
            menu.hide();
            document.removeEventListener("mouseover", closeMenu);
          }
        };
        document.addEventListener("mouseover", closeMenu);
      });
    });
    this.addSettingTab(new SettingsTab(
      this.app,
      this,
      settings,
      this.translations
    ));
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        try {
          const settings2 = await Settings.loadSettings();
          if (file.path.startsWith(settings2.notesFolder)) {
            if (this.dashboard) {
              await this.dashboard.refresh();
            }
          }
        } catch (error) {
          console.error("[LinkFlowz] Erreur lors du rafra\xEEchissement:", error);
        }
      })
    );
    registerStyles();
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL1NldHRpbmdzLnRzIiwgInNyYy9UcmFuc2xhdGlvbnMudHMiLCAic3JjL0hvdGtleXMudHMiLCAic3JjL1Nob3J0TGlua01vZGFsLnRzIiwgInNyYy9Eb21haW5WYWxpZGF0aW9ucy50cyIsICJzcmMvRGFzaGJvYXJkLnRzIiwgInNyYy9WaWV3TW9kZS50cyIsICJzcmMvUmVnaXN0ZXJTdHlsZXMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBsdWdpbiwgTWVudSwgTm90aWNlLCBXb3Jrc3BhY2VMZWFmLCBURmlsZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IFNldHRpbmdzLCBTZXR0aW5nc1RhYiwgREVGQVVMVF9TRVRUSU5HUywgRGVmYXVsdFNldHRpbmdzIH0gZnJvbSAnLi9TZXR0aW5ncyc7XG5pbXBvcnQgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL1RyYW5zbGF0aW9ucyc7XG5pbXBvcnQgeyBUVmlld01vZGUgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IEhvdGtleXMgfSBmcm9tICcuL0hvdGtleXMnO1xuaW1wb3J0IHsgVmlld01vZGUgfSBmcm9tICcuL1ZpZXdNb2RlJztcbmltcG9ydCB7IERhc2hib2FyZFZpZXcsIERhc2hib2FyZE1hbmFnZXIsIFZJRVdfVFlQRV9EQVNIQk9BUkQgfSBmcm9tICcuL0Rhc2hib2FyZCc7XG5pbXBvcnQgeyByZWdpc3RlclN0eWxlcywgdW5yZWdpc3RlclN0eWxlcyB9IGZyb20gJy4vUmVnaXN0ZXJTdHlsZXMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaW5rRmxvd3ogZXh0ZW5kcyBQbHVnaW4ge1xuICAgc2V0dGluZ3MhOiBEZWZhdWx0U2V0dGluZ3M7XG4gICBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zID0gbmV3IFRyYW5zbGF0aW9ucygpO1xuICAgcHJpdmF0ZSBob3RrZXlzITogSG90a2V5cztcbiAgIHByaXZhdGUgdmlld01vZGUhOiBWaWV3TW9kZTtcbiAgIHByaXZhdGUgZGFzaGJvYXJkTWFuYWdlciE6IERhc2hib2FyZE1hbmFnZXI7XG5cbiAgIGFzeW5jIG9ubG9hZCgpIHtcbiAgICAgIC8vIEluaXRpYWxpc2F0aW9uIGRlcyBwYXJhbVx1MDBFOHRyZXMgZXQgdHJhZHVjdGlvbnNcbiAgICAgIFNldHRpbmdzLmluaXRpYWxpemUodGhpcyk7XG4gICAgICBjb25zdCBzZXR0aW5ncyA9IGF3YWl0IFNldHRpbmdzLmxvYWRTZXR0aW5ncygpO1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgdGhpcy5sb2FkTGFuZ3VhZ2UoKTtcblxuICAgICAgLy8gRW5yZWdpc3RyZXIgbGVzIHN0eWxlcyBDU1NcbiAgICAgIHJlZ2lzdGVyU3R5bGVzKCk7XG5cbiAgICAgIC8vIEluaXRpYWxpc2F0aW9uIGRlcyBob3RrZXlzXG4gICAgICB0aGlzLmhvdGtleXMgPSBuZXcgSG90a2V5cyh0aGlzLCB0aGlzLnNldHRpbmdzLCB0aGlzLnRyYW5zbGF0aW9ucyk7XG4gICAgICB0aGlzLmhvdGtleXMucmVnaXN0ZXJIb3RrZXlzKCk7XG4gICAgICBcbiAgICAgIC8vIEF0dGVuZHJlIHF1ZSBsZSB3b3Jrc3BhY2Ugc29pdCBwclx1MDBFQXRcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbkxheW91dFJlYWR5KCgpID0+IHtcbiAgICAgICAgIC8vIEluaXRpYWxpc2F0aW9uIGRlIFZpZXdNb2RlXG4gICAgICAgICB0aGlzLnZpZXdNb2RlID0gbmV3IFZpZXdNb2RlKHRoaXMpO1xuXG4gICAgICAgICAvLyBFbnJlZ2lzdHJlbWVudCBkZSBsYSB2dWUgZGFzaGJvYXJkXG4gICAgICAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgICAgICAgIFZJRVdfVFlQRV9EQVNIQk9BUkQsXG4gICAgICAgICAgICAobGVhZikgPT4gbmV3IERhc2hib2FyZFZpZXcobGVhZiwgdGhpcywgdGhpcy50cmFuc2xhdGlvbnMpXG4gICAgICAgICApO1xuXG4gICAgICAgICAvLyBJbml0aWFsaXNhdGlvbiBkdSBkYXNoYm9hcmQgbWFuYWdlclxuICAgICAgICAgdGhpcy5kYXNoYm9hcmRNYW5hZ2VyID0gbmV3IERhc2hib2FyZE1hbmFnZXIodGhpcywgdGhpcy50cmFuc2xhdGlvbnMpO1xuXG4gICAgICAgICAvLyBBam91dCBkdSBib3V0b24gZGFucyBsYSBiYXJyZSBsYXRcdTAwRTlyYWxlIGF2ZWMgbWVudSBob3ZlclxuICAgICAgICAgY29uc3QgcmliYm9uSWNvbkVsID0gdGhpcy5hZGRSaWJib25JY29uKFxuICAgICAgICAgICAgJ2xheW91dC1kYXNoYm9hcmQnLFxuICAgICAgICAgICAgdGhpcy50cmFuc2xhdGlvbnMudCgnZGFzaGJvYXJkLnRpdGxlJyksXG4gICAgICAgICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbW9kZSA9IGF3YWl0IFNldHRpbmdzLmdldFZpZXdNb2RlKCk7XG4gICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnZpZXdNb2RlLnNldFZpZXcobW9kZSk7XG4gICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0xpbmtGbG93el0nLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKSk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICApO1xuXG4gICAgICAgICAvLyBNZW51IGhvdmVyXG4gICAgICAgICB0aGlzLnJlZ2lzdGVyRG9tRXZlbnQocmliYm9uSWNvbkVsLCAnbW91c2VlbnRlcicsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG4gICAgICAgICAgICBjb25zdCBjcmVhdGVNZW51SXRlbSA9ICh0aXRsZTogc3RyaW5nLCBpY29uOiBzdHJpbmcsIG1vZGU6IFRWaWV3TW9kZSkgPT4ge1xuICAgICAgICAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpdGVtLnNldFRpdGxlKHRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgLnNldEljb24oaWNvbilcbiAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnZpZXdNb2RlLnNldFZpZXcobW9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBjdXJyZW50TW9kZTogbW9kZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zdWNjZXNzJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tMaW5rRmxvd3pdJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNyZWF0ZU1lbnVJdGVtKHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC52aWV3TW9kZVRhYicpLCBcInRhYlwiLCBcInRhYlwiKTtcbiAgICAgICAgICAgIGNyZWF0ZU1lbnVJdGVtKHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC52aWV3TW9kZVNpZGViYXInKSwgXCJsYXlvdXQtc2lkZWJhci1yaWdodFwiLCBcInNpZGViYXJcIik7XG4gICAgICAgICAgICBjcmVhdGVNZW51SXRlbSh0aGlzLnRyYW5zbGF0aW9ucy50KCdkYXNoYm9hcmQudmlld01vZGVQb3B1cCcpLCBcImxheW91dC10b3BcIiwgXCJvdmVybGF5XCIpO1xuXG4gICAgICAgICAgICAvLyBQb3NpdGlvbm5lciBsZSBtZW51IGF1LWRlc3N1cyBkZSBsJ2ljXHUwMEY0bmVcbiAgICAgICAgICAgIGNvbnN0IHJlY3QgPSByaWJib25JY29uRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBtZW51LnNob3dBdFBvc2l0aW9uKHsgXG4gICAgICAgICAgICAgICB4OiByZWN0LmxlZnQsIFxuICAgICAgICAgICAgICAgeTogcmVjdC50b3BcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBHXHUwMEU5cmVyIGxhIGZlcm1ldHVyZSBkdSBtZW51XG4gICAgICAgICAgICBjb25zdCBjbG9zZU1lbnUgPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS5yZWxhdGVkVGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgICAgaWYgKCF0YXJnZXQ/LmNsb3Nlc3QoJy5tZW51JykgJiYgIXRhcmdldD8uY2xvc2VzdCgnLmNsaWNrYWJsZS1pY29uJykpIHtcbiAgICAgICAgICAgICAgICAgIG1lbnUuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgY2xvc2VNZW51KTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIGNsb3NlTWVudSk7XG4gICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBam91dCBkZSBsYSBwYWdlIGRlIHBhcmFtXHUwMEU4dHJlc1xuICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTZXR0aW5nc1RhYihcbiAgICAgICAgIHRoaXMuYXBwLFxuICAgICAgICAgdGhpcyxcbiAgICAgICAgIHNldHRpbmdzLFxuICAgICAgICAgdGhpcy50cmFuc2xhdGlvbnNcbiAgICAgICkpO1xuXG4gICAgICAvLyBcdTAwQzljb3V0ZXIgbGVzIG1vZGlmaWNhdGlvbnMgbWFudWVsbGVzIGRlcyBub3Rlc1xuICAgICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgICAgdGhpcy5hcHAudmF1bHQub24oJ21vZGlmeScsIGFzeW5jIChmaWxlOiBURmlsZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgU2V0dGluZ3MubG9hZFNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgoc2V0dGluZ3Mubm90ZXNGb2xkZXIpKSB7XG4gICAgICAgICAgICAgICAgICAvLyBSYWZyYVx1MDBFRWNoaXIgbGEgdnVlXG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXNoYm9hcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZGFzaGJvYXJkLnJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTGlua0Zsb3d6XSBFcnJldXIgbG9ycyBkdSByYWZyYVx1MDBFRWNoaXNzZW1lbnQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIHJlZ2lzdGVyU3R5bGVzKCk7XG4gICB9XG5cbiAgIHByaXZhdGUgbG9hZExhbmd1YWdlKCk6IHZvaWQge1xuICAgICAgY29uc3QgbG9jYWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lmxhbmc/LnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZnInKSA/ICdmcicgOiAnZW4nO1xuICAgICAgdGhpcy50cmFuc2xhdGlvbnMuc2V0TGFuZ3VhZ2UobG9jYWxlKTtcbiAgIH1cblxuICAgb251bmxvYWQoKSB7XG4gICAgICAvLyBTdXBwcmltZXIgbGVzIHN0eWxlc1xuICAgICAgdW5yZWdpc3RlclN0eWxlcygpO1xuICAgICAgXG4gICAgICAvLyBGZXJtZXIgbGEgdnVlIHNpIGVsbGUgZXN0IG91dmVydGVcbiAgICAgIGNvbnN0IGxlYWYgPSB0aGlzLmRhc2hib2FyZE1hbmFnZXI/LmdldEN1cnJlbnRMZWFmKCk7XG4gICAgICBpZiAobGVhZikge1xuICAgICAgICAgbGVhZi5kZXRhY2goKTtcbiAgICAgIH1cbiAgIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBQbHVnaW4sIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIE5vdGljZSwgcmVxdWVzdFVybCwgTWVudSwgVEZvbGRlciB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcblxuZXhwb3J0IGludGVyZmFjZSBEb21haW5Gb2xkZXJNYXBwaW5nIHtcbiAgIGRvbWFpbjogc3RyaW5nO1xuICAgZm9sZGVyOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVmYXVsdFNldHRpbmdzIHtcbiAgIGxhbmd1YWdlOiBzdHJpbmc7XG4gICBkdWJBcGlLZXk6IHN0cmluZztcbiAgIGR1YldvcmtzcGFjZUlkOiBzdHJpbmc7XG4gICBkb21haW5Gb2xkZXJNYXBwaW5nczogRG9tYWluRm9sZGVyTWFwcGluZ1tdO1xuICAgdmlld01vZGU6ICd0YWInIHwgJ3NpZGViYXInIHwgJ292ZXJsYXknO1xuICAgY2FjaGVkRG9tYWluczogc3RyaW5nW107XG4gICBsYXN0RG9tYWluc0ZldGNoOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBEZWZhdWx0U2V0dGluZ3MgPSB7XG4gICBsYW5ndWFnZTogJ2ZyJyxcbiAgIGR1YkFwaUtleTogJycsXG4gICBkdWJXb3Jrc3BhY2VJZDogJycsXG4gICBkb21haW5Gb2xkZXJNYXBwaW5nczogW10sXG4gICB2aWV3TW9kZTogJ3RhYicsXG4gICBjYWNoZWREb21haW5zOiBbXSxcbiAgIGxhc3REb21haW5zRmV0Y2g6IDBcbn07XG5cbmV4cG9ydCBjbGFzcyBTZXR0aW5ncyB7XG4gICBwcml2YXRlIHN0YXRpYyBwbHVnaW46IFBsdWdpbjtcbiAgIHByaXZhdGUgc3RhdGljIHNldHRpbmdzOiBEZWZhdWx0U2V0dGluZ3M7XG4gICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBDQUNIRV9EVVJBVElPTiA9IDI0ICogNjAgKiA2MCAqIDEwMDA7IC8vIDI0IGhldXJlcyBlbiBtaWxsaXNlY29uZGVzXG5cbiAgIHN0YXRpYyBpbml0aWFsaXplKHBsdWdpbjogUGx1Z2luKSB7XG4gICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgIH1cblxuICAgc3RhdGljIGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPERlZmF1bHRTZXR0aW5ncz4ge1xuICAgICAgY29uc3Qgc2F2ZWREYXRhID0gYXdhaXQgdGhpcy5wbHVnaW4ubG9hZERhdGEoKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBzYXZlZERhdGEgfHwge30pO1xuICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3M7XG4gICB9XG5cbiAgIHN0YXRpYyBhc3luYyBzYXZlU2V0dGluZ3Moc2V0dGluZ3M6IFBhcnRpYWw8RGVmYXVsdFNldHRpbmdzPikge1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24odGhpcy5zZXR0aW5ncyB8fCBERUZBVUxUX1NFVFRJTkdTLCBzZXR0aW5ncyk7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgIH1cblxuICAgc3RhdGljIGFzeW5jIGdldENhY2hlZERvbWFpbnMoYXBpS2V5OiBzdHJpbmcsIHdvcmtzcGFjZUlkPzogc3RyaW5nLCBmb3JjZVJlZnJlc2g6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICBjb25zdCBjYWNoZUFnZSA9IG5vdyAtIHRoaXMuc2V0dGluZ3MubGFzdERvbWFpbnNGZXRjaDtcblxuICAgICAgLy8gU2kgbGUgY2FjaGUgZXN0IHZhbGlkZSBldCBub24gdmlkZSwgZXQgcXUnb24gbmUgZm9yY2UgcGFzIGxlIHJhZnJhXHUwMEVFY2hpc3NlbWVudFxuICAgICAgaWYgKCFmb3JjZVJlZnJlc2ggJiYgY2FjaGVBZ2UgPCB0aGlzLkNBQ0hFX0RVUkFUSU9OICYmIHRoaXMuc2V0dGluZ3MuY2FjaGVkRG9tYWlucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICBjb25zb2xlLmxvZygnVXNpbmcgY2FjaGVkIGRvbWFpbnMnKTtcbiAgICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmNhY2hlZERvbWFpbnM7XG4gICAgICB9XG5cbiAgICAgIC8vIFNpbm9uLCByXHUwMEU5Y3VwXHUwMEU5cmVyIGxlcyBkb21haW5lcyBkZXB1aXMgbCdBUElcbiAgICAgIGNvbnNvbGUubG9nKCdDYWNoZSBleHBpcmVkIG9yIGVtcHR5IG9yIGZvcmNlIHJlZnJlc2ggcmVxdWVzdGVkLCBmZXRjaGluZyBmcmVzaCBkb21haW5zJyk7XG4gICAgICBjb25zdCBkb21haW5zID0gYXdhaXQgdGhpcy5mZXRjaERvbWFpbnMoYXBpS2V5LCB3b3Jrc3BhY2VJZCk7XG4gICAgICBcbiAgICAgIC8vIE1ldHRyZSBcdTAwRTAgam91ciBsZSBjYWNoZVxuICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3Moe1xuICAgICAgICAgY2FjaGVkRG9tYWluczogZG9tYWlucyxcbiAgICAgICAgIGxhc3REb21haW5zRmV0Y2g6IG5vd1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkb21haW5zO1xuICAgfVxuXG4gICBzdGF0aWMgYXN5bmMgZmV0Y2hEb21haW5zKGFwaUtleTogc3RyaW5nLCB3b3Jrc3BhY2VJZD86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgICBjb25zb2xlLmxvZygnRmV0Y2hpbmcgY3VzdG9tIGRvbWFpbnMuLi4nKTtcbiAgICAgICAgIFxuICAgICAgICAgLy8gUlx1MDBFOWN1cFx1MDBFOXJlciBkJ2Fib3JkIGxlcyBkb21haW5lcyBwZXJzb25uYWxpc1x1MDBFOXNcbiAgICAgICAgIGNvbnN0IGN1c3RvbURvbWFpbnNSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9hcGkuZHViLmNvL2RvbWFpbnMnLFxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke2FwaUtleX1gLFxuICAgICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG5cbiAgICAgICAgIC8vIFJcdTAwRTljdXBcdTAwRTlyZXIgbGVzIGRvbWFpbmVzIHBhciBkXHUwMEU5ZmF1dCBkaXNwb25pYmxlc1xuICAgICAgICAgY29uc29sZS5sb2coJ0ZldGNoaW5nIGRlZmF1bHQgZG9tYWlucy4uLicpO1xuICAgICAgICAgY29uc3QgZGVmYXVsdERvbWFpbnNSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9hcGkuZHViLmNvL2RvbWFpbnMvZGVmYXVsdCcsXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7YXBpS2V5fWAsXG4gICAgICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgICB9XG4gICAgICAgICB9KTtcblxuICAgICAgICAgbGV0IGRvbWFpbnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgIC8vIEFqb3V0ZXIgbGVzIGRvbWFpbmVzIHBlcnNvbm5hbGlzXHUwMEU5cyBzJ2lscyBleGlzdGVudFxuICAgICAgICAgaWYgKGN1c3RvbURvbWFpbnNSZXNwb25zZS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tRG9tYWlucyA9IEFycmF5LmlzQXJyYXkoY3VzdG9tRG9tYWluc1Jlc3BvbnNlLmpzb24pID8gY3VzdG9tRG9tYWluc1Jlc3BvbnNlLmpzb24gOiBbXTtcbiAgICAgICAgICAgIGRvbWFpbnMgPSBkb21haW5zLmNvbmNhdChjdXN0b21Eb21haW5zLm1hcCgoZG9tYWluOiBhbnkpID0+IGRvbWFpbi5zbHVnKSk7XG4gICAgICAgICB9XG5cbiAgICAgICAgIC8vIEFqb3V0ZXIgbGVzIGRvbWFpbmVzIHBhciBkXHUwMEU5ZmF1dFxuICAgICAgICAgaWYgKGRlZmF1bHREb21haW5zUmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIC8vIExhIHJcdTAwRTlwb25zZSBlc3QgZGlyZWN0ZW1lbnQgdW4gdGFibGVhdSBkZSBzdHJpbmdzIHBvdXIgbGVzIGRvbWFpbmVzIHBhciBkXHUwMEU5ZmF1dFxuICAgICAgICAgICAgY29uc3QgZGVmYXVsdERvbWFpbnMgPSBkZWZhdWx0RG9tYWluc1Jlc3BvbnNlLmpzb247XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkZWZhdWx0RG9tYWlucykpIHtcbiAgICAgICAgICAgICAgIGRvbWFpbnMgPSBkb21haW5zLmNvbmNhdChkZWZhdWx0RG9tYWlucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICB9XG5cbiAgICAgICAgIGNvbnNvbGUubG9nKCdBdmFpbGFibGUgZG9tYWluczonLCBkb21haW5zKTtcbiAgICAgICAgIHJldHVybiBkb21haW5zO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIGRvbWFpbnM6JywgZXJyb3IpO1xuICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGRldGFpbHM6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzdGFjazonLCBlcnJvci5zdGFjayk7XG4gICAgICAgICB9XG4gICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldHRpbmdzVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gICBzZXR0aW5nczogRGVmYXVsdFNldHRpbmdzO1xuICAgcHJpdmF0ZSBkb21haW5zOiBzdHJpbmdbXSA9IFsnZHViLnNoJ107XG5cbiAgIGNvbnN0cnVjdG9yKFxuICAgICAgYXBwOiBBcHAsIFxuICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbiwgXG4gICAgICBzZXR0aW5nczogRGVmYXVsdFNldHRpbmdzLFxuICAgICAgcHJpdmF0ZSB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9uc1xuICAgKSB7XG4gICAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICB9XG5cbiAgIGFzeW5jIGxvYWREb21haW5zKCkge1xuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5KSB7XG4gICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5kb21haW5zID0gYXdhaXQgU2V0dGluZ3MuZ2V0Q2FjaGVkRG9tYWlucyhcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5LFxuICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsIGVycm9yLm1lc3NhZ2UpKTtcbiAgICAgICAgIH1cbiAgICAgIH1cbiAgIH1cblxuICAgZGlzcGxheSgpIHtcbiAgICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgICAvLyBTZWN0aW9uIGR1Yi5jb1xuICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiAnZHViLmNvJyB9KTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAuc2V0TmFtZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kdWJBcGlLZXknKSlcbiAgICAgICAgIC5zZXREZXNjKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmR1YkFwaUtleURlc2MnKSlcbiAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdFbnRyZXogdm90cmUgY2xcdTAwRTkgQVBJJylcbiAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmR1YkFwaUtleSlcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5ID0gdmFsdWU7XG4gICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkdWJBcGlLZXk6IHZhbHVlIH0pO1xuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWREb21haW5zKCk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZHViV29ya3NwYWNlSWQnKSlcbiAgICAgICAgIC5zZXREZXNjKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkRGVzYycpKVxuICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ0VudHJleiB2b3RyZSBJRCBkZSB3b3Jrc3BhY2UnKVxuICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MuZHViV29ya3NwYWNlSWQpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmR1YldvcmtzcGFjZUlkID0gdmFsdWU7XG4gICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkdWJXb3Jrc3BhY2VJZDogdmFsdWUgfSk7XG4gICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5kdWJBcGlLZXkpIHtcbiAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZERvbWFpbnMoKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgLy8gQm91dG9uIGRlIHJhZnJhXHUwMEVFY2hpc3NlbWVudCBkZXMgZG9tYWluZXNcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MucmVmcmVzaERvbWFpbnMnKSlcbiAgICAgICAgIC5zZXREZXNjKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLnJlZnJlc2hEb21haW5zRGVzYycpKVxuICAgICAgICAgLmFkZEJ1dHRvbihidXR0b24gPT4gYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dCh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5yZWZyZXNoJykpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZHViQXBpS2V5KSB7XG4gICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCAnQVBJIGtleSByZXF1aXJlZCcpKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIC8vIEZvcmNlciBsZSByYWZyYVx1MDBFRWNoaXNzZW1lbnQgZW4gaW52YWxpZGFudCBsZSBjYWNoZVxuICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgbGFzdERvbWFpbnNGZXRjaDogMCB9KTtcbiAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZERvbWFpbnMoKTtcbiAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5kb21haW5zUmVmcmVzaGVkJykpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAvLyBTZWN0aW9uIE1hcHBhZ2VzIERvbWFpbmUtRG9zc2llclxuICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncycpIH0pO1xuICAgICAgXG4gICAgICAvLyBMaWduZSBkZSBkZXNjcmlwdGlvbiBhdmVjIGxlIGJvdXRvbiBkJ2Fqb3V0XG4gICAgICBjb25zdCBkZXNjcmlwdGlvbkxpbmUgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgIC5zZXROYW1lKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzRGVzYycpKVxuICAgICAgICAgLmFkZEJ1dHRvbihidXR0b24gPT4gYnV0dG9uXG4gICAgICAgICAgICAuc2V0SWNvbigncGx1cycpXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dCh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5hZGRNYXBwaW5nJykpXG4gICAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICBkb21haW46IHRoaXMuZG9tYWluc1swXSxcbiAgICAgICAgICAgICAgICAgIGZvbGRlcjogJydcbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZG9tYWluRm9sZGVyTWFwcGluZ3M6IHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MgfSk7XG4gICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgIFxuICAgICAgZGVzY3JpcHRpb25MaW5lLnNldHRpbmdFbC5hZGRDbGFzcygnZGVzY3JpcHRpb24td2l0aC1idXR0b24nKTtcblxuICAgICAgLy8gQ29udGVuZXVyIHBvdXIgbGVzIG1hcHBhZ2VzIGV4aXN0YW50c1xuICAgICAgY29uc3QgbWFwcGluZ3NDb250YWluZXIgPSBjb250YWluZXJFbC5jcmVhdGVFbCgnZGl2Jyk7XG4gICAgICBcbiAgICAgIC8vIEZvbmN0aW9uIHBvdXIgY3JcdTAwRTllciB1biBub3V2ZWF1IG1hcHBpbmdcbiAgICAgIGNvbnN0IGNyZWF0ZU1hcHBpbmdFbGVtZW50ID0gKG1hcHBpbmc6IERvbWFpbkZvbGRlck1hcHBpbmcsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgIGNvbnN0IG1hcHBpbmdEaXYgPSBtYXBwaW5nc0NvbnRhaW5lci5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdtYXBwaW5nLWNvbnRhaW5lcicgfSk7XG4gICAgICAgICBcbiAgICAgICAgIC8vIENvbnRlbmV1ciBwb3VyIGxhIGxpZ25lIGRlIG1hcHBpbmdcbiAgICAgICAgIGNvbnN0IG1hcHBpbmdMaW5lID0gbmV3IFNldHRpbmcobWFwcGluZ0RpdilcbiAgICAgICAgICAgIC5zZXRDbGFzcygnY29tcGFjdC1zZXR0aW5nJylcbiAgICAgICAgICAgIC8vIExhYmVsIFwiRG9tYWluZVwiXG4gICAgICAgICAgICAuYWRkVGV4dCh0ZXh0ID0+IHtcbiAgICAgICAgICAgICAgIHRleHQuaW5wdXRFbC5hZGRDbGFzcygnbGFiZWwtdGV4dCcpO1xuICAgICAgICAgICAgICAgdGV4dC5zZXRWYWx1ZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kb21haW4nKSk7XG4gICAgICAgICAgICAgICB0ZXh0LnNldERpc2FibGVkKHRydWUpO1xuICAgICAgICAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLy8gRHJvcGRvd24gZGVzIGRvbWFpbmVzXG4gICAgICAgICAgICAuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4ge1xuICAgICAgICAgICAgICAgdGhpcy5kb21haW5zLmZvckVhY2goZG9tYWluID0+IHtcbiAgICAgICAgICAgICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbihkb21haW4sIGRvbWFpbik7XG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgIGRyb3Bkb3duLnNldFZhbHVlKG1hcHBpbmcuZG9tYWluKTtcbiAgICAgICAgICAgICAgIGRyb3Bkb3duLm9uQ2hhbmdlKHZhbHVlID0+IHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3NbaW5kZXhdLmRvbWFpbiA9IHZhbHVlO1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICBkcm9wZG93bi5zZWxlY3RFbC5hZGRDbGFzcygnZG9tYWluLWRyb3Bkb3duJyk7XG4gICAgICAgICAgICAgICByZXR1cm4gZHJvcGRvd247XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLy8gQ2hhbXAgZGUgc2Fpc2llIGR1IGRvc3NpZXIgYXZlYyBzb24gbGFiZWxcbiAgICAgICAgICAgIC5hZGRCdXR0b24oYnV0dG9uID0+IGJ1dHRvblxuICAgICAgICAgICAgICAgLnNldEJ1dHRvblRleHQobWFwcGluZy5mb2xkZXIgfHwgdGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZm9sZGVyJykpXG4gICAgICAgICAgICAgICAub25DbGljaygoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy8gQ3JcdTAwRTllciBsZSBtZW51IGRlIHNcdTAwRTlsZWN0aW9uIHByaW5jaXBhbFxuICAgICAgICAgICAgICAgICAgY29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIC8vIENvbnN0cnVpcmUgbGEgaGlcdTAwRTlyYXJjaGllIGRlcyBkb3NzaWVycyBcdTAwRTAgcGFydGlyIGRlIGxhIHJhY2luZVxuICAgICAgICAgICAgICAgICAgdGhpcy5idWlsZEZvbGRlck1lbnUobWVudSwgdGhpcy5hcHAudmF1bHQuZ2V0Um9vdCgpLCBpbmRleCk7XG5cbiAgICAgICAgICAgICAgICAgIC8vIEFmZmljaGVyIGxlIG1lbnUgXHUwMEUwIGxhIHBvc2l0aW9uIGR1IGNsaWNcbiAgICAgICAgICAgICAgICAgIG1lbnUuc2hvd0F0TW91c2VFdmVudChlKTtcbiAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgLy8gQm91dG9ucyBkJ2FjdGlvblxuICAgICAgICAgICAgLmFkZEJ1dHRvbihidXR0b24gPT4gYnV0dG9uXG4gICAgICAgICAgICAgICAuc2V0SWNvbignY2hlY2ttYXJrJylcbiAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLnNhdmUnKSlcbiAgICAgICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZG9tYWluRm9sZGVyTWFwcGluZ3M6IHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MgfSk7XG4gICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIC5hZGRCdXR0b24oYnV0dG9uID0+IGJ1dHRvblxuICAgICAgICAgICAgICAgLnNldEljb24oJ3RyYXNoJylcbiAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLnJlbW92ZScpKVxuICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZG9tYWluRm9sZGVyTWFwcGluZ3M6IHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MgfSk7XG4gICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgLy8gQWpvdXRlciBkZXMgc3R5bGVzIHBvdXIgYWxpZ25lciBsZXMgXHUwMEU5bFx1MDBFOW1lbnRzXG4gICAgICAgICBtYXBwaW5nTGluZS5zZXR0aW5nRWwuYWRkQ2xhc3MoJ21hcHBpbmctbGluZScpO1xuICAgICAgfTtcblxuICAgICAgLy8gQWZmaWNoZXIgbGVzIG1hcHBhZ2VzIGV4aXN0YW50c1xuICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncy5mb3JFYWNoKChtYXBwaW5nLCBpbmRleCkgPT4ge1xuICAgICAgICAgY3JlYXRlTWFwcGluZ0VsZW1lbnQobWFwcGluZywgaW5kZXgpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFNlY3Rpb24gTW9kZSBkJ2FmZmljaGFnZVxuICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy52aWV3TW9kZScpIH0pO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgIC5zZXROYW1lKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmRlZmF1bHRWaWV3TW9kZScpKVxuICAgICAgICAgLnNldERlc2ModGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlRGVzYycpKVxuICAgICAgICAgLmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IGRyb3Bkb3duXG4gICAgICAgICAgICAuYWRkT3B0aW9uKCd0YWInLCB0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy50YWInKSlcbiAgICAgICAgICAgIC5hZGRPcHRpb24oJ3NpZGViYXInLCB0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5zaWRlYmFyJykpXG4gICAgICAgICAgICAuYWRkT3B0aW9uKCdvdmVybGF5JywgdGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3Mub3ZlcmxheScpKVxuICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3Mudmlld01vZGUpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlOiAndGFiJyB8ICdzaWRlYmFyJyB8ICdvdmVybGF5JykgPT4ge1xuICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy52aWV3TW9kZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgdmlld01vZGU6IHZhbHVlIH0pO1xuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAvLyBDaGFyZ2VyIGxlcyBkb21haW5lcyBhdSBkXHUwMEU5bWFycmFnZSBzaSB1bmUgY2xcdTAwRTkgQVBJIGVzdCBwclx1MDBFOXNlbnRlXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5kdWJBcGlLZXkgJiYgdGhpcy5kb21haW5zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgdGhpcy5sb2FkRG9tYWlucygpO1xuICAgICAgfVxuICAgfVxuXG4gICAvLyBDb25zdHJ1aXJlIGxlIG1lbnUgaGlcdTAwRTlyYXJjaGlxdWUgZGVzIGRvc3NpZXJzXG4gICBwcml2YXRlIGJ1aWxkRm9sZGVyTWVudShtZW51OiBNZW51LCBmb2xkZXI6IFRGb2xkZXIsIG1hcHBpbmdJbmRleDogbnVtYmVyLCBsZXZlbDogbnVtYmVyID0gMCkge1xuICAgICAgY29uc3Qgc3ViRm9sZGVycyA9IGZvbGRlci5jaGlsZHJlbi5maWx0ZXIoKGNoaWxkKTogY2hpbGQgaXMgVEZvbGRlciA9PiBjaGlsZCBpbnN0YW5jZW9mIFRGb2xkZXIpO1xuICAgICAgXG4gICAgICBzdWJGb2xkZXJzLmZvckVhY2goc3ViRm9sZGVyID0+IHtcbiAgICAgICAgIGNvbnN0IGhhc0NoaWxkcmVuID0gc3ViRm9sZGVyLmNoaWxkcmVuLnNvbWUoY2hpbGQgPT4gY2hpbGQgaW5zdGFuY2VvZiBURm9sZGVyKTtcbiAgICAgICAgIFxuICAgICAgICAgaWYgKGhhc0NoaWxkcmVuKSB7XG4gICAgICAgICAgICAvLyBQb3VyIGxlcyBkb3NzaWVycyBhdmVjIGRlcyBlbmZhbnRzLCBjclx1MDBFOWVyIHVuIHNvdXMtbWVudVxuICAgICAgICAgICAgbWVudS5hZGRJdGVtKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgY29uc3QgdGl0bGVFbCA9IGNyZWF0ZVNwYW4oeyBjbHM6ICdtZW51LWl0ZW0tdGl0bGUnIH0pO1xuICAgICAgICAgICAgICAgdGl0bGVFbC5hcHBlbmRUZXh0KHN1YkZvbGRlci5uYW1lKTtcbiAgICAgICAgICAgICAgIHRpdGxlRWwuYXBwZW5kQ2hpbGQoY3JlYXRlU3Bhbih7IGNsczogJ21lbnUtaXRlbS1hcnJvdycsIHRleHQ6ICcgXHUyMTkyJyB9KSk7XG5cbiAgICAgICAgICAgICAgIGl0ZW0uZG9tLnF1ZXJ5U2VsZWN0b3IoJy5tZW51LWl0ZW0tdGl0bGUnKT8ucmVwbGFjZVdpdGgodGl0bGVFbCk7XG4gICAgICAgICAgICAgICBpdGVtLnNldEljb24oJ2ZvbGRlcicpO1xuXG4gICAgICAgICAgICAgICAvLyBDclx1MDBFOWVyIGxlIHNvdXMtbWVudVxuICAgICAgICAgICAgICAgY29uc3Qgc3ViTWVudSA9IG5ldyBNZW51KCk7XG4gICAgICAgICAgICAgICB0aGlzLmJ1aWxkRm9sZGVyTWVudShzdWJNZW51LCBzdWJGb2xkZXIsIG1hcHBpbmdJbmRleCwgbGV2ZWwgKyAxKTtcblxuICAgICAgICAgICAgICAgLy8gQ29uZmlndXJlciBsJ1x1MDBFOXZcdTAwRTluZW1lbnQgZGUgc3Vydm9sXG4gICAgICAgICAgICAgICBjb25zdCBpdGVtRG9tID0gKGl0ZW0gYXMgYW55KS5kb20gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICAgICBpZiAoaXRlbURvbSkge1xuICAgICAgICAgICAgICAgICAgbGV0IGlzT3Zlckl0ZW0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGxldCBpc092ZXJNZW51ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBsZXQgaGlkZVRpbWVvdXQ6IE5vZGVKUy5UaW1lb3V0O1xuXG4gICAgICAgICAgICAgICAgICBjb25zdCBzaG93U3ViTWVudSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlY3QgPSBpdGVtRG9tLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgc3ViTWVudS5zaG93QXRQb3NpdGlvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICB4OiByZWN0LnJpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcmVjdC50b3BcbiAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgY29uc3QgaGlkZVN1Yk1lbnUgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICBoaWRlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc092ZXJJdGVtICYmICFpc092ZXJNZW51KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJNZW51LmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICBpdGVtRG9tLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICBpc092ZXJJdGVtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgIGlmIChoaWRlVGltZW91dCkgY2xlYXJUaW1lb3V0KGhpZGVUaW1lb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgIHNob3dTdWJNZW51KCk7XG4gICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgaXRlbURvbS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgaXNPdmVySXRlbSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgaGlkZVN1Yk1lbnUoKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAvLyBHXHUwMEU5cmVyIGxlIHN1cnZvbCBkdSBzb3VzLW1lbnUgbHVpLW1cdTAwRUFtZVxuICAgICAgICAgICAgICAgICAgY29uc3Qgc3ViTWVudUVsID0gKHN1Yk1lbnUgYXMgYW55KS5kb207XG4gICAgICAgICAgICAgICAgICBpZiAoc3ViTWVudUVsKSB7XG4gICAgICAgICAgICAgICAgICAgICBzdWJNZW51RWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzT3Zlck1lbnUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhpZGVUaW1lb3V0KSBjbGVhclRpbWVvdXQoaGlkZVRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgIHN1Yk1lbnVFbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNPdmVyTWVudSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGlkZVN1Yk1lbnUoKTtcbiAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBBam91dGVyIFx1MDBFOWdhbGVtZW50IHVuIGdlc3Rpb25uYWlyZSBkZSBjbGljIHBvdXIgbGUgZG9zc2llciBwYXJlbnRcbiAgICAgICAgICAgICAgIGl0ZW0ub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzW21hcHBpbmdJbmRleF0uZm9sZGVyID0gc3ViRm9sZGVyLnBhdGg7XG4gICAgICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkb21haW5Gb2xkZXJNYXBwaW5nczogdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncyB9KTtcbiAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zYXZlZCcpKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBQb3VyIGxlcyBkb3NzaWVycyBzYW5zIGVuZmFudHMsIGFqb3V0ZXIgc2ltcGxlbWVudCB1biBcdTAwRTlsXHUwMEU5bWVudCBkZSBtZW51XG4gICAgICAgICAgICBtZW51LmFkZEl0ZW0oaXRlbSA9PiB7XG4gICAgICAgICAgICAgICBpdGVtLnNldFRpdGxlKHN1YkZvbGRlci5uYW1lKVxuICAgICAgICAgICAgICAgICAgLnNldEljb24oJ2ZvbGRlcicpXG4gICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzW21hcHBpbmdJbmRleF0uZm9sZGVyID0gc3ViRm9sZGVyLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkb21haW5Gb2xkZXJNYXBwaW5nczogdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncyB9KTtcbiAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zYXZlZCcpKTtcbiAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgIH1cbiAgICAgIH0pO1xuICAgfVxufSIsICJleHBvcnQgdHlwZSBUcmFuc2xhdGlvbktleSA9IFxyXG4gICAvLyBOb3RpY2VzXHJcbiAgIHwgJ25vdGljZXMuc2F2ZWQnXHJcbiAgIHwgJ25vdGljZXMuZXJyb3InXHJcbiAgIHwgJ25vdGljZXMuc3VjY2VzcydcclxuICAgfCAnbm90aWNlcy5saW5rQ3JlYXRlZCdcclxuICAgfCAnbm90aWNlcy51cmxSZXF1aXJlZCdcclxuICAgLy8gTW9kYWxcclxuICAgfCAnbW9kYWwuY3JlYXRlU2hvcnRMaW5rJ1xyXG4gICB8ICdtb2RhbC5kZXN0aW5hdGlvblVybCdcclxuICAgfCAnbW9kYWwuZGVzdGluYXRpb25VcmxEZXNjJ1xyXG4gICB8ICdtb2RhbC5hbmNob3InXHJcbiAgIHwgJ21vZGFsLmFuY2hvckRlc2MnXHJcbiAgIHwgJ21vZGFsLmFuY2hvclBsYWNlaG9sZGVyJ1xyXG4gICB8ICdtb2RhbC5jdXN0b21TbHVnJ1xyXG4gICB8ICdtb2RhbC5jdXN0b21TbHVnRGVzYydcclxuICAgfCAnbW9kYWwuZG9tYWluJ1xyXG4gICB8ICdtb2RhbC5kb21haW5EZXNjJ1xyXG4gICB8ICdtb2RhbC5jcmVhdGUnXHJcbiAgIC8vIFNldHRpbmdzIGR1Yi5jb1xyXG4gICB8ICdzZXR0aW5ncy5kdWJBcGlLZXknXHJcbiAgIHwgJ3NldHRpbmdzLmR1YkFwaUtleURlc2MnXHJcbiAgIHwgJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkJ1xyXG4gICB8ICdzZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZERlc2MnXHJcbiAgIHwgJ3NldHRpbmdzLmR1YkN1c3RvbURvbWFpbnMnXHJcbiAgIHwgJ3NldHRpbmdzLmR1YkN1c3RvbURvbWFpbnNEZXNjJ1xyXG4gICB8ICdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncydcclxuICAgfCAnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3NEZXNjJ1xyXG4gICB8ICdzZXR0aW5ncy5hZGRNYXBwaW5nJ1xyXG4gICB8ICdzZXR0aW5ncy5kb21haW4nXHJcbiAgIHwgJ3NldHRpbmdzLmZvbGRlcidcclxuICAgfCAnc2V0dGluZ3MucmVtb3ZlJ1xyXG4gICAvLyBTZXR0aW5ncyBWaWV3TW9kZVxyXG4gICB8ICdzZXR0aW5ncy52aWV3TW9kZSdcclxuICAgfCAnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlJ1xyXG4gICB8ICdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGVEZXNjJ1xyXG4gICB8ICdzZXR0aW5ncy50YWInXHJcbiAgIHwgJ3NldHRpbmdzLnNpZGViYXInXHJcbiAgIHwgJ3NldHRpbmdzLm92ZXJsYXknXHJcbiAgIC8vIERhc2hib2FyZFxyXG4gICB8ICdkYXNoYm9hcmQudGl0bGUnXHJcbiAgIHwgJ2Rhc2hib2FyZC5ub0xpbmtzJ1xyXG4gICB8ICdkYXNoYm9hcmQubG9hZGluZydcclxuICAgfCAnZGFzaGJvYXJkLmVycm9yJ1xyXG4gICB8ICdkYXNoYm9hcmQucmVmcmVzaCdcclxuICAgfCAnZGFzaGJvYXJkLnZpZXdNb2RlVGFiJ1xyXG4gICB8ICdkYXNoYm9hcmQudmlld01vZGVTaWRlYmFyJ1xyXG4gICB8ICdkYXNoYm9hcmQudmlld01vZGVQb3B1cCdcclxuICAgfCAnc2V0dGluZ3MuZG9tYWluQW5kRm9sZGVyJ1xyXG4gICB8ICdzZXR0aW5ncy5mb2xkZXJQbGFjZWhvbGRlcidcclxuICAgfCAnc2V0dGluZ3Muc2F2ZSdcclxuICAgfCAnc2V0dGluZ3MucmVmcmVzaERvbWFpbnMnXHJcbiAgIHwgJ3NldHRpbmdzLnJlZnJlc2hEb21haW5zRGVzYydcclxuICAgfCAnc2V0dGluZ3MucmVmcmVzaCdcclxuICAgfCAnbm90aWNlcy5kb21haW5zUmVmcmVzaGVkJztcclxuXHJcbmV4cG9ydCBjb25zdCB0cmFuc2xhdGlvbnM6IHsgW2xhbmc6IHN0cmluZ106IFJlY29yZDxUcmFuc2xhdGlvbktleSwgc3RyaW5nPiB9ID0ge1xyXG4gICBlbjoge1xyXG4gICAgICAvLyBOb3RpY2VzXHJcbiAgICAgICdub3RpY2VzLnNhdmVkJzogJ1x1MjcwNSBTZXR0aW5ncyBzYXZlZCcsXHJcbiAgICAgICdub3RpY2VzLmVycm9yJzogJ1x1Mjc0QyBFcnJvcjoge21lc3NhZ2V9JyxcclxuICAgICAgJ25vdGljZXMuc3VjY2Vzcyc6ICdcdTI3MDUgT3BlcmF0aW9uIHN1Y2Nlc3NmdWwnLFxyXG4gICAgICAnbm90aWNlcy5saW5rQ3JlYXRlZCc6ICdcdTI3MDUgU2hvcnQgbGluayBjcmVhdGVkIHN1Y2Nlc3NmdWxseScsXHJcbiAgICAgICdub3RpY2VzLnVybFJlcXVpcmVkJzogJ1x1Mjc0QyBEZXN0aW5hdGlvbiBVUkwgaXMgcmVxdWlyZWQnLFxyXG4gICAgICAvLyBNb2RhbFxyXG4gICAgICAnbW9kYWwuY3JlYXRlU2hvcnRMaW5rJzogJ0NyZWF0ZSBTaG9ydCBMaW5rJyxcclxuICAgICAgJ21vZGFsLmRlc3RpbmF0aW9uVXJsJzogJ0Rlc3RpbmF0aW9uIFVSTCcsXHJcbiAgICAgICdtb2RhbC5kZXN0aW5hdGlvblVybERlc2MnOiAnVGhlIFVSTCB5b3Ugd2FudCB0byBzaG9ydGVuJyxcclxuICAgICAgJ21vZGFsLmFuY2hvcic6ICdMaW5rIFRleHQnLFxyXG4gICAgICAnbW9kYWwuYW5jaG9yRGVzYyc6ICdUaGUgdGV4dCB0aGF0IHdpbGwgYmUgZGlzcGxheWVkIGZvciB0aGUgbGluaycsXHJcbiAgICAgICdtb2RhbC5hbmNob3JQbGFjZWhvbGRlcic6ICdDbGljayBoZXJlJyxcclxuICAgICAgJ21vZGFsLmN1c3RvbVNsdWcnOiAnQ3VzdG9tIFNsdWcnLFxyXG4gICAgICAnbW9kYWwuY3VzdG9tU2x1Z0Rlc2MnOiAnQ3VzdG9tIHBhcnQgb2YgdGhlIHNob3J0IFVSTCAob3B0aW9uYWwpJyxcclxuICAgICAgJ21vZGFsLmRvbWFpbic6ICdEb21haW4nLFxyXG4gICAgICAnbW9kYWwuZG9tYWluRGVzYyc6ICdDaG9vc2UgdGhlIGRvbWFpbiBmb3IgeW91ciBzaG9ydCBsaW5rJyxcclxuICAgICAgJ21vZGFsLmNyZWF0ZSc6ICdDcmVhdGUnLFxyXG4gICAgICAvLyBTZXR0aW5ncyBkdWIuY29cclxuICAgICAgJ3NldHRpbmdzLmR1YkFwaUtleSc6ICdkdWIuY28gQVBJIEtleScsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJBcGlLZXlEZXNjJzogJ1lvdXIgZHViLmNvIEFQSSBrZXkgZm9yIGF1dGhlbnRpY2F0aW9uJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkJzogJ2R1Yi5jbyBXb3Jrc3BhY2UgSUQnLFxyXG4gICAgICAnc2V0dGluZ3MuZHViV29ya3NwYWNlSWREZXNjJzogJ09wdGlvbmFsOiBUaGUgSUQgb2YgdGhlIHdvcmtzcGFjZSB3aGVyZSB5b3Ugd2FudCB0byBjcmVhdGUgbGlua3MgKGZvdW5kIGluIHRoZSBVUkw6IGFwcC5kdWIuY28vW3dvcmtzcGFjZS1pZF0pLiBJZiBub3Qgc2V0LCBsaW5rcyB3aWxsIGJlIGNyZWF0ZWQgaW4geW91ciBkZWZhdWx0IHdvcmtzcGFjZS4nLFxyXG4gICAgICAnc2V0dGluZ3MuZHViQ3VzdG9tRG9tYWlucyc6ICdDdXN0b20gRG9tYWlucycsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJDdXN0b21Eb21haW5zRGVzYyc6ICdMaXN0IG9mIHlvdXIgY3VzdG9tIGRvbWFpbnMgKG9uZSBwZXIgbGluZSknLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MnOiAnRG9tYWluLUZvbGRlciBNYXBwaW5ncycsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5nc0Rlc2MnOiAnQ29uZmlndXJlIHdoaWNoIGRvbWFpbiB0byB1c2UgZm9yIGVhY2ggZm9sZGVyJyxcclxuICAgICAgJ3NldHRpbmdzLmFkZE1hcHBpbmcnOiAnQWRkIE5ldyBNYXBwaW5nJyxcclxuICAgICAgJ3NldHRpbmdzLmRvbWFpbic6ICdEb21haW4nLFxyXG4gICAgICAnc2V0dGluZ3MuZm9sZGVyJzogJ0ZvbGRlcicsXHJcbiAgICAgICdzZXR0aW5ncy5yZW1vdmUnOiAnUmVtb3ZlJyxcclxuICAgICAgLy8gU2V0dGluZ3MgVmlld01vZGVcclxuICAgICAgJ3NldHRpbmdzLnZpZXdNb2RlJzogJ1ZpZXcgTW9kZScsXHJcbiAgICAgICdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGUnOiAnRGVmYXVsdCBWaWV3IE1vZGUnLFxyXG4gICAgICAnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlRGVzYyc6ICdDaG9vc2UgaG93IHRoZSBsaW5rIGRldGFpbHMgd2lsbCBiZSBkaXNwbGF5ZWQnLFxyXG4gICAgICAnc2V0dGluZ3MudGFiJzogJ05ldyBUYWInLFxyXG4gICAgICAnc2V0dGluZ3Muc2lkZWJhcic6ICdSaWdodCBTaWRlYmFyJyxcclxuICAgICAgJ3NldHRpbmdzLm92ZXJsYXknOiAnT3ZlcmxheScsXHJcbiAgICAgIC8vIERhc2hib2FyZFxyXG4gICAgICAnZGFzaGJvYXJkLnRpdGxlJzogJ0xpbmtGbG93eiBEYXNoYm9hcmQnLFxyXG4gICAgICAnZGFzaGJvYXJkLm5vTGlua3MnOiAnTm8gc2hvcnQgbGlua3MgY3JlYXRlZCB5ZXQnLFxyXG4gICAgICAnZGFzaGJvYXJkLmxvYWRpbmcnOiAnTG9hZGluZyB5b3VyIGxpbmtzLi4uJyxcclxuICAgICAgJ2Rhc2hib2FyZC5lcnJvcic6ICdFcnJvciBsb2FkaW5nIGxpbmtzOiB7bWVzc2FnZX0nLFxyXG4gICAgICAnZGFzaGJvYXJkLnJlZnJlc2gnOiAnUmVmcmVzaCcsXHJcbiAgICAgICdkYXNoYm9hcmQudmlld01vZGVUYWInOiAnT3BlbiBpbiBUYWInLFxyXG4gICAgICAnZGFzaGJvYXJkLnZpZXdNb2RlU2lkZWJhcic6ICdPcGVuIGluIFNpZGViYXInLFxyXG4gICAgICAnZGFzaGJvYXJkLnZpZXdNb2RlUG9wdXAnOiAnT3BlbiBhcyBQb3B1cCcsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5BbmRGb2xkZXInOiAnRG9tYWluIGFuZCBGb2xkZXIgTWFwcGluZycsXHJcbiAgICAgICdzZXR0aW5ncy5mb2xkZXJQbGFjZWhvbGRlcic6ICdGb2xkZXInLFxyXG4gICAgICAnc2V0dGluZ3Muc2F2ZSc6ICdTYXZlJyxcclxuICAgICAgJ3NldHRpbmdzLnJlZnJlc2hEb21haW5zJzogJ1JlZnJlc2ggRG9tYWlucycsXHJcbiAgICAgICdzZXR0aW5ncy5yZWZyZXNoRG9tYWluc0Rlc2MnOiAnUmVmcmVzaCB0aGUgbGlzdCBvZiBhdmFpbGFibGUgZG9tYWlucyBmcm9tIGR1Yi5jbycsXHJcbiAgICAgICdzZXR0aW5ncy5yZWZyZXNoJzogJ1JlZnJlc2gnLFxyXG4gICAgICAnbm90aWNlcy5kb21haW5zUmVmcmVzaGVkJzogJ1x1MjcwNSBEb21haW5zIGxpc3QgcmVmcmVzaGVkJ1xyXG4gICB9LFxyXG4gICBmcjoge1xyXG4gICAgICAvLyBOb3RpY2VzXHJcbiAgICAgICdub3RpY2VzLnNhdmVkJzogJ1x1MjcwNSBQYXJhbVx1MDBFOHRyZXMgc2F1dmVnYXJkXHUwMEU5cycsXHJcbiAgICAgICdub3RpY2VzLmVycm9yJzogJ1x1Mjc0QyBFcnJldXI6IHttZXNzYWdlfScsXHJcbiAgICAgICdub3RpY2VzLnN1Y2Nlc3MnOiAnXHUyNzA1IE9wXHUwMEU5cmF0aW9uIHJcdTAwRTl1c3NpZScsXHJcbiAgICAgICdub3RpY2VzLmxpbmtDcmVhdGVkJzogJ1x1MjcwNSBMaWVuIGNvdXJ0IGNyXHUwMEU5XHUwMEU5IGF2ZWMgc3VjY1x1MDBFOHMnLFxyXG4gICAgICAnbm90aWNlcy51cmxSZXF1aXJlZCc6ICdcdTI3NEMgTFxcJ1VSTCBkZSBkZXN0aW5hdGlvbiBlc3QgcmVxdWlzZScsXHJcbiAgICAgIC8vIE1vZGFsXHJcbiAgICAgICdtb2RhbC5jcmVhdGVTaG9ydExpbmsnOiAnQ3JcdTAwRTllciB1biBsaWVuIGNvdXJ0JyxcclxuICAgICAgJ21vZGFsLmRlc3RpbmF0aW9uVXJsJzogJ1VSTCBkZSBkZXN0aW5hdGlvbicsXHJcbiAgICAgICdtb2RhbC5kZXN0aW5hdGlvblVybERlc2MnOiAnTFxcJ1VSTCBxdWUgdm91cyBzb3VoYWl0ZXogcmFjY291cmNpcicsXHJcbiAgICAgICdtb2RhbC5hbmNob3InOiAnVGV4dGUgZHUgbGllbicsXHJcbiAgICAgICdtb2RhbC5hbmNob3JEZXNjJzogJ0xlIHRleHRlIHF1aSBzZXJhIGFmZmljaFx1MDBFOSBwb3VyIGxlIGxpZW4nLFxyXG4gICAgICAnbW9kYWwuYW5jaG9yUGxhY2Vob2xkZXInOiAnQ2xpcXVleiBpY2knLFxyXG4gICAgICAnbW9kYWwuY3VzdG9tU2x1Zyc6ICdTbHVnIHBlcnNvbm5hbGlzXHUwMEU5JyxcclxuICAgICAgJ21vZGFsLmN1c3RvbVNsdWdEZXNjJzogJ1BhcnRpZSBwZXJzb25uYWxpc1x1MDBFOWUgZGUgbFxcJ1VSTCBjb3VydGUgKG9wdGlvbm5lbCknLFxyXG4gICAgICAnbW9kYWwuZG9tYWluJzogJ0RvbWFpbmUnLFxyXG4gICAgICAnbW9kYWwuZG9tYWluRGVzYyc6ICdDaG9pc2lzc2V6IGxlIGRvbWFpbmUgcG91ciB2b3RyZSBsaWVuIGNvdXJ0JyxcclxuICAgICAgJ21vZGFsLmNyZWF0ZSc6ICdDclx1MDBFOWVyJyxcclxuICAgICAgLy8gU2V0dGluZ3MgZHViLmNvXHJcbiAgICAgICdzZXR0aW5ncy5kdWJBcGlLZXknOiAnQ2xcdTAwRTkgQVBJIGR1Yi5jbycsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJBcGlLZXlEZXNjJzogJ1ZvdHJlIGNsXHUwMEU5IEFQSSBkdWIuY28gcG91ciBsXFwnYXV0aGVudGlmaWNhdGlvbicsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZCc6ICdJRCBXb3Jrc3BhY2UgZHViLmNvJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkRGVzYyc6ICdPcHRpb25uZWwgOiBMXFwnSUQgZHUgd29ya3NwYWNlIG9cdTAwRjkgdm91cyBzb3VoYWl0ZXogY3JcdTAwRTllciB2b3MgbGllbnMgKHZpc2libGUgZGFucyBsXFwnVVJMIDogYXBwLmR1Yi5jby9bd29ya3NwYWNlLWlkXSkuIFNpIG5vbiByZW5zZWlnblx1MDBFOSwgbGVzIGxpZW5zIHNlcm9udCBjclx1MDBFOVx1MDBFOXMgZGFucyB2b3RyZSB3b3Jrc3BhY2UgcGFyIGRcdTAwRTlmYXV0LicsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJDdXN0b21Eb21haW5zJzogJ0RvbWFpbmVzIHBlcnNvbm5hbGlzXHUwMEU5cycsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJDdXN0b21Eb21haW5zRGVzYyc6ICdMaXN0ZSBkZSB2b3MgZG9tYWluZXMgcGVyc29ubmFsaXNcdTAwRTlzICh1biBwYXIgbGlnbmUpJyxcclxuICAgICAgJ3NldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzJzogJ0Fzc29jaWF0aW9ucyBEb21haW5lcy1Eb3NzaWVycycsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5nc0Rlc2MnOiAnQ29uZmlndXJleiBxdWVsIGRvbWFpbmUgdXRpbGlzZXIgcG91ciBjaGFxdWUgZG9zc2llcicsXHJcbiAgICAgICdzZXR0aW5ncy5hZGRNYXBwaW5nJzogJ0Fqb3V0ZXIgdW5lIG5vdXZlbGxlIGFzc29jaWF0aW9uJyxcclxuICAgICAgJ3NldHRpbmdzLmRvbWFpbic6ICdEb21haW5lJyxcclxuICAgICAgJ3NldHRpbmdzLmZvbGRlcic6ICdEb3NzaWVyJyxcclxuICAgICAgJ3NldHRpbmdzLnJlbW92ZSc6ICdTdXBwcmltZXInLFxyXG4gICAgICAvLyBTZXR0aW5ncyBWaWV3TW9kZVxyXG4gICAgICAnc2V0dGluZ3Mudmlld01vZGUnOiAnTW9kZSBkXFwnYWZmaWNoYWdlJyxcclxuICAgICAgJ3NldHRpbmdzLmRlZmF1bHRWaWV3TW9kZSc6ICdNb2RlIGRcXCdhZmZpY2hhZ2UgcGFyIGRcdTAwRTlmYXV0JyxcclxuICAgICAgJ3NldHRpbmdzLmRlZmF1bHRWaWV3TW9kZURlc2MnOiAnQ2hvaXNpc3NleiBjb21tZW50IGxlcyBkXHUwMEU5dGFpbHMgZGVzIGxpZW5zIHNlcm9udCBhZmZpY2hcdTAwRTlzJyxcclxuICAgICAgJ3NldHRpbmdzLnRhYic6ICdOb3V2ZWwgb25nbGV0JyxcclxuICAgICAgJ3NldHRpbmdzLnNpZGViYXInOiAnQmFycmUgbGF0XHUwMEU5cmFsZScsXHJcbiAgICAgICdzZXR0aW5ncy5vdmVybGF5JzogJ1N1cGVycG9zaXRpb24nLFxyXG4gICAgICAvLyBEYXNoYm9hcmRcclxuICAgICAgJ2Rhc2hib2FyZC50aXRsZSc6ICdUYWJsZWF1IGRlIGJvcmQgTGlua0Zsb3d6JyxcclxuICAgICAgJ2Rhc2hib2FyZC5ub0xpbmtzJzogJ0F1Y3VuIGxpZW4gY291cnQgY3JcdTAwRTlcdTAwRTkgcG91ciBsZSBtb21lbnQnLFxyXG4gICAgICAnZGFzaGJvYXJkLmxvYWRpbmcnOiAnQ2hhcmdlbWVudCBkZSB2b3MgbGllbnMuLi4nLFxyXG4gICAgICAnZGFzaGJvYXJkLmVycm9yJzogJ0VycmV1ciBsb3JzIGR1IGNoYXJnZW1lbnQgZGVzIGxpZW5zIDoge21lc3NhZ2V9JyxcclxuICAgICAgJ2Rhc2hib2FyZC5yZWZyZXNoJzogJ1JhZnJhXHUwMEVFY2hpcicsXHJcbiAgICAgICdkYXNoYm9hcmQudmlld01vZGVUYWInOiAnT3V2cmlyIGRhbnMgdW4gb25nbGV0JyxcclxuICAgICAgJ2Rhc2hib2FyZC52aWV3TW9kZVNpZGViYXInOiAnT3V2cmlyIGRhbnMgbGEgYmFycmUgbGF0XHUwMEU5cmFsZScsXHJcbiAgICAgICdkYXNoYm9hcmQudmlld01vZGVQb3B1cCc6ICdPdXZyaXIgZW4gcG9wdXAnLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluQW5kRm9sZGVyJzogJ0Fzc29jaWF0aW9uIERvbWFpbmUgZXQgRG9zc2llcicsXHJcbiAgICAgICdzZXR0aW5ncy5mb2xkZXJQbGFjZWhvbGRlcic6ICdEb3NzaWVyJyxcclxuICAgICAgJ3NldHRpbmdzLnNhdmUnOiAnU2F1dmVnYXJkZXInLFxyXG4gICAgICAnc2V0dGluZ3MucmVmcmVzaERvbWFpbnMnOiAnUmFmcmFcdTAwRUVjaGlyIGxlcyBkb21haW5lcycsXHJcbiAgICAgICdzZXR0aW5ncy5yZWZyZXNoRG9tYWluc0Rlc2MnOiAnQWN0dWFsaXNlciBsYSBsaXN0ZSBkZXMgZG9tYWluZXMgZGlzcG9uaWJsZXMgZGVwdWlzIGR1Yi5jbycsXHJcbiAgICAgICdzZXR0aW5ncy5yZWZyZXNoJzogJ1JhZnJhXHUwMEVFY2hpcicsXHJcbiAgICAgICdub3RpY2VzLmRvbWFpbnNSZWZyZXNoZWQnOiAnXHUyNzA1IExpc3RlIGRlcyBkb21haW5lcyBhY3R1YWxpc1x1MDBFOWUnXHJcbiAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBjbGFzcyBUcmFuc2xhdGlvbnMge1xyXG4gICBwcml2YXRlIGN1cnJlbnRMYW5nOiBzdHJpbmc7XHJcblxyXG4gICBjb25zdHJ1Y3Rvcihpbml0aWFsTGFuZzogc3RyaW5nID0gJ2ZyJykge1xyXG4gICAgICB0aGlzLmN1cnJlbnRMYW5nID0gaW5pdGlhbExhbmc7XHJcbiAgIH1cclxuXHJcbiAgIHNldExhbmd1YWdlKGxhbmc6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgICB0aGlzLmN1cnJlbnRMYW5nID0gbGFuZztcclxuICAgfVxyXG5cclxuICAgdChrZXk6IFRyYW5zbGF0aW9uS2V5KTogc3RyaW5nIHtcclxuICAgICAgcmV0dXJuIHRyYW5zbGF0aW9uc1t0aGlzLmN1cnJlbnRMYW5nXT8uW2tleV0gfHwgdHJhbnNsYXRpb25zWydlbiddW2tleV0gfHwga2V5O1xyXG4gICB9XHJcbn1cclxuIiwgImltcG9ydCB7IFBsdWdpbiwgTm90aWNlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgRGVmYXVsdFNldHRpbmdzIH0gZnJvbSAnLi9TZXR0aW5ncyc7XG5pbXBvcnQgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL1RyYW5zbGF0aW9ucyc7XG5pbXBvcnQgeyBDcmVhdGVTaG9ydExpbmtNb2RhbCB9IGZyb20gJy4vU2hvcnRMaW5rTW9kYWwnO1xuaW1wb3J0IHsgVklFV19UWVBFX0RBU0hCT0FSRCB9IGZyb20gJy4vRGFzaGJvYXJkJztcblxuZXhwb3J0IGNsYXNzIEhvdGtleXMge1xuICAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luLFxuICAgICAgcHJpdmF0ZSBzZXR0aW5nczogRGVmYXVsdFNldHRpbmdzLFxuICAgICAgcHJpdmF0ZSB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9uc1xuICAgKSB7fVxuXG4gICByZWdpc3RlckhvdGtleXMoKSB7XG4gICAgICAvLyBDb21tYW5kZSBwb3VyIGNyXHUwMEU5ZXIgdW4gbm91dmVhdSBsaWVuIGNvdXJ0XG4gICAgICB0aGlzLnBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICAgICAgIGlkOiAnY3JlYXRlLXNob3J0LWxpbmsnLFxuICAgICAgICAgbmFtZTogdGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuY3JlYXRlU2hvcnRMaW5rJyksXG4gICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLmR1YkFwaUtleSkge1xuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgJ0FQSSBrZXkgbm90IGNvbmZpZ3VyZWQnKSk7XG4gICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5ldyBDcmVhdGVTaG9ydExpbmtNb2RhbChcbiAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcCxcbiAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLFxuICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncyxcbiAgICAgICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25zXG4gICAgICAgICAgICApLm9wZW4oKTtcbiAgICAgICAgIH0sXG4gICAgICAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIkN0cmxcIiwgXCJTaGlmdFwiXSwga2V5OiBcImxcIiB9XVxuICAgICAgfSk7XG5cbiAgICAgIC8vIENvbW1hbmRlIHBvdXIgZm9jdXMgbGEgYmFycmUgZGUgcmVjaGVyY2hlXG4gICAgICB0aGlzLnBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICAgICAgIGlkOiAnZm9jdXMtc2VhcmNoJyxcbiAgICAgICAgIG5hbWU6IHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC5mb2N1c1NlYXJjaCcpLFxuICAgICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsZWFmID0gdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0RBU0hCT0FSRClbMF07XG4gICAgICAgICAgICBpZiAobGVhZikge1xuICAgICAgICAgICAgICAgaWYgKCFjaGVja2luZykge1xuICAgICAgICAgICAgICAgICAgY29uc3Qgc2VhcmNoSW5wdXQgPSBsZWFmLnZpZXcuY29udGFpbmVyRWwucXVlcnlTZWxlY3RvcignLmxpbmtmbG93ei1zZWFyY2gtaW5wdXQnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgaWYgKHNlYXJjaElucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgICBzZWFyY2hJbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICB9LFxuICAgICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJDdHJsXCJdLCBrZXk6IFwia1wiIH1dXG4gICAgICB9KTtcbiAgIH1cbn1cbiIsICJpbXBvcnQgeyBNb2RhbCwgU2V0dGluZywgQXBwLCBQbHVnaW4sIE5vdGljZSwgTWFya2Rvd25WaWV3LCByZXF1ZXN0VXJsIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBEZWZhdWx0U2V0dGluZ3MsIFNldHRpbmdzIH0gZnJvbSAnLi9TZXR0aW5ncyc7XHJcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcclxuaW1wb3J0IHsgdmFsaWRhdGVEb21haW5VcmwgfSBmcm9tICcuL0RvbWFpblZhbGlkYXRpb25zJztcclxuXHJcbmV4cG9ydCBjbGFzcyBDcmVhdGVTaG9ydExpbmtNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuICAgcHJpdmF0ZSB1cmw6IHN0cmluZyA9ICcnO1xyXG4gICBwcml2YXRlIHNsdWc6IHN0cmluZyA9ICcnO1xyXG4gICBwcml2YXRlIHNlbGVjdGVkRG9tYWluOiBzdHJpbmcgPSAnJztcclxuICAgcHJpdmF0ZSBhbmNob3I6IHN0cmluZyA9ICcnO1xyXG4gICBwcml2YXRlIGRvbWFpbnM6IHN0cmluZ1tdID0gW107XHJcblxyXG4gICBjb25zdHJ1Y3RvcihcclxuICAgICAgYXBwOiBBcHAsXHJcbiAgICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sXHJcbiAgICAgIHByaXZhdGUgc2V0dGluZ3M6IERlZmF1bHRTZXR0aW5ncyxcclxuICAgICAgcHJpdmF0ZSB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9uc1xyXG4gICApIHtcclxuICAgICAgc3VwZXIoYXBwKTtcclxuICAgfVxyXG5cclxuICAgYXN5bmMgb25PcGVuKCkge1xyXG4gICAgICAvLyBDaGFyZ2VyIGxlcyBkb21haW5lcyBkaXNwb25pYmxlc1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgICB0aGlzLmRvbWFpbnMgPSBhd2FpdCBTZXR0aW5ncy5nZXRDYWNoZWREb21haW5zKFxyXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLmR1YkFwaUtleSxcclxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZFxyXG4gICAgICAgICApO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIGRvbWFpbnM6JywgZXJyb3IpO1xyXG4gICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCAnRmFpbGVkIHRvIGxvYWQgYXZhaWxhYmxlIGRvbWFpbnMnKSk7XHJcbiAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcclxuICAgICAgY29udGVudEVsLmVtcHR5KCk7XHJcblxyXG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmNyZWF0ZVNob3J0TGluaycpIH0pO1xyXG5cclxuICAgICAgLy8gVVJMIGRlIGRlc3RpbmF0aW9uXHJcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcclxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuZGVzdGluYXRpb25VcmwnKSlcclxuICAgICAgICAgLnNldERlc2ModGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuZGVzdGluYXRpb25VcmxEZXNjJykpXHJcbiAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxyXG4gICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ2h0dHBzOi8vZXhlbXBsZS5jb20vcGFnZS1sb25ndWUnKVxyXG4gICAgICAgICAgICAub25DaGFuZ2UodmFsdWUgPT4gdGhpcy51cmwgPSB2YWx1ZSkpO1xyXG5cclxuICAgICAgLy8gVGV4dGUgZHUgbGllbiAoYW5jcmUpXHJcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcclxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuYW5jaG9yJykpXHJcbiAgICAgICAgIC5zZXREZXNjKHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmFuY2hvckRlc2MnKSlcclxuICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XHJcbiAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcih0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5hbmNob3JQbGFjZWhvbGRlcicpKVxyXG4gICAgICAgICAgICAub25DaGFuZ2UodmFsdWUgPT4gdGhpcy5hbmNob3IgPSB2YWx1ZSkpO1xyXG5cclxuICAgICAgLy8gU2x1ZyBwZXJzb25uYWxpc1x1MDBFOVxyXG4gICAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXHJcbiAgICAgICAgIC5zZXROYW1lKHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmN1c3RvbVNsdWcnKSlcclxuICAgICAgICAgLnNldERlc2ModGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuY3VzdG9tU2x1Z0Rlc2MnKSlcclxuICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XHJcbiAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcignbW9uLWxpZW4nKVxyXG4gICAgICAgICAgICAub25DaGFuZ2UodmFsdWUgPT4gdGhpcy5zbHVnID0gdmFsdWUpKTtcclxuXHJcbiAgICAgIC8vIERvbWFpbmUgcGVyc29ubmFsaXNcdTAwRTlcclxuICAgICAgY29uc3QgZGVmYXVsdERvbWFpbiA9IHRoaXMuZ2V0RG9tYWluRm9yQ3VycmVudEZpbGUoKTtcclxuICAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxyXG4gICAgICAgICAuc2V0TmFtZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5kb21haW4nKSlcclxuICAgICAgICAgLnNldERlc2ModGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuZG9tYWluRGVzYycpKVxyXG4gICAgICAgICAuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4ge1xyXG4gICAgICAgICAgICAvLyBBam91dGVyIHRvdXMgbGVzIGRvbWFpbmVzIGRpc3BvbmlibGVzXHJcbiAgICAgICAgICAgIHRoaXMuZG9tYWlucy5mb3JFYWNoKGRvbWFpbiA9PiB7XHJcbiAgICAgICAgICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbihkb21haW4sIGRvbWFpbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBkcm9wZG93bi5zZXRWYWx1ZShkZWZhdWx0RG9tYWluKTtcclxuICAgICAgICAgICAgZHJvcGRvd24ub25DaGFuZ2UodmFsdWUgPT4gdGhpcy5zZWxlY3RlZERvbWFpbiA9IHZhbHVlKTtcclxuICAgICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBCb3V0b25zXHJcbiAgICAgIGNvbnN0IGJ1dHRvbkNvbnRhaW5lciA9IGNvbnRlbnRFbC5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdtb2RhbC1idXR0b24tY29udGFpbmVyJyB9KTtcclxuICAgICAgXHJcbiAgICAgIC8vIEJvdXRvbiBBbm51bGVyXHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiAnQW5udWxlcicgfSlcclxuICAgICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jbG9zZSgpKTtcclxuICAgICAgXHJcbiAgICAgIC8vIEJvdXRvbiBDclx1MDBFOWVyXHJcbiAgICAgIGNvbnN0IGNyZWF0ZUJ1dHRvbiA9IGJ1dHRvbkNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywge1xyXG4gICAgICAgICB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5jcmVhdGUnKSxcclxuICAgICAgICAgY2xzOiAnbW9kLWN0YSdcclxuICAgICAgfSk7XHJcbiAgICAgIGNyZWF0ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgaWYgKCF0aGlzLnVybCkge1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMudXJsUmVxdWlyZWQnKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgfVxyXG4gICAgICAgICB0aGlzLmNyZWF0ZVNob3J0TGluayh0aGlzLnVybCwgdGhpcy5zbHVnLCB0aGlzLnNlbGVjdGVkRG9tYWluIHx8IGRlZmF1bHREb21haW4pO1xyXG4gICAgICB9KTtcclxuICAgfVxyXG5cclxuICAgb25DbG9zZSgpIHtcclxuICAgICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XHJcbiAgICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xyXG4gICB9XHJcblxyXG4gICBwcml2YXRlIGdldERvbWFpbkZvckN1cnJlbnRGaWxlKCk6IHN0cmluZyB7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZUZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xyXG4gICAgICBpZiAoIWFjdGl2ZUZpbGUpIHJldHVybiB0aGlzLmRvbWFpbnNbMF0gfHwgJ2R1Yi5zaCc7XHJcblxyXG4gICAgICAvLyBSXHUwMEU5Y3VwXHUwMEU5cmVyIGxlIGNoZW1pbiBkdSBmaWNoaWVyIGFjdGlmXHJcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gYWN0aXZlRmlsZS5wYXRoO1xyXG5cclxuICAgICAgLy8gVHJvdXZlciBsZSBtYXBwaW5nIGxlIHBsdXMgc3BcdTAwRTljaWZpcXVlIHF1aSBjb3JyZXNwb25kIGF1IGNoZW1pbiBkdSBmaWNoaWVyXHJcbiAgICAgIGxldCBiZXN0TWF0Y2g6IHsgZG9tYWluOiBzdHJpbmcsIGRlcHRoOiBudW1iZXIgfSA9IHsgZG9tYWluOiB0aGlzLmRvbWFpbnNbMF0gfHwgJ2R1Yi5zaCcsIGRlcHRoOiAtMSB9O1xyXG5cclxuICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncy5mb3JFYWNoKG1hcHBpbmcgPT4ge1xyXG4gICAgICAgICAvLyBTaSBsZSBmaWNoaWVyIGVzdCBkYW5zIGNlIGRvc3NpZXIgb3UgdW4gc291cy1kb3NzaWVyXHJcbiAgICAgICAgIGlmIChmaWxlUGF0aC5zdGFydHNXaXRoKG1hcHBpbmcuZm9sZGVyKSkge1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxlciBsYSBwcm9mb25kZXVyIGR1IGRvc3NpZXIgbWFwcFx1MDBFOVxyXG4gICAgICAgICAgICBjb25zdCBkZXB0aCA9IG1hcHBpbmcuZm9sZGVyLnNwbGl0KCcvJykubGVuZ3RoO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gU2kgYydlc3QgbGUgbWFwcGluZyBsZSBwbHVzIHNwXHUwMEU5Y2lmaXF1ZSB0cm91dlx1MDBFOSBqdXNxdSdcdTAwRTAgcHJcdTAwRTlzZW50XHJcbiAgICAgICAgICAgIGlmIChkZXB0aCA+IGJlc3RNYXRjaC5kZXB0aCkge1xyXG4gICAgICAgICAgICAgICBiZXN0TWF0Y2ggPSB7XHJcbiAgICAgICAgICAgICAgICAgIGRvbWFpbjogbWFwcGluZy5kb21haW4sXHJcbiAgICAgICAgICAgICAgICAgIGRlcHRoOiBkZXB0aFxyXG4gICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gYmVzdE1hdGNoLmRvbWFpbjtcclxuICAgfVxyXG5cclxuICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTaG9ydExpbmsodXJsOiBzdHJpbmcsIHNsdWc6IHN0cmluZywgZG9tYWluOiBzdHJpbmcpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICAgY29uc29sZS5sb2coJ0NyZWF0aW5nIHNob3J0IGxpbmsgd2l0aDonLCB7IHVybCwgc2x1ZywgZG9tYWluIH0pO1xyXG4gICAgICAgICBcclxuICAgICAgICAgLy8gUydhc3N1cmVyIHF1ZSBsZSBkb21haW5lIGVzdCBkXHUwMEU5ZmluaVxyXG4gICAgICAgICBpZiAoIWRvbWFpbikge1xyXG4gICAgICAgICAgICBkb21haW4gPSAnZHViLnNoJztcclxuICAgICAgICAgfVxyXG5cclxuICAgICAgICAgLy8gVmFsaWRlciBldCBmb3JtYXRlciBsJ1VSTFxyXG4gICAgICAgICBpZiAoIXVybC5zdGFydHNXaXRoKCdodHRwOi8vJykgJiYgIXVybC5zdGFydHNXaXRoKCdodHRwczovLycpKSB7XHJcbiAgICAgICAgICAgIHVybCA9ICdodHRwczovLycgKyB1cmw7XHJcbiAgICAgICAgIH1cclxuXHJcbiAgICAgICAgIC8vIFZhbGlkZXIgbGEgY29tYmluYWlzb24gZG9tYWluZS9VUkxcclxuICAgICAgICAgaWYgKCF2YWxpZGF0ZURvbWFpblVybChkb21haW4sIHVybCwgdGhpcy50cmFuc2xhdGlvbnMpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgfVxyXG4gICAgICAgICBcclxuICAgICAgICAgLy8gVmFsaWRlciBsZSBzbHVnXHJcbiAgICAgICAgIGlmIChzbHVnKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNsdWdSZWdleCA9IC9eW2EtekEtWjAtOS1dKyQvO1xyXG4gICAgICAgICAgICBpZiAoIXNsdWdSZWdleC50ZXN0KHNsdWcpKSB7XHJcbiAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsICdMZSBzbHVnIG5lIHBldXQgY29udGVuaXIgcXVlIGRlcyBsZXR0cmVzLCBkZXMgY2hpZmZyZXMgZXQgZGVzIHRpcmV0cycpKTtcclxuICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFZcdTAwRTlyaWZpZXIgbGEgbG9uZ3VldXIgbWluaW1hbGUgZHUgc2x1ZyAoNCBjYXJhY3RcdTAwRThyZXMgcG91ciBsZSBwbGFuIGdyYXR1aXQpXHJcbiAgICAgICAgICAgIGlmIChzbHVnLmxlbmd0aCA8IDQpIHtcclxuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgJ0xlIHNsdWcgZG9pdCBjb250ZW5pciBhdSBtb2lucyA0IGNhcmFjdFx1MDBFOHJlcyBhdmVjIGxlIHBsYW4gZ3JhdHVpdCcpKTtcclxuICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgIH1cclxuXHJcbiAgICAgICAgIC8vIFZcdTAwRTlyaWZpZXIgc2kgbGUgZG9tYWluZSBlc3QgZGFucyBsYSBsaXN0ZSBkZXMgZG9tYWluZXMgZGlzcG9uaWJsZXNcclxuICAgICAgICAgaWYgKCF0aGlzLmRvbWFpbnMuaW5jbHVkZXMoZG9tYWluKSkge1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCBgTGUgZG9tYWluZSAke2RvbWFpbn0gbidlc3QgcGFzIGRpc3BvbmlibGUuIFZldWlsbGV6IGVuIGNob2lzaXIgdW4gYXV0cmUuYCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgXHJcbiAgICAgICAgIGNvbnN0IHBheWxvYWQgPSB7XHJcbiAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICBkb21haW46IGRvbWFpbixcclxuICAgICAgICAgICAgLi4uKHNsdWcgJiYgeyBrZXk6IHNsdWcgfSksXHJcbiAgICAgICAgICAgIC4uLih0aGlzLnNldHRpbmdzLmR1YldvcmtzcGFjZUlkICYmIHsgcHJvamVjdElkOiB0aGlzLnNldHRpbmdzLmR1YldvcmtzcGFjZUlkIH0pXHJcbiAgICAgICAgIH07XHJcblxyXG4gICAgICAgICBjb25zb2xlLmxvZygnUmVxdWVzdCBwYXlsb2FkOicsIHBheWxvYWQpO1xyXG4gICAgICAgICBcclxuICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcclxuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9hcGkuZHViLmNvL2xpbmtzJyxcclxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7dGhpcy5zZXR0aW5ncy5kdWJBcGlLZXl9YCxcclxuICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgIGNvbnNvbGUubG9nKCdSZXNwb25zZSBzdGF0dXM6JywgcmVzcG9uc2Uuc3RhdHVzKTtcclxuICAgICAgICAgY29uc29sZS5sb2coJ1Jlc3BvbnNlIGJvZHk6JywgcmVzcG9uc2UuanNvbik7XHJcbiAgICAgICAgIGNvbnNvbGUubG9nKCdSZXNwb25zZSBoZWFkZXJzOicsIHJlc3BvbnNlLmhlYWRlcnMpO1xyXG5cclxuICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAxKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNob3J0TGluayA9IHJlc3BvbnNlLmpzb24uc2hvcnRMaW5rO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQ3JlYXRlZCBzaG9ydCBsaW5rOicsIHNob3J0TGluayk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zdCBhY3RpdmVWaWV3ID0gdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoYWN0aXZlVmlldykge1xyXG4gICAgICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhY3RpdmVWaWV3LmVkaXRvcjtcclxuICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGFjdGl2ZVZpZXcuZmlsZTtcclxuXHJcbiAgICAgICAgICAgICAgIGlmIChlZGl0b3IgJiYgZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAvLyBVdGlsaXNlciBsJ2FuY3JlIHNpIGVsbGUgZXN0IGRcdTAwRTlmaW5pZSwgc2lub24gdXRpbGlzZXIgbCdVUkwgZGUgZGVzdGluYXRpb25cclxuICAgICAgICAgICAgICAgICAgY29uc3QgbGlua1RleHQgPSB0aGlzLmFuY2hvciB8fCB1cmw7XHJcbiAgICAgICAgICAgICAgICAgIC8vIENyXHUwMEU5ZXIgbGUgbm91dmVhdSBsaWVuIE1hcmtkb3duXHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG1hcmtkb3duTGluayA9IGBbJHtsaW5rVGV4dH1dKCR7c2hvcnRMaW5rfSlgO1xyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0luc2VydGluZyBtYXJrZG93biBsaW5rOicsIG1hcmtkb3duTGluayk7XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAvLyBPYnRlbmlyIGxhIHBvc2l0aW9uIGR1IGN1cnNldXJcclxuICAgICAgICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvcigpO1xyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgLy8gSW5zXHUwMEU5cmVyIGxlIGxpZW4gXHUwMEUwIGxhIHBvc2l0aW9uIGR1IGN1cnNldXJcclxuICAgICAgICAgICAgICAgICAgZWRpdG9yLnJlcGxhY2VSYW5nZShtYXJrZG93bkxpbmssIGN1cnNvcik7XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAvLyBNZXR0cmUgXHUwMEUwIGpvdXIgbGVzIGxpZW5zIGRhbnMgbGUgY2FjaGUgZCdPYnNpZGlhblxyXG4gICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XHJcbiAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmxpbmtDcmVhdGVkJykpO1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHJlc3BvbnNlOicsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcmVzcG9uc2UgYm9keTonLCByZXNwb25zZS5qc29uKTtcclxuICAgICAgICAgICAgbGV0IGVycm9yTWVzc2FnZSA9IHJlc3BvbnNlLmpzb24/LmVycm9yIHx8IHJlc3BvbnNlLmpzb24/Lm1lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gR1x1MDBFOXJlciBsZXMgZXJyZXVycyBzcFx1MDBFOWNpZmlxdWVzXHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwOSkge1xyXG4gICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSAnQ2Ugc2x1ZyBlc3QgZFx1MDBFOWpcdTAwRTAgdXRpbGlzXHUwMEU5LiBWZXVpbGxleiBlbiBjaG9pc2lyIHVuIGF1dHJlLic7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDApIHtcclxuICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gJ1VSTCBpbnZhbGlkZSBvdSBwYXJhbVx1MDBFOHRyZXMgaW5jb3JyZWN0cy4nO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxKSB7XHJcbiAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9ICdDbFx1MDBFOSBBUEkgaW52YWxpZGUgb3UgZXhwaXJcdTAwRTllLic7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDMpIHtcclxuICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gJ0FjY1x1MDBFOHMgcmVmdXNcdTAwRTkuIFZcdTAwRTlyaWZpZXogdm9zIHBlcm1pc3Npb25zLic7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MjIpIHtcclxuICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignNDIyIEVycm9yIGRldGFpbHM6JywgcmVzcG9uc2UuanNvbik7XHJcbiAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5qc29uPy5jb2RlID09PSAnZG9tYWluX25vdF9mb3VuZCcpIHtcclxuICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gYExlIGRvbWFpbmUgJHtkb21haW59IG4nZXN0IHBhcyBkaXNwb25pYmxlLiBWZXVpbGxleiBlbiBjaG9pc2lyIHVuIGF1dHJlLmA7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFJhZnJhXHUwMEVFY2hpciBsYSBsaXN0ZSBkZXMgZG9tYWluZXNcclxuICAgICAgICAgICAgICAgICAgdGhpcy5kb21haW5zID0gYXdhaXQgU2V0dGluZ3MuZ2V0Q2FjaGVkRG9tYWlucyhcclxuICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kdWJBcGlLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZHViV29ya3NwYWNlSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgIHRydWUgLy8gZm9yY2VyIGxlIHJhZnJhXHUwMEVFY2hpc3NlbWVudFxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLmpzb24/LmNvZGUgPT09ICdkb21haW5fbm90X2FsbG93ZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGBWb3VzIG4nYXZleiBwYXMgYWNjXHUwMEU4cyBhdSBkb21haW5lICR7ZG9tYWlufS4gVmV1aWxsZXogZW4gY2hvaXNpciB1biBhdXRyZS5gO1xyXG4gICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLmpzb24/LmNvZGUgPT09ICdpbnZhbGlkX2RvbWFpbicpIHtcclxuICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gYExlIGRvbWFpbmUgJHtkb21haW59IG4nZXN0IHBhcyB2YWxpZGUuYDtcclxuICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gcmVzcG9uc2UuanNvbj8ubWVzc2FnZSB8fCAnTGVzIGRvbm5cdTAwRTllcyBmb3VybmllcyBzb250IGludmFsaWRlcy4gVlx1MDBFOXJpZmlleiBsXFwnVVJMIGV0IGxlIHNsdWcuJztcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCBgJHtlcnJvck1lc3NhZ2V9YCkpO1xyXG4gICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0VycmV1ciBsb3JzIGRlIGxhIGNyXHUwMEU5YXRpb24gZHUgbGllbiBjb3VydDonLCBlcnJvcik7XHJcbiAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGRldGFpbHM6JywgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN0YWNrOicsIGVycm9yLnN0YWNrKTtcclxuICAgICAgICAgfVxyXG4gICAgICAgICBcclxuICAgICAgICAgbGV0IGVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XHJcbiAgICAgICAgIGlmIChlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ3N0YXR1cyA0MDknKSkge1xyXG4gICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSAnQ2Ugc2x1ZyBlc3QgZFx1MDBFOWpcdTAwRTAgdXRpbGlzXHUwMEU5LiBWZXVpbGxleiBlbiBjaG9pc2lyIHVuIGF1dHJlLic7XHJcbiAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3JNZXNzYWdlLmluY2x1ZGVzKCdzdGF0dXMgNDIyJykpIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gJ0xlcyBkb25uXHUwMEU5ZXMgZm91cm5pZXMgc29udCBpbnZhbGlkZXMuIFZcdTAwRTlyaWZpZXogbFxcJ1VSTCBldCBsZSBkb21haW5lLic7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgXHJcbiAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsIGVycm9yTWVzc2FnZSkpO1xyXG4gICAgICB9XHJcbiAgIH1cclxufSIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tICdvYnNpZGlhbic7XHJcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcclxuXHJcbmludGVyZmFjZSBEb21haW5WYWxpZGF0aW9uIHtcclxuICAgYWxsb3dlZERvbWFpbnM6IHN0cmluZ1tdO1xyXG4gICBlcnJvck1lc3NhZ2U6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IERPTUFJTl9WQUxJREFUSU9OUzogeyBba2V5OiBzdHJpbmddOiBEb21haW5WYWxpZGF0aW9uIH0gPSB7XHJcbiAgICdnaXQubmV3Jzoge1xyXG4gICAgICBhbGxvd2VkRG9tYWluczogWydnaXRodWIuY29tJ10sXHJcbiAgICAgIGVycm9yTWVzc2FnZTogJ0xlIGRvbWFpbmUgZ2l0Lm5ldyBuZSBwZXV0IFx1MDBFQXRyZSB1dGlsaXNcdTAwRTkgcXVcXCdhdmVjIGRlcyBVUkxzIGdpdGh1Yi5jb20nXHJcbiAgIH0sXHJcbiAgICdjaGF0Zy5wdCc6IHtcclxuICAgICAgYWxsb3dlZERvbWFpbnM6IFsnb3BlbmFpLmNvbScsICdjaGF0Z3B0LmNvbSddLFxyXG4gICAgICBlcnJvck1lc3NhZ2U6ICdMZSBkb21haW5lIGNoYXRnLnB0IG5lIHBldXQgXHUwMEVBdHJlIHV0aWxpc1x1MDBFOSBxdVxcJ2F2ZWMgZGVzIFVSTHMgb3BlbmFpLmNvbSBvdSBjaGF0Z3B0LmNvbSdcclxuICAgfSxcclxuICAgJ2Ftem4uaWQnOiB7XHJcbiAgICAgIGFsbG93ZWREb21haW5zOiBbXHJcbiAgICAgICAgICdhbWF6b24uY29tJyxcclxuICAgICAgICAgJ2FtYXpvbi5jby51aycsXHJcbiAgICAgICAgICdhbWF6b24uY2EnLFxyXG4gICAgICAgICAnYW1hem9uLmVzJyxcclxuICAgICAgICAgJ2FtYXpvbi5mcidcclxuICAgICAgXSxcclxuICAgICAgZXJyb3JNZXNzYWdlOiAnTGUgZG9tYWluZSBhbXpuLmlkIG5lIHBldXQgXHUwMEVBdHJlIHV0aWxpc1x1MDBFOSBxdVxcJ2F2ZWMgZGVzIFVSTHMgQW1hem9uIChjb20sIGNvLnVrLCBjYSwgZXMsIGZyKSdcclxuICAgfSxcclxuICAgJ2NhbC5saW5rJzoge1xyXG4gICAgICBhbGxvd2VkRG9tYWluczogW1xyXG4gICAgICAgICAnY2FsLmNvbScsXHJcbiAgICAgICAgICdjYWxlbmRseS5jb20nLFxyXG4gICAgICAgICAnY2FsZW5kYXIuYXBwLmdvb2dsZScsXHJcbiAgICAgICAgICdjaGlsbGlwaXBlci5jb20nLFxyXG4gICAgICAgICAnaHVic3BvdC5jb20nLFxyXG4gICAgICAgICAnc2F2dnljYWwuY29tJyxcclxuICAgICAgICAgJ3RpZHljYWwuY29tJyxcclxuICAgICAgICAgJ3pjYWwuY28nXHJcbiAgICAgIF0sXHJcbiAgICAgIGVycm9yTWVzc2FnZTogJ0xlIGRvbWFpbmUgY2FsLmxpbmsgbmUgcGV1dCBcdTAwRUF0cmUgdXRpbGlzXHUwMEU5IHF1XFwnYXZlYyBkZXMgVVJMcyBkZSBzZXJ2aWNlcyBkZSBjYWxlbmRyaWVyIGF1dG9yaXNcdTAwRTlzIChjYWwuY29tLCBjYWxlbmRseS5jb20sIGV0Yy4pJ1xyXG4gICB9LFxyXG4gICAnZmlnLnBhZ2UnOiB7XHJcbiAgICAgIGFsbG93ZWREb21haW5zOiBbJ2ZpZ21hLmNvbSddLFxyXG4gICAgICBlcnJvck1lc3NhZ2U6ICdMZSBkb21haW5lIGZpZy5wYWdlIG5lIHBldXQgXHUwMEVBdHJlIHV0aWxpc1x1MDBFOSBxdVxcJ2F2ZWMgZGVzIFVSTHMgZmlnbWEuY29tJ1xyXG4gICB9LFxyXG4gICAnZ2dsLmxpbmsnOiB7XHJcbiAgICAgIGFsbG93ZWREb21haW5zOiBbXHJcbiAgICAgICAgICdnb29nbGUuY29tJyxcclxuICAgICAgICAgJ2dvb2dsZS5jby51aycsXHJcbiAgICAgICAgICdnb29nbGUuY28uaWQnLFxyXG4gICAgICAgICAnZ29vZ2xlLmNhJyxcclxuICAgICAgICAgJ2dvb2dsZS5lcycsXHJcbiAgICAgICAgICdnb29nbGUuZnInLFxyXG4gICAgICAgICAnZ29vZ2xlYmxvZy5jb20nLFxyXG4gICAgICAgICAnYmxvZy5nb29nbGUnLFxyXG4gICAgICAgICAnZy5jbycsXHJcbiAgICAgICAgICdnLnBhZ2UnLFxyXG4gICAgICAgICAneW91dHViZS5jb20nLFxyXG4gICAgICAgICAneW91dHUuYmUnXHJcbiAgICAgIF0sXHJcbiAgICAgIGVycm9yTWVzc2FnZTogJ0xlIGRvbWFpbmUgZ2dsLmxpbmsgbmUgcGV1dCBcdTAwRUF0cmUgdXRpbGlzXHUwMEU5IHF1XFwnYXZlYyBkZXMgVVJMcyBHb29nbGUgKGdvb2dsZS5jb20sIHlvdXR1YmUuY29tLCBldGMuKSdcclxuICAgfSxcclxuICAgJ3NwdGkuZmknOiB7XHJcbiAgICAgIGFsbG93ZWREb21haW5zOiBbJ3Nwb3RpZnkuY29tJ10sXHJcbiAgICAgIGVycm9yTWVzc2FnZTogJ0xlIGRvbWFpbmUgc3B0aS5maSBuZSBwZXV0IFx1MDBFQXRyZSB1dGlsaXNcdTAwRTkgcXVcXCdhdmVjIGRlcyBVUkxzIHNwb3RpZnkuY29tJ1xyXG4gICB9XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVEb21haW5VcmwoZG9tYWluOiBzdHJpbmcsIHVybDogc3RyaW5nLCB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9ucyk6IGJvb2xlYW4ge1xyXG4gICBjb25zdCB2YWxpZGF0aW9uID0gRE9NQUlOX1ZBTElEQVRJT05TW2RvbWFpbl07XHJcbiAgIGlmICghdmFsaWRhdGlvbikgcmV0dXJuIHRydWU7IC8vIFNpIHBhcyBkZSB2YWxpZGF0aW9uIHNwXHUwMEU5Y2lmaXF1ZSwgb24gYWNjZXB0ZVxyXG5cclxuICAgdHJ5IHtcclxuICAgICAgY29uc3QgdXJsT2JqID0gbmV3IFVSTCh1cmwpO1xyXG4gICAgICBjb25zdCBpc1ZhbGlkID0gdmFsaWRhdGlvbi5hbGxvd2VkRG9tYWlucy5zb21lKGQgPT4gXHJcbiAgICAgICAgIHVybE9iai5ob3N0bmFtZSA9PT0gZCB8fCB1cmxPYmouaG9zdG5hbWUuZW5kc1dpdGgoJy4nICsgZClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmICghaXNWYWxpZCkge1xyXG4gICAgICAgICBuZXcgTm90aWNlKHRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgdmFsaWRhdGlvbi5lcnJvck1lc3NhZ2UpKTtcclxuICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgbmV3IE5vdGljZSh0cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsICdVUkwgaW52YWxpZGUnKSk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgfVxyXG59ICIsICJpbXBvcnQgeyBJdGVtVmlldywgUGx1Z2luLCBXb3Jrc3BhY2VMZWFmLCBzZXRJY29uLCBNZW51LCBNb2RhbCwgTm90aWNlIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL1RyYW5zbGF0aW9ucyc7XHJcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSAnLi9TZXR0aW5ncyc7XHJcbmltcG9ydCB7IHJlcXVlc3RVcmwgfSBmcm9tICdvYnNpZGlhbic7XHJcbmltcG9ydCB7IENyZWF0ZVNob3J0TGlua01vZGFsIH0gZnJvbSAnLi9TaG9ydExpbmtNb2RhbCc7XHJcblxyXG5leHBvcnQgY29uc3QgVklFV19UWVBFX0RBU0hCT0FSRCA9IFwibGlua2Zsb3d6LXZpZXdcIjtcclxuXHJcbmludGVyZmFjZSBTaG9ydExpbmsge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHVybDogc3RyaW5nO1xyXG4gICAgc2hvcnRVcmw6IHN0cmluZztcclxuICAgIGRvbWFpbjogc3RyaW5nO1xyXG4gICAgY3JlYXRlZEF0OiBzdHJpbmc7XHJcbiAgICBjbGlja3M6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERhc2hib2FyZFZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XHJcbiAgICBwcml2YXRlIGxpbmtzOiBTaG9ydExpbmtbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBmaWx0ZXJlZExpbmtzOiBTaG9ydExpbmtbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBpc0xvYWRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgc2VhcmNoSW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgbGVhZjogV29ya3NwYWNlTGVhZiwgXHJcbiAgICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcclxuICAgICAgICBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zXHJcbiAgICApIHtcclxuICAgICAgICBzdXBlcihsZWFmKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBWSUVXX1RZUEVfREFTSEJPQVJEO1xyXG4gICAgfVxyXG5cclxuICAgIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC50aXRsZScpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIG9uT3BlbigpIHtcclxuICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsO1xyXG4gICAgICAgIGNvbnRhaW5lci5lbXB0eSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENyXHUwMEU5ZXIgbGUgY29udGVuZXVyIHByaW5jaXBhbFxyXG4gICAgICAgIGNvbnN0IGRhc2hib2FyZENvbnRhaW5lciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdsaW5rZmxvd3otY29udGFpbmVyJyB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDclx1MDBFOWVyIGwnZW4tdFx1MDBFQXRlXHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZGFzaGJvYXJkQ29udGFpbmVyLmNyZWF0ZUVsKCdkaXYnLCB7IGNsczogJ2xpbmtmbG93ei1oZWFkZXInIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFByZW1pXHUwMEU4cmUgbGlnbmUgOiB0aXRyZSBldCBib3V0b25zXHJcbiAgICAgICAgY29uc3QgdGl0bGVSb3cgPSBoZWFkZXIuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnbGlua2Zsb3d6LWhlYWRlci1yb3cnIH0pO1xyXG4gICAgICAgIHRpdGxlUm93LmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnZGFzaGJvYXJkLnRpdGxlJykgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQm91dG9ucyBkYW5zIGxhIHByZW1pXHUwMEU4cmUgbGlnbmVcclxuICAgICAgICBjb25zdCBidXR0b25zID0gdGl0bGVSb3cuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnbGlua2Zsb3d6LWJ1dHRvbnMnIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEJvdXRvbiBkZSBjclx1MDBFOWF0aW9uIGRlIGxpZW5cclxuICAgICAgICBjb25zdCBjcmVhdGVCdXR0b24gPSBidXR0b25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otYnV0dG9uIG1vZC1jdGEnLFxyXG4gICAgICAgICAgICB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5jcmVhdGVTaG9ydExpbmsnKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNldEljb24oY3JlYXRlQnV0dG9uLCAncGx1cycpO1xyXG4gICAgICAgIGNyZWF0ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMub3BlbkNyZWF0ZUxpbmtNb2RhbCgpKTtcclxuXHJcbiAgICAgICAgLy8gQm91dG9uIGRlIHJhZnJhXHUwMEVFY2hpc3NlbWVudFxyXG4gICAgICAgIGNvbnN0IHJlZnJlc2hCdXR0b24gPSBidXR0b25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otYnV0dG9uJyxcclxuICAgICAgICAgICAgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnZGFzaGJvYXJkLnJlZnJlc2gnKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNldEljb24ocmVmcmVzaEJ1dHRvbiwgJ3JlZnJlc2gtY3cnKTtcclxuICAgICAgICByZWZyZXNoQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5yZWZyZXNoKCkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIERldXhpXHUwMEU4bWUgbGlnbmUgOiBiYXJyZSBkZSByZWNoZXJjaGVcclxuICAgICAgICBjb25zdCBzZWFyY2hSb3cgPSBoZWFkZXIuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnbGlua2Zsb3d6LWhlYWRlci1yb3cnIH0pO1xyXG4gICAgICAgIGNvbnN0IHNlYXJjaENvbnRhaW5lciA9IHNlYXJjaFJvdy5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdsaW5rZmxvd3otc2VhcmNoJyB9KTtcclxuICAgICAgICB0aGlzLnNlYXJjaElucHV0ID0gc2VhcmNoQ29udGFpbmVyLmNyZWF0ZUVsKCdpbnB1dCcsIHtcclxuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otc2VhcmNoLWlucHV0J1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEFqb3V0ZXIgbCdpY1x1MDBGNG5lIGRlIHJlY2hlcmNoZVxyXG4gICAgICAgIGNvbnN0IHNlYXJjaEljb24gPSBzZWFyY2hDb250YWluZXIuY3JlYXRlRWwoJ3NwYW4nLCB7IGNsczogJ2xpbmtmbG93ei1zZWFyY2gtaWNvbicgfSk7XHJcbiAgICAgICAgc2V0SWNvbihzZWFyY2hJY29uLCAnc2VhcmNoJyk7XHJcblxyXG4gICAgICAgIC8vIFx1MDBDOWNvdXRlciBsZXMgY2hhbmdlbWVudHMgZGFucyBsYSByZWNoZXJjaGVcclxuICAgICAgICB0aGlzLnNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmZpbHRlckxpbmtzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ3JcdTAwRTllciBsYSBzZWN0aW9uIHByaW5jaXBhbGVcclxuICAgICAgICBjb25zdCBjb250ZW50ID0gZGFzaGJvYXJkQ29udGFpbmVyLmNyZWF0ZUVsKCdkaXYnLCB7IGNsczogJ2xpbmtmbG93ei1jb250ZW50JyB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDclx1MDBFOWVyIGxhIGxpc3RlIGRlcyBsaWVuc1xyXG4gICAgICAgIGNvbnN0IGxpbmtzTGlzdCA9IGNvbnRlbnQuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnbGlua2Zsb3d6LWxpbmtzLWxpc3QnIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENoYXJnZXIgZXQgYWZmaWNoZXIgbGVzIGxpZW5zXHJcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkTGlua3MobGlua3NMaXN0KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBvbkNsb3NlKCkge1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyRWwuZW1wdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWZyZXNoKCkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLmNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3IoJy5saW5rZmxvd3otbGlua3MtbGlzdCcpO1xyXG4gICAgICAgIGlmIChjb250ZW50KSB7XHJcbiAgICAgICAgICAgIC8vIEFqb3V0ZXIgbCdhbmltYXRpb24gZGUgZmFkZSBvdXRcclxuICAgICAgICAgICAgY29udGVudC5hZGRDbGFzcygnZmFkZS1vdXQnKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEF0dGVuZHJlIGxhIGZpbiBkZSBsJ2FuaW1hdGlvblxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMzAwKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb250ZW50LmVtcHR5KCk7XHJcbiAgICAgICAgICAgIGNvbnRlbnQucmVtb3ZlQ2xhc3MoJ2ZhZGUtb3V0Jyk7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZExpbmtzKGNvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGxvYWRMaW5rcyhjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNMb2FkaW5nKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFmZmljaGVyIGxlIGxvYWRlclxyXG4gICAgICAgICAgICBjb250YWluZXIuZW1wdHkoKTtcclxuICAgICAgICAgICAgY29uc3QgbG9hZGVyID0gY29udGFpbmVyLmNyZWF0ZUVsKCdkaXYnLCB7IFxyXG4gICAgICAgICAgICAgICAgY2xzOiAnbGlua2Zsb3d6LWxvYWRpbmcnLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnZGFzaGJvYXJkLmxvYWRpbmcnKVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENoYXJnZXIgbGVzIGxpZW5zIGRlcHVpcyBkdWIuY29cclxuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCBTZXR0aW5ncy5sb2FkU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgaWYgKCFzZXR0aW5ncy5kdWJBcGlLZXkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQVBJIGtleSByZXF1aXJlZCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBcHBlbCBcdTAwRTAgbCdBUEkgZHViLmNvXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IGBodHRwczovL2FwaS5kdWIuY28vbGlua3Mke3NldHRpbmdzLmR1YldvcmtzcGFjZUlkID8gYD93b3Jrc3BhY2VJZD0ke3NldHRpbmdzLmR1YldvcmtzcGFjZUlkfWAgOiAnJ31gLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtzZXR0aW5ncy5kdWJBcGlLZXl9YCxcclxuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFQSSBFcnJvcjogJHtyZXNwb25zZS5zdGF0dXN9IC0gJHtyZXNwb25zZS50ZXh0fWApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBsaW5rcyA9IGF3YWl0IHJlc3BvbnNlLmpzb247XHJcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShsaW5rcykpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBBUEkgcmVzcG9uc2UgZm9ybWF0OiBleHBlY3RlZCBhcnJheScpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpbmtzID0gbGlua3MubWFwKChsaW5rOiBhbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICBpZDogbGluay5pZCxcclxuICAgICAgICAgICAgICAgIHVybDogbGluay51cmwsXHJcbiAgICAgICAgICAgICAgICBzaG9ydFVybDogbGluay5zaG9ydExpbmssXHJcbiAgICAgICAgICAgICAgICBkb21haW46IGxpbmsuZG9tYWluLFxyXG4gICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBsaW5rLmNyZWF0ZWRBdCxcclxuICAgICAgICAgICAgICAgIGNsaWNrczogbGluay5jbGlja3MgfHwgMFxyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTdXBwcmltZXIgbGUgbG9hZGVyXHJcbiAgICAgICAgICAgIGxvYWRlci5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFmZmljaGVyIGxlcyBsaWVuc1xyXG4gICAgICAgICAgICBpZiAodGhpcy5saW5rcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5jcmVhdGVFbCgnZGl2JywgeyBcclxuICAgICAgICAgICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otZW1wdHktc3RhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC5ub0xpbmtzJylcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBDclx1MDBFOWVyIGxhIGxpc3RlIGRlcyBsaWVuc1xyXG4gICAgICAgICAgICB0aGlzLmxpbmtzLmZvckVhY2gobGluayA9PiB0aGlzLmNyZWF0ZUxpbmtFbGVtZW50KGNvbnRhaW5lciwgbGluaykpO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJldXIgbG9ycyBkdSBjaGFyZ2VtZW50IGRlcyBsaWVuczonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5jcmVhdGVFbCgnZGl2JywgeyBcclxuICAgICAgICAgICAgICAgIGNsczogJ2xpbmtmbG93ei1lcnJvcicsXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9ucy50KCdkYXNoYm9hcmQuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCBlcnJvci5tZXNzYWdlKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUxpbmtFbGVtZW50KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGxpbms6IFNob3J0TGluaykge1xyXG4gICAgICAgIGNvbnN0IGxpbmtFbCA9IGNvbnRhaW5lci5jcmVhdGVFbCgnZGl2JywgeyBcclxuICAgICAgICAgICAgY2xzOiAnbGlua2Zsb3d6LWxpbmstaXRlbScsXHJcbiAgICAgICAgICAgIGF0dHI6IHsgdGFiaW5kZXg6ICcwJyB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEdlc3Rpb24gZGVzIFx1MDBFOXZcdTAwRTluZW1lbnRzIGNsYXZpZXJcclxuICAgICAgICBsaW5rRWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xyXG4gICAgICAgICAgICAgICAgLy8gT3V2cmUgbGUgbGllblxyXG4gICAgICAgICAgICAgICAgd2luZG93Lm9wZW4obGluay5zaG9ydFVybCwgJ19ibGFuaycpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSAnQXJyb3dEb3duJykge1xyXG4gICAgICAgICAgICAgICAgLy8gRm9jdXMgbCdcdTAwRTlsXHUwMEU5bWVudCBzdWl2YW50XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gbGlua0VsLm5leHRFbGVtZW50U2libGluZyBhcyBIVE1MRWxlbWVudDtcclxuICAgICAgICAgICAgICAgIGlmIChuZXh0KSBuZXh0LmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZS5rZXkgPT09ICdBcnJvd1VwJykge1xyXG4gICAgICAgICAgICAgICAgLy8gRm9jdXMgbCdcdTAwRTlsXHUwMEU5bWVudCBwclx1MDBFOWNcdTAwRTlkZW50XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcmV2ID0gbGlua0VsLnByZXZpb3VzRWxlbWVudFNpYmxpbmcgYXMgSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldikgcHJldi5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEVuLXRcdTAwRUF0ZSBkdSBsaWVuXHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gbGlua0VsLmNyZWF0ZUVsKCdkaXYnLCB7IGNsczogJ2xpbmtmbG93ei1saW5rLWhlYWRlcicgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVVJMIGNvdXJ0ZSBhdmVjIGljXHUwMEY0bmUgZGUgY29waWVcclxuICAgICAgICBjb25zdCBzaG9ydFVybENvbnRhaW5lciA9IGhlYWRlci5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdsaW5rZmxvd3otc2hvcnQtdXJsJyB9KTtcclxuICAgICAgICBzaG9ydFVybENvbnRhaW5lci5jcmVhdGVFbCgnYScsIHtcclxuICAgICAgICAgICAgdGV4dDogbGluay5zaG9ydFVybCxcclxuICAgICAgICAgICAgaHJlZjogbGluay5zaG9ydFVybCxcclxuICAgICAgICAgICAgY2xzOiAnbGlua2Zsb3d6LWxpbmsnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgY29weUJ1dHRvbiA9IHNob3J0VXJsQ29udGFpbmVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otYnV0dG9uLWljb24nLFxyXG4gICAgICAgICAgICBhdHRyOiB7IFxyXG4gICAgICAgICAgICAgICAgJ2FyaWEtbGFiZWwnOiAnQ29weSBVUkwnLFxyXG4gICAgICAgICAgICAgICAgJ3RhYmluZGV4JzogJzAnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBzZXRJY29uKGNvcHlCdXR0b24sICdjb3B5Jyk7XHJcbiAgICAgICAgY29weUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobGluay5zaG9ydFVybCk7XHJcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoJ1VSTCBjb3BpZWQgdG8gY2xpcGJvYXJkJyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIE1lbnUgZCdhY3Rpb25zXHJcbiAgICAgICAgY29uc3QgYWN0aW9uc0J1dHRvbiA9IGhlYWRlci5jcmVhdGVFbCgnYnV0dG9uJywgeyBcclxuICAgICAgICAgICAgY2xzOiAnbGlua2Zsb3d6LWJ1dHRvbi1pY29uJyxcclxuICAgICAgICAgICAgYXR0cjogeyBcclxuICAgICAgICAgICAgICAgICdhcmlhLWxhYmVsJzogJ0FjdGlvbnMnLFxyXG4gICAgICAgICAgICAgICAgJ3RhYmluZGV4JzogJzAnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBzZXRJY29uKGFjdGlvbnNCdXR0b24sICdtb3JlLXZlcnRpY2FsJyk7XHJcbiAgICAgICAgYWN0aW9uc0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcclxuICAgICAgICAgICAgbWVudS5hZGRJdGVtKGl0ZW0gPT4gaXRlbVxyXG4gICAgICAgICAgICAgICAgLnNldEljb24oJ3BlbmNpbCcpXHJcbiAgICAgICAgICAgICAgICAuc2V0VGl0bGUoJ0VkaXQnKVxyXG4gICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEltcGxcdTAwRTltZW50ZXIgbCdcdTAwRTlkaXRpb25cclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgbWVudS5hZGRJdGVtKGl0ZW0gPT4gaXRlbVxyXG4gICAgICAgICAgICAgICAgLnNldEljb24oJ3RyYXNoJylcclxuICAgICAgICAgICAgICAgIC5zZXRUaXRsZSgnRGVsZXRlJylcclxuICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBJbXBsXHUwMEU5bWVudGVyIGxhIHN1cHByZXNzaW9uXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIG1lbnUuc2hvd0F0TW91c2VFdmVudChldmVudCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIERcdTAwRTl0YWlscyBkdSBsaWVuXHJcbiAgICAgICAgY29uc3QgZGV0YWlscyA9IGxpbmtFbC5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdsaW5rZmxvd3otbGluay1kZXRhaWxzJyB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBVUkwgb3JpZ2luYWxlXHJcbiAgICAgICAgZGV0YWlscy5jcmVhdGVFbCgnZGl2JywgeyBcclxuICAgICAgICAgICAgY2xzOiAnbGlua2Zsb3d6LW9yaWdpbmFsLXVybCcsXHJcbiAgICAgICAgICAgIHRleHQ6IGxpbmsudXJsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFN0YXRpc3RpcXVlc1xyXG4gICAgICAgIGNvbnN0IHN0YXRzID0gZGV0YWlscy5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdsaW5rZmxvd3otbGluay1zdGF0cycgfSk7XHJcbiAgICAgICAgc3RhdHMuY3JlYXRlRWwoJ3NwYW4nLCB7IFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otc3RhdCcsXHJcbiAgICAgICAgICAgIHRleHQ6IGAke2xpbmsuY2xpY2tzfSBjbGlja3NgXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc3RhdHMuY3JlYXRlRWwoJ3NwYW4nLCB7IFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otc3RhdCcsXHJcbiAgICAgICAgICAgIHRleHQ6IG5ldyBEYXRlKGxpbmsuY3JlYXRlZEF0KS50b0xvY2FsZURhdGVTdHJpbmcoKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgb3BlbkNyZWF0ZUxpbmtNb2RhbCgpIHtcclxuICAgICAgICBjb25zdCBzZXR0aW5ncyA9IGF3YWl0IFNldHRpbmdzLmxvYWRTZXR0aW5ncygpO1xyXG4gICAgICAgIGNvbnN0IG1vZGFsID0gbmV3IENyZWF0ZVNob3J0TGlua01vZGFsKFxyXG4gICAgICAgICAgICB0aGlzLmFwcCxcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4sXHJcbiAgICAgICAgICAgIHNldHRpbmdzLFxyXG4gICAgICAgICAgICB0aGlzLnRyYW5zbGF0aW9uc1xyXG4gICAgICAgICk7XHJcbiAgICAgICAgbW9kYWwub3BlbigpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZmlsdGVyTGlua3MoKSB7XHJcbiAgICAgICAgY29uc3Qgc2VhcmNoVGVybSA9IHRoaXMuc2VhcmNoSW5wdXQudmFsdWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5jb250YWluZXJFbC5xdWVyeVNlbGVjdG9yKCcubGlua2Zsb3d6LWxpbmtzLWxpc3QnKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoIWNvbnRlbnQpIHJldHVybjtcclxuICAgICAgICBcclxuICAgICAgICBjb250ZW50LmVtcHR5KCk7XHJcblxyXG4gICAgICAgIGlmICghc2VhcmNoVGVybSkge1xyXG4gICAgICAgICAgICB0aGlzLmxpbmtzLmZvckVhY2gobGluayA9PiB0aGlzLmNyZWF0ZUxpbmtFbGVtZW50KGNvbnRlbnQsIGxpbmspKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZmlsdGVyZWQgPSB0aGlzLmxpbmtzLmZpbHRlcihsaW5rID0+IFxyXG4gICAgICAgICAgICBsaW5rLnVybC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHNlYXJjaFRlcm0pIHx8XHJcbiAgICAgICAgICAgIGxpbmsuc2hvcnRVcmwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhzZWFyY2hUZXJtKSB8fFxyXG4gICAgICAgICAgICBsaW5rLmRvbWFpbi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHNlYXJjaFRlcm0pXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlcmVkLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb250ZW50LmNyZWF0ZUVsKCdkaXYnLCB7IFxyXG4gICAgICAgICAgICAgICAgY2xzOiAnbGlua2Zsb3d6LWVtcHR5LXN0YXRlJyxcclxuICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC5ub1NlYXJjaFJlc3VsdHMnKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlsdGVyZWQuZm9yRWFjaChsaW5rID0+IHRoaXMuY3JlYXRlTGlua0VsZW1lbnQoY29udGVudCwgbGluaykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRGFzaGJvYXJkTWFuYWdlciB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogUGx1Z2luLCBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zKSB7fVxyXG5cclxuICAgIGFzeW5jIG9wZW5EYXNoYm9hcmQobW9kZTogJ3RhYicgfCAnc2lkZWJhcicgfCAnb3ZlcmxheScpIHtcclxuICAgICAgICBjb25zdCBleGlzdGluZ0xlYXZlcyA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9EQVNIQk9BUkQpO1xyXG4gICAgICAgIGlmIChleGlzdGluZ0xlYXZlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihleGlzdGluZ0xlYXZlc1swXSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnZpZXdNb2RlLnNldFZpZXcobW9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q3VycmVudExlYWYoKTogV29ya3NwYWNlTGVhZiB8IG51bGwge1xyXG4gICAgICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9EQVNIQk9BUkQpO1xyXG4gICAgICAgIHJldHVybiBsZWF2ZXMubGVuZ3RoID4gMCA/IGxlYXZlc1swXSA6IG51bGw7XHJcbiAgICB9XHJcbn0gIiwgImltcG9ydCB7IFBsdWdpbiwgV29ya3NwYWNlTGVhZiwgTW9kYWwsIE5vdGljZSwgQ29tcG9uZW50IH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBUVmlld01vZGUgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tICcuL1NldHRpbmdzJztcclxuaW1wb3J0IHsgRGFzaGJvYXJkVmlldywgVklFV19UWVBFX0RBU0hCT0FSRCB9IGZyb20gJy4vRGFzaGJvYXJkJztcclxuaW1wb3J0IHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi9UcmFuc2xhdGlvbnMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFZpZXdNb2RlIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgcHJpdmF0ZSBjdXJyZW50VmlldzogRGFzaGJvYXJkVmlldyB8IG51bGwgPSBudWxsO1xyXG4gICBwcml2YXRlIGN1cnJlbnRNb2RlOiBUVmlld01vZGUgfCBudWxsID0gbnVsbDtcclxuICAgcHJpdmF0ZSBhY3RpdmVMZWFmOiBXb3Jrc3BhY2VMZWFmIHwgbnVsbCA9IG51bGw7XHJcbiAgIHByaXZhdGUgbGVhZklkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgcHJpdmF0ZSB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9ucztcclxuXHJcbiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBQbHVnaW4pIHtcclxuICAgICAgc3VwZXIoKTtcclxuICAgICAgdGhpcy50cmFuc2xhdGlvbnMgPSBuZXcgVHJhbnNsYXRpb25zKCk7XHJcbiAgICAgIC8vIEluaXRpYWxpc2VyIGxlcyBtb2RlcyBkZXB1aXMgbGVzIHNldHRpbmdzXHJcbiAgICAgIFNldHRpbmdzLmxvYWRTZXR0aW5ncygpLnRoZW4oc2V0dGluZ3MgPT4ge1xyXG4gICAgICAgICB0aGlzLmN1cnJlbnRNb2RlID0gc2V0dGluZ3MuY3VycmVudE1vZGU7XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBOZXR0b3llciBsZXMgYW5jaWVubmVzIGxlYWZzIGF1IGRcdTAwRTltYXJyYWdlXHJcbiAgICAgIHRoaXMuY2xvc2VDdXJyZW50VmlldygpO1xyXG4gICB9XHJcblxyXG4gICBwcml2YXRlIGFzeW5jIGNsb3NlQ3VycmVudFZpZXcoKSB7XHJcbiAgICAgIC8vIEZlcm1lciBsYSB2dWUgYWN0dWVsbGUgc2kgZWxsZSBleGlzdGVcclxuICAgICAgaWYgKHRoaXMuY3VycmVudFZpZXcpIHtcclxuICAgICAgICAgLy8gU2kgYydlc3QgdW5lIGxlYWYsIGxhIGRcdTAwRTl0YWNoZXJcclxuICAgICAgICAgaWYgKHRoaXMuYWN0aXZlTGVhZikge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUxlYWYuZGV0YWNoKCk7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgXHJcbiAgICAgICAgIC8vIEZlcm1lciB0b3V0ZXMgbGVzIGF1dHJlcyB2dWVzIGV4aXN0YW50ZXNcclxuICAgICAgICAgY29uc3QgbGVhdmVzID0gdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0RBU0hCT0FSRCk7XHJcbiAgICAgICAgIGxlYXZlcy5mb3JFYWNoKGxlYWYgPT4ge1xyXG4gICAgICAgICAgICBpZiAobGVhZi52aWV3IGluc3RhbmNlb2YgRGFzaGJvYXJkVmlldykge1xyXG4gICAgICAgICAgICAgICBsZWFmLmRldGFjaCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgdGhpcy5jdXJyZW50VmlldyA9IG51bGw7XHJcbiAgICAgICAgIHRoaXMuYWN0aXZlTGVhZiA9IG51bGw7XHJcbiAgICAgICAgIHRoaXMubGVhZklkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICB9XHJcblxyXG4gICBhc3luYyBzZXRWaWV3KG1vZGU6IFRWaWV3TW9kZSkge1xyXG4gICAgICAvLyBTaSBvbiBlc3QgZFx1MDBFOWpcdTAwRTAgZGFucyBsZSBib24gbW9kZSBldCBxdWUgY2Ugbidlc3QgcGFzIHVuIHBvcHVwLCBuZSByaWVuIGZhaXJlXHJcbiAgICAgIGlmIChtb2RlID09PSB0aGlzLmN1cnJlbnRNb2RlICYmIHRoaXMuY3VycmVudFZpZXcgJiYgbW9kZSAhPT0gJ292ZXJsYXknKSB7XHJcbiAgICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRmVybWVyIGxhIHZ1ZSBhY3R1ZWxsZSBldCB0b3V0ZXMgbGVzIGF1dHJlcyB2dWVzIGV4aXN0YW50ZXNcclxuICAgICAgYXdhaXQgdGhpcy5jbG9zZUN1cnJlbnRWaWV3KCk7XHJcblxyXG4gICAgICBjb25zdCB3b3Jrc3BhY2UgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlO1xyXG5cclxuICAgICAgLy8gR1x1MDBFOXJlciBsZSBtb2RlIG92ZXJsYXkgc1x1MDBFOXBhclx1MDBFOW1lbnQgY2FyIGlsIG4ndXRpbGlzZSBwYXMgZGUgbGVhZlxyXG4gICAgICBpZiAobW9kZSA9PT0gJ292ZXJsYXknKSB7XHJcbiAgICAgICAgIGNvbnN0IG1vZGFsID0gbmV3IE1vZGFsKHRoaXMucGx1Z2luLmFwcCk7XHJcbiAgICAgICAgIG1vZGFsLnRpdGxlRWwuc2V0VGV4dCh0aGlzLnRyYW5zbGF0aW9ucy50KCdkYXNoYm9hcmQudGl0bGUnKSk7XHJcbiAgICAgICAgIG1vZGFsLmNvbnRhaW5lckVsLmFkZENsYXNzKCdsaW5rZmxvd3otbW9kYWwnKTtcclxuXHJcbiAgICAgICAgIC8vIENyXHUwMEU5ZXIgbGUgY29udGVuZXVyIHBvdXIgbGUgZGFzaGJvYXJkIGRhbnMgbGEgbW9kYWxlXHJcbiAgICAgICAgIGNvbnN0IGNvbnRlbnRFbCA9IG1vZGFsLmNvbnRlbnRFbC5jcmVhdGVEaXYoJ2xpbmtmbG93ei1jb250ZW50Jyk7XHJcblxyXG4gICAgICAgICAvLyBDclx1MDBFOWVyIHVuZSBpbnN0YW5jZSBkZSBsYSBEYXNoYm9hcmRWaWV3IGVuIG1vZGUgb3ZlcmxheVxyXG4gICAgICAgICBjb25zdCB2aWV3ID0gbmV3IERhc2hib2FyZFZpZXcoXHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZignc3BsaXQnKSxcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4sXHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25zXHJcbiAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAvLyBSZW5kcmUgbGUgY29udGVudVxyXG4gICAgICAgICBhd2FpdCB2aWV3Lm9uT3BlbigpO1xyXG4gICAgICAgICBcclxuICAgICAgICAgdGhpcy5jdXJyZW50VmlldyA9IHZpZXc7XHJcbiAgICAgICAgIHRoaXMuYWN0aXZlTGVhZiA9IG51bGw7XHJcbiAgICAgICAgIG1vZGFsLm9wZW4oKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgLy8gQ3JcdTAwRTllciBsYSBsZWFmIHNlbG9uIGxlIG1vZGVcclxuICAgICAgICAgbGV0IGxlYWY6IFdvcmtzcGFjZUxlYWYgfCBudWxsID0gbnVsbDtcclxuICAgICAgICAgc3dpdGNoIChtb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3NpZGViYXInOlxyXG4gICAgICAgICAgICAgICBsZWFmID0gd29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSkgPz8gd29ya3NwYWNlLmdldExlYWYoJ3NwbGl0Jyk7XHJcbiAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd0YWInOlxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoJ3NwbGl0Jyk7XHJcbiAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICB9XHJcblxyXG4gICAgICAgICBpZiAobGVhZikge1xyXG4gICAgICAgICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgIHR5cGU6IFZJRVdfVFlQRV9EQVNIQk9BUkQsXHJcbiAgICAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgc3RhdGU6IHsgXHJcbiAgICAgICAgICAgICAgICAgIG1vZGU6IG1vZGUsXHJcbiAgICAgICAgICAgICAgICAgIGxlYWZJZDogdGhpcy5sZWFmSWRcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFZpZXcgPSBsZWFmLnZpZXcgYXMgRGFzaGJvYXJkVmlldztcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVMZWFmID0gbGVhZjtcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xyXG4gICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuY3VycmVudE1vZGUgPSBtb2RlO1xyXG4gICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBjdXJyZW50TW9kZTogbW9kZSB9KTtcclxuICAgfVxyXG5cclxuICAgZ2V0QWN0aXZlTGVhZigpOiBXb3Jrc3BhY2VMZWFmIHwgbnVsbCB7XHJcbiAgICAgIHJldHVybiB0aGlzLmFjdGl2ZUxlYWY7XHJcbiAgIH1cclxuXHJcbiAgIGdldEN1cnJlbnRMZWFmSWQoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICAgIHJldHVybiB0aGlzLmxlYWZJZDtcclxuICAgfVxyXG5cclxuICAgZ2V0Q3VycmVudE1vZGUoKTogVFZpZXdNb2RlIHwgbnVsbCB7XHJcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRNb2RlO1xyXG4gICB9XHJcbn0gIiwgImV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclN0eWxlcygpIHtcbmNvbnN0IHN0eWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuc3R5bGVFbC5pZCA9ICdsaW5rZmxvd3otc3R5bGVzJztcbnN0eWxlRWwudGV4dENvbnRlbnQgPSBgXG4gICAgLyogQW5pbWF0aW9ucyAqL1xuICAgIEBrZXlmcmFtZXMgZmFkZUluIHtcbiAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IH1cbiAgICAgICAgdG8geyBvcGFjaXR5OiAxOyB9XG4gICAgfVxuXG4gICAgQGtleWZyYW1lcyBmYWRlT3V0IHtcbiAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDE7IH1cbiAgICAgICAgdG8geyBvcGFjaXR5OiAwOyB9XG4gICAgfVxuXG4gICAgLyogTWVudSBIb3ZlciBTdHlsZXMgKi9cbiAgICAubWVudS5saW5rZmxvd3otbWVudSB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgei1pbmRleDogMTAwMDtcbiAgICB9XG5cbiAgICAvKiBEYXNoYm9hcmQgQ29udGFpbmVyICovXG4gICAgLmxpbmtmbG93ei1jb250YWluZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgIHBhZGRpbmc6IDFyZW07XG4gICAgICAgIGdhcDogMXJlbTtcbiAgICB9XG5cbiAgICAvKiBIZWFkZXIgU3R5bGVzICovXG4gICAgLmxpbmtmbG93ei1oZWFkZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBnYXA6IDFyZW07XG4gICAgICAgIHBhZGRpbmctYm90dG9tOiAxcmVtO1xuICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otaGVhZGVyLXJvdyB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWhlYWRlciBoMiB7XG4gICAgICAgIG1hcmdpbjogMDtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbnMge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBnYXA6IDAuNXJlbTtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAvKiBUb29sYmFyIFN0eWxlcyAqL1xuICAgIC5saW5rZmxvd3otdG9vbGJhciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGdhcDogMC41cmVtO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGdhcDogMC41cmVtO1xuICAgICAgICBwYWRkaW5nOiAwLjVyZW0gMXJlbTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWludGVyYWN0aXZlLW5vcm1hbCk7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbjpob3ZlciB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWludGVyYWN0aXZlLWhvdmVyKTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbi5tb2QtY3RhIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtb24tYWNjZW50KTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbi5tb2QtY3RhOmhvdmVyIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50LWhvdmVyKTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbi1pY29uIHtcbiAgICAgICAgcGFkZGluZzogMC4yNXJlbTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbi1pY29uOmhvdmVyIHtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ob3Zlcik7XG4gICAgfVxuXG4gICAgLyogQ29udGVudCBTdHlsZXMgKi9cbiAgICAubGlua2Zsb3d6LWNvbnRlbnQge1xuICAgICAgICBmbGV4OiAxO1xuICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICBwYWRkaW5nOiAxcmVtIDA7XG4gICAgfVxuXG4gICAgLmxpbmtmbG93ei1saW5rcy1saXN0IHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgZ2FwOiAxcmVtO1xuICAgICAgICBhbmltYXRpb246IGZhZGVJbiAwLjNzIGVhc2UtaW4tb3V0O1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otbGlua3MtbGlzdC5mYWRlLW91dCB7XG4gICAgICAgIGFuaW1hdGlvbjogZmFkZU91dCAwLjNzIGVhc2UtaW4tb3V0O1xuICAgIH1cblxuICAgIC8qIExpbmsgSXRlbSBTdHlsZXMgKi9cbiAgICAubGlua2Zsb3d6LWxpbmstaXRlbSB7XG4gICAgICAgIHBhZGRpbmc6IDFyZW07XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KTtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otbGluay1oZWFkZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDAuNXJlbTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LXNob3J0LXVybCB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGdhcDogMC41cmVtO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otbGluayB7XG4gICAgICAgIGNvbG9yOiB2YXIoLS10ZXh0LWFjY2VudCk7XG4gICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWxpbms6aG92ZXIge1xuICAgICAgICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWxpbmstZGV0YWlscyB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIGdhcDogMC41cmVtO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otb3JpZ2luYWwtdXJsIHtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICAgICAgICBmb250LXNpemU6IDAuOWVtO1xuICAgICAgICB3b3JkLWJyZWFrOiBicmVhay1hbGw7XG4gICAgfVxuXG4gICAgLmxpbmtmbG93ei1saW5rLXN0YXRzIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZ2FwOiAxcmVtO1xuICAgICAgICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gICAgICAgIGZvbnQtc2l6ZTogMC45ZW07XG4gICAgfVxuXG4gICAgLyogTG9hZGluZyBTdGF0ZSAqL1xuICAgIC5saW5rZmxvd3otbG9hZGluZyB7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogMnJlbTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICAgIH1cblxuICAgIC8qIEVtcHR5IFN0YXRlICovXG4gICAgLmxpbmtmbG93ei1lbXB0eS1zdGF0ZSB7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogMnJlbTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICAgIH1cblxuICAgIC8qIEVycm9yIFN0YXRlICovXG4gICAgLmxpbmtmbG93ei1lcnJvciB7XG4gICAgICAgIGNvbG9yOiB2YXIoLS10ZXh0LWVycm9yKTtcbiAgICAgICAgcGFkZGluZzogMXJlbTtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWVycm9yKTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgIH1cblxuICAgIC8qIE1vZGFsIFN0eWxlcyAqL1xuICAgIC5saW5rZmxvd3otbW9kYWwge1xuICAgICAgICBtYXgtd2lkdGg6IDgwdnc7XG4gICAgICAgIG1heC1oZWlnaHQ6IDgwdmg7XG4gICAgICAgIHdpZHRoOiA2MDBweDtcbiAgICB9XG5cbiAgICAvKiBTZWFyY2ggU3R5bGVzICovXG4gICAgLmxpbmtmbG93ei1zZWFyY2gge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWJhY2tncm91bmQtcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmxpbmtmbG93ei1zZWFyY2gtaWNvbiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB3aWR0aDogMnJlbTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otc2VhcmNoLWlucHV0IHtcbiAgICAgICAgZmxleDogMTtcbiAgICAgICAgcGFkZGluZzogMC41cmVtO1xuICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICAgIGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG4gICAgfVxuXG4gICAgLmxpbmtmbG93ei1zZWFyY2gtaW5wdXQ6Zm9jdXMge1xuICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICBib3gtc2hhZG93OiAwIDAgMCAycHggdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICAgIH1cbmA7XG5cbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bnJlZ2lzdGVyU3R5bGVzKCkge1xuY29uc3Qgc3R5bGVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaW5rZmxvd3otc3R5bGVzJyk7XG5pZiAoc3R5bGVFbCkge1xuICAgIHN0eWxlRWwucmVtb3ZlKCk7XG59XG59ICJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQTJEOzs7QUNBM0Qsc0JBQTBGO0FBa0JuRixJQUFNLG1CQUFvQztBQUFBLEVBQzlDLFVBQVU7QUFBQSxFQUNWLFdBQVc7QUFBQSxFQUNYLGdCQUFnQjtBQUFBLEVBQ2hCLHNCQUFzQixDQUFDO0FBQUEsRUFDdkIsVUFBVTtBQUFBLEVBQ1YsZUFBZSxDQUFDO0FBQUEsRUFDaEIsa0JBQWtCO0FBQ3JCO0FBRU8sSUFBTSxXQUFOLE1BQWU7QUFBQTtBQUFBLEVBS25CLE9BQU8sV0FBVyxRQUFnQjtBQUMvQixTQUFLLFNBQVM7QUFBQSxFQUNqQjtBQUFBLEVBRUEsYUFBYSxlQUF5QztBQUNuRCxVQUFNLFlBQVksTUFBTSxLQUFLLE9BQU8sU0FBUztBQUM3QyxTQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxrQkFBa0IsYUFBYSxDQUFDLENBQUM7QUFD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QUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtB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QUFLO0FBQ1YscUJBQVMsb0JBQW9CLGFBQWEsU0FBUztBQUFBLFVBQ3REO0FBQUEsUUFDSDtBQUVBLGlCQUFTLGlCQUFpQixhQUFhLFNBQVM7QUFBQSxNQUNuRCxDQUFDO0FBQUEsSUFDSixDQUFDO0FBR0QsU0FBSyxjQUFjLElBQUk7QUFBQSxNQUNwQixLQUFLO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBLEtBQUs7QUFBQSxJQUNSLENBQUM7QUFHRCxTQUFLO0FBQUEsTUFDRixLQUFLLElBQUksTUFBTSxHQUFHLFVBQVUsT0FBTyxTQUFnQjtBQUNoRCxZQUFJO0FBQ0QsZ0JBQU1DLFlBQVcsTUFBTSxTQUFTLGFBQWE7QUFDN0MsY0FBSSxLQUFLLEtBQUssV0FBV0EsVUFBUyxXQUFXLEdBQUc7QUFFN0MsZ0JBQUksS0FBSyxXQUFXO0FBQ2pCLG9CQUFNLEtBQUssVUFBVSxRQUFRO0FBQUEsWUFDaEM7QUFBQSxVQUNIO0FBQUEsUUFDSCxTQUFTLE9BQU87QUFDYixrQkFBUSxNQUFNLG1EQUFnRCxLQUFLO0FBQUEsUUFDdEU7QUFBQSxNQUNILENBQUM7QUFBQSxJQUNKO0FBRUEsbUJBQWU7QUFBQSxFQUNsQjtBQUFBLEVBRVEsZUFBcUI7QUFwSWhDO0FBcUlNLFVBQU0sV0FBUyxjQUFTLGdCQUFnQixTQUF6QixtQkFBK0IsY0FBYyxXQUFXLFNBQVEsT0FBTztBQUN0RixTQUFLLGFBQWEsWUFBWSxNQUFNO0FBQUEsRUFDdkM7QUFBQSxFQUVBLFdBQVc7QUF6SWQ7QUEySU0scUJBQWlCO0FBR2pCLFVBQU0sUUFBTyxVQUFLLHFCQUFMLG1CQUF1QjtBQUNwQyxRQUFJLE1BQU07QUFDUCxXQUFLLE9BQU87QUFBQSxJQUNmO0FBQUEsRUFDSDtBQUNIOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAidHJhbnNsYXRpb25zIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgInRyYW5zbGF0aW9ucyIsICJ0cmFuc2xhdGlvbnMiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJ0cmFuc2xhdGlvbnMiLCAidHJhbnNsYXRpb25zIiwgImltcG9ydF9vYnNpZGlhbiIsICJzZXR0aW5ncyJdCn0K
