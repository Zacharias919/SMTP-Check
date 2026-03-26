import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Shield, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PROVIDER_MAP } from './constants';
import { SmtpConfig } from './types';

export default function App() {
  const [email, setEmail] = useState('');
  const [smtpServer, setSmtpServer] = useState('');
  const [port, setPort] = useState(25);
  const [encryption, setEncryption] = useState<SmtpConfig['encryption']>('none');
  // Initialize with 'login' so username/password fields are immediately visible as user requested
  const [authMethod, setAuthMethod] = useState<SmtpConfig['authMethod']>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isAutoDiscovering, setIsAutoDiscovering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState<'idle' | 'success' | 'derived' | 'failed'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetch('/api/smtp-config')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.email) setEmail(data.email);
          if (data.smtpServer) setSmtpServer(data.smtpServer);
          if (data.port) setPort(data.port);
          if (data.encryption) setEncryption(data.encryption);
          if (data.authMethod) setAuthMethod(data.authMethod);
          if (data.username) setUsername(data.username);
        }
      })
      .catch(() => {
        // Ignorieren, wenn noch keine Datenbank existiert
      });
  }, []);

  // Auto-Discovery Logic
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // If username is empty or was the same as the old email, update username too
    if (username === '' || username === email) {
      setUsername(value);
    }

    if (value.includes('@')) {
      const parts = value.split('@');
      const domain = parts[1].toLowerCase();
      if (domain.includes('.') && domain.length > 3) {
        autoDiscover(domain);
      }
    }
  };

  const handleEncryptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEnc = e.target.value as SmtpConfig['encryption'];
    setEncryption(newEnc);

    // Port automatisch anpassen
    if (newEnc === 'ssl') {
      setPort(465);
    } else if (newEnc === 'starttls' || newEnc === 'tls') {
      setPort(587);
    } else if (newEnc === 'none') {
      setPort(25);
    }
  };

  const autoDiscover = useCallback(async (domain: string) => {
    setIsAutoDiscovering(true);
    setDiscoveryStatus('idle');

    await new Promise(resolve => setTimeout(resolve, 600));

    const config = PROVIDER_MAP[domain];

    if (config) {
      setSmtpServer(config.server);
      setPort(config.port);
      setEncryption(config.encryption);
      setAuthMethod(config.authMethod);
      setDiscoveryStatus('success');
    } else {
      setSmtpServer(`smtp.${domain}`);
      setPort(587);
      setEncryption('starttls');
      setAuthMethod('login');
      setDiscoveryStatus('derived');
    }
    setIsAutoDiscovering(false);
  }, []);

  useEffect(() => {
    if (port === 465) {
      setEncryption('ssl');
    } else if (port === 587) {
      setEncryption('starttls');
    }

    if (port === 465 && encryption !== 'ssl') {
      setValidationError('Hinweis: Port 465 wird in der Regel mit SSL/TLS verwendet.');
    } else if (port === 587 && (encryption !== 'starttls' && encryption !== 'tls')) {
      setValidationError('Hinweis: Port 587 wird in der Regel mit STARTTLS verwendet.');
    } else if (port === 25 && encryption !== 'none') {
      setValidationError('Wichtiger Hinweis: Port 25 ist standardmäßig unverschlüsselt.');
    } else {
      setValidationError(null);
    }
  }, [port, encryption]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const response = await fetch('/api/smtp-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          smtpServer,
          port,
          encryption,
          authMethod,
          username,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitFeedback({ type: 'success', message: 'Einstellungen erfolgreich gespeichert und getestet!' });
      } else {
        setSubmitFeedback({ type: 'error', message: data.message || 'Fehler beim Speichern' });
      }
    } catch (error: any) {
      setSubmitFeedback({
        type: 'error',
        message: 'Verbindungsfehler beim Testen der Konfiguration.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setSmtpServer('');
    setPort(25);
    setEncryption('none');
    setAuthMethod('login');
    setUsername('');
    setPassword('');
    setDiscoveryStatus('idle');
    setSubmitFeedback(null);
    setValidationError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      {/* Header - Bild 3 Anforderung */}
      <header className="w-full max-w-4xl bg-primary-blue text-white p-4 flex justify-between items-center shadow-md mb-8 rounded-sm">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-md">
            <Settings className="text-primary-blue w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SMTP-Check</h1>
          </div>
        </div>
      </header>

      {/* Main Content Form - Bild 2 Anforderung */}
      <main className="w-full max-w-4xl flex-1">
        <div className="bg-white border border-primary-border shadow-md">
          <div className="p-6 border-b border-gray-100">
          </div>

          <div className="p-8 space-y-10">
            {submitFeedback && (
              <div className={`p-4 rounded border flex items-center gap-3 text-sm ${submitFeedback.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                {submitFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{submitFeedback.message}</span>
              </div>
            )}

            {/* Primäre Einstellungen */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary-blue mb-4">
                <Mail size={20} />
                <h3 className="font-bold text-sm tracking-wide uppercase">Primäre Einstellungen</h3>
              </div>

              <div className="grid grid-cols-[1fr,2fr] gap-4 items-center pl-8">
                <label className="text-sm font-semibold text-gray-700">Antwortadresse</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="z. B. benutzer@gmail.com"
                    className="w-full p-2.5 border border-primary-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-blue"
                  />
                  {isAutoDiscovering && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-blue"></div>
                    </div>
                  )}
                </div>
              </div>

              {discoveryStatus === 'success' && (
                <div className="ml-8 bg-green-50 border border-green-200 p-2.5 rounded-sm flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle2 size={16} />
                  <span>Provider erkannt. Standardeinstellungen wurden eingefügt.</span>
                </div>
              )}

              {discoveryStatus === 'derived' && (
                <div className="ml-8 bg-blue-50 border border-blue-200 p-2.5 rounded-sm flex items-center gap-2 text-blue-700 text-sm">
                  <CheckCircle2 size={16} />
                  <span>Domain nicht explizit in der Liste, Standardwerte wurden abgeleitet.</span>
                </div>
              )}

              <div className="grid grid-cols-[1fr,2fr] gap-4 items-center pl-8">
                <label className="text-sm font-semibold text-gray-700">Primäres SMTP-Gateway</label>
                <input
                  type="text"
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  className="w-full p-2.5 border border-primary-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div className="grid grid-cols-[1fr,2fr] gap-4 items-center pl-8">
                <label className="text-sm font-semibold text-gray-700">SMTP-Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value))}
                  className="w-full p-2.5 border border-primary-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div className="grid grid-cols-[1fr,2fr] gap-4 items-center pl-8">
                <label className="text-sm font-semibold text-gray-700">SSL/TLS verwenden</label>
                <select
                  value={encryption}
                  onChange={handleEncryptionChange}
                  className="w-full p-2.5 border border-primary-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-blue bg-white"
                >
                  <option value="none">Deaktiviert</option>
                  <option value="ssl">SSL/TLS</option>
                  <option value="starttls">STARTTLS</option>
                  <option value="tls">TLS</option>
                </select>
              </div>

              {validationError && (
                <div className="ml-8 bg-red-50 border border-red-200 p-3 rounded-sm flex items-start gap-2 text-red-700 text-sm mt-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </section>

            <hr className="border-gray-200" />

            {/* Authentifizierung */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary-blue mb-4">
                <Shield size={20} />
                <h3 className="font-bold text-sm tracking-wide uppercase">Authentifizierung</h3>
              </div>

              <div className="grid grid-cols-[1fr,2fr] gap-4 items-center pl-8">
                <label className="text-sm font-semibold text-gray-700">SMTP-Server-Authentifizierung</label>
                <select
                  value={authMethod}
                  onChange={(e) => setAuthMethod(e.target.value as any)}
                  className="w-full p-2.5 border border-primary-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-blue bg-white"
                >
                  <option value="none">Keine Authentifizierung erforderlich</option>
                  <option value="login">Login / Plain</option>
                </select>
              </div>

              {authMethod !== 'none' && (
                <>
                  <div className="grid grid-cols-[1fr,2fr] gap-4 items-center pl-8 mt-4">
                    <label className="text-sm font-semibold text-gray-700">Geräte-Benutzer-ID</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="z. B. Ihre E-Mail Adresse"
                      className="w-full p-2.5 border border-primary-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-blue"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr,2fr] gap-4 items-start pl-8">
                    <label className="text-sm font-semibold text-gray-700 mt-2.5">Geräte-Passwort</label>
                    <div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ihr Passwort oder App-Passwort"
                        className="w-full p-2.5 border border-primary-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-blue"
                      />
                      <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer w-max">
                        <input
                          type="checkbox"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                          className="w-4 h-4 cursor-pointer rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                        />
                        Passwort anzeigen
                      </label>
                    </div>
                  </div>
                  <div className="pl-8 text-xs text-gray-500 mt-2">
                    <p>Hinweis: Bei Google/Microsoft Konten mit 2-Faktor Authentifizierung benötigen Sie hier ein spezielles <strong>App-Passwort</strong> anstelle Ihres normalen Login-Passworts.</p>
                  </div>
                </>
              )}
            </section>

          </div>

          <div className="bg-gray-50 border-t border-primary-border p-5 flex justify-end gap-4">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 border border-gray-300 rounded-sm text-sm font-semibold bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Zurücksetzen
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-primary-blue text-white rounded-sm text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {isSubmitting ? 'Wird geprüft...' : 'Senden'}
            </button>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Universal Device Management. Alle Rechte vorbehalten.
        </footer>
      </main>
    </div>
  );
}
