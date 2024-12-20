import { Notice } from 'obsidian';
import { Translations } from './Translations';

interface DomainValidation {
   allowedDomains: string[];
   errorMessage: string;
}

export const DOMAIN_VALIDATIONS: { [key: string]: DomainValidation } = {
   'git.new': {
      allowedDomains: ['github.com'],
      errorMessage: 'Le domaine git.new ne peut être utilisé qu\'avec des URLs github.com'
   },
   'chatg.pt': {
      allowedDomains: ['openai.com', 'chatgpt.com'],
      errorMessage: 'Le domaine chatg.pt ne peut être utilisé qu\'avec des URLs openai.com ou chatgpt.com'
   },
   'amzn.id': {
      allowedDomains: [
         'amazon.com',
         'amazon.co.uk',
         'amazon.ca',
         'amazon.es',
         'amazon.fr'
      ],
      errorMessage: 'Le domaine amzn.id ne peut être utilisé qu\'avec des URLs Amazon (com, co.uk, ca, es, fr)'
   },
   'cal.link': {
      allowedDomains: [
         'cal.com',
         'calendly.com',
         'calendar.app.google',
         'chillipiper.com',
         'hubspot.com',
         'savvycal.com',
         'tidycal.com',
         'zcal.co'
      ],
      errorMessage: 'Le domaine cal.link ne peut être utilisé qu\'avec des URLs de services de calendrier autorisés (cal.com, calendly.com, etc.)'
   },
   'fig.page': {
      allowedDomains: ['figma.com'],
      errorMessage: 'Le domaine fig.page ne peut être utilisé qu\'avec des URLs figma.com'
   },
   'ggl.link': {
      allowedDomains: [
         'google.com',
         'google.co.uk',
         'google.co.id',
         'google.ca',
         'google.es',
         'google.fr',
         'googleblog.com',
         'blog.google',
         'g.co',
         'g.page',
         'youtube.com',
         'youtu.be'
      ],
      errorMessage: 'Le domaine ggl.link ne peut être utilisé qu\'avec des URLs Google (google.com, youtube.com, etc.)'
   },
   'spti.fi': {
      allowedDomains: ['spotify.com'],
      errorMessage: 'Le domaine spti.fi ne peut être utilisé qu\'avec des URLs spotify.com'
   }
};

export function validateDomainUrl(domain: string, url: string, translations: Translations): boolean {
   const validation = DOMAIN_VALIDATIONS[domain];
   if (!validation) return true; // Si pas de validation spécifique, on accepte

   try {
      const urlObj = new URL(url);
      const isValid = validation.allowedDomains.some(d => 
         urlObj.hostname === d || urlObj.hostname.endsWith('.' + d)
      );

      if (!isValid) {
         new Notice(translations.t('notices.error').replace('{message}', validation.errorMessage));
         return false;
      }

      return true;
   } catch (error) {
      new Notice(translations.t('notices.error').replace('{message}', 'URL invalide'));
      return false;
   }
} 