import { ProviderMapping } from './types';

export const PROVIDER_MAP: ProviderMapping = {
  'gmail.com': {
    server: 'smtp.gmail.com',
    port: 465,
    encryption: 'ssl',
    authMethod: 'login'
  },
  'outlook.com': {
    server: 'smtp-mail.outlook.com',
    port: 587,
    encryption: 'starttls',
    authMethod: 'login'
  },
  'hotmail.com': {
    server: 'smtp-mail.outlook.com',
    port: 587,
    encryption: 'starttls',
    authMethod: 'login'
  },
  'yahoo.com': {
    server: 'smtp.mail.yahoo.com',
    port: 465,
    encryption: 'ssl',
    authMethod: 'login'
  },
  'icloud.com': {
    server: 'smtp.mail.me.com',
    port: 587,
    encryption: 'starttls',
    authMethod: 'login'
  },
  'gmx.de': {
    server: 'mail.gmx.net',
    port: 587,
    encryption: 'starttls',
    authMethod: 'login'
  },
  'web.de': {
    server: 'smtp.web.de',
    port: 587,
    encryption: 'starttls',
    authMethod: 'login'
  },
  'muenstermann.de': {
    server: 'smtp.office365.com',
    port: 587,
    encryption: 'starttls',
    authMethod: 'login'
  }
};
