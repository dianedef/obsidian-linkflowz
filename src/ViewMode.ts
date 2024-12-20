import { Plugin, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_DASHBOARD } from './Dashboard';

export class ViewMode {
   private currentMode: 'tab' | 'sidebar' | 'overlay' = 'tab';
   private currentLeaf: WorkspaceLeaf | null = null;

   constructor(private plugin: Plugin) {}

   async setView(mode: 'tab' | 'sidebar' | 'overlay') {
      this.currentMode = mode;

      // Fermer la vue actuelle si elle existe
      if (this.currentLeaf) {
         this.currentLeaf.detach();
      }

      const workspace = this.plugin.app.workspace;
      let leaf: WorkspaceLeaf;

      // Créer la nouvelle vue selon le mode
      switch (mode) {
         case 'sidebar':
            leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf('split');
            break;
         case 'overlay':
            const activeLeaf = workspace.getMostRecentLeaf() ?? workspace.getLeaf('split');
            leaf = workspace.createLeafBySplit(activeLeaf, 'horizontal', true);
            break;
         case 'tab':
         default:
            leaf = workspace.getLeaf('split');
            break;
      }

      // Configurer la nouvelle vue
      await leaf.setViewState({
         type: VIEW_TYPE_DASHBOARD,
         active: true
      });

      this.currentLeaf = leaf;
      this.plugin.app.workspace.revealLeaf(leaf);
   }

   getCurrentMode(): 'tab' | 'sidebar' | 'overlay' {
      return this.currentMode;
   }

   getCurrentLeaf(): WorkspaceLeaf | null {
      return this.currentLeaf;
   }
} 