export type TranslationKey = 
   // Notices
   | 'notices.saved'
   | 'notices.error'
   | 'notices.success'
   | 'notices.linkCreated'
   | 'notices.urlRequired'
   | 'notices.linkDeleted'
   | 'notices.linkCopied'
   // Modal
   | 'modal.createShortLink'
   | 'modal.destinationUrl'
   | 'modal.destinationUrlDesc'
   | 'modal.anchor'
   | 'modal.anchorDesc'
   | 'modal.anchorPlaceholder'
   | 'modal.customSlug'
   | 'modal.customSlugDesc'
   | 'modal.domain'
   | 'modal.domainDesc'
   | 'modal.create'
   | 'modal.cancel'
   | 'modal.edit'
   | 'modal.delete'
   | 'modal.editShortLink'
   // Settings dub.co
   | 'settings.dubApiKey'
   | 'settings.dubApiKeyDesc'
   | 'settings.dubWorkspaceId'
   | 'settings.dubWorkspaceIdDesc'
   | 'settings.dubCustomDomains'
   | 'settings.dubCustomDomainsDesc'
   | 'settings.domainFolderMappings'
   | 'settings.domainFolderMappingsDesc'
   | 'settings.addMapping'
   | 'settings.domain'
   | 'settings.folder'
   | 'settings.remove'
   // Settings ViewMode
   | 'settings.viewMode'
   | 'settings.defaultViewMode'
   | 'settings.defaultViewModeDesc'
   | 'settings.tab'
   | 'settings.sidebar'
   | 'settings.overlay'
   // Dashboard
   | 'dashboard.title'
   | 'dashboard.noLinks'
   | 'dashboard.loading'
   | 'dashboard.error'
   | 'dashboard.refresh'
   | 'dashboard.viewModeTab'
   | 'dashboard.viewModeSidebar'
   | 'dashboard.viewModePopup'
   | 'settings.domainAndFolder'
   | 'settings.folderPlaceholder'
   | 'settings.save'
   | 'settings.refreshDomains'
   | 'settings.refreshDomainsDesc'
   | 'settings.refresh'
   | 'notices.domainsRefreshed'
   | 'dashboard.noSearchResults'
   | 'dashboard.focusSearch'
   | 'notices.linkUpdated';

export const translations: { [lang: string]: Record<TranslationKey, string> } = {
   en: {
      // Notices
      'notices.saved': '✅ Settings saved',
      'notices.error': '❌ Error: {message}',
      'notices.success': '✅ Operation successful',
      'notices.linkCreated': '✅ Short link created successfully',
      'notices.urlRequired': '❌ Destination URL is required',
      'notices.linkDeleted': '✅ Short link deleted successfully',
      'notices.linkCopied': '✅ Short link copied to clipboard',
      // Modal
      'modal.createShortLink': 'Create Short Link',
      'modal.destinationUrl': 'Destination URL',
      'modal.destinationUrlDesc': 'The URL you want to shorten',
      'modal.anchor': 'Link Text',
      'modal.anchorDesc': 'The text that will be displayed for the link',
      'modal.anchorPlaceholder': 'Click here',
      'modal.customSlug': 'Custom Slug',
      'modal.customSlugDesc': 'Custom part of the short URL (optional)',
      'modal.domain': 'Domain',
      'modal.domainDesc': 'Choose the domain for your short link',
      'modal.create': 'Create',
      'modal.cancel': 'Cancel',
      'modal.edit': 'Edit',
      'modal.delete': 'Delete',
      'modal.editShortLink': 'Edit Short Link',
      // Settings dub.co
      'settings.dubApiKey': 'dub.co API Key',
      'settings.dubApiKeyDesc': 'Your dub.co API key for authentication',
      'settings.dubWorkspaceId': 'dub.co Workspace ID',
      'settings.dubWorkspaceIdDesc': 'Optional: The ID of the workspace where you want to create links (found in the URL: app.dub.co/[workspace-id]). If not set, links will be created in your default workspace.',
      'settings.dubCustomDomains': 'Custom Domains',
      'settings.dubCustomDomainsDesc': 'List of your custom domains (one per line)',
      'settings.domainFolderMappings': 'Domain-Folder Mappings',
      'settings.domainFolderMappingsDesc': 'Configure which domain to use for each folder',
      'settings.addMapping': 'Add New Mapping',
      'settings.domain': 'Domain',
      'settings.folder': 'Folder',
      'settings.remove': 'Remove',
      // Settings ViewMode
      'settings.viewMode': 'View Mode',
      'settings.defaultViewMode': 'Default View Mode',
      'settings.defaultViewModeDesc': 'Choose how the link details will be displayed',
      'settings.tab': 'New Tab',
      'settings.sidebar': 'Right Sidebar',
      'settings.overlay': 'Overlay',
      // Dashboard
      'dashboard.title': 'LinkFlowz Dashboard',
      'dashboard.noLinks': 'No short links created yet',
      'dashboard.loading': 'Loading your links...',
      'dashboard.error': 'Error loading links: {message}',
      'dashboard.refresh': 'Refresh',
      'dashboard.viewModeTab': 'Open in Tab',
      'dashboard.viewModeSidebar': 'Open in Sidebar',
      'dashboard.viewModePopup': 'Open as Popup',
      'settings.domainAndFolder': 'Domain and Folder Mapping',
      'settings.folderPlaceholder': 'Folder',
      'settings.save': 'Save',
      'settings.refreshDomains': 'Refresh Domains',
      'settings.refreshDomainsDesc': 'Refresh the list of available domains from dub.co',
      'settings.refresh': 'Refresh',
      'notices.domainsRefreshed': '✅ Domains list refreshed',
      'dashboard.noSearchResults': 'No results found',
      'dashboard.focusSearch': 'Focus search',
      'notices.linkUpdated': '✅ Short link updated successfully'
   },
   fr: {
      // Notices
      'notices.saved': '✅ Paramètres sauvegardés',
      'notices.error': '❌ Erreur: {message}',
      'notices.success': '✅ Opération réussie',
      'notices.linkCreated': '✅ Lien court créé avec succès',
      'notices.urlRequired': '❌ L\'URL de destination est requise',
      'notices.linkDeleted': '✅ Lien court supprimé avec succès',
      'notices.linkCopied': '✅ Lien court copié dans le presse-papier',
      // Modal
      'modal.createShortLink': 'Créer un lien court',
      'modal.destinationUrl': 'URL de destination',
      'modal.destinationUrlDesc': 'L\'URL que vous souhaitez raccourcir',
      'modal.anchor': 'Texte du lien',
      'modal.anchorDesc': 'Le texte qui sera affiché pour le lien',
      'modal.anchorPlaceholder': 'Cliquez ici',
      'modal.customSlug': 'Slug personnalisé',
      'modal.customSlugDesc': 'Partie personnalisée de l\'URL courte (optionnel)',
      'modal.domain': 'Domaine',
      'modal.domainDesc': 'Choisissez le domaine pour votre lien court',
      'modal.create': 'Créer',
      'modal.cancel': 'Annuler',
      'modal.edit': 'Modifier',
      'modal.delete': 'Supprimer',
      'modal.editShortLink': 'Modifier le lien court',
      // Settings dub.co
      'settings.dubApiKey': 'Clé API dub.co',
      'settings.dubApiKeyDesc': 'Votre clé API dub.co pour l\'authentification',
      'settings.dubWorkspaceId': 'ID Workspace dub.co',
      'settings.dubWorkspaceIdDesc': 'Optionnel : L\'ID du workspace où vous souhaitez créer vos liens (visible dans l\'URL : app.dub.co/[workspace-id]). Si non renseigné, les liens seront créés dans votre workspace par défaut.',
      'settings.dubCustomDomains': 'Domaines personnalisés',
      'settings.dubCustomDomainsDesc': 'Liste de vos domaines personnalisés (un par ligne)',
      'settings.domainFolderMappings': 'Associations Domaines-Dossiers',
      'settings.domainFolderMappingsDesc': 'Configurez quel domaine utiliser pour chaque dossier',
      'settings.addMapping': 'Ajouter une nouvelle association',
      'settings.domain': 'Domaine',
      'settings.folder': 'Dossier',
      'settings.remove': 'Supprimer',
      // Settings ViewMode
      'settings.viewMode': 'Mode d\'affichage',
      'settings.defaultViewMode': 'Mode d\'affichage par défaut',
      'settings.defaultViewModeDesc': 'Choisissez comment les détails des liens seront affichés',
      'settings.tab': 'Nouvel onglet',
      'settings.sidebar': 'Barre latérale',
      'settings.overlay': 'Superposition',
      // Dashboard
      'dashboard.title': 'Tableau de bord LinkFlowz',
      'dashboard.noLinks': 'Aucun lien court créé pour le moment',
      'dashboard.loading': 'Chargement de vos liens...',
      'dashboard.error': 'Erreur lors du chargement des liens : {message}',
      'dashboard.refresh': 'Rafraîchir',
      'dashboard.viewModeTab': 'Ouvrir dans un onglet',
      'dashboard.viewModeSidebar': 'Ouvrir dans la barre latérale',
      'dashboard.viewModePopup': 'Ouvrir en popup',
      'settings.domainAndFolder': 'Association Domaine et Dossier',
      'settings.folderPlaceholder': 'Dossier',
      'settings.save': 'Sauvegarder',
      'settings.refreshDomains': 'Rafraîchir les domaines',
      'settings.refreshDomainsDesc': 'Actualiser la liste des domaines disponibles depuis dub.co',
      'settings.refresh': 'Rafraîchir',
      'notices.domainsRefreshed': '✅ Liste des domaines actualisée',
      'dashboard.noSearchResults': 'Aucun résultat trouvé',
      'dashboard.focusSearch': 'Rechercher un lien',
      'notices.linkUpdated': '✅ Lien court modifié avec succès'
   }
};

export class Translations {
   private currentLang: string;

   constructor(initialLang: string = 'fr') {
      this.currentLang = initialLang;
   }

   setLanguage(lang: string): void {
      this.currentLang = lang;
   }

   t(key: TranslationKey): string {
      return translations[this.currentLang]?.[key] || translations['en'][key] || key;
   }
}
