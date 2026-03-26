export interface SmtpConfig {
  server: string;
  port: number;
  encryption: 'none' | 'ssl' | 'tls' | 'starttls';
  authMethod: 'none' | 'login' | 'plain';
}

export interface ProviderMapping {
  [domain: string]: SmtpConfig;
}
