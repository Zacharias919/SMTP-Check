import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const dbPath = path.join(__dirname, 'database.json');

  app.get('/api/smtp-config', async (req, res) => {
    try {
      const data = await fs.readFile(dbPath, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      res.json(null); // File doesn't exist yet
    }
  });

  // API Endpoint für SMTP-Konfiguration
  app.post('/api/smtp-config', async (req, res) => {
    const { email, smtpServer, port, encryption, authMethod, username, password } = req.body;

    // Passwort niemals im Klartext loggen!
    console.log(`[SMTP-Test] Versuche Verbindung zu ${smtpServer}:${port} (${encryption})`);
    console.log(`[SMTP-Test] Authentifizierung: ${authMethod}, Benutzer: ${username}`);

    try {
      const transporter = nodemailer.createTransport({
        host: smtpServer,
        port: port,
        secure: encryption === 'ssl', // true für 465, false für andere Ports
        auth: authMethod !== 'none' ? {
          user: username,
          pass: password,
        } : undefined,
        tls: {
          // In einer echten Umgebung sollte man Zertifikate validieren, 
          // aber für Tests ist oft ein flexiblerer Umgang nötig.
          rejectUnauthorized: false 
        }
      });

      // Verbindung testen
      await transporter.verify();
      
      const configToSave = { email, smtpServer, port, encryption, authMethod, username };
      await fs.writeFile(dbPath, JSON.stringify(configToSave, null, 2));

      console.log(`[SMTP-Test] Verbindung erfolgreich für ${smtpServer}`);
      res.json({ success: true, message: 'Verbindung erfolgreich hergestellt und in Datenbank (database.json) gespeichert!' });
    } catch (error: any) {
      console.error(`[SMTP-Test] Fehler bei der Verbindung zu ${smtpServer}:`, error.message);
      res.status(500).json({ 
        success: false, 
        message: 'Verbindung fehlgeschlagen: ' + error.message 
      });
    }
  });

  // Vite-Middleware für die Entwicklung
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
  });
}

startServer();
