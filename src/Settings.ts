import { App, Plugin, PluginSettingTab, Setting, Notice, requestUrl, Menu, TFolder } from 'obsidian';
import { Translations } from './Translations';

export interface DomainFolderMapping {
   domain: string;
   folder: string;
}

export interface DefaultSettings {
   language: string;
   dubApiKey: string;
   dubWorkspaceId: string;
   domainFolderMappings: DomainFolderMapping[];
   viewMode: 'tab' | 'sidebar' | 'overlay';
}

export const DEFAULT_SETTINGS: DefaultSettings = {
   language: 'fr',
   dubApiKey: '',
   dubWorkspaceId: '',
   domainFolderMappings: [],
   viewMode: 'tab'
};

export class Settings {
   private static plugin: Plugin;
   private static settings: DefaultSettings;

   static initialize(plugin: Plugin) {
      this.plugin = plugin;
   }

   static async loadSettings(): Promise<DefaultSettings> {
      const savedData = await this.plugin.loadData();
      this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData || {});
      return this.settings;
   }

   static async saveSettings(settings: Partial<DefaultSettings>) {
      this.settings = Object.assign(this.settings || DEFAULT_SETTINGS, settings);
      await this.plugin.saveData(this.settings);
   }

   static async fetchDomains(apiKey: string, workspaceId?: string): Promise<string[]> {
      try {
         console.log('Fetching domains with API key:', apiKey.substring(0, 4) + '...');
         if (workspaceId) {
            console.log('Using workspace ID:', workspaceId);
         }

         const url = workspaceId 
            ? `https://api.dub.co/domains?projectId=${workspaceId}`
            : 'https://api.dub.co/domains';

         console.log('Requesting URL:', url);

         const response = await requestUrl({
            url,
            method: 'GET',
            headers: {
               'Authorization': `Bearer ${apiKey}`,
               'Accept': 'application/json'
            }
         });

         console.log('Response status:', response.status);

         if (response.status === 200) {
            // La réponse est un tableau de domaines
            const domains = Array.isArray(response.json) ? response.json : [];
            console.log('Parsed domains:', domains);
            
            // Extraire les slugs des domaines
            return domains.map((domain: any) => domain.slug);
         }

         console.error('Error response:', response.json);
         throw new Error(response.json?.error || `Failed to fetch domains (status: ${response.status})`);
      } catch (error) {
         console.error('Error fetching domains:', error);
         if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
         }
         throw error;
      }
   }
}

export class SettingsTab extends PluginSettingTab {
   settings: DefaultSettings;
   private domains: string[] = ['dub.co'];

   constructor(
      app: App, 
      private plugin: Plugin, 
      settings: DefaultSettings,
      private translations: Translations
   ) {
      super(app, plugin);
      this.settings = settings;
   }

   async loadDomains() {
      if (this.settings.dubApiKey) {
         try {
            this.domains = ['dub.co', ...await Settings.fetchDomains(
               this.settings.dubApiKey,
               this.settings.dubWorkspaceId
            )];
            this.display();
         } catch (error) {
            new Notice(this.translations.t('notices.error').replace('{message}', error.message));
         }
      }
   }

   display() {
      const { containerEl } = this;
      containerEl.empty();

      // Section dub.co
      containerEl.createEl('h2', { text: 'dub.co' });

      new Setting(containerEl)
         .setName(this.translations.t('settings.dubApiKey'))
         .setDesc(this.translations.t('settings.dubApiKeyDesc'))
         .addText(text => text
            .setPlaceholder('Entrez votre clé API')
            .setValue(this.settings.dubApiKey)
            .onChange(async (value) => {
               this.settings.dubApiKey = value;
               await Settings.saveSettings({ dubApiKey: value });
               new Notice(this.translations.t('notices.saved'));
               if (value) {
                  await this.loadDomains();
               }
            }));

      new Setting(containerEl)
         .setName(this.translations.t('settings.dubWorkspaceId'))
         .setDesc(this.translations.t('settings.dubWorkspaceIdDesc'))
         .addText(text => text
            .setPlaceholder('Entrez votre ID de workspace')
            .setValue(this.settings.dubWorkspaceId)
            .onChange(async (value) => {
               this.settings.dubWorkspaceId = value;
               await Settings.saveSettings({ dubWorkspaceId: value });
               new Notice(this.translations.t('notices.saved'));
               if (this.settings.dubApiKey) {
                  await this.loadDomains();
               }
            }));

      // Section Mappages Domaine-Dossier
      containerEl.createEl('h2', { text: this.translations.t('settings.domainFolderMappings') });
      
      // Ligne de description avec le bouton d'ajout
      const descriptionLine = new Setting(containerEl)
         .setName(this.translations.t('settings.domainFolderMappingsDesc'))
         .addButton(button => button
            .setIcon('plus')
            .setButtonText(this.translations.t('settings.addMapping'))
            .setCta()
            .onClick(async () => {
               this.settings.domainFolderMappings.push({
                  domain: this.domains[0],
                  folder: ''
               });
               await Settings.saveSettings({ domainFolderMappings: this.settings.domainFolderMappings });
               new Notice(this.translations.t('notices.saved'));
               this.display();
            }));
      
      descriptionLine.settingEl.addClass('description-with-button');

      // Conteneur pour les mappages existants
      const mappingsContainer = containerEl.createEl('div');
      
      // Fonction pour créer un nouveau mapping
      const createMappingElement = (mapping: DomainFolderMapping, index: number) => {
         const mappingDiv = mappingsContainer.createEl('div', { cls: 'mapping-container' });
         
         // Conteneur pour la ligne de mapping
         const mappingLine = new Setting(mappingDiv)
            .setClass('compact-setting')
            // Label "Domaine"
            .addText(text => {
               text.inputEl.addClass('label-text');
               text.setValue(this.translations.t('settings.domain'));
               text.setDisabled(true);
               return text;
            })
            // Dropdown des domaines
            .addDropdown(dropdown => {
               this.domains.forEach(domain => {
                  dropdown.addOption(domain, domain);
               });
               dropdown.setValue(mapping.domain);
               dropdown.onChange(value => {
                  this.settings.domainFolderMappings[index].domain = value;
               });
               dropdown.selectEl.addClass('domain-dropdown');
               return dropdown;
            })
            // Champ de saisie du dossier avec son label
            .addButton(button => button
               .setButtonText(mapping.folder || this.translations.t('settings.folder'))
               .onClick((e: MouseEvent) => {
                  // Créer le menu de sélection principal
                  const menu = new Menu();
                  
                  // Construire la hiérarchie des dossiers à partir de la racine
                  this.buildFolderMenu(menu, this.app.vault.getRoot(), index);

                  // Afficher le menu à la position du clic
                  menu.showAtMouseEvent(e);
               }))
            // Boutons d'action
            .addButton(button => button
               .setIcon('checkmark')
               .setTooltip(this.translations.t('settings.save'))
               .setCta()
               .onClick(async () => {
                  await Settings.saveSettings({ domainFolderMappings: this.settings.domainFolderMappings });
                  new Notice(this.translations.t('notices.saved'));
               }))
            .addButton(button => button
               .setIcon('trash')
               .setTooltip(this.translations.t('settings.remove'))
               .onClick(async () => {
                  this.settings.domainFolderMappings.splice(index, 1);
                  await Settings.saveSettings({ domainFolderMappings: this.settings.domainFolderMappings });
                  new Notice(this.translations.t('notices.saved'));
                  this.display();
               }));

         // Ajouter des styles pour aligner les éléments
         mappingLine.settingEl.addClass('mapping-line');
      };

      // Afficher les mappages existants
      this.settings.domainFolderMappings.forEach((mapping, index) => {
         createMappingElement(mapping, index);
      });

      // Section Mode d'affichage
      containerEl.createEl('h2', { text: this.translations.t('settings.viewMode') });

      new Setting(containerEl)
         .setName(this.translations.t('settings.defaultViewMode'))
         .setDesc(this.translations.t('settings.defaultViewModeDesc'))
         .addDropdown(dropdown => dropdown
            .addOption('tab', this.translations.t('settings.tab'))
            .addOption('sidebar', this.translations.t('settings.sidebar'))
            .addOption('overlay', this.translations.t('settings.overlay'))
            .setValue(this.settings.viewMode)
            .onChange(async (value: 'tab' | 'sidebar' | 'overlay') => {
               this.settings.viewMode = value;
               await Settings.saveSettings({ viewMode: value });
               new Notice(this.translations.t('notices.saved'));
            }));

      // Charger les domaines au démarrage si une clé API est présente
      if (this.settings.dubApiKey && this.domains.length === 1) {
         this.loadDomains();
      }
   }

   // Construire le menu hiérarchique des dossiers
   private buildFolderMenu(menu: Menu, folder: TFolder, mappingIndex: number, level: number = 0) {
      const subFolders = folder.children.filter((child): child is TFolder => child instanceof TFolder);
      
      subFolders.forEach(subFolder => {
         const hasChildren = subFolder.children.some(child => child instanceof TFolder);
         
         if (hasChildren) {
            // Pour les dossiers avec des enfants, créer un sous-menu
            menu.addItem(item => {
               const titleEl = createSpan({ cls: 'menu-item-title' });
               titleEl.appendText(subFolder.name);
               titleEl.appendChild(createSpan({ cls: 'menu-item-arrow', text: ' →' }));

               item.dom.querySelector('.menu-item-title')?.replaceWith(titleEl);
               item.setIcon('folder');

               // Créer le sous-menu
               const subMenu = new Menu();
               this.buildFolderMenu(subMenu, subFolder, mappingIndex, level + 1);

               // Configurer l'événement de survol
               const itemDom = (item as any).dom as HTMLElement;
               if (itemDom) {
                  let isOverItem = false;
                  let isOverMenu = false;
                  let hideTimeout: NodeJS.Timeout;

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

                  itemDom.addEventListener('mouseenter', () => {
                     isOverItem = true;
                     if (hideTimeout) clearTimeout(hideTimeout);
                     showSubMenu();
                  });

                  itemDom.addEventListener('mouseleave', () => {
                     isOverItem = false;
                     hideSubMenu();
                  });

                  // Gérer le survol du sous-menu lui-même
                  const subMenuEl = (subMenu as any).dom;
                  if (subMenuEl) {
                     subMenuEl.addEventListener('mouseenter', () => {
                        isOverMenu = true;
                        if (hideTimeout) clearTimeout(hideTimeout);
                     });

                     subMenuEl.addEventListener('mouseleave', () => {
                        isOverMenu = false;
                        hideSubMenu();
                     });
                  }
               }

               // Ajouter également un gestionnaire de clic pour le dossier parent
               item.onClick(async () => {
                  this.settings.domainFolderMappings[mappingIndex].folder = subFolder.path;
                  await Settings.saveSettings({ domainFolderMappings: this.settings.domainFolderMappings });
                  new Notice(this.translations.t('notices.saved'));
                  this.display();
               });
            });
         } else {
            // Pour les dossiers sans enfants, ajouter simplement un élément de menu
            menu.addItem(item => {
               item.setTitle(subFolder.name)
                  .setIcon('folder')
                  .onClick(async () => {
                     this.settings.domainFolderMappings[mappingIndex].folder = subFolder.path;
                     await Settings.saveSettings({ domainFolderMappings: this.settings.domainFolderMappings });
                     new Notice(this.translations.t('notices.saved'));
                     this.display();
                  });
            });
         }
      });
   }
}