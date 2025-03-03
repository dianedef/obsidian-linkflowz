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

// obsidian-LinkFlowz/src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => LinkFlowz
});
module.exports = __toCommonJS(main_exports);
var import_obsidian8 = require("obsidian");

// obsidian-LinkFlowz/src/Settings.ts
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

// obsidian-LinkFlowz/src/Translations.ts
var translations = {
  en: {
    // Notices
    "notices.saved": "\u2705 Settings saved",
    "notices.error": "\u274C Error: {message}",
    "notices.success": "\u2705 Operation successful",
    "notices.linkCreated": "\u2705 Short link created successfully",
    "notices.urlRequired": "\u274C Destination URL is required",
    "notices.linkDeleted": "\u2705 Short link deleted successfully",
    "notices.linkCopied": "\u2705 Short link copied to clipboard",
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
    "modal.cancel": "Cancel",
    "modal.edit": "Edit",
    "modal.delete": "Delete",
    "modal.editShortLink": "Edit Short Link",
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
    "notices.domainsRefreshed": "\u2705 Domains list refreshed",
    "dashboard.noSearchResults": "No results found",
    "dashboard.focusSearch": "Focus search",
    "notices.linkUpdated": "\u2705 Short link updated successfully"
  },
  fr: {
    // Notices
    "notices.saved": "\u2705 Param\xE8tres sauvegard\xE9s",
    "notices.error": "\u274C Erreur: {message}",
    "notices.success": "\u2705 Op\xE9ration r\xE9ussie",
    "notices.linkCreated": "\u2705 Lien court cr\xE9\xE9 avec succ\xE8s",
    "notices.urlRequired": "\u274C L'URL de destination est requise",
    "notices.linkDeleted": "\u2705 Lien court supprim\xE9 avec succ\xE8s",
    "notices.linkCopied": "\u2705 Lien court copi\xE9 dans le presse-papier",
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
    "modal.cancel": "Annuler",
    "modal.edit": "Modifier",
    "modal.delete": "Supprimer",
    "modal.editShortLink": "Modifier le lien court",
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
    "notices.domainsRefreshed": "\u2705 Liste des domaines actualis\xE9e",
    "dashboard.noSearchResults": "Aucun r\xE9sultat trouv\xE9",
    "dashboard.focusSearch": "Rechercher un lien",
    "notices.linkUpdated": "\u2705 Lien court modifi\xE9 avec succ\xE8s"
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

// obsidian-LinkFlowz/src/Hotkeys.ts
var import_obsidian6 = require("obsidian");

// obsidian-LinkFlowz/src/ShortLinkModal.ts
var import_obsidian3 = require("obsidian");

// obsidian-LinkFlowz/src/DomainValidations.ts
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

// obsidian-LinkFlowz/src/ShortLinkModal.ts
var CreateShortLinkModal = class extends import_obsidian3.Modal {
  constructor(app, plugin, settings, translations2, editData) {
    super(app);
    this.plugin = plugin;
    this.settings = settings;
    this.translations = translations2;
    this.url = "";
    this.slug = "";
    this.selectedDomain = "";
    this.anchor = "";
    this.domains = [];
    this.isEditing = false;
    this.editData = null;
    if (editData) {
      this.isEditing = true;
      this.editData = editData;
      this.url = editData.url;
      this.selectedDomain = editData.domain;
      this.slug = editData.key || "";
    }
  }
  async onOpen() {
    if (this.isEditing && this.editData) {
      try {
        const response = await (0, import_obsidian3.requestUrl)({
          url: `https://api.dub.co/links/${this.editData.id}`,
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.settings.dubApiKey}`,
            "Content-Type": "application/json"
          }
        });
        if (response.status === 200) {
          const linkDetails = response.json;
          this.url = linkDetails.url;
          this.selectedDomain = linkDetails.domain;
          this.slug = linkDetails.key || "";
          this.editData = {
            ...this.editData,
            ...linkDetails
          };
        }
      } catch (error) {
        console.error("Error fetching link details:", error);
        new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", "Failed to load link details"));
      }
    }
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
    contentEl.createEl("h2", {
      text: this.translations.t(this.isEditing ? "modal.editShortLink" : "modal.createShortLink")
    });
    new import_obsidian3.Setting(contentEl).setName(this.translations.t("modal.destinationUrl")).setDesc(this.translations.t("modal.destinationUrlDesc")).addText((text) => text.setValue(this.url).setPlaceholder("https://exemple.com/page-longue").onChange((value) => this.url = value));
    new import_obsidian3.Setting(contentEl).setName(this.translations.t("modal.anchor")).setDesc(this.translations.t("modal.anchorDesc")).addText((text) => text.setValue(this.anchor).setPlaceholder(this.translations.t("modal.anchorPlaceholder")).onChange((value) => this.anchor = value));
    new import_obsidian3.Setting(contentEl).setName(this.translations.t("modal.customSlug")).setDesc(this.translations.t("modal.customSlugDesc")).addText((text) => text.setValue(this.slug).setPlaceholder("mon-lien").onChange((value) => this.slug = value));
    const defaultDomain = this.selectedDomain || this.getDomainForCurrentFile();
    new import_obsidian3.Setting(contentEl).setName(this.translations.t("modal.domain")).setDesc(this.translations.t("modal.domainDesc")).addDropdown((dropdown) => {
      this.domains.forEach((domain) => {
        dropdown.addOption(domain, domain);
      });
      dropdown.setValue(defaultDomain);
      dropdown.onChange((value) => this.selectedDomain = value);
    });
    const buttonContainer = contentEl.createEl("div", { cls: "modal-button-container" });
    buttonContainer.createEl("button", {
      text: this.translations.t("modal.cancel")
    }).addEventListener("click", () => this.close());
    const submitButton = buttonContainer.createEl("button", {
      text: this.translations.t(this.isEditing ? "modal.edit" : "modal.create"),
      cls: "mod-cta"
    });
    submitButton.addEventListener("click", async () => {
      if (!this.url) {
        new import_obsidian3.Notice(this.translations.t("notices.urlRequired"));
        return;
      }
      if (this.isEditing) {
        await this.updateShortLink();
      } else {
        await this.createShortLink();
      }
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    const dashboardLeaf = this.plugin.app.workspace.getLeavesOfType("linkflowz-view")[0];
    if (dashboardLeaf == null ? void 0 : dashboardLeaf.view) {
      dashboardLeaf.view.refresh();
    }
  }
  getDomainForCurrentFile() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile)
      return this.domains[0] || "dub.sh";
    const filePath = activeFile.path;
    let bestMatch = { domain: this.domains[0] || "dub.sh", depth: -1 };
    if (this.settings.domainFolderMappings) {
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
    }
    return bestMatch.domain;
  }
  async createShortLink() {
    try {
      if (!this.url.startsWith("http://") && !this.url.startsWith("https://")) {
        this.url = "https://" + this.url;
      }
      if (!validateDomainUrl(this.selectedDomain, this.url, this.translations)) {
        return;
      }
      const payload = {
        url: this.url,
        domain: this.selectedDomain,
        ...this.slug && { key: this.slug },
        ...this.settings.dubWorkspaceId && { projectId: this.settings.dubWorkspaceId }
      };
      const response = await (0, import_obsidian3.requestUrl)({
        url: "https://api.dub.co/links",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.settings.dubApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (response.status === 200) {
        const shortLink = response.json.shortLink;
        const activeView = this.plugin.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
        if (activeView && !this.isEditing) {
          const editor = activeView.editor;
          const file = activeView.file;
          if (editor && file) {
            const linkText = this.anchor || this.url;
            const markdownLink = `[${linkText}](${shortLink})`;
            const cursor = editor.getCursor();
            editor.replaceRange(markdownLink, cursor);
          }
        }
        new import_obsidian3.Notice(this.translations.t("notices.linkCreated"));
        this.close();
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.error("Error creating link:", error);
      new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", error.message));
    }
  }
  async updateShortLink() {
    var _a;
    try {
      if (!((_a = this.editData) == null ? void 0 : _a.id)) {
        throw new Error("No link ID provided for update");
      }
      if (!this.url.startsWith("http://") && !this.url.startsWith("https://")) {
        this.url = "https://" + this.url;
      }
      const payload = {
        url: this.url,
        domain: this.selectedDomain,
        ...this.slug && { key: this.slug }
      };
      const response = await (0, import_obsidian3.requestUrl)({
        url: `https://api.dub.co/links/${this.editData.id}`,
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.settings.dubApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (response.status === 200) {
        new import_obsidian3.Notice(this.translations.t("notices.linkUpdated"));
        this.close();
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating link:", error);
      new import_obsidian3.Notice(this.translations.t("notices.error").replace("{message}", error.message));
    }
  }
};

// obsidian-LinkFlowz/src/Dashboard.ts
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
      await new Promise((resolve) => setTimeout(resolve, 200));
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
      new import_obsidian4.Notice(this.translations.t("notices.linkCopied"));
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
      menu.addItem((item) => item.setIcon("pencil").setTitle(this.translations.t("modal.edit")).onClick(() => {
        this.editLink(link);
      }));
      menu.addItem((item) => item.setIcon("trash").setTitle(this.translations.t("modal.delete")).onClick(async () => {
        await this.deleteLink(link.id);
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
  async deleteLink(linkId) {
    try {
      const settings = await Settings.loadSettings();
      if (!settings.dubApiKey) {
        throw new Error("API key required");
      }
      const response = await (0, import_obsidian5.requestUrl)({
        url: `https://api.dub.co/links/${linkId}`,
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${settings.dubApiKey}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status !== 200) {
        throw new Error(`API Error: ${response.status}`);
      }
      this.links = this.links.filter((link) => link.id !== linkId);
      const content = this.containerEl.querySelector(".linkflowz-links-list");
      if (content) {
        content.addClass("fade-out");
        await new Promise((resolve) => setTimeout(resolve, 300));
        content.empty();
        if (this.links.length === 0) {
          content.createEl("div", {
            cls: "linkflowz-empty-state",
            text: this.translations.t("dashboard.noLinks")
          });
        } else {
          this.links.forEach((link) => this.createLinkElement(content, link));
        }
        content.removeClass("fade-out");
      }
      new import_obsidian4.Notice(this.translations.t("notices.linkDeleted"));
    } catch (error) {
      console.error("Erreur lors de la suppression du lien:", error);
      new import_obsidian4.Notice(this.translations.t("notices.error").replace("{message}", error.message));
    }
  }
  async editLink(link) {
    const settings = await Settings.loadSettings();
    const modal = new CreateShortLinkModal(
      this.app,
      this.plugin,
      settings,
      this.translations,
      {
        url: link.url,
        id: link.id,
        domain: link.domain
      }
    );
    modal.onClose = async () => {
      await this.refresh();
    };
    modal.open();
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

// obsidian-LinkFlowz/src/Hotkeys.ts
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
            this.plugin.app.workspace.revealLeaf(leaf);
            setTimeout(() => {
              const searchInput = leaf.view.containerEl.querySelector(".linkflowz-search-input");
              if (searchInput) {
                searchInput.focus();
              }
            }, 100);
          }
          return true;
        }
        return false;
      },
      hotkeys: [{ modifiers: ["Ctrl"], key: "k" }]
    });
  }
};

// obsidian-LinkFlowz/src/ViewMode.ts
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

// obsidian-LinkFlowz/src/RegisterStyles.ts
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

    .linkflowz-modal .setting-item {
        border-top: none;
        padding: 0.75rem 0;
    }

    .linkflowz-modal .setting-item-info {
        font-size: 0.9em;
    }

    .linkflowz-modal .setting-item-control {
        flex-grow: 0.7;
    }

    .linkflowz-modal input[type="text"],
    .linkflowz-modal select {
        width: 100%;
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid var(--background-modifier-border);
        background-color: var(--background-primary);
        color: var(--text-normal);
    }

    .linkflowz-modal .modal-button-container {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--background-modifier-border);
    }

    .linkflowz-modal .modal-button-container button {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
        border: 1px solid var(--background-modifier-border);
        background-color: var(--background-primary);
        color: var(--text-normal);
    }

    .linkflowz-modal .modal-button-container button.mod-cta {
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
        border: none;
    }

    .linkflowz-modal .modal-button-container button:hover {
        background-color: var(--interactive-hover);
    }

    .linkflowz-modal .modal-button-container button.mod-cta:hover {
        background-color: var(--interactive-accent-hover);
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

// obsidian-LinkFlowz/src/main.ts
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL1NldHRpbmdzLnRzIiwgInNyYy9UcmFuc2xhdGlvbnMudHMiLCAic3JjL0hvdGtleXMudHMiLCAic3JjL1Nob3J0TGlua01vZGFsLnRzIiwgInNyYy9Eb21haW5WYWxpZGF0aW9ucy50cyIsICJzcmMvRGFzaGJvYXJkLnRzIiwgInNyYy9WaWV3TW9kZS50cyIsICJzcmMvUmVnaXN0ZXJTdHlsZXMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBsdWdpbiwgTWVudSwgTm90aWNlLCBXb3Jrc3BhY2VMZWFmLCBURmlsZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IFNldHRpbmdzLCBTZXR0aW5nc1RhYiwgREVGQVVMVF9TRVRUSU5HUywgRGVmYXVsdFNldHRpbmdzIH0gZnJvbSAnLi9TZXR0aW5ncyc7XG5pbXBvcnQgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL1RyYW5zbGF0aW9ucyc7XG5pbXBvcnQgeyBUVmlld01vZGUgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IEhvdGtleXMgfSBmcm9tICcuL0hvdGtleXMnO1xuaW1wb3J0IHsgVmlld01vZGUgfSBmcm9tICcuL1ZpZXdNb2RlJztcbmltcG9ydCB7IERhc2hib2FyZFZpZXcsIERhc2hib2FyZE1hbmFnZXIsIFZJRVdfVFlQRV9EQVNIQk9BUkQgfSBmcm9tICcuL0Rhc2hib2FyZCc7XG5pbXBvcnQgeyByZWdpc3RlclN0eWxlcywgdW5yZWdpc3RlclN0eWxlcyB9IGZyb20gJy4vUmVnaXN0ZXJTdHlsZXMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaW5rRmxvd3ogZXh0ZW5kcyBQbHVnaW4ge1xuICAgc2V0dGluZ3MhOiBEZWZhdWx0U2V0dGluZ3M7XG4gICBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zID0gbmV3IFRyYW5zbGF0aW9ucygpO1xuICAgcHJpdmF0ZSBob3RrZXlzITogSG90a2V5cztcbiAgIHByaXZhdGUgdmlld01vZGUhOiBWaWV3TW9kZTtcbiAgIHByaXZhdGUgZGFzaGJvYXJkTWFuYWdlciE6IERhc2hib2FyZE1hbmFnZXI7XG5cbiAgIGFzeW5jIG9ubG9hZCgpIHtcbiAgICAgIC8vIEluaXRpYWxpc2F0aW9uIGRlcyBwYXJhbVx1MDBFOHRyZXMgZXQgdHJhZHVjdGlvbnNcbiAgICAgIFNldHRpbmdzLmluaXRpYWxpemUodGhpcyk7XG4gICAgICBjb25zdCBzZXR0aW5ncyA9IGF3YWl0IFNldHRpbmdzLmxvYWRTZXR0aW5ncygpO1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgdGhpcy5sb2FkTGFuZ3VhZ2UoKTtcblxuICAgICAgLy8gRW5yZWdpc3RyZXIgbGVzIHN0eWxlcyBDU1NcbiAgICAgIHJlZ2lzdGVyU3R5bGVzKCk7XG5cbiAgICAgIC8vIEluaXRpYWxpc2F0aW9uIGRlcyBob3RrZXlzXG4gICAgICB0aGlzLmhvdGtleXMgPSBuZXcgSG90a2V5cyh0aGlzLCB0aGlzLnNldHRpbmdzLCB0aGlzLnRyYW5zbGF0aW9ucyk7XG4gICAgICB0aGlzLmhvdGtleXMucmVnaXN0ZXJIb3RrZXlzKCk7XG4gICAgICBcbiAgICAgIC8vIEF0dGVuZHJlIHF1ZSBsZSB3b3Jrc3BhY2Ugc29pdCBwclx1MDBFQXRcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbkxheW91dFJlYWR5KCgpID0+IHtcbiAgICAgICAgIC8vIEluaXRpYWxpc2F0aW9uIGRlIFZpZXdNb2RlXG4gICAgICAgICB0aGlzLnZpZXdNb2RlID0gbmV3IFZpZXdNb2RlKHRoaXMpO1xuXG4gICAgICAgICAvLyBFbnJlZ2lzdHJlbWVudCBkZSBsYSB2dWUgZGFzaGJvYXJkXG4gICAgICAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgICAgICAgIFZJRVdfVFlQRV9EQVNIQk9BUkQsXG4gICAgICAgICAgICAobGVhZikgPT4gbmV3IERhc2hib2FyZFZpZXcobGVhZiwgdGhpcywgdGhpcy50cmFuc2xhdGlvbnMpXG4gICAgICAgICApO1xuXG4gICAgICAgICAvLyBJbml0aWFsaXNhdGlvbiBkdSBkYXNoYm9hcmQgbWFuYWdlclxuICAgICAgICAgdGhpcy5kYXNoYm9hcmRNYW5hZ2VyID0gbmV3IERhc2hib2FyZE1hbmFnZXIodGhpcywgdGhpcy50cmFuc2xhdGlvbnMpO1xuXG4gICAgICAgICAvLyBBam91dCBkdSBib3V0b24gZGFucyBsYSBiYXJyZSBsYXRcdTAwRTlyYWxlIGF2ZWMgbWVudSBob3ZlclxuICAgICAgICAgY29uc3QgcmliYm9uSWNvbkVsID0gdGhpcy5hZGRSaWJib25JY29uKFxuICAgICAgICAgICAgJ2xheW91dC1kYXNoYm9hcmQnLFxuICAgICAgICAgICAgdGhpcy50cmFuc2xhdGlvbnMudCgnZGFzaGJvYXJkLnRpdGxlJyksXG4gICAgICAgICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbW9kZSA9IGF3YWl0IFNldHRpbmdzLmdldFZpZXdNb2RlKCk7XG4gICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnZpZXdNb2RlLnNldFZpZXcobW9kZSk7XG4gICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0xpbmtGbG93el0nLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKSk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICApO1xuXG4gICAgICAgICAvLyBNZW51IGhvdmVyXG4gICAgICAgICB0aGlzLnJlZ2lzdGVyRG9tRXZlbnQocmliYm9uSWNvbkVsLCAnbW91c2VlbnRlcicsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG4gICAgICAgICAgICBjb25zdCBjcmVhdGVNZW51SXRlbSA9ICh0aXRsZTogc3RyaW5nLCBpY29uOiBzdHJpbmcsIG1vZGU6IFRWaWV3TW9kZSkgPT4ge1xuICAgICAgICAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpdGVtLnNldFRpdGxlKHRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgLnNldEljb24oaWNvbilcbiAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnZpZXdNb2RlLnNldFZpZXcobW9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBjdXJyZW50TW9kZTogbW9kZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zdWNjZXNzJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tMaW5rRmxvd3pdJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNyZWF0ZU1lbnVJdGVtKHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC52aWV3TW9kZVRhYicpLCBcInRhYlwiLCBcInRhYlwiKTtcbiAgICAgICAgICAgIGNyZWF0ZU1lbnVJdGVtKHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC52aWV3TW9kZVNpZGViYXInKSwgXCJsYXlvdXQtc2lkZWJhci1yaWdodFwiLCBcInNpZGViYXJcIik7XG4gICAgICAgICAgICBjcmVhdGVNZW51SXRlbSh0aGlzLnRyYW5zbGF0aW9ucy50KCdkYXNoYm9hcmQudmlld01vZGVQb3B1cCcpLCBcImxheW91dC10b3BcIiwgXCJvdmVybGF5XCIpO1xuXG4gICAgICAgICAgICAvLyBQb3NpdGlvbm5lciBsZSBtZW51IGF1LWRlc3N1cyBkZSBsJ2ljXHUwMEY0bmVcbiAgICAgICAgICAgIGNvbnN0IHJlY3QgPSByaWJib25JY29uRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBtZW51LnNob3dBdFBvc2l0aW9uKHsgXG4gICAgICAgICAgICAgICB4OiByZWN0LmxlZnQsIFxuICAgICAgICAgICAgICAgeTogcmVjdC50b3BcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBHXHUwMEU5cmVyIGxhIGZlcm1ldHVyZSBkdSBtZW51XG4gICAgICAgICAgICBjb25zdCBjbG9zZU1lbnUgPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS5yZWxhdGVkVGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgICAgaWYgKCF0YXJnZXQ/LmNsb3Nlc3QoJy5tZW51JykgJiYgIXRhcmdldD8uY2xvc2VzdCgnLmNsaWNrYWJsZS1pY29uJykpIHtcbiAgICAgICAgICAgICAgICAgIG1lbnUuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgY2xvc2VNZW51KTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIGNsb3NlTWVudSk7XG4gICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBam91dCBkZSBsYSBwYWdlIGRlIHBhcmFtXHUwMEU4dHJlc1xuICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTZXR0aW5nc1RhYihcbiAgICAgICAgIHRoaXMuYXBwLFxuICAgICAgICAgdGhpcyxcbiAgICAgICAgIHNldHRpbmdzLFxuICAgICAgICAgdGhpcy50cmFuc2xhdGlvbnNcbiAgICAgICkpO1xuXG4gICAgICAvLyBcdTAwQzljb3V0ZXIgbGVzIG1vZGlmaWNhdGlvbnMgbWFudWVsbGVzIGRlcyBub3Rlc1xuICAgICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgICAgdGhpcy5hcHAudmF1bHQub24oJ21vZGlmeScsIGFzeW5jIChmaWxlOiBURmlsZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgU2V0dGluZ3MubG9hZFNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgoc2V0dGluZ3Mubm90ZXNGb2xkZXIpKSB7XG4gICAgICAgICAgICAgICAgICAvLyBSYWZyYVx1MDBFRWNoaXIgbGEgdnVlXG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXNoYm9hcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZGFzaGJvYXJkLnJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTGlua0Zsb3d6XSBFcnJldXIgbG9ycyBkdSByYWZyYVx1MDBFRWNoaXNzZW1lbnQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIHJlZ2lzdGVyU3R5bGVzKCk7XG4gICB9XG5cbiAgIHByaXZhdGUgbG9hZExhbmd1YWdlKCk6IHZvaWQge1xuICAgICAgY29uc3QgbG9jYWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lmxhbmc/LnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZnInKSA/ICdmcicgOiAnZW4nO1xuICAgICAgdGhpcy50cmFuc2xhdGlvbnMuc2V0TGFuZ3VhZ2UobG9jYWxlKTtcbiAgIH1cblxuICAgb251bmxvYWQoKSB7XG4gICAgICAvLyBTdXBwcmltZXIgbGVzIHN0eWxlc1xuICAgICAgdW5yZWdpc3RlclN0eWxlcygpO1xuICAgICAgXG4gICAgICAvLyBGZXJtZXIgbGEgdnVlIHNpIGVsbGUgZXN0IG91dmVydGVcbiAgICAgIGNvbnN0IGxlYWYgPSB0aGlzLmRhc2hib2FyZE1hbmFnZXI/LmdldEN1cnJlbnRMZWFmKCk7XG4gICAgICBpZiAobGVhZikge1xuICAgICAgICAgbGVhZi5kZXRhY2goKTtcbiAgICAgIH1cbiAgIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBQbHVnaW4sIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIE5vdGljZSwgcmVxdWVzdFVybCwgTWVudSwgVEZvbGRlciB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcblxuZXhwb3J0IGludGVyZmFjZSBEb21haW5Gb2xkZXJNYXBwaW5nIHtcbiAgIGRvbWFpbjogc3RyaW5nO1xuICAgZm9sZGVyOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVmYXVsdFNldHRpbmdzIHtcbiAgIGxhbmd1YWdlOiBzdHJpbmc7XG4gICBkdWJBcGlLZXk6IHN0cmluZztcbiAgIGR1YldvcmtzcGFjZUlkOiBzdHJpbmc7XG4gICBkb21haW5Gb2xkZXJNYXBwaW5nczogRG9tYWluRm9sZGVyTWFwcGluZ1tdO1xuICAgdmlld01vZGU6ICd0YWInIHwgJ3NpZGViYXInIHwgJ292ZXJsYXknO1xuICAgY2FjaGVkRG9tYWluczogc3RyaW5nW107XG4gICBsYXN0RG9tYWluc0ZldGNoOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBEZWZhdWx0U2V0dGluZ3MgPSB7XG4gICBsYW5ndWFnZTogJ2ZyJyxcbiAgIGR1YkFwaUtleTogJycsXG4gICBkdWJXb3Jrc3BhY2VJZDogJycsXG4gICBkb21haW5Gb2xkZXJNYXBwaW5nczogW10sXG4gICB2aWV3TW9kZTogJ3RhYicsXG4gICBjYWNoZWREb21haW5zOiBbXSxcbiAgIGxhc3REb21haW5zRmV0Y2g6IDBcbn07XG5cbmV4cG9ydCBjbGFzcyBTZXR0aW5ncyB7XG4gICBwcml2YXRlIHN0YXRpYyBwbHVnaW46IFBsdWdpbjtcbiAgIHByaXZhdGUgc3RhdGljIHNldHRpbmdzOiBEZWZhdWx0U2V0dGluZ3M7XG4gICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBDQUNIRV9EVVJBVElPTiA9IDI0ICogNjAgKiA2MCAqIDEwMDA7IC8vIDI0IGhldXJlcyBlbiBtaWxsaXNlY29uZGVzXG5cbiAgIHN0YXRpYyBpbml0aWFsaXplKHBsdWdpbjogUGx1Z2luKSB7XG4gICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgIH1cblxuICAgc3RhdGljIGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPERlZmF1bHRTZXR0aW5ncz4ge1xuICAgICAgY29uc3Qgc2F2ZWREYXRhID0gYXdhaXQgdGhpcy5wbHVnaW4ubG9hZERhdGEoKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBzYXZlZERhdGEgfHwge30pO1xuICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3M7XG4gICB9XG5cbiAgIHN0YXRpYyBhc3luYyBzYXZlU2V0dGluZ3Moc2V0dGluZ3M6IFBhcnRpYWw8RGVmYXVsdFNldHRpbmdzPikge1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24odGhpcy5zZXR0aW5ncyB8fCBERUZBVUxUX1NFVFRJTkdTLCBzZXR0aW5ncyk7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgIH1cblxuICAgc3RhdGljIGFzeW5jIGdldENhY2hlZERvbWFpbnMoYXBpS2V5OiBzdHJpbmcsIHdvcmtzcGFjZUlkPzogc3RyaW5nLCBmb3JjZVJlZnJlc2g6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICBjb25zdCBjYWNoZUFnZSA9IG5vdyAtIHRoaXMuc2V0dGluZ3MubGFzdERvbWFpbnNGZXRjaDtcblxuICAgICAgLy8gU2kgbGUgY2FjaGUgZXN0IHZhbGlkZSBldCBub24gdmlkZSwgZXQgcXUnb24gbmUgZm9yY2UgcGFzIGxlIHJhZnJhXHUwMEVFY2hpc3NlbWVudFxuICAgICAgaWYgKCFmb3JjZVJlZnJlc2ggJiYgY2FjaGVBZ2UgPCB0aGlzLkNBQ0hFX0RVUkFUSU9OICYmIHRoaXMuc2V0dGluZ3MuY2FjaGVkRG9tYWlucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICBjb25zb2xlLmxvZygnVXNpbmcgY2FjaGVkIGRvbWFpbnMnKTtcbiAgICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmNhY2hlZERvbWFpbnM7XG4gICAgICB9XG5cbiAgICAgIC8vIFNpbm9uLCByXHUwMEU5Y3VwXHUwMEU5cmVyIGxlcyBkb21haW5lcyBkZXB1aXMgbCdBUElcbiAgICAgIGNvbnNvbGUubG9nKCdDYWNoZSBleHBpcmVkIG9yIGVtcHR5IG9yIGZvcmNlIHJlZnJlc2ggcmVxdWVzdGVkLCBmZXRjaGluZyBmcmVzaCBkb21haW5zJyk7XG4gICAgICBjb25zdCBkb21haW5zID0gYXdhaXQgdGhpcy5mZXRjaERvbWFpbnMoYXBpS2V5LCB3b3Jrc3BhY2VJZCk7XG4gICAgICBcbiAgICAgIC8vIE1ldHRyZSBcdTAwRTAgam91ciBsZSBjYWNoZVxuICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3Moe1xuICAgICAgICAgY2FjaGVkRG9tYWluczogZG9tYWlucyxcbiAgICAgICAgIGxhc3REb21haW5zRmV0Y2g6IG5vd1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkb21haW5zO1xuICAgfVxuXG4gICBzdGF0aWMgYXN5bmMgZmV0Y2hEb21haW5zKGFwaUtleTogc3RyaW5nLCB3b3Jrc3BhY2VJZD86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgICBjb25zb2xlLmxvZygnRmV0Y2hpbmcgY3VzdG9tIGRvbWFpbnMuLi4nKTtcbiAgICAgICAgIFxuICAgICAgICAgLy8gUlx1MDBFOWN1cFx1MDBFOXJlciBkJ2Fib3JkIGxlcyBkb21haW5lcyBwZXJzb25uYWxpc1x1MDBFOXNcbiAgICAgICAgIGNvbnN0IGN1c3RvbURvbWFpbnNSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9hcGkuZHViLmNvL2RvbWFpbnMnLFxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke2FwaUtleX1gLFxuICAgICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG5cbiAgICAgICAgIC8vIFJcdTAwRTljdXBcdTAwRTlyZXIgbGVzIGRvbWFpbmVzIHBhciBkXHUwMEU5ZmF1dCBkaXNwb25pYmxlc1xuICAgICAgICAgY29uc29sZS5sb2coJ0ZldGNoaW5nIGRlZmF1bHQgZG9tYWlucy4uLicpO1xuICAgICAgICAgY29uc3QgZGVmYXVsdERvbWFpbnNSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9hcGkuZHViLmNvL2RvbWFpbnMvZGVmYXVsdCcsXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7YXBpS2V5fWAsXG4gICAgICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgICB9XG4gICAgICAgICB9KTtcblxuICAgICAgICAgbGV0IGRvbWFpbnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgIC8vIEFqb3V0ZXIgbGVzIGRvbWFpbmVzIHBlcnNvbm5hbGlzXHUwMEU5cyBzJ2lscyBleGlzdGVudFxuICAgICAgICAgaWYgKGN1c3RvbURvbWFpbnNSZXNwb25zZS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tRG9tYWlucyA9IEFycmF5LmlzQXJyYXkoY3VzdG9tRG9tYWluc1Jlc3BvbnNlLmpzb24pID8gY3VzdG9tRG9tYWluc1Jlc3BvbnNlLmpzb24gOiBbXTtcbiAgICAgICAgICAgIGRvbWFpbnMgPSBkb21haW5zLmNvbmNhdChjdXN0b21Eb21haW5zLm1hcCgoZG9tYWluOiBhbnkpID0+IGRvbWFpbi5zbHVnKSk7XG4gICAgICAgICB9XG5cbiAgICAgICAgIC8vIEFqb3V0ZXIgbGVzIGRvbWFpbmVzIHBhciBkXHUwMEU5ZmF1dFxuICAgICAgICAgaWYgKGRlZmF1bHREb21haW5zUmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIC8vIExhIHJcdTAwRTlwb25zZSBlc3QgZGlyZWN0ZW1lbnQgdW4gdGFibGVhdSBkZSBzdHJpbmdzIHBvdXIgbGVzIGRvbWFpbmVzIHBhciBkXHUwMEU5ZmF1dFxuICAgICAgICAgICAgY29uc3QgZGVmYXVsdERvbWFpbnMgPSBkZWZhdWx0RG9tYWluc1Jlc3BvbnNlLmpzb247XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkZWZhdWx0RG9tYWlucykpIHtcbiAgICAgICAgICAgICAgIGRvbWFpbnMgPSBkb21haW5zLmNvbmNhdChkZWZhdWx0RG9tYWlucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICB9XG5cbiAgICAgICAgIGNvbnNvbGUubG9nKCdBdmFpbGFibGUgZG9tYWluczonLCBkb21haW5zKTtcbiAgICAgICAgIHJldHVybiBkb21haW5zO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIGRvbWFpbnM6JywgZXJyb3IpO1xuICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGRldGFpbHM6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzdGFjazonLCBlcnJvci5zdGFjayk7XG4gICAgICAgICB9XG4gICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldHRpbmdzVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gICBzZXR0aW5nczogRGVmYXVsdFNldHRpbmdzO1xuICAgcHJpdmF0ZSBkb21haW5zOiBzdHJpbmdbXSA9IFsnZHViLnNoJ107XG5cbiAgIGNvbnN0cnVjdG9yKFxuICAgICAgYXBwOiBBcHAsIFxuICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbiwgXG4gICAgICBzZXR0aW5nczogRGVmYXVsdFNldHRpbmdzLFxuICAgICAgcHJpdmF0ZSB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9uc1xuICAgKSB7XG4gICAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICB9XG5cbiAgIGFzeW5jIGxvYWREb21haW5zKCkge1xuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5KSB7XG4gICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5kb21haW5zID0gYXdhaXQgU2V0dGluZ3MuZ2V0Q2FjaGVkRG9tYWlucyhcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5LFxuICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsIGVycm9yLm1lc3NhZ2UpKTtcbiAgICAgICAgIH1cbiAgICAgIH1cbiAgIH1cblxuICAgZGlzcGxheSgpIHtcbiAgICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgICAvLyBTZWN0aW9uIGR1Yi5jb1xuICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiAnZHViLmNvJyB9KTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAuc2V0TmFtZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kdWJBcGlLZXknKSlcbiAgICAgICAgIC5zZXREZXNjKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmR1YkFwaUtleURlc2MnKSlcbiAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdFbnRyZXogdm90cmUgY2xcdTAwRTkgQVBJJylcbiAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmR1YkFwaUtleSlcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5ID0gdmFsdWU7XG4gICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkdWJBcGlLZXk6IHZhbHVlIH0pO1xuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWREb21haW5zKCk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZHViV29ya3NwYWNlSWQnKSlcbiAgICAgICAgIC5zZXREZXNjKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkRGVzYycpKVxuICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ0VudHJleiB2b3RyZSBJRCBkZSB3b3Jrc3BhY2UnKVxuICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MuZHViV29ya3NwYWNlSWQpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmR1YldvcmtzcGFjZUlkID0gdmFsdWU7XG4gICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkdWJXb3Jrc3BhY2VJZDogdmFsdWUgfSk7XG4gICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5kdWJBcGlLZXkpIHtcbiAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZERvbWFpbnMoKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgLy8gQm91dG9uIGRlIHJhZnJhXHUwMEVFY2hpc3NlbWVudCBkZXMgZG9tYWluZXNcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MucmVmcmVzaERvbWFpbnMnKSlcbiAgICAgICAgIC5zZXREZXNjKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLnJlZnJlc2hEb21haW5zRGVzYycpKVxuICAgICAgICAgLmFkZEJ1dHRvbihidXR0b24gPT4gYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dCh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5yZWZyZXNoJykpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZHViQXBpS2V5KSB7XG4gICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCAnQVBJIGtleSByZXF1aXJlZCcpKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIC8vIEZvcmNlciBsZSByYWZyYVx1MDBFRWNoaXNzZW1lbnQgZW4gaW52YWxpZGFudCBsZSBjYWNoZVxuICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgbGFzdERvbWFpbnNGZXRjaDogMCB9KTtcbiAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZERvbWFpbnMoKTtcbiAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5kb21haW5zUmVmcmVzaGVkJykpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAvLyBTZWN0aW9uIE1hcHBhZ2VzIERvbWFpbmUtRG9zc2llclxuICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncycpIH0pO1xuICAgICAgXG4gICAgICAvLyBMaWduZSBkZSBkZXNjcmlwdGlvbiBhdmVjIGxlIGJvdXRvbiBkJ2Fqb3V0XG4gICAgICBjb25zdCBkZXNjcmlwdGlvbkxpbmUgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgIC5zZXROYW1lKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzRGVzYycpKVxuICAgICAgICAgLmFkZEJ1dHRvbihidXR0b24gPT4gYnV0dG9uXG4gICAgICAgICAgICAuc2V0SWNvbigncGx1cycpXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dCh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5hZGRNYXBwaW5nJykpXG4gICAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICBkb21haW46IHRoaXMuZG9tYWluc1swXSxcbiAgICAgICAgICAgICAgICAgIGZvbGRlcjogJydcbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZG9tYWluRm9sZGVyTWFwcGluZ3M6IHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MgfSk7XG4gICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgIFxuICAgICAgZGVzY3JpcHRpb25MaW5lLnNldHRpbmdFbC5hZGRDbGFzcygnZGVzY3JpcHRpb24td2l0aC1idXR0b24nKTtcblxuICAgICAgLy8gQ29udGVuZXVyIHBvdXIgbGVzIG1hcHBhZ2VzIGV4aXN0YW50c1xuICAgICAgY29uc3QgbWFwcGluZ3NDb250YWluZXIgPSBjb250YWluZXJFbC5jcmVhdGVFbCgnZGl2Jyk7XG4gICAgICBcbiAgICAgIC8vIEZvbmN0aW9uIHBvdXIgY3JcdTAwRTllciB1biBub3V2ZWF1IG1hcHBpbmdcbiAgICAgIGNvbnN0IGNyZWF0ZU1hcHBpbmdFbGVtZW50ID0gKG1hcHBpbmc6IERvbWFpbkZvbGRlck1hcHBpbmcsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgIGNvbnN0IG1hcHBpbmdEaXYgPSBtYXBwaW5nc0NvbnRhaW5lci5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdtYXBwaW5nLWNvbnRhaW5lcicgfSk7XG4gICAgICAgICBcbiAgICAgICAgIC8vIENvbnRlbmV1ciBwb3VyIGxhIGxpZ25lIGRlIG1hcHBpbmdcbiAgICAgICAgIGNvbnN0IG1hcHBpbmdMaW5lID0gbmV3IFNldHRpbmcobWFwcGluZ0RpdilcbiAgICAgICAgICAgIC5zZXRDbGFzcygnY29tcGFjdC1zZXR0aW5nJylcbiAgICAgICAgICAgIC8vIExhYmVsIFwiRG9tYWluZVwiXG4gICAgICAgICAgICAuYWRkVGV4dCh0ZXh0ID0+IHtcbiAgICAgICAgICAgICAgIHRleHQuaW5wdXRFbC5hZGRDbGFzcygnbGFiZWwtdGV4dCcpO1xuICAgICAgICAgICAgICAgdGV4dC5zZXRWYWx1ZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5kb21haW4nKSk7XG4gICAgICAgICAgICAgICB0ZXh0LnNldERpc2FibGVkKHRydWUpO1xuICAgICAgICAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLy8gRHJvcGRvd24gZGVzIGRvbWFpbmVzXG4gICAgICAgICAgICAuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4ge1xuICAgICAgICAgICAgICAgdGhpcy5kb21haW5zLmZvckVhY2goZG9tYWluID0+IHtcbiAgICAgICAgICAgICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbihkb21haW4sIGRvbWFpbik7XG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgIGRyb3Bkb3duLnNldFZhbHVlKG1hcHBpbmcuZG9tYWluKTtcbiAgICAgICAgICAgICAgIGRyb3Bkb3duLm9uQ2hhbmdlKHZhbHVlID0+IHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3NbaW5kZXhdLmRvbWFpbiA9IHZhbHVlO1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICBkcm9wZG93bi5zZWxlY3RFbC5hZGRDbGFzcygnZG9tYWluLWRyb3Bkb3duJyk7XG4gICAgICAgICAgICAgICByZXR1cm4gZHJvcGRvd247XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLy8gQ2hhbXAgZGUgc2Fpc2llIGR1IGRvc3NpZXIgYXZlYyBzb24gbGFiZWxcbiAgICAgICAgICAgIC5hZGRCdXR0b24oYnV0dG9uID0+IGJ1dHRvblxuICAgICAgICAgICAgICAgLnNldEJ1dHRvblRleHQobWFwcGluZy5mb2xkZXIgfHwgdGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZm9sZGVyJykpXG4gICAgICAgICAgICAgICAub25DbGljaygoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy8gQ3JcdTAwRTllciBsZSBtZW51IGRlIHNcdTAwRTlsZWN0aW9uIHByaW5jaXBhbFxuICAgICAgICAgICAgICAgICAgY29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIC8vIENvbnN0cnVpcmUgbGEgaGlcdTAwRTlyYXJjaGllIGRlcyBkb3NzaWVycyBcdTAwRTAgcGFydGlyIGRlIGxhIHJhY2luZVxuICAgICAgICAgICAgICAgICAgdGhpcy5idWlsZEZvbGRlck1lbnUobWVudSwgdGhpcy5hcHAudmF1bHQuZ2V0Um9vdCgpLCBpbmRleCk7XG5cbiAgICAgICAgICAgICAgICAgIC8vIEFmZmljaGVyIGxlIG1lbnUgXHUwMEUwIGxhIHBvc2l0aW9uIGR1IGNsaWNcbiAgICAgICAgICAgICAgICAgIG1lbnUuc2hvd0F0TW91c2VFdmVudChlKTtcbiAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgLy8gQm91dG9ucyBkJ2FjdGlvblxuICAgICAgICAgICAgLmFkZEJ1dHRvbihidXR0b24gPT4gYnV0dG9uXG4gICAgICAgICAgICAgICAuc2V0SWNvbignY2hlY2ttYXJrJylcbiAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLnNhdmUnKSlcbiAgICAgICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZG9tYWluRm9sZGVyTWFwcGluZ3M6IHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MgfSk7XG4gICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIC5hZGRCdXR0b24oYnV0dG9uID0+IGJ1dHRvblxuICAgICAgICAgICAgICAgLnNldEljb24oJ3RyYXNoJylcbiAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLnJlbW92ZScpKVxuICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgZG9tYWluRm9sZGVyTWFwcGluZ3M6IHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MgfSk7XG4gICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuc2F2ZWQnKSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgLy8gQWpvdXRlciBkZXMgc3R5bGVzIHBvdXIgYWxpZ25lciBsZXMgXHUwMEU5bFx1MDBFOW1lbnRzXG4gICAgICAgICBtYXBwaW5nTGluZS5zZXR0aW5nRWwuYWRkQ2xhc3MoJ21hcHBpbmctbGluZScpO1xuICAgICAgfTtcblxuICAgICAgLy8gQWZmaWNoZXIgbGVzIG1hcHBhZ2VzIGV4aXN0YW50c1xuICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncy5mb3JFYWNoKChtYXBwaW5nLCBpbmRleCkgPT4ge1xuICAgICAgICAgY3JlYXRlTWFwcGluZ0VsZW1lbnQobWFwcGluZywgaW5kZXgpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFNlY3Rpb24gTW9kZSBkJ2FmZmljaGFnZVxuICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy52aWV3TW9kZScpIH0pO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgIC5zZXROYW1lKHRoaXMudHJhbnNsYXRpb25zLnQoJ3NldHRpbmdzLmRlZmF1bHRWaWV3TW9kZScpKVxuICAgICAgICAgLnNldERlc2ModGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlRGVzYycpKVxuICAgICAgICAgLmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IGRyb3Bkb3duXG4gICAgICAgICAgICAuYWRkT3B0aW9uKCd0YWInLCB0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy50YWInKSlcbiAgICAgICAgICAgIC5hZGRPcHRpb24oJ3NpZGViYXInLCB0aGlzLnRyYW5zbGF0aW9ucy50KCdzZXR0aW5ncy5zaWRlYmFyJykpXG4gICAgICAgICAgICAuYWRkT3B0aW9uKCdvdmVybGF5JywgdGhpcy50cmFuc2xhdGlvbnMudCgnc2V0dGluZ3Mub3ZlcmxheScpKVxuICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3Mudmlld01vZGUpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlOiAndGFiJyB8ICdzaWRlYmFyJyB8ICdvdmVybGF5JykgPT4ge1xuICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy52aWV3TW9kZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgYXdhaXQgU2V0dGluZ3Muc2F2ZVNldHRpbmdzKHsgdmlld01vZGU6IHZhbHVlIH0pO1xuICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLnNhdmVkJykpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAvLyBDaGFyZ2VyIGxlcyBkb21haW5lcyBhdSBkXHUwMEU5bWFycmFnZSBzaSB1bmUgY2xcdTAwRTkgQVBJIGVzdCBwclx1MDBFOXNlbnRlXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5kdWJBcGlLZXkgJiYgdGhpcy5kb21haW5zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgdGhpcy5sb2FkRG9tYWlucygpO1xuICAgICAgfVxuICAgfVxuXG4gICAvLyBDb25zdHJ1aXJlIGxlIG1lbnUgaGlcdTAwRTlyYXJjaGlxdWUgZGVzIGRvc3NpZXJzXG4gICBwcml2YXRlIGJ1aWxkRm9sZGVyTWVudShtZW51OiBNZW51LCBmb2xkZXI6IFRGb2xkZXIsIG1hcHBpbmdJbmRleDogbnVtYmVyLCBsZXZlbDogbnVtYmVyID0gMCkge1xuICAgICAgY29uc3Qgc3ViRm9sZGVycyA9IGZvbGRlci5jaGlsZHJlbi5maWx0ZXIoKGNoaWxkKTogY2hpbGQgaXMgVEZvbGRlciA9PiBjaGlsZCBpbnN0YW5jZW9mIFRGb2xkZXIpO1xuICAgICAgXG4gICAgICBzdWJGb2xkZXJzLmZvckVhY2goc3ViRm9sZGVyID0+IHtcbiAgICAgICAgIGNvbnN0IGhhc0NoaWxkcmVuID0gc3ViRm9sZGVyLmNoaWxkcmVuLnNvbWUoY2hpbGQgPT4gY2hpbGQgaW5zdGFuY2VvZiBURm9sZGVyKTtcbiAgICAgICAgIFxuICAgICAgICAgaWYgKGhhc0NoaWxkcmVuKSB7XG4gICAgICAgICAgICAvLyBQb3VyIGxlcyBkb3NzaWVycyBhdmVjIGRlcyBlbmZhbnRzLCBjclx1MDBFOWVyIHVuIHNvdXMtbWVudVxuICAgICAgICAgICAgbWVudS5hZGRJdGVtKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgY29uc3QgdGl0bGVFbCA9IGNyZWF0ZVNwYW4oeyBjbHM6ICdtZW51LWl0ZW0tdGl0bGUnIH0pO1xuICAgICAgICAgICAgICAgdGl0bGVFbC5hcHBlbmRUZXh0KHN1YkZvbGRlci5uYW1lKTtcbiAgICAgICAgICAgICAgIHRpdGxlRWwuYXBwZW5kQ2hpbGQoY3JlYXRlU3Bhbih7IGNsczogJ21lbnUtaXRlbS1hcnJvdycsIHRleHQ6ICcgXHUyMTkyJyB9KSk7XG5cbiAgICAgICAgICAgICAgIGl0ZW0uZG9tLnF1ZXJ5U2VsZWN0b3IoJy5tZW51LWl0ZW0tdGl0bGUnKT8ucmVwbGFjZVdpdGgodGl0bGVFbCk7XG4gICAgICAgICAgICAgICBpdGVtLnNldEljb24oJ2ZvbGRlcicpO1xuXG4gICAgICAgICAgICAgICAvLyBDclx1MDBFOWVyIGxlIHNvdXMtbWVudVxuICAgICAgICAgICAgICAgY29uc3Qgc3ViTWVudSA9IG5ldyBNZW51KCk7XG4gICAgICAgICAgICAgICB0aGlzLmJ1aWxkRm9sZGVyTWVudShzdWJNZW51LCBzdWJGb2xkZXIsIG1hcHBpbmdJbmRleCwgbGV2ZWwgKyAxKTtcblxuICAgICAgICAgICAgICAgLy8gQ29uZmlndXJlciBsJ1x1MDBFOXZcdTAwRTluZW1lbnQgZGUgc3Vydm9sXG4gICAgICAgICAgICAgICBjb25zdCBpdGVtRG9tID0gKGl0ZW0gYXMgYW55KS5kb20gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICAgICBpZiAoaXRlbURvbSkge1xuICAgICAgICAgICAgICAgICAgbGV0IGlzT3Zlckl0ZW0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGxldCBpc092ZXJNZW51ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBsZXQgaGlkZVRpbWVvdXQ6IE5vZGVKUy5UaW1lb3V0O1xuXG4gICAgICAgICAgICAgICAgICBjb25zdCBzaG93U3ViTWVudSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlY3QgPSBpdGVtRG9tLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgc3ViTWVudS5zaG93QXRQb3NpdGlvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICB4OiByZWN0LnJpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcmVjdC50b3BcbiAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgY29uc3QgaGlkZVN1Yk1lbnUgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICBoaWRlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc092ZXJJdGVtICYmICFpc092ZXJNZW51KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJNZW51LmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICBpdGVtRG9tLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICBpc092ZXJJdGVtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgIGlmIChoaWRlVGltZW91dCkgY2xlYXJUaW1lb3V0KGhpZGVUaW1lb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgIHNob3dTdWJNZW51KCk7XG4gICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgaXRlbURvbS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgaXNPdmVySXRlbSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgaGlkZVN1Yk1lbnUoKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAvLyBHXHUwMEU5cmVyIGxlIHN1cnZvbCBkdSBzb3VzLW1lbnUgbHVpLW1cdTAwRUFtZVxuICAgICAgICAgICAgICAgICAgY29uc3Qgc3ViTWVudUVsID0gKHN1Yk1lbnUgYXMgYW55KS5kb207XG4gICAgICAgICAgICAgICAgICBpZiAoc3ViTWVudUVsKSB7XG4gICAgICAgICAgICAgICAgICAgICBzdWJNZW51RWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzT3Zlck1lbnUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhpZGVUaW1lb3V0KSBjbGVhclRpbWVvdXQoaGlkZVRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgIHN1Yk1lbnVFbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNPdmVyTWVudSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGlkZVN1Yk1lbnUoKTtcbiAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBBam91dGVyIFx1MDBFOWdhbGVtZW50IHVuIGdlc3Rpb25uYWlyZSBkZSBjbGljIHBvdXIgbGUgZG9zc2llciBwYXJlbnRcbiAgICAgICAgICAgICAgIGl0ZW0ub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzW21hcHBpbmdJbmRleF0uZm9sZGVyID0gc3ViRm9sZGVyLnBhdGg7XG4gICAgICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkb21haW5Gb2xkZXJNYXBwaW5nczogdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncyB9KTtcbiAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zYXZlZCcpKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBQb3VyIGxlcyBkb3NzaWVycyBzYW5zIGVuZmFudHMsIGFqb3V0ZXIgc2ltcGxlbWVudCB1biBcdTAwRTlsXHUwMEU5bWVudCBkZSBtZW51XG4gICAgICAgICAgICBtZW51LmFkZEl0ZW0oaXRlbSA9PiB7XG4gICAgICAgICAgICAgICBpdGVtLnNldFRpdGxlKHN1YkZvbGRlci5uYW1lKVxuICAgICAgICAgICAgICAgICAgLnNldEljb24oJ2ZvbGRlcicpXG4gICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzW21hcHBpbmdJbmRleF0uZm9sZGVyID0gc3ViRm9sZGVyLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBkb21haW5Gb2xkZXJNYXBwaW5nczogdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncyB9KTtcbiAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5zYXZlZCcpKTtcbiAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgIH1cbiAgICAgIH0pO1xuICAgfVxufSIsICJleHBvcnQgdHlwZSBUcmFuc2xhdGlvbktleSA9IFxyXG4gICAvLyBOb3RpY2VzXHJcbiAgIHwgJ25vdGljZXMuc2F2ZWQnXHJcbiAgIHwgJ25vdGljZXMuZXJyb3InXHJcbiAgIHwgJ25vdGljZXMuc3VjY2VzcydcclxuICAgfCAnbm90aWNlcy5saW5rQ3JlYXRlZCdcclxuICAgfCAnbm90aWNlcy51cmxSZXF1aXJlZCdcclxuICAgfCAnbm90aWNlcy5saW5rRGVsZXRlZCdcclxuICAgfCAnbm90aWNlcy5saW5rQ29waWVkJ1xyXG4gICAvLyBNb2RhbFxyXG4gICB8ICdtb2RhbC5jcmVhdGVTaG9ydExpbmsnXHJcbiAgIHwgJ21vZGFsLmRlc3RpbmF0aW9uVXJsJ1xyXG4gICB8ICdtb2RhbC5kZXN0aW5hdGlvblVybERlc2MnXHJcbiAgIHwgJ21vZGFsLmFuY2hvcidcclxuICAgfCAnbW9kYWwuYW5jaG9yRGVzYydcclxuICAgfCAnbW9kYWwuYW5jaG9yUGxhY2Vob2xkZXInXHJcbiAgIHwgJ21vZGFsLmN1c3RvbVNsdWcnXHJcbiAgIHwgJ21vZGFsLmN1c3RvbVNsdWdEZXNjJ1xyXG4gICB8ICdtb2RhbC5kb21haW4nXHJcbiAgIHwgJ21vZGFsLmRvbWFpbkRlc2MnXHJcbiAgIHwgJ21vZGFsLmNyZWF0ZSdcclxuICAgfCAnbW9kYWwuY2FuY2VsJ1xyXG4gICB8ICdtb2RhbC5lZGl0J1xyXG4gICB8ICdtb2RhbC5kZWxldGUnXHJcbiAgIHwgJ21vZGFsLmVkaXRTaG9ydExpbmsnXHJcbiAgIC8vIFNldHRpbmdzIGR1Yi5jb1xyXG4gICB8ICdzZXR0aW5ncy5kdWJBcGlLZXknXHJcbiAgIHwgJ3NldHRpbmdzLmR1YkFwaUtleURlc2MnXHJcbiAgIHwgJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkJ1xyXG4gICB8ICdzZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZERlc2MnXHJcbiAgIHwgJ3NldHRpbmdzLmR1YkN1c3RvbURvbWFpbnMnXHJcbiAgIHwgJ3NldHRpbmdzLmR1YkN1c3RvbURvbWFpbnNEZXNjJ1xyXG4gICB8ICdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncydcclxuICAgfCAnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3NEZXNjJ1xyXG4gICB8ICdzZXR0aW5ncy5hZGRNYXBwaW5nJ1xyXG4gICB8ICdzZXR0aW5ncy5kb21haW4nXHJcbiAgIHwgJ3NldHRpbmdzLmZvbGRlcidcclxuICAgfCAnc2V0dGluZ3MucmVtb3ZlJ1xyXG4gICAvLyBTZXR0aW5ncyBWaWV3TW9kZVxyXG4gICB8ICdzZXR0aW5ncy52aWV3TW9kZSdcclxuICAgfCAnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlJ1xyXG4gICB8ICdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGVEZXNjJ1xyXG4gICB8ICdzZXR0aW5ncy50YWInXHJcbiAgIHwgJ3NldHRpbmdzLnNpZGViYXInXHJcbiAgIHwgJ3NldHRpbmdzLm92ZXJsYXknXHJcbiAgIC8vIERhc2hib2FyZFxyXG4gICB8ICdkYXNoYm9hcmQudGl0bGUnXHJcbiAgIHwgJ2Rhc2hib2FyZC5ub0xpbmtzJ1xyXG4gICB8ICdkYXNoYm9hcmQubG9hZGluZydcclxuICAgfCAnZGFzaGJvYXJkLmVycm9yJ1xyXG4gICB8ICdkYXNoYm9hcmQucmVmcmVzaCdcclxuICAgfCAnZGFzaGJvYXJkLnZpZXdNb2RlVGFiJ1xyXG4gICB8ICdkYXNoYm9hcmQudmlld01vZGVTaWRlYmFyJ1xyXG4gICB8ICdkYXNoYm9hcmQudmlld01vZGVQb3B1cCdcclxuICAgfCAnc2V0dGluZ3MuZG9tYWluQW5kRm9sZGVyJ1xyXG4gICB8ICdzZXR0aW5ncy5mb2xkZXJQbGFjZWhvbGRlcidcclxuICAgfCAnc2V0dGluZ3Muc2F2ZSdcclxuICAgfCAnc2V0dGluZ3MucmVmcmVzaERvbWFpbnMnXHJcbiAgIHwgJ3NldHRpbmdzLnJlZnJlc2hEb21haW5zRGVzYydcclxuICAgfCAnc2V0dGluZ3MucmVmcmVzaCdcclxuICAgfCAnbm90aWNlcy5kb21haW5zUmVmcmVzaGVkJ1xyXG4gICB8ICdkYXNoYm9hcmQubm9TZWFyY2hSZXN1bHRzJ1xyXG4gICB8ICdkYXNoYm9hcmQuZm9jdXNTZWFyY2gnXHJcbiAgIHwgJ25vdGljZXMubGlua1VwZGF0ZWQnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHRyYW5zbGF0aW9uczogeyBbbGFuZzogc3RyaW5nXTogUmVjb3JkPFRyYW5zbGF0aW9uS2V5LCBzdHJpbmc+IH0gPSB7XHJcbiAgIGVuOiB7XHJcbiAgICAgIC8vIE5vdGljZXNcclxuICAgICAgJ25vdGljZXMuc2F2ZWQnOiAnXHUyNzA1IFNldHRpbmdzIHNhdmVkJyxcclxuICAgICAgJ25vdGljZXMuZXJyb3InOiAnXHUyNzRDIEVycm9yOiB7bWVzc2FnZX0nLFxyXG4gICAgICAnbm90aWNlcy5zdWNjZXNzJzogJ1x1MjcwNSBPcGVyYXRpb24gc3VjY2Vzc2Z1bCcsXHJcbiAgICAgICdub3RpY2VzLmxpbmtDcmVhdGVkJzogJ1x1MjcwNSBTaG9ydCBsaW5rIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgJ25vdGljZXMudXJsUmVxdWlyZWQnOiAnXHUyNzRDIERlc3RpbmF0aW9uIFVSTCBpcyByZXF1aXJlZCcsXHJcbiAgICAgICdub3RpY2VzLmxpbmtEZWxldGVkJzogJ1x1MjcwNSBTaG9ydCBsaW5rIGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgJ25vdGljZXMubGlua0NvcGllZCc6ICdcdTI3MDUgU2hvcnQgbGluayBjb3BpZWQgdG8gY2xpcGJvYXJkJyxcclxuICAgICAgLy8gTW9kYWxcclxuICAgICAgJ21vZGFsLmNyZWF0ZVNob3J0TGluayc6ICdDcmVhdGUgU2hvcnQgTGluaycsXHJcbiAgICAgICdtb2RhbC5kZXN0aW5hdGlvblVybCc6ICdEZXN0aW5hdGlvbiBVUkwnLFxyXG4gICAgICAnbW9kYWwuZGVzdGluYXRpb25VcmxEZXNjJzogJ1RoZSBVUkwgeW91IHdhbnQgdG8gc2hvcnRlbicsXHJcbiAgICAgICdtb2RhbC5hbmNob3InOiAnTGluayBUZXh0JyxcclxuICAgICAgJ21vZGFsLmFuY2hvckRlc2MnOiAnVGhlIHRleHQgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBmb3IgdGhlIGxpbmsnLFxyXG4gICAgICAnbW9kYWwuYW5jaG9yUGxhY2Vob2xkZXInOiAnQ2xpY2sgaGVyZScsXHJcbiAgICAgICdtb2RhbC5jdXN0b21TbHVnJzogJ0N1c3RvbSBTbHVnJyxcclxuICAgICAgJ21vZGFsLmN1c3RvbVNsdWdEZXNjJzogJ0N1c3RvbSBwYXJ0IG9mIHRoZSBzaG9ydCBVUkwgKG9wdGlvbmFsKScsXHJcbiAgICAgICdtb2RhbC5kb21haW4nOiAnRG9tYWluJyxcclxuICAgICAgJ21vZGFsLmRvbWFpbkRlc2MnOiAnQ2hvb3NlIHRoZSBkb21haW4gZm9yIHlvdXIgc2hvcnQgbGluaycsXHJcbiAgICAgICdtb2RhbC5jcmVhdGUnOiAnQ3JlYXRlJyxcclxuICAgICAgJ21vZGFsLmNhbmNlbCc6ICdDYW5jZWwnLFxyXG4gICAgICAnbW9kYWwuZWRpdCc6ICdFZGl0JyxcclxuICAgICAgJ21vZGFsLmRlbGV0ZSc6ICdEZWxldGUnLFxyXG4gICAgICAnbW9kYWwuZWRpdFNob3J0TGluayc6ICdFZGl0IFNob3J0IExpbmsnLFxyXG4gICAgICAvLyBTZXR0aW5ncyBkdWIuY29cclxuICAgICAgJ3NldHRpbmdzLmR1YkFwaUtleSc6ICdkdWIuY28gQVBJIEtleScsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJBcGlLZXlEZXNjJzogJ1lvdXIgZHViLmNvIEFQSSBrZXkgZm9yIGF1dGhlbnRpY2F0aW9uJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkJzogJ2R1Yi5jbyBXb3Jrc3BhY2UgSUQnLFxyXG4gICAgICAnc2V0dGluZ3MuZHViV29ya3NwYWNlSWREZXNjJzogJ09wdGlvbmFsOiBUaGUgSUQgb2YgdGhlIHdvcmtzcGFjZSB3aGVyZSB5b3Ugd2FudCB0byBjcmVhdGUgbGlua3MgKGZvdW5kIGluIHRoZSBVUkw6IGFwcC5kdWIuY28vW3dvcmtzcGFjZS1pZF0pLiBJZiBub3Qgc2V0LCBsaW5rcyB3aWxsIGJlIGNyZWF0ZWQgaW4geW91ciBkZWZhdWx0IHdvcmtzcGFjZS4nLFxyXG4gICAgICAnc2V0dGluZ3MuZHViQ3VzdG9tRG9tYWlucyc6ICdDdXN0b20gRG9tYWlucycsXHJcbiAgICAgICdzZXR0aW5ncy5kdWJDdXN0b21Eb21haW5zRGVzYyc6ICdMaXN0IG9mIHlvdXIgY3VzdG9tIGRvbWFpbnMgKG9uZSBwZXIgbGluZSknLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MnOiAnRG9tYWluLUZvbGRlciBNYXBwaW5ncycsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5nc0Rlc2MnOiAnQ29uZmlndXJlIHdoaWNoIGRvbWFpbiB0byB1c2UgZm9yIGVhY2ggZm9sZGVyJyxcclxuICAgICAgJ3NldHRpbmdzLmFkZE1hcHBpbmcnOiAnQWRkIE5ldyBNYXBwaW5nJyxcclxuICAgICAgJ3NldHRpbmdzLmRvbWFpbic6ICdEb21haW4nLFxyXG4gICAgICAnc2V0dGluZ3MuZm9sZGVyJzogJ0ZvbGRlcicsXHJcbiAgICAgICdzZXR0aW5ncy5yZW1vdmUnOiAnUmVtb3ZlJyxcclxuICAgICAgLy8gU2V0dGluZ3MgVmlld01vZGVcclxuICAgICAgJ3NldHRpbmdzLnZpZXdNb2RlJzogJ1ZpZXcgTW9kZScsXHJcbiAgICAgICdzZXR0aW5ncy5kZWZhdWx0Vmlld01vZGUnOiAnRGVmYXVsdCBWaWV3IE1vZGUnLFxyXG4gICAgICAnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlRGVzYyc6ICdDaG9vc2UgaG93IHRoZSBsaW5rIGRldGFpbHMgd2lsbCBiZSBkaXNwbGF5ZWQnLFxyXG4gICAgICAnc2V0dGluZ3MudGFiJzogJ05ldyBUYWInLFxyXG4gICAgICAnc2V0dGluZ3Muc2lkZWJhcic6ICdSaWdodCBTaWRlYmFyJyxcclxuICAgICAgJ3NldHRpbmdzLm92ZXJsYXknOiAnT3ZlcmxheScsXHJcbiAgICAgIC8vIERhc2hib2FyZFxyXG4gICAgICAnZGFzaGJvYXJkLnRpdGxlJzogJ0xpbmtGbG93eiBEYXNoYm9hcmQnLFxyXG4gICAgICAnZGFzaGJvYXJkLm5vTGlua3MnOiAnTm8gc2hvcnQgbGlua3MgY3JlYXRlZCB5ZXQnLFxyXG4gICAgICAnZGFzaGJvYXJkLmxvYWRpbmcnOiAnTG9hZGluZyB5b3VyIGxpbmtzLi4uJyxcclxuICAgICAgJ2Rhc2hib2FyZC5lcnJvcic6ICdFcnJvciBsb2FkaW5nIGxpbmtzOiB7bWVzc2FnZX0nLFxyXG4gICAgICAnZGFzaGJvYXJkLnJlZnJlc2gnOiAnUmVmcmVzaCcsXHJcbiAgICAgICdkYXNoYm9hcmQudmlld01vZGVUYWInOiAnT3BlbiBpbiBUYWInLFxyXG4gICAgICAnZGFzaGJvYXJkLnZpZXdNb2RlU2lkZWJhcic6ICdPcGVuIGluIFNpZGViYXInLFxyXG4gICAgICAnZGFzaGJvYXJkLnZpZXdNb2RlUG9wdXAnOiAnT3BlbiBhcyBQb3B1cCcsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5BbmRGb2xkZXInOiAnRG9tYWluIGFuZCBGb2xkZXIgTWFwcGluZycsXHJcbiAgICAgICdzZXR0aW5ncy5mb2xkZXJQbGFjZWhvbGRlcic6ICdGb2xkZXInLFxyXG4gICAgICAnc2V0dGluZ3Muc2F2ZSc6ICdTYXZlJyxcclxuICAgICAgJ3NldHRpbmdzLnJlZnJlc2hEb21haW5zJzogJ1JlZnJlc2ggRG9tYWlucycsXHJcbiAgICAgICdzZXR0aW5ncy5yZWZyZXNoRG9tYWluc0Rlc2MnOiAnUmVmcmVzaCB0aGUgbGlzdCBvZiBhdmFpbGFibGUgZG9tYWlucyBmcm9tIGR1Yi5jbycsXHJcbiAgICAgICdzZXR0aW5ncy5yZWZyZXNoJzogJ1JlZnJlc2gnLFxyXG4gICAgICAnbm90aWNlcy5kb21haW5zUmVmcmVzaGVkJzogJ1x1MjcwNSBEb21haW5zIGxpc3QgcmVmcmVzaGVkJyxcclxuICAgICAgJ2Rhc2hib2FyZC5ub1NlYXJjaFJlc3VsdHMnOiAnTm8gcmVzdWx0cyBmb3VuZCcsXHJcbiAgICAgICdkYXNoYm9hcmQuZm9jdXNTZWFyY2gnOiAnRm9jdXMgc2VhcmNoJyxcclxuICAgICAgJ25vdGljZXMubGlua1VwZGF0ZWQnOiAnXHUyNzA1IFNob3J0IGxpbmsgdXBkYXRlZCBzdWNjZXNzZnVsbHknXHJcbiAgIH0sXHJcbiAgIGZyOiB7XHJcbiAgICAgIC8vIE5vdGljZXNcclxuICAgICAgJ25vdGljZXMuc2F2ZWQnOiAnXHUyNzA1IFBhcmFtXHUwMEU4dHJlcyBzYXV2ZWdhcmRcdTAwRTlzJyxcclxuICAgICAgJ25vdGljZXMuZXJyb3InOiAnXHUyNzRDIEVycmV1cjoge21lc3NhZ2V9JyxcclxuICAgICAgJ25vdGljZXMuc3VjY2Vzcyc6ICdcdTI3MDUgT3BcdTAwRTlyYXRpb24gclx1MDBFOXVzc2llJyxcclxuICAgICAgJ25vdGljZXMubGlua0NyZWF0ZWQnOiAnXHUyNzA1IExpZW4gY291cnQgY3JcdTAwRTlcdTAwRTkgYXZlYyBzdWNjXHUwMEU4cycsXHJcbiAgICAgICdub3RpY2VzLnVybFJlcXVpcmVkJzogJ1x1Mjc0QyBMXFwnVVJMIGRlIGRlc3RpbmF0aW9uIGVzdCByZXF1aXNlJyxcclxuICAgICAgJ25vdGljZXMubGlua0RlbGV0ZWQnOiAnXHUyNzA1IExpZW4gY291cnQgc3VwcHJpbVx1MDBFOSBhdmVjIHN1Y2NcdTAwRThzJyxcclxuICAgICAgJ25vdGljZXMubGlua0NvcGllZCc6ICdcdTI3MDUgTGllbiBjb3VydCBjb3BpXHUwMEU5IGRhbnMgbGUgcHJlc3NlLXBhcGllcicsXHJcbiAgICAgIC8vIE1vZGFsXHJcbiAgICAgICdtb2RhbC5jcmVhdGVTaG9ydExpbmsnOiAnQ3JcdTAwRTllciB1biBsaWVuIGNvdXJ0JyxcclxuICAgICAgJ21vZGFsLmRlc3RpbmF0aW9uVXJsJzogJ1VSTCBkZSBkZXN0aW5hdGlvbicsXHJcbiAgICAgICdtb2RhbC5kZXN0aW5hdGlvblVybERlc2MnOiAnTFxcJ1VSTCBxdWUgdm91cyBzb3VoYWl0ZXogcmFjY291cmNpcicsXHJcbiAgICAgICdtb2RhbC5hbmNob3InOiAnVGV4dGUgZHUgbGllbicsXHJcbiAgICAgICdtb2RhbC5hbmNob3JEZXNjJzogJ0xlIHRleHRlIHF1aSBzZXJhIGFmZmljaFx1MDBFOSBwb3VyIGxlIGxpZW4nLFxyXG4gICAgICAnbW9kYWwuYW5jaG9yUGxhY2Vob2xkZXInOiAnQ2xpcXVleiBpY2knLFxyXG4gICAgICAnbW9kYWwuY3VzdG9tU2x1Zyc6ICdTbHVnIHBlcnNvbm5hbGlzXHUwMEU5JyxcclxuICAgICAgJ21vZGFsLmN1c3RvbVNsdWdEZXNjJzogJ1BhcnRpZSBwZXJzb25uYWxpc1x1MDBFOWUgZGUgbFxcJ1VSTCBjb3VydGUgKG9wdGlvbm5lbCknLFxyXG4gICAgICAnbW9kYWwuZG9tYWluJzogJ0RvbWFpbmUnLFxyXG4gICAgICAnbW9kYWwuZG9tYWluRGVzYyc6ICdDaG9pc2lzc2V6IGxlIGRvbWFpbmUgcG91ciB2b3RyZSBsaWVuIGNvdXJ0JyxcclxuICAgICAgJ21vZGFsLmNyZWF0ZSc6ICdDclx1MDBFOWVyJyxcclxuICAgICAgJ21vZGFsLmNhbmNlbCc6ICdBbm51bGVyJyxcclxuICAgICAgJ21vZGFsLmVkaXQnOiAnTW9kaWZpZXInLFxyXG4gICAgICAnbW9kYWwuZGVsZXRlJzogJ1N1cHByaW1lcicsXHJcbiAgICAgICdtb2RhbC5lZGl0U2hvcnRMaW5rJzogJ01vZGlmaWVyIGxlIGxpZW4gY291cnQnLFxyXG4gICAgICAvLyBTZXR0aW5ncyBkdWIuY29cclxuICAgICAgJ3NldHRpbmdzLmR1YkFwaUtleSc6ICdDbFx1MDBFOSBBUEkgZHViLmNvJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YkFwaUtleURlc2MnOiAnVm90cmUgY2xcdTAwRTkgQVBJIGR1Yi5jbyBwb3VyIGxcXCdhdXRoZW50aWZpY2F0aW9uJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YldvcmtzcGFjZUlkJzogJ0lEIFdvcmtzcGFjZSBkdWIuY28nLFxyXG4gICAgICAnc2V0dGluZ3MuZHViV29ya3NwYWNlSWREZXNjJzogJ09wdGlvbm5lbCA6IExcXCdJRCBkdSB3b3Jrc3BhY2Ugb1x1MDBGOSB2b3VzIHNvdWhhaXRleiBjclx1MDBFOWVyIHZvcyBsaWVucyAodmlzaWJsZSBkYW5zIGxcXCdVUkwgOiBhcHAuZHViLmNvL1t3b3Jrc3BhY2UtaWRdKS4gU2kgbm9uIHJlbnNlaWduXHUwMEU5LCBsZXMgbGllbnMgc2Vyb250IGNyXHUwMEU5XHUwMEU5cyBkYW5zIHZvdHJlIHdvcmtzcGFjZSBwYXIgZFx1MDBFOWZhdXQuJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YkN1c3RvbURvbWFpbnMnOiAnRG9tYWluZXMgcGVyc29ubmFsaXNcdTAwRTlzJyxcclxuICAgICAgJ3NldHRpbmdzLmR1YkN1c3RvbURvbWFpbnNEZXNjJzogJ0xpc3RlIGRlIHZvcyBkb21haW5lcyBwZXJzb25uYWxpc1x1MDBFOXMgKHVuIHBhciBsaWduZSknLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MnOiAnQXNzb2NpYXRpb25zIERvbWFpbmVzLURvc3NpZXJzJyxcclxuICAgICAgJ3NldHRpbmdzLmRvbWFpbkZvbGRlck1hcHBpbmdzRGVzYyc6ICdDb25maWd1cmV6IHF1ZWwgZG9tYWluZSB1dGlsaXNlciBwb3VyIGNoYXF1ZSBkb3NzaWVyJyxcclxuICAgICAgJ3NldHRpbmdzLmFkZE1hcHBpbmcnOiAnQWpvdXRlciB1bmUgbm91dmVsbGUgYXNzb2NpYXRpb24nLFxyXG4gICAgICAnc2V0dGluZ3MuZG9tYWluJzogJ0RvbWFpbmUnLFxyXG4gICAgICAnc2V0dGluZ3MuZm9sZGVyJzogJ0Rvc3NpZXInLFxyXG4gICAgICAnc2V0dGluZ3MucmVtb3ZlJzogJ1N1cHByaW1lcicsXHJcbiAgICAgIC8vIFNldHRpbmdzIFZpZXdNb2RlXHJcbiAgICAgICdzZXR0aW5ncy52aWV3TW9kZSc6ICdNb2RlIGRcXCdhZmZpY2hhZ2UnLFxyXG4gICAgICAnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlJzogJ01vZGUgZFxcJ2FmZmljaGFnZSBwYXIgZFx1MDBFOWZhdXQnLFxyXG4gICAgICAnc2V0dGluZ3MuZGVmYXVsdFZpZXdNb2RlRGVzYyc6ICdDaG9pc2lzc2V6IGNvbW1lbnQgbGVzIGRcdTAwRTl0YWlscyBkZXMgbGllbnMgc2Vyb250IGFmZmljaFx1MDBFOXMnLFxyXG4gICAgICAnc2V0dGluZ3MudGFiJzogJ05vdXZlbCBvbmdsZXQnLFxyXG4gICAgICAnc2V0dGluZ3Muc2lkZWJhcic6ICdCYXJyZSBsYXRcdTAwRTlyYWxlJyxcclxuICAgICAgJ3NldHRpbmdzLm92ZXJsYXknOiAnU3VwZXJwb3NpdGlvbicsXHJcbiAgICAgIC8vIERhc2hib2FyZFxyXG4gICAgICAnZGFzaGJvYXJkLnRpdGxlJzogJ1RhYmxlYXUgZGUgYm9yZCBMaW5rRmxvd3onLFxyXG4gICAgICAnZGFzaGJvYXJkLm5vTGlua3MnOiAnQXVjdW4gbGllbiBjb3VydCBjclx1MDBFOVx1MDBFOSBwb3VyIGxlIG1vbWVudCcsXHJcbiAgICAgICdkYXNoYm9hcmQubG9hZGluZyc6ICdDaGFyZ2VtZW50IGRlIHZvcyBsaWVucy4uLicsXHJcbiAgICAgICdkYXNoYm9hcmQuZXJyb3InOiAnRXJyZXVyIGxvcnMgZHUgY2hhcmdlbWVudCBkZXMgbGllbnMgOiB7bWVzc2FnZX0nLFxyXG4gICAgICAnZGFzaGJvYXJkLnJlZnJlc2gnOiAnUmFmcmFcdTAwRUVjaGlyJyxcclxuICAgICAgJ2Rhc2hib2FyZC52aWV3TW9kZVRhYic6ICdPdXZyaXIgZGFucyB1biBvbmdsZXQnLFxyXG4gICAgICAnZGFzaGJvYXJkLnZpZXdNb2RlU2lkZWJhcic6ICdPdXZyaXIgZGFucyBsYSBiYXJyZSBsYXRcdTAwRTlyYWxlJyxcclxuICAgICAgJ2Rhc2hib2FyZC52aWV3TW9kZVBvcHVwJzogJ091dnJpciBlbiBwb3B1cCcsXHJcbiAgICAgICdzZXR0aW5ncy5kb21haW5BbmRGb2xkZXInOiAnQXNzb2NpYXRpb24gRG9tYWluZSBldCBEb3NzaWVyJyxcclxuICAgICAgJ3NldHRpbmdzLmZvbGRlclBsYWNlaG9sZGVyJzogJ0Rvc3NpZXInLFxyXG4gICAgICAnc2V0dGluZ3Muc2F2ZSc6ICdTYXV2ZWdhcmRlcicsXHJcbiAgICAgICdzZXR0aW5ncy5yZWZyZXNoRG9tYWlucyc6ICdSYWZyYVx1MDBFRWNoaXIgbGVzIGRvbWFpbmVzJyxcclxuICAgICAgJ3NldHRpbmdzLnJlZnJlc2hEb21haW5zRGVzYyc6ICdBY3R1YWxpc2VyIGxhIGxpc3RlIGRlcyBkb21haW5lcyBkaXNwb25pYmxlcyBkZXB1aXMgZHViLmNvJyxcclxuICAgICAgJ3NldHRpbmdzLnJlZnJlc2gnOiAnUmFmcmFcdTAwRUVjaGlyJyxcclxuICAgICAgJ25vdGljZXMuZG9tYWluc1JlZnJlc2hlZCc6ICdcdTI3MDUgTGlzdGUgZGVzIGRvbWFpbmVzIGFjdHVhbGlzXHUwMEU5ZScsXHJcbiAgICAgICdkYXNoYm9hcmQubm9TZWFyY2hSZXN1bHRzJzogJ0F1Y3VuIHJcdTAwRTlzdWx0YXQgdHJvdXZcdTAwRTknLFxyXG4gICAgICAnZGFzaGJvYXJkLmZvY3VzU2VhcmNoJzogJ1JlY2hlcmNoZXIgdW4gbGllbicsXHJcbiAgICAgICdub3RpY2VzLmxpbmtVcGRhdGVkJzogJ1x1MjcwNSBMaWVuIGNvdXJ0IG1vZGlmaVx1MDBFOSBhdmVjIHN1Y2NcdTAwRThzJ1xyXG4gICB9XHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgVHJhbnNsYXRpb25zIHtcclxuICAgcHJpdmF0ZSBjdXJyZW50TGFuZzogc3RyaW5nO1xyXG5cclxuICAgY29uc3RydWN0b3IoaW5pdGlhbExhbmc6IHN0cmluZyA9ICdmcicpIHtcclxuICAgICAgdGhpcy5jdXJyZW50TGFuZyA9IGluaXRpYWxMYW5nO1xyXG4gICB9XHJcblxyXG4gICBzZXRMYW5ndWFnZShsYW5nOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgdGhpcy5jdXJyZW50TGFuZyA9IGxhbmc7XHJcbiAgIH1cclxuXHJcbiAgIHQoa2V5OiBUcmFuc2xhdGlvbktleSk6IHN0cmluZyB7XHJcbiAgICAgIHJldHVybiB0cmFuc2xhdGlvbnNbdGhpcy5jdXJyZW50TGFuZ10/LltrZXldIHx8IHRyYW5zbGF0aW9uc1snZW4nXVtrZXldIHx8IGtleTtcclxuICAgfVxyXG59XHJcbiIsICJpbXBvcnQgeyBQbHVnaW4sIE5vdGljZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IERlZmF1bHRTZXR0aW5ncyB9IGZyb20gJy4vU2V0dGluZ3MnO1xuaW1wb3J0IHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi9UcmFuc2xhdGlvbnMnO1xuaW1wb3J0IHsgQ3JlYXRlU2hvcnRMaW5rTW9kYWwgfSBmcm9tICcuL1Nob3J0TGlua01vZGFsJztcbmltcG9ydCB7IFZJRVdfVFlQRV9EQVNIQk9BUkQgfSBmcm9tICcuL0Rhc2hib2FyZCc7XG5cbmV4cG9ydCBjbGFzcyBIb3RrZXlzIHtcbiAgIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcbiAgICAgIHByaXZhdGUgc2V0dGluZ3M6IERlZmF1bHRTZXR0aW5ncyxcbiAgICAgIHByaXZhdGUgdHJhbnNsYXRpb25zOiBUcmFuc2xhdGlvbnNcbiAgICkge31cblxuICAgcmVnaXN0ZXJIb3RrZXlzKCkge1xuICAgICAgLy8gQ29tbWFuZGUgcG91ciBjclx1MDBFOWVyIHVuIG5vdXZlYXUgbGllbiBjb3VydFxuICAgICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgICAgICBpZDogJ2NyZWF0ZS1zaG9ydC1saW5rJyxcbiAgICAgICAgIG5hbWU6IHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmNyZWF0ZVNob3J0TGluaycpLFxuICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5kdWJBcGlLZXkpIHtcbiAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsICdBUEkga2V5IG5vdCBjb25maWd1cmVkJykpO1xuICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBuZXcgQ3JlYXRlU2hvcnRMaW5rTW9kYWwoXG4gICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXG4gICAgICAgICAgICAgICB0aGlzLnBsdWdpbixcbiAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgICAgICAgICB0aGlzLnRyYW5zbGF0aW9uc1xuICAgICAgICAgICAgKS5vcGVuKCk7XG4gICAgICAgICB9LFxuICAgICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJDdHJsXCIsIFwiU2hpZnRcIl0sIGtleTogXCJsXCIgfV1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBDb21tYW5kZSBwb3VyIGZvY3VzIGxhIGJhcnJlIGRlIHJlY2hlcmNoZVxuICAgICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgICAgICBpZDogJ2ZvY3VzLXNlYXJjaCcsXG4gICAgICAgICBuYW1lOiB0aGlzLnRyYW5zbGF0aW9ucy50KCdkYXNoYm9hcmQuZm9jdXNTZWFyY2gnKSxcbiAgICAgICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGVhZiA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9EQVNIQk9BUkQpWzBdO1xuICAgICAgICAgICAgaWYgKGxlYWYpIHtcbiAgICAgICAgICAgICAgIGlmICghY2hlY2tpbmcpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFJcdTAwRTl2XHUwMEU5bGVyIGQnYWJvcmQgbGEgdnVlXG4gICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIC8vIFB1aXMgZm9jdXMgc3VyIGxhIGJhcnJlIGRlIHJlY2hlcmNoZVxuICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWFyY2hJbnB1dCA9IGxlYWYudmlldy5jb250YWluZXJFbC5xdWVyeVNlbGVjdG9yKCcubGlua2Zsb3d6LXNlYXJjaC1pbnB1dCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICBpZiAoc2VhcmNoSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaElucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9LCAxMDApOyAvLyBQZXRpdCBkXHUwMEU5bGFpIHBvdXIgcydhc3N1cmVyIHF1ZSBsYSB2dWUgZXN0IGJpZW4gclx1MDBFOXZcdTAwRTlsXHUwMEU5ZVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICB9LFxuICAgICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJDdHJsXCJdLCBrZXk6IFwia1wiIH1dXG4gICAgICB9KTtcbiAgIH1cbn1cbiIsICJpbXBvcnQgeyBNb2RhbCwgU2V0dGluZywgQXBwLCBQbHVnaW4sIE5vdGljZSwgTWFya2Rvd25WaWV3LCByZXF1ZXN0VXJsIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBEZWZhdWx0U2V0dGluZ3MsIFNldHRpbmdzIH0gZnJvbSAnLi9TZXR0aW5ncyc7XHJcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcclxuaW1wb3J0IHsgdmFsaWRhdGVEb21haW5VcmwgfSBmcm9tICcuL0RvbWFpblZhbGlkYXRpb25zJztcclxuXHJcbmludGVyZmFjZSBFZGl0TGlua0RhdGEge1xyXG4gICAgdXJsOiBzdHJpbmc7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgZG9tYWluOiBzdHJpbmc7XHJcbiAgICBrZXk/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDcmVhdGVTaG9ydExpbmtNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuICAgIHByaXZhdGUgdXJsOiBzdHJpbmcgPSAnJztcclxuICAgIHByaXZhdGUgc2x1Zzogc3RyaW5nID0gJyc7XHJcbiAgICBwcml2YXRlIHNlbGVjdGVkRG9tYWluOiBzdHJpbmcgPSAnJztcclxuICAgIHByaXZhdGUgYW5jaG9yOiBzdHJpbmcgPSAnJztcclxuICAgIHByaXZhdGUgZG9tYWluczogc3RyaW5nW10gPSBbXTtcclxuICAgIHByaXZhdGUgaXNFZGl0aW5nOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIGVkaXREYXRhOiBFZGl0TGlua0RhdGEgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBhcHA6IEFwcCxcclxuICAgICAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luLFxyXG4gICAgICAgIHByaXZhdGUgc2V0dGluZ3M6IERlZmF1bHRTZXR0aW5ncyxcclxuICAgICAgICBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zLFxyXG4gICAgICAgIGVkaXREYXRhPzogRWRpdExpbmtEYXRhXHJcbiAgICApIHtcclxuICAgICAgICBzdXBlcihhcHApO1xyXG4gICAgICAgIGlmIChlZGl0RGF0YSkge1xyXG4gICAgICAgICAgICB0aGlzLmlzRWRpdGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZWRpdERhdGEgPSBlZGl0RGF0YTtcclxuICAgICAgICAgICAgdGhpcy51cmwgPSBlZGl0RGF0YS51cmw7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWREb21haW4gPSBlZGl0RGF0YS5kb21haW47XHJcbiAgICAgICAgICAgIHRoaXMuc2x1ZyA9IGVkaXREYXRhLmtleSB8fCAnJztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgb25PcGVuKCkge1xyXG4gICAgICAgIC8vIFNpIG9uIGVzdCBlbiBtb2RlIFx1MDBFOWRpdGlvbiwgclx1MDBFOWN1cFx1MDBFOXJlciBsZXMgZFx1MDBFOXRhaWxzIGNvbXBsZXRzIGR1IGxpZW5cclxuICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcgJiYgdGhpcy5lZGl0RGF0YSkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IGBodHRwczovL2FwaS5kdWIuY28vbGlua3MvJHt0aGlzLmVkaXREYXRhLmlkfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3RoaXMuc2V0dGluZ3MuZHViQXBpS2V5fWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsaW5rRGV0YWlscyA9IHJlc3BvbnNlLmpzb247XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cmwgPSBsaW5rRGV0YWlscy51cmw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZERvbWFpbiA9IGxpbmtEZXRhaWxzLmRvbWFpbjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNsdWcgPSBsaW5rRGV0YWlscy5rZXkgfHwgJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0RGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4udGhpcy5lZGl0RGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4ubGlua0RldGFpbHNcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgbGluayBkZXRhaWxzOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsICdGYWlsZWQgdG8gbG9hZCBsaW5rIGRldGFpbHMnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENoYXJnZXIgbGVzIGRvbWFpbmVzIGRpc3BvbmlibGVzXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy5kb21haW5zID0gYXdhaXQgU2V0dGluZ3MuZ2V0Q2FjaGVkRG9tYWlucyhcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZHViQXBpS2V5LFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kdWJXb3Jrc3BhY2VJZFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgZG9tYWluczonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5lcnJvcicpLnJlcGxhY2UoJ3ttZXNzYWdlfScsICdGYWlsZWQgdG8gbG9hZCBhdmFpbGFibGUgZG9tYWlucycpKTtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcclxuICAgICAgICBjb250ZW50RWwuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyBcclxuICAgICAgICAgICAgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCh0aGlzLmlzRWRpdGluZyA/ICdtb2RhbC5lZGl0U2hvcnRMaW5rJyA6ICdtb2RhbC5jcmVhdGVTaG9ydExpbmsnKSBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVVJMIGRlIGRlc3RpbmF0aW9uXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5kZXN0aW5hdGlvblVybCcpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5kZXN0aW5hdGlvblVybERlc2MnKSlcclxuICAgICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XHJcbiAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy51cmwpXHJcbiAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ2h0dHBzOi8vZXhlbXBsZS5jb20vcGFnZS1sb25ndWUnKVxyXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKHZhbHVlID0+IHRoaXMudXJsID0gdmFsdWUpKTtcclxuXHJcbiAgICAgICAgLy8gVGV4dGUgZHUgbGllbiAoYW5jcmUpXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5hbmNob3InKSlcclxuICAgICAgICAgICAgLnNldERlc2ModGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuYW5jaG9yRGVzYycpKVxyXG4gICAgICAgICAgICAuYWRkVGV4dCh0ZXh0ID0+IHRleHRcclxuICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLmFuY2hvcilcclxuICAgICAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcih0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5hbmNob3JQbGFjZWhvbGRlcicpKVxyXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKHZhbHVlID0+IHRoaXMuYW5jaG9yID0gdmFsdWUpKTtcclxuXHJcbiAgICAgICAgLy8gU2x1ZyBwZXJzb25uYWxpc1x1MDBFOVxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcclxuICAgICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuY3VzdG9tU2x1ZycpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5jdXN0b21TbHVnRGVzYycpKVxyXG4gICAgICAgICAgICAuYWRkVGV4dCh0ZXh0ID0+IHRleHRcclxuICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNsdWcpXHJcbiAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ21vbi1saWVuJylcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZSh2YWx1ZSA9PiB0aGlzLnNsdWcgPSB2YWx1ZSkpO1xyXG5cclxuICAgICAgICAvLyBEb21haW5lIHBlcnNvbm5hbGlzXHUwMEU5XHJcbiAgICAgICAgY29uc3QgZGVmYXVsdERvbWFpbiA9IHRoaXMuc2VsZWN0ZWREb21haW4gfHwgdGhpcy5nZXREb21haW5Gb3JDdXJyZW50RmlsZSgpO1xyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcclxuICAgICAgICAgICAgLnNldE5hbWUodGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuZG9tYWluJykpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKHRoaXMudHJhbnNsYXRpb25zLnQoJ21vZGFsLmRvbWFpbkRlc2MnKSlcclxuICAgICAgICAgICAgLmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIEFqb3V0ZXIgdG91cyBsZXMgZG9tYWluZXMgZGlzcG9uaWJsZXNcclxuICAgICAgICAgICAgICAgIHRoaXMuZG9tYWlucy5mb3JFYWNoKGRvbWFpbiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJvcGRvd24uYWRkT3B0aW9uKGRvbWFpbiwgZG9tYWluKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgZHJvcGRvd24uc2V0VmFsdWUoZGVmYXVsdERvbWFpbik7XHJcbiAgICAgICAgICAgICAgICBkcm9wZG93bi5vbkNoYW5nZSh2YWx1ZSA9PiB0aGlzLnNlbGVjdGVkRG9tYWluID0gdmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQm91dG9uc1xyXG4gICAgICAgIGNvbnN0IGJ1dHRvbkNvbnRhaW5lciA9IGNvbnRlbnRFbC5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdtb2RhbC1idXR0b24tY29udGFpbmVyJyB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBCb3V0b24gQW5udWxlclxyXG4gICAgICAgIGJ1dHRvbkNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyBcclxuICAgICAgICAgICAgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnbW9kYWwuY2FuY2VsJylcclxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2xvc2UoKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQm91dG9uIENyXHUwMEU5ZXIvTW9kaWZpZXJcclxuICAgICAgICBjb25zdCBzdWJtaXRCdXR0b24gPSBidXR0b25Db250YWluZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHtcclxuICAgICAgICAgICAgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCh0aGlzLmlzRWRpdGluZyA/ICdtb2RhbC5lZGl0JyA6ICdtb2RhbC5jcmVhdGUnKSxcclxuICAgICAgICAgICAgY2xzOiAnbW9kLWN0YSdcclxuICAgICAgICB9KTtcclxuICAgICAgICBzdWJtaXRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy51cmwpIHtcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy51cmxSZXF1aXJlZCcpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlU2hvcnRMaW5rKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZVNob3J0TGluaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgb25DbG9zZSgpIHtcclxuICAgICAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcclxuICAgICAgICBjb250ZW50RWwuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgLy8gUmFmcmFcdTAwRUVjaGlyIGxlIGRhc2hib2FyZCBhcHJcdTAwRThzIGxhIGZlcm1ldHVyZSBkdSBtb2RhbFxyXG4gICAgICAgIGNvbnN0IGRhc2hib2FyZExlYWYgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZSgnbGlua2Zsb3d6LXZpZXcnKVswXTtcclxuICAgICAgICBpZiAoZGFzaGJvYXJkTGVhZj8udmlldykge1xyXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgIGRhc2hib2FyZExlYWYudmlldy5yZWZyZXNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RG9tYWluRm9yQ3VycmVudEZpbGUoKTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCBhY3RpdmVGaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcclxuICAgICAgICBpZiAoIWFjdGl2ZUZpbGUpIHJldHVybiB0aGlzLmRvbWFpbnNbMF0gfHwgJ2R1Yi5zaCc7XHJcblxyXG4gICAgICAgIC8vIFJcdTAwRTljdXBcdTAwRTlyZXIgbGUgY2hlbWluIGR1IGZpY2hpZXIgYWN0aWZcclxuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGFjdGl2ZUZpbGUucGF0aDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUcm91dmVyIGxlIG1hcHBpbmcgbGUgcGx1cyBzcFx1MDBFOWNpZmlxdWUgcXVpIGNvcnJlc3BvbmQgYXUgY2hlbWluIGR1IGZpY2hpZXJcclxuICAgICAgICBsZXQgYmVzdE1hdGNoOiB7IGRvbWFpbjogc3RyaW5nLCBkZXB0aDogbnVtYmVyIH0gPSB7IGRvbWFpbjogdGhpcy5kb21haW5zWzBdIHx8ICdkdWIuc2gnLCBkZXB0aDogLTEgfTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZG9tYWluRm9sZGVyTWFwcGluZ3MpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5kb21haW5Gb2xkZXJNYXBwaW5ncy5mb3JFYWNoKG1hcHBpbmcgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gU2kgbGUgZmljaGllciBlc3QgZGFucyBjZSBkb3NzaWVyIG91IHVuIHNvdXMtZG9zc2llclxyXG4gICAgICAgICAgICAgICAgaWYgKGZpbGVQYXRoLnN0YXJ0c1dpdGgobWFwcGluZy5mb2xkZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2FsY3VsZXIgbGEgcHJvZm9uZGV1ciBkdSBkb3NzaWVyIG1hcHBcdTAwRTlcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXB0aCA9IG1hcHBpbmcuZm9sZGVyLnNwbGl0KCcvJykubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNpIGMnZXN0IGxlIG1hcHBpbmcgbGUgcGx1cyBzcFx1MDBFOWNpZmlxdWUgdHJvdXZcdTAwRTkganVzcXUnXHUwMEUwIHByXHUwMEU5c2VudFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXB0aCA+IGJlc3RNYXRjaC5kZXB0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2ggPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb21haW46IG1hcHBpbmcuZG9tYWluLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwdGg6IGRlcHRoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBiZXN0TWF0Y2guZG9tYWluO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlU2hvcnRMaW5rKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFZhbGlkZXIgZXQgZm9ybWF0ZXIgbCdVUkxcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnVybC5zdGFydHNXaXRoKCdodHRwOi8vJykgJiYgIXRoaXMudXJsLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXJsID0gJ2h0dHBzOi8vJyArIHRoaXMudXJsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBWYWxpZGVyIGxhIGNvbWJpbmFpc29uIGRvbWFpbmUvVVJMXHJcbiAgICAgICAgICAgIGlmICghdmFsaWRhdGVEb21haW5VcmwodGhpcy5zZWxlY3RlZERvbWFpbiwgdGhpcy51cmwsIHRoaXMudHJhbnNsYXRpb25zKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0ge1xyXG4gICAgICAgICAgICAgICAgdXJsOiB0aGlzLnVybCxcclxuICAgICAgICAgICAgICAgIGRvbWFpbjogdGhpcy5zZWxlY3RlZERvbWFpbixcclxuICAgICAgICAgICAgICAgIC4uLih0aGlzLnNsdWcgJiYgeyBrZXk6IHRoaXMuc2x1ZyB9KSxcclxuICAgICAgICAgICAgICAgIC4uLih0aGlzLnNldHRpbmdzLmR1YldvcmtzcGFjZUlkICYmIHsgcHJvamVjdElkOiB0aGlzLnNldHRpbmdzLmR1YldvcmtzcGFjZUlkIH0pXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9hcGkuZHViLmNvL2xpbmtzJyxcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3RoaXMuc2V0dGluZ3MuZHViQXBpS2V5fWAsXHJcbiAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzaG9ydExpbmsgPSByZXNwb25zZS5qc29uLnNob3J0TGluaztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlVmlldyA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFjdGl2ZVZpZXcgJiYgIXRoaXMuaXNFZGl0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYWN0aXZlVmlldy5lZGl0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGFjdGl2ZVZpZXcuZmlsZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVkaXRvciAmJiBmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFV0aWxpc2VyIGwnYW5jcmUgc2kgZWxsZSBlc3QgZFx1MDBFOWZpbmllLCBzaW5vbiB1dGlsaXNlciBsJ1VSTCBkZSBkZXN0aW5hdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsaW5rVGV4dCA9IHRoaXMuYW5jaG9yIHx8IHRoaXMudXJsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDclx1MDBFOWVyIGxlIG5vdXZlYXUgbGllbiBNYXJrZG93blxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXJrZG93bkxpbmsgPSBgWyR7bGlua1RleHR9XSgke3Nob3J0TGlua30pYDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9idGVuaXIgbGEgcG9zaXRpb24gZHUgY3Vyc2V1clxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnNcdTAwRTlyZXIgbGUgbGllbiBcdTAwRTAgbGEgcG9zaXRpb24gZHUgY3Vyc2V1clxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IucmVwbGFjZVJhbmdlKG1hcmtkb3duTGluaywgY3Vyc29yKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5saW5rQ3JlYXRlZCcpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQVBJIEVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNyZWF0aW5nIGxpbms6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCBlcnJvci5tZXNzYWdlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgdXBkYXRlU2hvcnRMaW5rKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5lZGl0RGF0YT8uaWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gbGluayBJRCBwcm92aWRlZCBmb3IgdXBkYXRlJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFZhbGlkZXIgZXQgZm9ybWF0ZXIgbCdVUkxcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnVybC5zdGFydHNXaXRoKCdodHRwOi8vJykgJiYgIXRoaXMudXJsLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXJsID0gJ2h0dHBzOi8vJyArIHRoaXMudXJsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0ge1xyXG4gICAgICAgICAgICAgICAgdXJsOiB0aGlzLnVybCxcclxuICAgICAgICAgICAgICAgIGRvbWFpbjogdGhpcy5zZWxlY3RlZERvbWFpbixcclxuICAgICAgICAgICAgICAgIC4uLih0aGlzLnNsdWcgJiYgeyBrZXk6IHRoaXMuc2x1ZyB9KVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcclxuICAgICAgICAgICAgICAgIHVybDogYGh0dHBzOi8vYXBpLmR1Yi5jby9saW5rcy8ke3RoaXMuZWRpdERhdGEuaWR9YCxcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7dGhpcy5zZXR0aW5ncy5kdWJBcGlLZXl9YCxcclxuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodGhpcy50cmFuc2xhdGlvbnMudCgnbm90aWNlcy5saW5rVXBkYXRlZCcpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQVBJIEVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHVwZGF0aW5nIGxpbms6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCBlcnJvci5tZXNzYWdlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi9UcmFuc2xhdGlvbnMnO1xyXG5cclxuaW50ZXJmYWNlIERvbWFpblZhbGlkYXRpb24ge1xyXG4gICBhbGxvd2VkRG9tYWluczogc3RyaW5nW107XHJcbiAgIGVycm9yTWVzc2FnZTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgRE9NQUlOX1ZBTElEQVRJT05TOiB7IFtrZXk6IHN0cmluZ106IERvbWFpblZhbGlkYXRpb24gfSA9IHtcclxuICAgJ2dpdC5uZXcnOiB7XHJcbiAgICAgIGFsbG93ZWREb21haW5zOiBbJ2dpdGh1Yi5jb20nXSxcclxuICAgICAgZXJyb3JNZXNzYWdlOiAnTGUgZG9tYWluZSBnaXQubmV3IG5lIHBldXQgXHUwMEVBdHJlIHV0aWxpc1x1MDBFOSBxdVxcJ2F2ZWMgZGVzIFVSTHMgZ2l0aHViLmNvbSdcclxuICAgfSxcclxuICAgJ2NoYXRnLnB0Jzoge1xyXG4gICAgICBhbGxvd2VkRG9tYWluczogWydvcGVuYWkuY29tJywgJ2NoYXRncHQuY29tJ10sXHJcbiAgICAgIGVycm9yTWVzc2FnZTogJ0xlIGRvbWFpbmUgY2hhdGcucHQgbmUgcGV1dCBcdTAwRUF0cmUgdXRpbGlzXHUwMEU5IHF1XFwnYXZlYyBkZXMgVVJMcyBvcGVuYWkuY29tIG91IGNoYXRncHQuY29tJ1xyXG4gICB9LFxyXG4gICAnYW16bi5pZCc6IHtcclxuICAgICAgYWxsb3dlZERvbWFpbnM6IFtcclxuICAgICAgICAgJ2FtYXpvbi5jb20nLFxyXG4gICAgICAgICAnYW1hem9uLmNvLnVrJyxcclxuICAgICAgICAgJ2FtYXpvbi5jYScsXHJcbiAgICAgICAgICdhbWF6b24uZXMnLFxyXG4gICAgICAgICAnYW1hem9uLmZyJ1xyXG4gICAgICBdLFxyXG4gICAgICBlcnJvck1lc3NhZ2U6ICdMZSBkb21haW5lIGFtem4uaWQgbmUgcGV1dCBcdTAwRUF0cmUgdXRpbGlzXHUwMEU5IHF1XFwnYXZlYyBkZXMgVVJMcyBBbWF6b24gKGNvbSwgY28udWssIGNhLCBlcywgZnIpJ1xyXG4gICB9LFxyXG4gICAnY2FsLmxpbmsnOiB7XHJcbiAgICAgIGFsbG93ZWREb21haW5zOiBbXHJcbiAgICAgICAgICdjYWwuY29tJyxcclxuICAgICAgICAgJ2NhbGVuZGx5LmNvbScsXHJcbiAgICAgICAgICdjYWxlbmRhci5hcHAuZ29vZ2xlJyxcclxuICAgICAgICAgJ2NoaWxsaXBpcGVyLmNvbScsXHJcbiAgICAgICAgICdodWJzcG90LmNvbScsXHJcbiAgICAgICAgICdzYXZ2eWNhbC5jb20nLFxyXG4gICAgICAgICAndGlkeWNhbC5jb20nLFxyXG4gICAgICAgICAnemNhbC5jbydcclxuICAgICAgXSxcclxuICAgICAgZXJyb3JNZXNzYWdlOiAnTGUgZG9tYWluZSBjYWwubGluayBuZSBwZXV0IFx1MDBFQXRyZSB1dGlsaXNcdTAwRTkgcXVcXCdhdmVjIGRlcyBVUkxzIGRlIHNlcnZpY2VzIGRlIGNhbGVuZHJpZXIgYXV0b3Jpc1x1MDBFOXMgKGNhbC5jb20sIGNhbGVuZGx5LmNvbSwgZXRjLiknXHJcbiAgIH0sXHJcbiAgICdmaWcucGFnZSc6IHtcclxuICAgICAgYWxsb3dlZERvbWFpbnM6IFsnZmlnbWEuY29tJ10sXHJcbiAgICAgIGVycm9yTWVzc2FnZTogJ0xlIGRvbWFpbmUgZmlnLnBhZ2UgbmUgcGV1dCBcdTAwRUF0cmUgdXRpbGlzXHUwMEU5IHF1XFwnYXZlYyBkZXMgVVJMcyBmaWdtYS5jb20nXHJcbiAgIH0sXHJcbiAgICdnZ2wubGluayc6IHtcclxuICAgICAgYWxsb3dlZERvbWFpbnM6IFtcclxuICAgICAgICAgJ2dvb2dsZS5jb20nLFxyXG4gICAgICAgICAnZ29vZ2xlLmNvLnVrJyxcclxuICAgICAgICAgJ2dvb2dsZS5jby5pZCcsXHJcbiAgICAgICAgICdnb29nbGUuY2EnLFxyXG4gICAgICAgICAnZ29vZ2xlLmVzJyxcclxuICAgICAgICAgJ2dvb2dsZS5mcicsXHJcbiAgICAgICAgICdnb29nbGVibG9nLmNvbScsXHJcbiAgICAgICAgICdibG9nLmdvb2dsZScsXHJcbiAgICAgICAgICdnLmNvJyxcclxuICAgICAgICAgJ2cucGFnZScsXHJcbiAgICAgICAgICd5b3V0dWJlLmNvbScsXHJcbiAgICAgICAgICd5b3V0dS5iZSdcclxuICAgICAgXSxcclxuICAgICAgZXJyb3JNZXNzYWdlOiAnTGUgZG9tYWluZSBnZ2wubGluayBuZSBwZXV0IFx1MDBFQXRyZSB1dGlsaXNcdTAwRTkgcXVcXCdhdmVjIGRlcyBVUkxzIEdvb2dsZSAoZ29vZ2xlLmNvbSwgeW91dHViZS5jb20sIGV0Yy4pJ1xyXG4gICB9LFxyXG4gICAnc3B0aS5maSc6IHtcclxuICAgICAgYWxsb3dlZERvbWFpbnM6IFsnc3BvdGlmeS5jb20nXSxcclxuICAgICAgZXJyb3JNZXNzYWdlOiAnTGUgZG9tYWluZSBzcHRpLmZpIG5lIHBldXQgXHUwMEVBdHJlIHV0aWxpc1x1MDBFOSBxdVxcJ2F2ZWMgZGVzIFVSTHMgc3BvdGlmeS5jb20nXHJcbiAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZURvbWFpblVybChkb21haW46IHN0cmluZywgdXJsOiBzdHJpbmcsIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zKTogYm9vbGVhbiB7XHJcbiAgIGNvbnN0IHZhbGlkYXRpb24gPSBET01BSU5fVkFMSURBVElPTlNbZG9tYWluXTtcclxuICAgaWYgKCF2YWxpZGF0aW9uKSByZXR1cm4gdHJ1ZTsgLy8gU2kgcGFzIGRlIHZhbGlkYXRpb24gc3BcdTAwRTljaWZpcXVlLCBvbiBhY2NlcHRlXHJcblxyXG4gICB0cnkge1xyXG4gICAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHVybCk7XHJcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSB2YWxpZGF0aW9uLmFsbG93ZWREb21haW5zLnNvbWUoZCA9PiBcclxuICAgICAgICAgdXJsT2JqLmhvc3RuYW1lID09PSBkIHx8IHVybE9iai5ob3N0bmFtZS5lbmRzV2l0aCgnLicgKyBkKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKCFpc1ZhbGlkKSB7XHJcbiAgICAgICAgIG5ldyBOb3RpY2UodHJhbnNsYXRpb25zLnQoJ25vdGljZXMuZXJyb3InKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCB2YWxpZGF0aW9uLmVycm9yTWVzc2FnZSkpO1xyXG4gICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBuZXcgTm90aWNlKHRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgJ1VSTCBpbnZhbGlkZScpKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICB9XHJcbn0gIiwgImltcG9ydCB7IEl0ZW1WaWV3LCBQbHVnaW4sIFdvcmtzcGFjZUxlYWYsIHNldEljb24sIE1lbnUsIE1vZGFsLCBOb3RpY2UgfSBmcm9tICdvYnNpZGlhbic7XHJcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vVHJhbnNsYXRpb25zJztcclxuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tICcuL1NldHRpbmdzJztcclxuaW1wb3J0IHsgcmVxdWVzdFVybCB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IHsgQ3JlYXRlU2hvcnRMaW5rTW9kYWwgfSBmcm9tICcuL1Nob3J0TGlua01vZGFsJztcclxuXHJcbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfREFTSEJPQVJEID0gXCJsaW5rZmxvd3otdmlld1wiO1xyXG5cclxuaW50ZXJmYWNlIFNob3J0TGluayB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgdXJsOiBzdHJpbmc7XHJcbiAgICBzaG9ydFVybDogc3RyaW5nO1xyXG4gICAgZG9tYWluOiBzdHJpbmc7XHJcbiAgICBjbGlja3M6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERhc2hib2FyZFZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XHJcbiAgICBwcml2YXRlIGxpbmtzOiBTaG9ydExpbmtbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBmaWx0ZXJlZExpbmtzOiBTaG9ydExpbmtbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBpc0xvYWRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgc2VhcmNoSW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgbGVhZjogV29ya3NwYWNlTGVhZiwgXHJcbiAgICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcclxuICAgICAgICBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zXHJcbiAgICApIHtcclxuICAgICAgICBzdXBlcihsZWFmKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBWSUVXX1RZUEVfREFTSEJPQVJEO1xyXG4gICAgfVxyXG5cclxuICAgIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC50aXRsZScpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIG9uT3BlbigpIHtcclxuICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsO1xyXG4gICAgICAgIGNvbnRhaW5lci5lbXB0eSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENyXHUwMEU5ZXIgbGUgY29udGVuZXVyIHByaW5jaXBhbFxyXG4gICAgICAgIGNvbnN0IGRhc2hib2FyZENvbnRhaW5lciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdsaW5rZmxvd3otY29udGFpbmVyJyB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDclx1MDBFOWVyIGwnZW4tdFx1MDBFQXRlXHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZGFzaGJvYXJkQ29udGFpbmVyLmNyZWF0ZUVsKCdkaXYnLCB7IGNsczogJ2xpbmtmbG93ei1oZWFkZXInIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFByZW1pXHUwMEU4cmUgbGlnbmUgOiB0aXRyZSBldCBib3V0b25zXHJcbiAgICAgICAgY29uc3QgdGl0bGVSb3cgPSBoZWFkZXIuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnbGlua2Zsb3d6LWhlYWRlci1yb3cnIH0pO1xyXG4gICAgICAgIHRpdGxlUm93LmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnZGFzaGJvYXJkLnRpdGxlJykgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQm91dG9ucyBkYW5zIGxhIHByZW1pXHUwMEU4cmUgbGlnbmVcclxuICAgICAgICBjb25zdCBidXR0b25zID0gdGl0bGVSb3cuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnbGlua2Zsb3d6LWJ1dHRvbnMnIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEJvdXRvbiBkZSBjclx1MDBFOWF0aW9uIGRlIGxpZW5cclxuICAgICAgICBjb25zdCBjcmVhdGVCdXR0b24gPSBidXR0b25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otYnV0dG9uIG1vZC1jdGEnLFxyXG4gICAgICAgICAgICB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5jcmVhdGVTaG9ydExpbmsnKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNldEljb24oY3JlYXRlQnV0dG9uLCAncGx1cycpO1xyXG4gICAgICAgIGNyZWF0ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMub3BlbkNyZWF0ZUxpbmtNb2RhbCgpKTtcclxuXHJcbiAgICAgICAgLy8gQm91dG9uIGRlIHJhZnJhXHUwMEVFY2hpc3NlbWVudFxyXG4gICAgICAgIGNvbnN0IHJlZnJlc2hCdXR0b24gPSBidXR0b25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otYnV0dG9uJyxcclxuICAgICAgICAgICAgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnZGFzaGJvYXJkLnJlZnJlc2gnKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNldEljb24ocmVmcmVzaEJ1dHRvbiwgJ3JlZnJlc2gtY3cnKTtcclxuICAgICAgICByZWZyZXNoQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5yZWZyZXNoKCkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIERldXhpXHUwMEU4bWUgbGlnbmUgOiBiYXJyZSBkZSByZWNoZXJjaGVcclxuICAgICAgICBjb25zdCBzZWFyY2hSb3cgPSBoZWFkZXIuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnbGlua2Zsb3d6LWhlYWRlci1yb3cnIH0pO1xyXG4gICAgICAgIGNvbnN0IHNlYXJjaENvbnRhaW5lciA9IHNlYXJjaFJvdy5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdsaW5rZmxvd3otc2VhcmNoJyB9KTtcclxuICAgICAgICB0aGlzLnNlYXJjaElucHV0ID0gc2VhcmNoQ29udGFpbmVyLmNyZWF0ZUVsKCdpbnB1dCcsIHtcclxuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otc2VhcmNoLWlucHV0J1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEFqb3V0ZXIgbCdpY1x1MDBGNG5lIGRlIHJlY2hlcmNoZVxyXG4gICAgICAgIGNvbnN0IHNlYXJjaEljb24gPSBzZWFyY2hDb250YWluZXIuY3JlYXRlRWwoJ3NwYW4nLCB7IGNsczogJ2xpbmtmbG93ei1zZWFyY2gtaWNvbicgfSk7XHJcbiAgICAgICAgc2V0SWNvbihzZWFyY2hJY29uLCAnc2VhcmNoJyk7XHJcblxyXG4gICAgICAgIC8vIFx1MDBDOWNvdXRlciBsZXMgY2hhbmdlbWVudHMgZGFucyBsYSByZWNoZXJjaGVcclxuICAgICAgICB0aGlzLnNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmZpbHRlckxpbmtzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ3JcdTAwRTllciBsYSBzZWN0aW9uIHByaW5jaXBhbGVcclxuICAgICAgICBjb25zdCBjb250ZW50ID0gZGFzaGJvYXJkQ29udGFpbmVyLmNyZWF0ZUVsKCdkaXYnLCB7IGNsczogJ2xpbmtmbG93ei1jb250ZW50JyB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDclx1MDBFOWVyIGxhIGxpc3RlIGRlcyBsaWVuc1xyXG4gICAgICAgIGNvbnN0IGxpbmtzTGlzdCA9IGNvbnRlbnQuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnbGlua2Zsb3d6LWxpbmtzLWxpc3QnIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENoYXJnZXIgZXQgYWZmaWNoZXIgbGVzIGxpZW5zXHJcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkTGlua3MobGlua3NMaXN0KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBvbkNsb3NlKCkge1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyRWwuZW1wdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWZyZXNoKCkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLmNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3IoJy5saW5rZmxvd3otbGlua3MtbGlzdCcpO1xyXG4gICAgICAgIGlmIChjb250ZW50KSB7XHJcbiAgICAgICAgICAgIC8vIEFqb3V0ZXIgbCdhbmltYXRpb24gZGUgZmFkZSBvdXRcclxuICAgICAgICAgICAgY29udGVudC5hZGRDbGFzcygnZmFkZS1vdXQnKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEF0dGVuZHJlIGxhIGZpbiBkZSBsJ2FuaW1hdGlvblxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMzAwKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBBdHRlbmRyZSB1biBwZXRpdCBkXHUwMEU5bGFpIHN1cHBsXHUwMEU5bWVudGFpcmVcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDIwMCkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29udGVudC5lbXB0eSgpO1xyXG4gICAgICAgICAgICBjb250ZW50LnJlbW92ZUNsYXNzKCdmYWRlLW91dCcpO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRMaW5rcyhjb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBsb2FkTGlua3MoY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTG9hZGluZykgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAvLyBBZmZpY2hlciBsZSBsb2FkZXJcclxuICAgICAgICAgICAgY29udGFpbmVyLmVtcHR5KCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvYWRlciA9IGNvbnRhaW5lci5jcmVhdGVFbCgnZGl2JywgeyBcclxuICAgICAgICAgICAgICAgIGNsczogJ2xpbmtmbG93ei1sb2FkaW5nJyxcclxuICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMudHJhbnNsYXRpb25zLnQoJ2Rhc2hib2FyZC5sb2FkaW5nJylcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGFyZ2VyIGxlcyBsaWVucyBkZXB1aXMgZHViLmNvXHJcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgU2V0dGluZ3MubG9hZFNldHRpbmdzKCk7XHJcbiAgICAgICAgICAgIGlmICghc2V0dGluZ3MuZHViQXBpS2V5KSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FQSSBrZXkgcmVxdWlyZWQnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQXBwZWwgXHUwMEUwIGwnQVBJIGR1Yi5jbyBwb3VyIHJcdTAwRTljdXBcdTAwRTlyZXIgbGVzIGxpZW5zXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IGBodHRwczovL2FwaS5kdWIuY28vbGlua3Mke3NldHRpbmdzLmR1YldvcmtzcGFjZUlkID8gYD93b3Jrc3BhY2VJZD0ke3NldHRpbmdzLmR1YldvcmtzcGFjZUlkfWAgOiAnJ31gLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtzZXR0aW5ncy5kdWJBcGlLZXl9YCxcclxuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFQSSBFcnJvcjogJHtyZXNwb25zZS5zdGF0dXN9IC0gJHtyZXNwb25zZS50ZXh0fWApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBsaW5rcyA9IGF3YWl0IHJlc3BvbnNlLmpzb247XHJcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShsaW5rcykpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBBUEkgcmVzcG9uc2UgZm9ybWF0OiBleHBlY3RlZCBhcnJheScpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBNYXBwZXIgbGVzIGxpZW5zIGF2ZWMgbGVzIGluZm9ybWF0aW9ucyBuXHUwMEU5Y2Vzc2FpcmVzXHJcbiAgICAgICAgICAgIHRoaXMubGlua3MgPSBsaW5rcy5tYXAoKGxpbms6IGFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgIGlkOiBsaW5rLmlkLFxyXG4gICAgICAgICAgICAgICAgdXJsOiBsaW5rLnVybCxcclxuICAgICAgICAgICAgICAgIHNob3J0VXJsOiBsaW5rLnNob3J0TGluayxcclxuICAgICAgICAgICAgICAgIGRvbWFpbjogbGluay5kb21haW4sXHJcbiAgICAgICAgICAgICAgICBjbGlja3M6IGxpbmsuY2xpY2tzIHx8IDBcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgLy8gU3VwcHJpbWVyIGxlIGxvYWRlclxyXG4gICAgICAgICAgICBsb2FkZXIucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBBZmZpY2hlciBsZXMgbGllbnNcclxuICAgICAgICAgICAgaWYgKHRoaXMubGlua3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb250YWluZXIuY3JlYXRlRWwoJ2RpdicsIHsgXHJcbiAgICAgICAgICAgICAgICAgICAgY2xzOiAnbGlua2Zsb3d6LWVtcHR5LXN0YXRlJyxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9ucy50KCdkYXNoYm9hcmQubm9MaW5rcycpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ3JcdTAwRTllciBsYSBsaXN0ZSBkZXMgbGllbnNcclxuICAgICAgICAgICAgdGhpcy5saW5rcy5mb3JFYWNoKGxpbmsgPT4gdGhpcy5jcmVhdGVMaW5rRWxlbWVudChjb250YWluZXIsIGxpbmspKTtcclxuXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyZXVyIGxvcnMgZHUgY2hhcmdlbWVudCBkZXMgbGllbnM6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICBjb250YWluZXIuY3JlYXRlRWwoJ2RpdicsIHsgXHJcbiAgICAgICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otZXJyb3InLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnZGFzaGJvYXJkLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgZXJyb3IubWVzc2FnZSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVMaW5rRWxlbWVudChjb250YWluZXI6IEhUTUxFbGVtZW50LCBsaW5rOiBTaG9ydExpbmspIHtcclxuICAgICAgICBjb25zdCBsaW5rRWwgPSBjb250YWluZXIuY3JlYXRlRWwoJ2RpdicsIHsgXHJcbiAgICAgICAgICAgIGNsczogJ2xpbmtmbG93ei1saW5rLWl0ZW0nLFxyXG4gICAgICAgICAgICBhdHRyOiB7IHRhYmluZGV4OiAnMCcgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBHZXN0aW9uIGRlcyBcdTAwRTl2XHUwMEU5bmVtZW50cyBjbGF2aWVyXHJcbiAgICAgICAgbGlua0VsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIHtcclxuICAgICAgICAgICAgICAgIC8vIE91dnJlIGxlIGxpZW5cclxuICAgICAgICAgICAgICAgIHdpbmRvdy5vcGVuKGxpbmsuc2hvcnRVcmwsICdfYmxhbmsnKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChlLmtleSA9PT0gJ0Fycm93RG93bicpIHtcclxuICAgICAgICAgICAgICAgIC8vIEZvY3VzIGwnXHUwMEU5bFx1MDBFOW1lbnQgc3VpdmFudFxyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IGxpbmtFbC5uZXh0RWxlbWVudFNpYmxpbmcgYXMgSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV4dCkgbmV4dC5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSAnQXJyb3dVcCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIEZvY3VzIGwnXHUwMEU5bFx1MDBFOW1lbnQgcHJcdTAwRTljXHUwMEU5ZGVudFxyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJldiA9IGxpbmtFbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nIGFzIEhUTUxFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXYpIHByZXYuZm9jdXMoKTtcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBFbi10XHUwMEVBdGUgZHUgbGllblxyXG4gICAgICAgIGNvbnN0IGhlYWRlciA9IGxpbmtFbC5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdsaW5rZmxvd3otbGluay1oZWFkZXInIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFVSTCBjb3VydGUgYXZlYyBpY1x1MDBGNG5lIGRlIGNvcGllXHJcbiAgICAgICAgY29uc3Qgc2hvcnRVcmxDb250YWluZXIgPSBoZWFkZXIuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnbGlua2Zsb3d6LXNob3J0LXVybCcgfSk7XHJcbiAgICAgICAgc2hvcnRVcmxDb250YWluZXIuY3JlYXRlRWwoJ2EnLCB7XHJcbiAgICAgICAgICAgIHRleHQ6IGxpbmsuc2hvcnRVcmwsXHJcbiAgICAgICAgICAgIGhyZWY6IGxpbmsuc2hvcnRVcmwsXHJcbiAgICAgICAgICAgIGNsczogJ2xpbmtmbG93ei1saW5rJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IGNvcHlCdXR0b24gPSBzaG9ydFVybENvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyBcclxuICAgICAgICAgICAgY2xzOiAnbGlua2Zsb3d6LWJ1dHRvbi1pY29uJyxcclxuICAgICAgICAgICAgYXR0cjogeyBcclxuICAgICAgICAgICAgICAgICdhcmlhLWxhYmVsJzogJ0NvcHkgVVJMJyxcclxuICAgICAgICAgICAgICAgICd0YWJpbmRleCc6ICcwJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc2V0SWNvbihjb3B5QnV0dG9uLCAnY29weScpO1xyXG4gICAgICAgIGNvcHlCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGxpbmsuc2hvcnRVcmwpO1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKHRoaXMudHJhbnNsYXRpb25zLnQoJ25vdGljZXMubGlua0NvcGllZCcpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gTWVudSBkJ2FjdGlvbnNcclxuICAgICAgICBjb25zdCBhY3Rpb25zQnV0dG9uID0gaGVhZGVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otYnV0dG9uLWljb24nLFxyXG4gICAgICAgICAgICBhdHRyOiB7IFxyXG4gICAgICAgICAgICAgICAgJ2FyaWEtbGFiZWwnOiAnQWN0aW9ucycsXHJcbiAgICAgICAgICAgICAgICAndGFiaW5kZXgnOiAnMCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNldEljb24oYWN0aW9uc0J1dHRvbiwgJ21vcmUtdmVydGljYWwnKTtcclxuICAgICAgICBhY3Rpb25zQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xyXG4gICAgICAgICAgICBtZW51LmFkZEl0ZW0oaXRlbSA9PiBpdGVtXHJcbiAgICAgICAgICAgICAgICAuc2V0SWNvbigncGVuY2lsJylcclxuICAgICAgICAgICAgICAgIC5zZXRUaXRsZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5lZGl0JykpXHJcbiAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0TGluayhsaW5rKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgbWVudS5hZGRJdGVtKGl0ZW0gPT4gaXRlbVxyXG4gICAgICAgICAgICAgICAgLnNldEljb24oJ3RyYXNoJylcclxuICAgICAgICAgICAgICAgIC5zZXRUaXRsZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdtb2RhbC5kZWxldGUnKSlcclxuICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmRlbGV0ZUxpbmsobGluay5pZCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIG1lbnUuc2hvd0F0TW91c2VFdmVudChldmVudCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIERcdTAwRTl0YWlscyBkdSBsaWVuXHJcbiAgICAgICAgY29uc3QgZGV0YWlscyA9IGxpbmtFbC5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdsaW5rZmxvd3otbGluay1kZXRhaWxzJyB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBVUkwgb3JpZ2luYWxlXHJcbiAgICAgICAgZGV0YWlscy5jcmVhdGVFbCgnZGl2JywgeyBcclxuICAgICAgICAgICAgY2xzOiAnbGlua2Zsb3d6LW9yaWdpbmFsLXVybCcsXHJcbiAgICAgICAgICAgIHRleHQ6IGxpbmsudXJsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFN0YXRpc3RpcXVlc1xyXG4gICAgICAgIGNvbnN0IHN0YXRzID0gZGV0YWlscy5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdsaW5rZmxvd3otbGluay1zdGF0cycgfSk7XHJcbiAgICAgICAgc3RhdHMuY3JlYXRlRWwoJ3NwYW4nLCB7IFxyXG4gICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otc3RhdCcsXHJcbiAgICAgICAgICAgIHRleHQ6IGAke2xpbmsuY2xpY2tzfSBjbGlja3NgXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBvcGVuQ3JlYXRlTGlua01vZGFsKCkge1xyXG4gICAgICAgIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgU2V0dGluZ3MubG9hZFNldHRpbmdzKCk7XHJcbiAgICAgICAgY29uc3QgbW9kYWwgPSBuZXcgQ3JlYXRlU2hvcnRMaW5rTW9kYWwoXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLFxyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbixcclxuICAgICAgICAgICAgc2V0dGluZ3MsXHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25zXHJcbiAgICAgICAgKTtcclxuICAgICAgICBtb2RhbC5vcGVuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmaWx0ZXJMaW5rcygpIHtcclxuICAgICAgICBjb25zdCBzZWFyY2hUZXJtID0gdGhpcy5zZWFyY2hJbnB1dC52YWx1ZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLmNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3IoJy5saW5rZmxvd3otbGlua3MtbGlzdCcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghY29udGVudCkgcmV0dXJuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnRlbnQuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgaWYgKCFzZWFyY2hUZXJtKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlua3MuZm9yRWFjaChsaW5rID0+IHRoaXMuY3JlYXRlTGlua0VsZW1lbnQoY29udGVudCwgbGluaykpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBmaWx0ZXJlZCA9IHRoaXMubGlua3MuZmlsdGVyKGxpbmsgPT4gXHJcbiAgICAgICAgICAgIGxpbmsudXJsLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoVGVybSkgfHxcclxuICAgICAgICAgICAgbGluay5zaG9ydFVybC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHNlYXJjaFRlcm0pIHx8XHJcbiAgICAgICAgICAgIGxpbmsuZG9tYWluLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoVGVybSlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoZmlsdGVyZWQubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQuY3JlYXRlRWwoJ2RpdicsIHsgXHJcbiAgICAgICAgICAgICAgICBjbHM6ICdsaW5rZmxvd3otZW1wdHktc3RhdGUnLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnZGFzaGJvYXJkLm5vU2VhcmNoUmVzdWx0cycpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaWx0ZXJlZC5mb3JFYWNoKGxpbmsgPT4gdGhpcy5jcmVhdGVMaW5rRWxlbWVudChjb250ZW50LCBsaW5rKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBkZWxldGVMaW5rKGxpbmtJZDogc3RyaW5nKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCBTZXR0aW5ncy5sb2FkU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgaWYgKCFzZXR0aW5ncy5kdWJBcGlLZXkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQVBJIGtleSByZXF1aXJlZCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkuZHViLmNvL2xpbmtzLyR7bGlua0lkfWAsXHJcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3NldHRpbmdzLmR1YkFwaUtleX1gLFxyXG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzICE9PSAyMDApIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQVBJIEVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU3VwcHJpbWVyIGxlIGxpZW4gbG9jYWxlbWVudFxyXG4gICAgICAgICAgICB0aGlzLmxpbmtzID0gdGhpcy5saW5rcy5maWx0ZXIobGluayA9PiBsaW5rLmlkICE9PSBsaW5rSWQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUmFmcmFcdTAwRUVjaGlyIGwnYWZmaWNoYWdlXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLmNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3IoJy5saW5rZmxvd3otbGlua3MtbGlzdCcpO1xyXG4gICAgICAgICAgICBpZiAoY29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgY29udGVudC5hZGRDbGFzcygnZmFkZS1vdXQnKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAzMDApKTtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQuZW1wdHkoKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGlua3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5jcmVhdGVFbCgnZGl2JywgeyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xzOiAnbGlua2Zsb3d6LWVtcHR5LXN0YXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogdGhpcy50cmFuc2xhdGlvbnMudCgnZGFzaGJvYXJkLm5vTGlua3MnKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmtzLmZvckVhY2gobGluayA9PiB0aGlzLmNyZWF0ZUxpbmtFbGVtZW50KGNvbnRlbnQsIGxpbmspKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY29udGVudC5yZW1vdmVDbGFzcygnZmFkZS1vdXQnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmxpbmtEZWxldGVkJykpO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJldXIgbG9ycyBkZSBsYSBzdXBwcmVzc2lvbiBkdSBsaWVuOicsIGVycm9yKTtcclxuICAgICAgICAgICAgbmV3IE5vdGljZSh0aGlzLnRyYW5zbGF0aW9ucy50KCdub3RpY2VzLmVycm9yJykucmVwbGFjZSgne21lc3NhZ2V9JywgZXJyb3IubWVzc2FnZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGVkaXRMaW5rKGxpbms6IFNob3J0TGluaykge1xyXG4gICAgICAgIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgU2V0dGluZ3MubG9hZFNldHRpbmdzKCk7XHJcbiAgICAgICAgY29uc3QgbW9kYWwgPSBuZXcgQ3JlYXRlU2hvcnRMaW5rTW9kYWwoXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLFxyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbixcclxuICAgICAgICAgICAgc2V0dGluZ3MsXHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25zLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB1cmw6IGxpbmsudXJsLFxyXG4gICAgICAgICAgICAgICAgaWQ6IGxpbmsuaWQsXHJcbiAgICAgICAgICAgICAgICBkb21haW46IGxpbmsuZG9tYWluXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIG1vZGFsLm9uQ2xvc2UgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaCgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgbW9kYWwub3BlbigpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRGFzaGJvYXJkTWFuYWdlciB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogUGx1Z2luLCBwcml2YXRlIHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zKSB7fVxyXG5cclxuICAgIGFzeW5jIG9wZW5EYXNoYm9hcmQobW9kZTogJ3RhYicgfCAnc2lkZWJhcicgfCAnb3ZlcmxheScpIHtcclxuICAgICAgICBjb25zdCBleGlzdGluZ0xlYXZlcyA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9EQVNIQk9BUkQpO1xyXG4gICAgICAgIGlmIChleGlzdGluZ0xlYXZlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihleGlzdGluZ0xlYXZlc1swXSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnZpZXdNb2RlLnNldFZpZXcobW9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q3VycmVudExlYWYoKTogV29ya3NwYWNlTGVhZiB8IG51bGwge1xyXG4gICAgICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9EQVNIQk9BUkQpO1xyXG4gICAgICAgIHJldHVybiBsZWF2ZXMubGVuZ3RoID4gMCA/IGxlYXZlc1swXSA6IG51bGw7XHJcbiAgICB9XHJcbn0gIiwgImltcG9ydCB7IFBsdWdpbiwgV29ya3NwYWNlTGVhZiwgTW9kYWwsIE5vdGljZSwgQ29tcG9uZW50IH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBUVmlld01vZGUgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tICcuL1NldHRpbmdzJztcclxuaW1wb3J0IHsgRGFzaGJvYXJkVmlldywgVklFV19UWVBFX0RBU0hCT0FSRCB9IGZyb20gJy4vRGFzaGJvYXJkJztcclxuaW1wb3J0IHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi9UcmFuc2xhdGlvbnMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFZpZXdNb2RlIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgcHJpdmF0ZSBjdXJyZW50VmlldzogRGFzaGJvYXJkVmlldyB8IG51bGwgPSBudWxsO1xyXG4gICBwcml2YXRlIGN1cnJlbnRNb2RlOiBUVmlld01vZGUgfCBudWxsID0gbnVsbDtcclxuICAgcHJpdmF0ZSBhY3RpdmVMZWFmOiBXb3Jrc3BhY2VMZWFmIHwgbnVsbCA9IG51bGw7XHJcbiAgIHByaXZhdGUgbGVhZklkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgcHJpdmF0ZSB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9ucztcclxuXHJcbiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBQbHVnaW4pIHtcclxuICAgICAgc3VwZXIoKTtcclxuICAgICAgdGhpcy50cmFuc2xhdGlvbnMgPSBuZXcgVHJhbnNsYXRpb25zKCk7XHJcbiAgICAgIC8vIEluaXRpYWxpc2VyIGxlcyBtb2RlcyBkZXB1aXMgbGVzIHNldHRpbmdzXHJcbiAgICAgIFNldHRpbmdzLmxvYWRTZXR0aW5ncygpLnRoZW4oc2V0dGluZ3MgPT4ge1xyXG4gICAgICAgICB0aGlzLmN1cnJlbnRNb2RlID0gc2V0dGluZ3MuY3VycmVudE1vZGU7XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBOZXR0b3llciBsZXMgYW5jaWVubmVzIGxlYWZzIGF1IGRcdTAwRTltYXJyYWdlXHJcbiAgICAgIHRoaXMuY2xvc2VDdXJyZW50VmlldygpO1xyXG4gICB9XHJcblxyXG4gICBwcml2YXRlIGFzeW5jIGNsb3NlQ3VycmVudFZpZXcoKSB7XHJcbiAgICAgIC8vIEZlcm1lciBsYSB2dWUgYWN0dWVsbGUgc2kgZWxsZSBleGlzdGVcclxuICAgICAgaWYgKHRoaXMuY3VycmVudFZpZXcpIHtcclxuICAgICAgICAgLy8gU2kgYydlc3QgdW5lIGxlYWYsIGxhIGRcdTAwRTl0YWNoZXJcclxuICAgICAgICAgaWYgKHRoaXMuYWN0aXZlTGVhZikge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUxlYWYuZGV0YWNoKCk7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgXHJcbiAgICAgICAgIC8vIEZlcm1lciB0b3V0ZXMgbGVzIGF1dHJlcyB2dWVzIGV4aXN0YW50ZXNcclxuICAgICAgICAgY29uc3QgbGVhdmVzID0gdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0RBU0hCT0FSRCk7XHJcbiAgICAgICAgIGxlYXZlcy5mb3JFYWNoKGxlYWYgPT4ge1xyXG4gICAgICAgICAgICBpZiAobGVhZi52aWV3IGluc3RhbmNlb2YgRGFzaGJvYXJkVmlldykge1xyXG4gICAgICAgICAgICAgICBsZWFmLmRldGFjaCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgdGhpcy5jdXJyZW50VmlldyA9IG51bGw7XHJcbiAgICAgICAgIHRoaXMuYWN0aXZlTGVhZiA9IG51bGw7XHJcbiAgICAgICAgIHRoaXMubGVhZklkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICB9XHJcblxyXG4gICBhc3luYyBzZXRWaWV3KG1vZGU6IFRWaWV3TW9kZSkge1xyXG4gICAgICAvLyBTaSBvbiBlc3QgZFx1MDBFOWpcdTAwRTAgZGFucyBsZSBib24gbW9kZSBldCBxdWUgY2Ugbidlc3QgcGFzIHVuIHBvcHVwLCBuZSByaWVuIGZhaXJlXHJcbiAgICAgIGlmIChtb2RlID09PSB0aGlzLmN1cnJlbnRNb2RlICYmIHRoaXMuY3VycmVudFZpZXcgJiYgbW9kZSAhPT0gJ292ZXJsYXknKSB7XHJcbiAgICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRmVybWVyIGxhIHZ1ZSBhY3R1ZWxsZSBldCB0b3V0ZXMgbGVzIGF1dHJlcyB2dWVzIGV4aXN0YW50ZXNcclxuICAgICAgYXdhaXQgdGhpcy5jbG9zZUN1cnJlbnRWaWV3KCk7XHJcblxyXG4gICAgICBjb25zdCB3b3Jrc3BhY2UgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlO1xyXG5cclxuICAgICAgLy8gR1x1MDBFOXJlciBsZSBtb2RlIG92ZXJsYXkgc1x1MDBFOXBhclx1MDBFOW1lbnQgY2FyIGlsIG4ndXRpbGlzZSBwYXMgZGUgbGVhZlxyXG4gICAgICBpZiAobW9kZSA9PT0gJ292ZXJsYXknKSB7XHJcbiAgICAgICAgIGNvbnN0IG1vZGFsID0gbmV3IE1vZGFsKHRoaXMucGx1Z2luLmFwcCk7XHJcbiAgICAgICAgIG1vZGFsLnRpdGxlRWwuc2V0VGV4dCh0aGlzLnRyYW5zbGF0aW9ucy50KCdkYXNoYm9hcmQudGl0bGUnKSk7XHJcbiAgICAgICAgIG1vZGFsLmNvbnRhaW5lckVsLmFkZENsYXNzKCdsaW5rZmxvd3otbW9kYWwnKTtcclxuXHJcbiAgICAgICAgIC8vIENyXHUwMEU5ZXIgbGUgY29udGVuZXVyIHBvdXIgbGUgZGFzaGJvYXJkIGRhbnMgbGEgbW9kYWxlXHJcbiAgICAgICAgIGNvbnN0IGNvbnRlbnRFbCA9IG1vZGFsLmNvbnRlbnRFbC5jcmVhdGVEaXYoJ2xpbmtmbG93ei1jb250ZW50Jyk7XHJcblxyXG4gICAgICAgICAvLyBDclx1MDBFOWVyIHVuZSBpbnN0YW5jZSBkZSBsYSBEYXNoYm9hcmRWaWV3IGVuIG1vZGUgb3ZlcmxheVxyXG4gICAgICAgICBjb25zdCB2aWV3ID0gbmV3IERhc2hib2FyZFZpZXcoXHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZignc3BsaXQnKSxcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4sXHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25zXHJcbiAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAvLyBSZW5kcmUgbGUgY29udGVudVxyXG4gICAgICAgICBhd2FpdCB2aWV3Lm9uT3BlbigpO1xyXG4gICAgICAgICBcclxuICAgICAgICAgdGhpcy5jdXJyZW50VmlldyA9IHZpZXc7XHJcbiAgICAgICAgIHRoaXMuYWN0aXZlTGVhZiA9IG51bGw7XHJcbiAgICAgICAgIG1vZGFsLm9wZW4oKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgLy8gQ3JcdTAwRTllciBsYSBsZWFmIHNlbG9uIGxlIG1vZGVcclxuICAgICAgICAgbGV0IGxlYWY6IFdvcmtzcGFjZUxlYWYgfCBudWxsID0gbnVsbDtcclxuICAgICAgICAgc3dpdGNoIChtb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3NpZGViYXInOlxyXG4gICAgICAgICAgICAgICBsZWFmID0gd29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSkgPz8gd29ya3NwYWNlLmdldExlYWYoJ3NwbGl0Jyk7XHJcbiAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd0YWInOlxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoJ3NwbGl0Jyk7XHJcbiAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICB9XHJcblxyXG4gICAgICAgICBpZiAobGVhZikge1xyXG4gICAgICAgICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgIHR5cGU6IFZJRVdfVFlQRV9EQVNIQk9BUkQsXHJcbiAgICAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgc3RhdGU6IHsgXHJcbiAgICAgICAgICAgICAgICAgIG1vZGU6IG1vZGUsXHJcbiAgICAgICAgICAgICAgICAgIGxlYWZJZDogdGhpcy5sZWFmSWRcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFZpZXcgPSBsZWFmLnZpZXcgYXMgRGFzaGJvYXJkVmlldztcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVMZWFmID0gbGVhZjtcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xyXG4gICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuY3VycmVudE1vZGUgPSBtb2RlO1xyXG4gICAgICBhd2FpdCBTZXR0aW5ncy5zYXZlU2V0dGluZ3MoeyBjdXJyZW50TW9kZTogbW9kZSB9KTtcclxuICAgfVxyXG5cclxuICAgZ2V0QWN0aXZlTGVhZigpOiBXb3Jrc3BhY2VMZWFmIHwgbnVsbCB7XHJcbiAgICAgIHJldHVybiB0aGlzLmFjdGl2ZUxlYWY7XHJcbiAgIH1cclxuXHJcbiAgIGdldEN1cnJlbnRMZWFmSWQoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICAgIHJldHVybiB0aGlzLmxlYWZJZDtcclxuICAgfVxyXG5cclxuICAgZ2V0Q3VycmVudE1vZGUoKTogVFZpZXdNb2RlIHwgbnVsbCB7XHJcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRNb2RlO1xyXG4gICB9XHJcbn0gIiwgImV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclN0eWxlcygpIHtcbmNvbnN0IHN0eWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuc3R5bGVFbC5pZCA9ICdsaW5rZmxvd3otc3R5bGVzJztcbnN0eWxlRWwudGV4dENvbnRlbnQgPSBgXG4gICAgLyogQW5pbWF0aW9ucyAqL1xuICAgIEBrZXlmcmFtZXMgZmFkZUluIHtcbiAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IH1cbiAgICAgICAgdG8geyBvcGFjaXR5OiAxOyB9XG4gICAgfVxuXG4gICAgQGtleWZyYW1lcyBmYWRlT3V0IHtcbiAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDE7IH1cbiAgICAgICAgdG8geyBvcGFjaXR5OiAwOyB9XG4gICAgfVxuXG4gICAgLyogTWVudSBIb3ZlciBTdHlsZXMgKi9cbiAgICAubWVudS5saW5rZmxvd3otbWVudSB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgei1pbmRleDogMTAwMDtcbiAgICB9XG5cbiAgICAvKiBEYXNoYm9hcmQgQ29udGFpbmVyICovXG4gICAgLmxpbmtmbG93ei1jb250YWluZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgIHBhZGRpbmc6IDFyZW07XG4gICAgICAgIGdhcDogMXJlbTtcbiAgICB9XG5cbiAgICAvKiBIZWFkZXIgU3R5bGVzICovXG4gICAgLmxpbmtmbG93ei1oZWFkZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBnYXA6IDFyZW07XG4gICAgICAgIHBhZGRpbmctYm90dG9tOiAxcmVtO1xuICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otaGVhZGVyLXJvdyB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWhlYWRlciBoMiB7XG4gICAgICAgIG1hcmdpbjogMDtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbnMge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBnYXA6IDAuNXJlbTtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAvKiBUb29sYmFyIFN0eWxlcyAqL1xuICAgIC5saW5rZmxvd3otdG9vbGJhciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGdhcDogMC41cmVtO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGdhcDogMC41cmVtO1xuICAgICAgICBwYWRkaW5nOiAwLjVyZW0gMXJlbTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWludGVyYWN0aXZlLW5vcm1hbCk7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbjpob3ZlciB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWludGVyYWN0aXZlLWhvdmVyKTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbi5tb2QtY3RhIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtb24tYWNjZW50KTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbi5tb2QtY3RhOmhvdmVyIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50LWhvdmVyKTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbi1pY29uIHtcbiAgICAgICAgcGFkZGluZzogMC4yNXJlbTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWJ1dHRvbi1pY29uOmhvdmVyIHtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ob3Zlcik7XG4gICAgfVxuXG4gICAgLyogQ29udGVudCBTdHlsZXMgKi9cbiAgICAubGlua2Zsb3d6LWNvbnRlbnQge1xuICAgICAgICBmbGV4OiAxO1xuICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICBwYWRkaW5nOiAxcmVtIDA7XG4gICAgfVxuXG4gICAgLmxpbmtmbG93ei1saW5rcy1saXN0IHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgZ2FwOiAxcmVtO1xuICAgICAgICBhbmltYXRpb246IGZhZGVJbiAwLjNzIGVhc2UtaW4tb3V0O1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otbGlua3MtbGlzdC5mYWRlLW91dCB7XG4gICAgICAgIGFuaW1hdGlvbjogZmFkZU91dCAwLjNzIGVhc2UtaW4tb3V0O1xuICAgIH1cblxuICAgIC8qIExpbmsgSXRlbSBTdHlsZXMgKi9cbiAgICAubGlua2Zsb3d6LWxpbmstaXRlbSB7XG4gICAgICAgIHBhZGRpbmc6IDFyZW07XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KTtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otbGluay1oZWFkZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDAuNXJlbTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LXNob3J0LXVybCB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGdhcDogMC41cmVtO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otbGluayB7XG4gICAgICAgIGNvbG9yOiB2YXIoLS10ZXh0LWFjY2VudCk7XG4gICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWxpbms6aG92ZXIge1xuICAgICAgICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LWxpbmstZGV0YWlscyB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIGdhcDogMC41cmVtO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otb3JpZ2luYWwtdXJsIHtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICAgICAgICBmb250LXNpemU6IDAuOWVtO1xuICAgICAgICB3b3JkLWJyZWFrOiBicmVhay1hbGw7XG4gICAgfVxuXG4gICAgLmxpbmtmbG93ei1saW5rLXN0YXRzIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZ2FwOiAxcmVtO1xuICAgICAgICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gICAgICAgIGZvbnQtc2l6ZTogMC45ZW07XG4gICAgfVxuXG4gICAgLyogTG9hZGluZyBTdGF0ZSAqL1xuICAgIC5saW5rZmxvd3otbG9hZGluZyB7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogMnJlbTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICAgIH1cblxuICAgIC8qIEVtcHR5IFN0YXRlICovXG4gICAgLmxpbmtmbG93ei1lbXB0eS1zdGF0ZSB7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogMnJlbTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICAgIH1cblxuICAgIC8qIEVycm9yIFN0YXRlICovXG4gICAgLmxpbmtmbG93ei1lcnJvciB7XG4gICAgICAgIGNvbG9yOiB2YXIoLS10ZXh0LWVycm9yKTtcbiAgICAgICAgcGFkZGluZzogMXJlbTtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWVycm9yKTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgIH1cblxuICAgIC8qIE1vZGFsIFN0eWxlcyAqL1xuICAgIC5saW5rZmxvd3otbW9kYWwge1xuICAgICAgICBtYXgtd2lkdGg6IDgwdnc7XG4gICAgICAgIG1heC1oZWlnaHQ6IDgwdmg7XG4gICAgICAgIHdpZHRoOiA2MDBweDtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LW1vZGFsIC5zZXR0aW5nLWl0ZW0ge1xuICAgICAgICBib3JkZXItdG9wOiBub25lO1xuICAgICAgICBwYWRkaW5nOiAwLjc1cmVtIDA7XG4gICAgfVxuXG4gICAgLmxpbmtmbG93ei1tb2RhbCAuc2V0dGluZy1pdGVtLWluZm8ge1xuICAgICAgICBmb250LXNpemU6IDAuOWVtO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otbW9kYWwgLnNldHRpbmctaXRlbS1jb250cm9sIHtcbiAgICAgICAgZmxleC1ncm93OiAwLjc7XG4gICAgfVxuXG4gICAgLmxpbmtmbG93ei1tb2RhbCBpbnB1dFt0eXBlPVwidGV4dFwiXSxcbiAgICAubGlua2Zsb3d6LW1vZGFsIHNlbGVjdCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBwYWRkaW5nOiAwLjVyZW07XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpO1xuICAgICAgICBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otbW9kYWwgLm1vZGFsLWJ1dHRvbi1jb250YWluZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgICBnYXA6IDAuNXJlbTtcbiAgICAgICAgbWFyZ2luLXRvcDogMnJlbTtcbiAgICAgICAgcGFkZGluZy10b3A6IDFyZW07XG4gICAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gICAgfVxuXG4gICAgLmxpbmtmbG93ei1tb2RhbCAubW9kYWwtYnV0dG9uLWNvbnRhaW5lciBidXR0b24ge1xuICAgICAgICBwYWRkaW5nOiAwLjVyZW0gMXJlbTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIGZvbnQtc2l6ZTogMC45ZW07XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LW1vZGFsIC5tb2RhbC1idXR0b24tY29udGFpbmVyIGJ1dHRvbi5tb2QtY3RhIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtb24tYWNjZW50KTtcbiAgICAgICAgYm9yZGVyOiBub25lO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otbW9kYWwgLm1vZGFsLWJ1dHRvbi1jb250YWluZXIgYnV0dG9uOmhvdmVyIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0taW50ZXJhY3RpdmUtaG92ZXIpO1xuICAgIH1cblxuICAgIC5saW5rZmxvd3otbW9kYWwgLm1vZGFsLWJ1dHRvbi1jb250YWluZXIgYnV0dG9uLm1vZC1jdGE6aG92ZXIge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQtaG92ZXIpO1xuICAgIH1cblxuICAgIC8qIFNlYXJjaCBTdHlsZXMgKi9cbiAgICAubGlua2Zsb3d6LXNlYXJjaCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LXNlYXJjaC1pY29uIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIHdpZHRoOiAycmVtO1xuICAgICAgICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gICAgfVxuXG4gICAgLmxpbmtmbG93ei1zZWFyY2gtaW5wdXQge1xuICAgICAgICBmbGV4OiAxO1xuICAgICAgICBwYWRkaW5nOiAwLjVyZW07XG4gICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgYmFja2dyb3VuZDogbm9uZTtcbiAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcbiAgICB9XG5cbiAgICAubGlua2Zsb3d6LXNlYXJjaC1pbnB1dDpmb2N1cyB7XG4gICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDJweCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gICAgfVxuYDtcblxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZUVsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVucmVnaXN0ZXJTdHlsZXMoKSB7XG5jb25zdCBzdHlsZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpbmtmbG93ei1zdHlsZXMnKTtcbmlmIChzdHls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QUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FB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QUs7QUFDVixxQkFBUyxvQkFBb0IsYUFBYSxTQUFTO0FBQUEsVUFDdEQ7QUFBQSxRQUNIO0FBRUEsaUJBQVMsaUJBQWlCLGFBQWEsU0FBUztBQUFBLE1BQ25ELENBQUM7QUFBQSxJQUNKLENBQUM7QUFHRCxTQUFLLGNBQWMsSUFBSTtBQUFBLE1BQ3BCLEtBQUs7QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0EsS0FBSztBQUFBLElBQ1IsQ0FBQztBQUdELFNBQUs7QUFBQSxNQUNGLEtBQUssSUFBSSxNQUFNLEdBQUcsVUFBVSxPQUFPLFNBQWdCO0FBQ2hELFlBQUk7QUFDRCxnQkFBTUMsWUFBVyxNQUFNLFNBQVMsYUFBYTtBQUM3QyxjQUFJLEtBQUssS0FBSyxXQUFXQSxVQUFTLFdBQVcsR0FBRztBQUU3QyxnQkFBSSxLQUFLLFdBQVc7QUFDakIsb0JBQU0sS0FBSyxVQUFVLFFBQVE7QUFBQSxZQUNoQztBQUFBLFVBQ0g7QUFBQSxRQUNILFNBQVMsT0FBTztBQUNiLGtCQUFRLE1BQU0sbURBQWdELEtBQUs7QUFBQSxRQUN0RTtBQUFBLE1BQ0gsQ0FBQztBQUFBLElBQ0o7QUFFQSxtQkFBZTtBQUFBLEVBQ2xCO0FBQUEsRUFFUSxlQUFxQjtBQXBJaEM7QUFxSU0sVUFBTSxXQUFTLGNBQVMsZ0JBQWdCLFNBQXpCLG1CQUErQixjQUFjLFdBQVcsU0FBUSxPQUFPO0FBQ3RGLFNBQUssYUFBYSxZQUFZLE1BQU07QUFBQSxFQUN2QztBQUFBLEVBRUEsV0FBVztBQXpJZDtBQTJJTSxxQkFBaUI7QUFHakIsVUFBTSxRQUFPLFVBQUsscUJBQUwsbUJBQXVCO0FBQ3BDLFFBQUksTUFBTTtBQUNQLFdBQUssT0FBTztBQUFBLElBQ2Y7QUFBQSxFQUNIO0FBQ0g7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJ0cmFuc2xhdGlvbnMiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAidHJhbnNsYXRpb25zIiwgInRyYW5zbGF0aW9ucyIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgInRyYW5zbGF0aW9ucyIsICJ0cmFuc2xhdGlvbnMiLCAiaW1wb3J0X29ic2lkaWFuIiwgInNldHRpbmdzIl0KfQo=
