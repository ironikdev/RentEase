import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

// Helper to load .env variables in Node environment
const loadEnvFile = () => {
  const env = {};
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.substring(1, value.length - 1);
          }
          if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
            value = value.substring(1, value.length - 1);
          }
          env[key] = value.trim();
        }
      });
    }
  } catch (e) {
    console.error('Failed to read .env file:', e);
  }
  return env;
};

const envVars = loadEnvFile();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/send-email' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', async () => {
              try {
                const { to, userName, propertyName, location, rent, propertyUrl } = JSON.parse(body);

                // Create a test account or use configured env credentials if available
                let transporter;
                const smtpHost = envVars.SMTP_HOST;
                const smtpPort = envVars.SMTP_PORT;
                const smtpUser = envVars.SMTP_USER;
                const smtpPass = envVars.SMTP_PASS;
                const smtpSecure = envVars.SMTP_SECURE;

                if (smtpHost && smtpUser && smtpPass) {
                  console.log(`[SMTP] Attempting connection to ${smtpHost}:${smtpPort} as ${smtpUser}...`);
                  transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: parseInt(smtpPort || '587'),
                    secure: smtpSecure === 'true',
                    auth: {
                      user: smtpUser,
                      pass: smtpPass,
                    },
                  });
                } else {
                  // Fallback: Create ethereal test account
                  const testAccount = await nodemailer.createTestAccount();
                  transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                      user: testAccount.user,
                      pass: testAccount.pass,
                    },
                  });
                }

                const mailOptions = {
                  from: '"RentEase Notifications" <notifications@rentease.com>',
                  to,
                  subject: 'Property Available Again',
                  text: `Hello ${userName},\n\nGood news! The property "${propertyName}" that you previously saved is now available for rent.\n\nProperty Details:\n\nProperty Name: ${propertyName}\nLocation: ${location}\nRent: ${rent}\n\nClick below to view the property:\n${propertyUrl}\n\nThank you for using our platform.`,
                  html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                      <h2 style="color: #10b981; margin-top: 0; font-size: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Property Available Again</h2>
                      <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello <strong>${userName}</strong>,</p>
                      <p style="font-size: 15px; line-height: 1.5; color: #334155;">Good news! The property "<strong>${propertyName}</strong>" that you previously saved is now available for rent.</p>
                      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px;">Property Details:</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                          <tr>
                            <td style="padding: 6px 0; font-weight: bold; width: 130px; color: #64748b;">Property Name:</td>
                            <td style="padding: 6px 0; font-weight: 500;">${propertyName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Location:</td>
                            <td style="padding: 6px 0; font-weight: 500;">${location}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Rent:</td>
                            <td style="padding: 6px 0; font-weight: bold; color: #10b981;">${rent}</td>
                          </tr>
                        </table>
                      </div>
                      <p style="margin: 25px 0; text-align: center;">
                        <a href="${propertyUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">View Property Details</a>
                      </p>
                      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-t: 1px solid #f1f5f9; padding-top: 15px; text-align: center;">Thank you for choosing RentEase.</p>
                    </div>
                  `
                };

                const info = await transporter.sendMail(mailOptions);
                console.log(`[Email Sent] Message ID: ${info.messageId}`);
                
                // Get Ethereal preview link if using test account
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                  console.log(`[Ethereal Preview URL] ${previewUrl}`);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  success: true, 
                  messageId: info.messageId,
                  previewUrl: previewUrl || null
                }));
              } catch (err) {
                console.error('[Email Error]', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})
