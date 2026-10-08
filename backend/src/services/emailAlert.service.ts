import fs from 'fs';
import path from 'path';
import tls from 'tls';
import net from 'net';
import { config } from '../config';
import { logger } from '../utils/logger';
import { emitToOrg } from '../sockets/socket.server';
import { prisma } from '../database/prisma';

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  category: 'TASK_ALERT' | 'INCIDENT_ALERT' | 'MAJOR_CHANGE' | 'TEST_MAIL' | 'SECURITY';
  status: 'DELIVERED_LOCAL' | 'DELIVERED_SMTP' | 'FAILED';
  previewPath?: string;
  htmlContent: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

// In-memory ring buffer of recent email dispatches (last 100)
const emailLogsBuffer: EmailLogEntry[] = [];

export class AdminEmailAlertService {
  private static readonly ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'mozework11@gmail.com';
  private static readonly OUTBOX_DIR = path.resolve(config.LOCAL_STORAGE_PATH, 'mail-outbox');

  private static ensureOutboxExists() {
    if (!fs.existsSync(this.OUTBOX_DIR)) {
      fs.mkdirSync(this.OUTBOX_DIR, { recursive: true });
    }
  }

  /**
   * Primary Dispatch Method: Sends to mozework11@gmail.com
   * Handles local zero-cost rendering, file outbox persistence, and optional live SMTP
   */
  public static async sendAlertEmail(payload: {
    subject: string;
    category: 'TASK_ALERT' | 'INCIDENT_ALERT' | 'MAJOR_CHANGE' | 'TEST_MAIL' | 'SECURITY';
    headline: string;
    preheader: string;
    badgeText: string;
    badgeColor: string; // e.g. '#2563eb', '#dc2626', '#f59e0b', '#10b981'
    detailsTable: Array<{ label: string; value: string }>;
    descriptionText: string;
    actionUrl: string;
    actionText: string;
    organizationId?: string;
    metadata?: Record<string, any>;
  }): Promise<EmailLogEntry> {
    const targetEmail = this.ADMIN_EMAIL;
    const emailId = `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    // 1. Generate Responsive Modern HTML Email Template
    const html = this.buildHtmlTemplate({
      ...payload,
      recipientEmail: targetEmail,
      timestamp,
      emailId,
    });

    // 2. Persist to local outbox HTML file for 100% free inspection
    this.ensureOutboxExists();
    const fileName = `${timestamp.replace(/[:.]/g, '-')}_${payload.category}_${emailId}.html`;
    const filePath = path.join(this.OUTBOX_DIR, fileName);

    try {
      fs.writeFileSync(filePath, html, 'utf8');
    } catch (err: any) {
      logger.warn(`Could not save email to outbox: ${err.message}`);
    }

    // 3. Attempt native SMTP delivery if SMTP variables are configured
    let deliveryStatus: 'DELIVERED_LOCAL' | 'DELIVERED_SMTP' | 'FAILED' = 'DELIVERED_LOCAL';
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await this.sendViaNativeSmtp({
          to: targetEmail,
          from: config.EMAIL_FROM || 'alerts@opsflow.io',
          subject: payload.subject,
          html,
        });
        deliveryStatus = 'DELIVERED_SMTP';
        logger.info(`[AdminEmailAlert] 🚀 Live SMTP Email delivered to ${targetEmail}: "${payload.subject}"`);
      } catch (smtpErr: any) {
        logger.warn(`[AdminEmailAlert] SMTP delivery failed, retained in local outbox: ${smtpErr.message}`);
      }
    } else {
      logger.info(`[AdminEmailAlert] 📧 [AUTOMATED DISPATCH] Sent to Admin (${targetEmail}): "${payload.subject}" (Saved to ${fileName})`);
    }

    // 4. Record to email logs buffer
    const logEntry: EmailLogEntry = {
      id: emailId,
      to: targetEmail,
      subject: payload.subject,
      category: payload.category,
      status: deliveryStatus,
      previewPath: `/uploads/mail-outbox/${fileName}`,
      htmlContent: html,
      createdAt: timestamp,
      metadata: payload.metadata,
    };

    emailLogsBuffer.unshift(logEntry);
    if (emailLogsBuffer.length > 100) emailLogsBuffer.pop();

    // 5. Broadcast real-time socket event so the UI updates live
    if (payload.organizationId) {
      emitToOrg(payload.organizationId, 'email:dispatched', {
        id: emailId,
        to: targetEmail,
        subject: payload.subject,
        category: payload.category,
        timestamp,
        previewUrl: logEntry.previewPath,
      });
    }

    return logEntry;
  }

  // =========================================================================
  // AUTOMATED HOOK: TASK EVENTS (Task Added, Updated, Status Changed)
  // =========================================================================
  public static async notifyTaskEvent(params: {
    action: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'TASK_DELETED';
    task: any;
    actor: { firstName?: string; lastName?: string; email: string };
    organizationId: string;
  }) {
    const { action, task, actor, organizationId } = params;
    const actorName = actor.firstName ? `${actor.firstName} ${actor.lastName}` : actor.email;

    const actionTitles: Record<string, string> = {
      TASK_CREATED: `📋 New Task Created: [${task.taskCode}] ${task.title}`,
      TASK_UPDATED: `📝 Task Updated: [${task.taskCode}] ${task.title}`,
      TASK_ASSIGNED: `👤 Task Assigned: [${task.taskCode}] ${task.title}`,
      TASK_COMPLETED: `✅ Task Completed: [${task.taskCode}] ${task.title}`,
      TASK_DELETED: `🗑️ Task Deleted: [${task.taskCode}] ${task.title}`,
    };

    const badgeColors: Record<string, string> = {
      URGENT: '#dc2626',
      HIGH: '#ea580c',
      MEDIUM: '#2563eb',
      LOW: '#64748b',
    };

    await this.sendAlertEmail({
      subject: actionTitles[action] || `Task Notification: ${task.taskCode}`,
      category: 'TASK_ALERT',
      headline: actionTitles[action] || `Task Activity on ${task.taskCode}`,
      preheader: `Admin Alert: Task activity by ${actorName}`,
      badgeText: `${task.priority || 'NORMAL'} PRIORITY &bull; ${task.status || 'ACTIVE'}`,
      badgeColor: badgeColors[task.priority] || '#2563eb',
      descriptionText: task.description || 'No detailed description provided.',
      detailsTable: [
        { label: 'Task Identifier', value: task.taskCode || task.id },
        { label: 'Task Title', value: task.title },
        { label: 'Priority / Status', value: `${task.priority} / ${task.status}` },
        { label: 'Assigned Engineer', value: task.assignedTo?.email || task.assignedTo?.firstName || 'Unassigned' },
        { label: 'Department', value: task.department?.name || 'General Operations' },
        { label: 'Action Initiated By', value: `${actorName} (${actor.email})` },
        { label: 'Due Date', value: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline' },
      ],
      actionUrl: `${config.FRONTEND_URL}/tasks?search=${encodeURIComponent(task.taskCode || '')}`,
      actionText: 'View Task in OpsFlow',
      organizationId,
      metadata: { taskId: task.id, taskCode: task.taskCode, action },
    });
  }

  // =========================================================================
  // AUTOMATED HOOK: INCIDENT & SRE ALERTS (Alert Opened, SEV Escalated)
  // =========================================================================
  public static async notifyIncidentEvent(params: {
    action: 'INCIDENT_OPENED' | 'SEVERITY_ESCALATED' | 'SLA_BREACH_WARNING' | 'INCIDENT_RESOLVED' | 'WAR_ROOM_UPDATE';
    incident: any;
    actor: { firstName?: string; lastName?: string; email: string };
    organizationId: string;
    details?: string;
  }) {
    const { action, incident, actor, organizationId, details } = params;
    const actorName = actor.firstName ? `${actor.firstName} ${actor.lastName}` : actor.email;

    const actionTitles: Record<string, string> = {
      INCIDENT_OPENED: `🚨 [${incident.severity}] Production Incident Opened: ${incident.incidentCode}`,
      SEVERITY_ESCALATED: `🔥 Severity Escalation: ${incident.incidentCode} [${incident.severity}]`,
      SLA_BREACH_WARNING: `⚠️ SLA Breach Alert: ${incident.incidentCode} SLA expiring soon!`,
      INCIDENT_RESOLVED: `✨ Incident Resolved: ${incident.incidentCode} - ${incident.title}`,
      WAR_ROOM_UPDATE: `💬 SRE War Room Update: ${incident.incidentCode}`,
    };

    const sevColors: Record<string, string> = {
      CRITICAL: '#dc2626',
      HIGH: '#ea580c',
      MEDIUM: '#d97706',
      LOW: '#2563eb',
    };

    await this.sendAlertEmail({
      subject: actionTitles[action] || `SRE Alert: ${incident.incidentCode}`,
      category: 'INCIDENT_ALERT',
      headline: actionTitles[action] || `Incident Alert: ${incident.incidentCode}`,
      preheader: `CRITICAL SRE ALERT: ${incident.severity} Outage reported by ${actorName}`,
      badgeText: `${incident.severity} SEVERITY &bull; SLA: ${incident.slaHours || 4} HOURS`,
      badgeColor: sevColors[incident.severity] || '#dc2626',
      descriptionText: details || incident.description || 'Production system disruption registered in OpsFlow.',
      detailsTable: [
        { label: 'Incident Code', value: incident.incidentCode },
        { label: 'Incident Title', value: incident.title },
        { label: 'Severity Level', value: incident.severity },
        { label: 'Current Status', value: incident.status },
        { label: 'Target Department', value: incident.department?.name || 'Infrastructure & SRE' },
        { label: 'Reported By', value: `${actorName} (${actor.email})` },
        { label: 'Lead Assigned SRE', value: incident.assignedEmployee?.email || 'Unassigned (Needs Triage)' },
      ],
      actionUrl: `${config.FRONTEND_URL}/incidents?search=${encodeURIComponent(incident.incidentCode || '')}`,
      actionText: 'Open Incident War Room',
      organizationId,
      metadata: { incidentId: incident.id, incidentCode: incident.incidentCode, severity: incident.severity },
    });
  }

  // =========================================================================
  // AUTOMATED HOOK: MAJOR SYSTEM & SECURITY CHANGES
  // =========================================================================
  public static async notifyMajorChangeEvent(params: {
    category: 'SECURITY_2FA' | 'ROLE_CHANGED' | 'AUTOMATION_EXECUTED' | 'DEPARTMENT_UPDATED' | 'SESSION_GOVERNANCE';
    title: string;
    description: string;
    actor: { firstName?: string; lastName?: string; email: string };
    organizationId: string;
    metadataTable?: Array<{ label: string; value: string }>;
  }) {
    const { category, title, description, actor, organizationId, metadataTable = [] } = params;
    const actorName = actor.firstName ? `${actor.firstName} ${actor.lastName}` : actor.email;

    await this.sendAlertEmail({
      subject: `🛡️ Security & Governance Alert: ${title}`,
      category: 'MAJOR_CHANGE',
      headline: title,
      preheader: `Security event logged by ${actorName}`,
      badgeText: `SECURITY EVENT &bull; ${category}`,
      badgeColor: '#7c3aed',
      descriptionText: description,
      detailsTable: [
        { label: 'Event Classification', value: category },
        { label: 'Triggered By Actor', value: `${actorName} (${actor.email})` },
        { label: 'Timestamp (UTC)', value: new Date().toISOString() },
        ...metadataTable,
      ],
      actionUrl: `${config.FRONTEND_URL}/profile`,
      actionText: 'Review Security & Audit Logs',
      organizationId,
      metadata: { category, title },
    });
  }

  public static getEmailLogs(limit = 50): EmailLogEntry[] {
    return emailLogsBuffer.slice(0, limit);
  }

  // =========================================================================
  // EMAIL TEMPLATE BUILDER (Crisp, High-DPI, Enterprise Styling)
  // =========================================================================
  private static buildHtmlTemplate(p: {
    headline: string;
    preheader: string;
    badgeText: string;
    badgeColor: string;
    detailsTable: Array<{ label: string; value: string }>;
    descriptionText: string;
    actionUrl: string;
    actionText: string;
    recipientEmail: string;
    timestamp: string;
    emailId: string;
  }): string {
    const rowsHtml = p.detailsTable
      .map(
        (row, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 9px 12px; font-weight: 600; color: #475569; font-size: 13px; border-bottom: 1px solid #e2e8f0; width: 35%;">${row.label}</td>
          <td style="padding: 9px 12px; color: #0f172a; font-size: 13px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${row.value}</td>
        </tr>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${p.headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <span style="display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
    ${p.preheader}
  </span>

  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 30px; border-bottom: 3px solid ${p.badgeColor};">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      ⚡ NexusCloud <span style="color: #38bdf8;">OpsFlow</span>
                    </div>
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-top: 2px;">
                      Automated Enterprise Command Alert
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: ${p.badgeColor}20; color: ${p.badgeColor}; border: 1px solid ${p.badgeColor}60; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
                      ${p.badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 30px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -0.3px; line-height: 1.3;">
                ${p.headline}
              </h1>

              <div style="background-color: #f1f5f9; border-left: 4px solid ${p.badgeColor}; padding: 14px 16px; border-radius: 0 6px 6px 0; margin-bottom: 24px;">
                <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.5;">
                  ${p.descriptionText}
                </p>
              </div>

              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px;">
                Event Parameters &amp; Metadata
              </div>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 28px; border-collapse: collapse;">
                ${rowsHtml}
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${p.actionUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                      ${p.actionText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                Automated notification dispatched directly to Designated Admin: <strong style="color: #0f172a;">${p.recipientEmail}</strong>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Ref ID: ${p.emailId} &bull; Generated at ${p.timestamp} &bull; 100% Free &amp; Local OpsFlow Engine
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // =========================================================================
  // NATIVE SMTP SOCKET CLIENT (Pure Node.js TLS - Zero External Dependencies)
  // =========================================================================
  private static async sendViaNativeSmtp(options: {
    to: string;
    from: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    return new Promise((resolve, reject) => {
      const socket = tls.connect(
        {
          host,
          port,
          rejectUnauthorized: false,
        },
        () => {
          let step = 0;

          const sendCmd = (cmd: string) => {
            socket.write(cmd + '\r\n');
          };

          socket.on('data', (data) => {
            const res = data.toString();

            if (step === 0 && res.startsWith('220')) {
              step = 1;
              sendCmd(`EHLO localhost`);
            } else if (step === 1 && res.startsWith('250')) {
              step = 2;
              sendCmd(`AUTH LOGIN`);
            } else if (step === 2 && res.startsWith('334')) {
              step = 3;
              sendCmd(Buffer.from(user).toString('base64'));
            } else if (step === 3 && res.startsWith('334')) {
              step = 4;
              sendCmd(Buffer.from(pass).toString('base64'));
            } else if (step === 4 && res.startsWith('235')) {
              step = 5;
              sendCmd(`MAIL FROM:<${options.from}>`);
            } else if (step === 5 && res.startsWith('250')) {
              step = 6;
              sendCmd(`RCPT TO:<${options.to}>`);
            } else if (step === 6 && res.startsWith('250')) {
              step = 7;
              sendCmd(`DATA`);
            } else if (step === 7 && res.startsWith('354')) {
              step = 8;
              const rawMessage = [
                `From: OpsFlow Alerts <${options.from}>`,
                `To: <${options.to}>`,
                `Subject: ${options.subject}`,
                `MIME-Version: 1.0`,
                `Content-Type: text/html; charset=UTF-8`,
                ``,
                options.html,
                `.`,
              ].join('\r\n');
              sendCmd(rawMessage);
            } else if (step === 8 && res.startsWith('250')) {
              step = 9;
              sendCmd(`QUIT`);
              socket.end();
              resolve();
            } else if (res.startsWith('5') || res.startsWith('4')) {
              socket.end();
              reject(new Error(`SMTP Error at step ${step}: ${res.trim()}`));
            }
          });

          socket.on('error', (err) => {
            reject(err);
          });
        }
      );

      socket.setTimeout(8000, () => {
        socket.destroy();
        reject(new Error('SMTP connection timed out after 8000ms'));
      });
    });
  }
}
