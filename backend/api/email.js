const nodemailer = require('nodemailer');

// Initialize Nodemailer SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.bizmail.yahoo.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true for port 465 SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Ensure we set timeout configurations
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 15000
});

// Helper to send general emails
async function sendMail({ to, subject, html }) {
  const mailOptions = {
    from: `MRA IT Helpdesk <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('Nodemailer error sending email:', err.message);
    throw err;
  }
}

// 1. Send Ticket Created Confirmation Email to Requester
async function sendTicketCreatedEmail(ticket) {
  if (!ticket || !ticket.requester || !ticket.requester.email) {
    console.log('Skipping Ticket Created Email: requester email not found.');
    return;
  }

  const subject = `[MRA IT Helpdesk] New Ticket Registered: ${ticket.id} - ${ticket.title}`;
  
  const formattedDate = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }) : '-';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
      
      <!-- Top Accent Bar -->
      <div style="height: 6px; background-color: #0ea5e9;"></div>

      <!-- Header -->
      <div style="padding: 32px 24px 24px 24px; text-align: center; background-color: #fafafa;">
        <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MRA IT HELPDESK</h2>
        <span style="font-size: 11px; color: #0ea5e9; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; background-color: #e0f2fe; padding: 4px 10px; border-radius: 9999px;">Ticket Registration Confirmation</span>
      </div>

      <!-- Content Area -->
      <div style="padding: 24px 32px 32px 32px;">
        <!-- Greeting -->
        <p style="font-size: 15px; line-height: 1.6; color: #1e293b; margin: 0 0 12px 0;">Hello <strong>${ticket.requester.name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
          Your IT support ticket has been successfully registered in the MRA Group Helpdesk system. Here are the ticket details for your reference:
        </p>

        <!-- Details Card -->
        <div style="background-color: #f8fafc; border-left: 4px solid #0ea5e9; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; border-radius: 0 12px 12px 0; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; width: 35%; border-bottom: 1px dashed #e2e8f0;">Ticket ID</td>
              <td style="padding: 8px 0; font-weight: bold; color: #0f172a; font-size: 14px; border-bottom: 1px dashed #e2e8f0;">${ticket.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; border-bottom: 1px dashed #e2e8f0;">Subject / Issue</td>
              <td style="padding: 8px 0; color: #334155; border-bottom: 1px dashed #e2e8f0;">${ticket.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; border-bottom: 1px dashed #e2e8f0;">Category</td>
              <td style="padding: 8px 0; color: #334155; border-bottom: 1px dashed #e2e8f0;">${ticket.category} ${ticket.subCategory && ticket.subCategory !== '-' ? `(${ticket.subCategory})` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; border-bottom: 1px dashed #e2e8f0;">Priority</td>
              <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
                <span style="font-weight: bold; color: ${ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#0ea5e9'}; font-size: 12px; background-color: ${ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#fef2f2' : ticket.priority === 'MEDIUM' ? '#fffbeb' : '#f0f9ff'}; padding: 2px 8px; border-radius: 4px; display: inline-block;">${ticket.priority}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; border-bottom: 1px dashed #e2e8f0;">Source</td>
              <td style="padding: 8px 0; color: #334155; border-bottom: 1px dashed #e2e8f0;">${ticket.source || 'System'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Created At</td>
              <td style="padding: 8px 0; color: #334155;">${formattedDate}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 32px 0; font-style: italic;">
          Our IT Support Engineers will review and analyze your request. You will receive email notifications as the ticket status is updated.
        </p>

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
          <p style="margin: 0 0 4px 0; font-weight: bold; color: #64748b;">MRA Group IT Infrastructure & Support Team</p>
          <p style="margin: 0; color: #cbd5e1;">This is an automated system notification. Please do not reply directly to this email.</p>
        </div>
      </div>

    </div>
  `;

  return sendMail({ to: ticket.requester.email, subject, html }).catch(err => {
    // Suppress error so backend process isn't interrupted if email delivery fails
    console.error('Suppressed sendTicketCreatedEmail error:', err.message);
  });
}

// 2. Send Ticket Status Updated Notification Email to Requester
async function sendTicketStatusChangedEmail(ticket, oldStatus, newStatus, comment) {
  if (!ticket || !ticket.requester || !ticket.requester.email) {
    console.log('Skipping Ticket Status Updated Email: requester email not found.');
    return;
  }

  const subject = `[MRA IT Helpdesk] Pembaruan Tiket ${ticket.id}: Status Menjadi ${newStatus}`;
  
  const statusColorMap = {
    'OPEN': '#3b82f6',
    'IN_PROGRESS': '#6366f1',
    'PENDING': '#f59e0b',
    'RESOLVED': '#10b981',
    'CLOSED': '#64748b'
  };

  const statusNameMap = {
    'OPEN': 'Terbuka (Open)',
    'IN_PROGRESS': 'Sedang Dikerjakan (In Progress)',
    'PENDING': 'Ditangguhkan (Pending/Paused)',
    'RESOLVED': 'Selesai (Resolved)',
    'CLOSED': 'Ditutup (Closed)'
  };

  const statusColor = statusColorMap[newStatus] || '#1e293b';
  const statusName = statusNameMap[newStatus] || newStatus;
  const updateTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  // Additional detail depending on RESOLVED
  let statusInfoMsg = '';
  if (newStatus === 'RESOLVED') {
    statusInfoMsg = `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 13px; color: #065f46; text-align: center;">
        🎉 <strong>Hore! Masalah Anda Telah Terselesaikan</strong><br/>
        Tiket Anda sudah diselesaikan oleh tim IT Support kami pada <strong>${updateTime}</strong>. 
        Apabila kendala masih terjadi, silakan hubungi tim IT Support untuk melakukan peninjauan kembali.
      </div>
    `;
  } else if (newStatus === 'PENDING') {
    statusInfoMsg = `
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 13px; color: #92400e;">
        ⚠️ <strong>SLA Tiket Ditangguhkan Sementara (Paused)</strong><br/>
        Tiket Anda ditangguhkan karena membutuhkan respon balik dari Anda (user), menunggu ketersediaan barang/sparepart, atau kendala eksternal dari pihak ketiga (vendor). SLA pengerjaan akan kembali aktif setelah kendala terselesaikan.
      </div>
    `;
  }

  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid ${statusColor}; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #1e293b; margin: 0 0 5px 0; font-size: 20px;">PEMBARUAN TIKET: ${ticket.id}</h2>
        <span style="font-size: 12px; color: ${statusColor}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Status: ${statusName}</span>
      </div>

      <!-- Greeting -->
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">Halo <strong>${ticket.requester.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        Kami menginformasikan bahwa status pengaduan IT Anda telah diperbarui oleh tim IT Support kami.
      </p>

      <!-- Status Info Banner -->
      ${statusInfoMsg}

      <!-- Details Card -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 35%;">ID Tiket:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #1e293b;">${ticket.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Subjek / Masalah:</td>
            <td style="padding: 6px 0; color: #1e293b;">${ticket.title}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Status Sebelumnya:</td>
            <td style="padding: 6px 0; color: #64748b; text-decoration: line-through;">${oldStatus}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Status Baru:</td>
            <td style="padding: 6px 0; font-weight: bold; color: ${statusColor};">${statusName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Waktu Pembaruan:</td>
            <td style="padding: 6px 0; color: #1e293b;">${updateTime}</td>
          </tr>
          ${ticket.assignedTo ? `
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Ditangani Oleh:</td>
            <td style="padding: 6px 0; color: #1e293b;">${ticket.assignedTo.name} (IT Support)</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Action Note / Comment -->
      ${comment ? `
      <div style="border-left: 4px solid ${statusColor}; background-color: #f1f5f9; padding: 12px; border-radius: 4px; font-size: 13px; color: #334155; margin-bottom: 20px; font-style: italic;">
        <strong>Catatan dari IT Support:</strong><br/>
        "${comment}"
      </div>` : ''}

      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8; margin-top: 25px;">
        <p style="margin: 0; font-weight: bold;">MRA Group IT Infrastructure & Support Team</p>
        <p style="margin: 5px 0 0 0; color: #cbd5e1;">Pesan ini dibuat secara otomatis oleh sistem, mohon tidak membalas email ini.</p>
      </div>

    </div>
  `;

  return sendMail({ to: ticket.requester.email, subject, html }).catch(err => {
    console.error('Suppressed sendTicketStatusChangedEmail error:', err.message);
  });
}

// 3. Send Ticket Assigned Notification Email to IT Agent
async function sendTicketAssignedEmail(ticket, agent) {
  if (!ticket || !agent || !agent.email) {
    console.log('Skipping Ticket Assigned Email: agent email not found.');
    return;
  }

  const subject = `[MRA IT Helpdesk] Penugasan Tiket Baru: ${ticket.id} - ${ticket.title}`;
  const formattedDate = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
  const responseTarget = ticket.slaResponseLimit ? new Date(ticket.slaResponseLimit).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
  const resolutionTarget = ticket.slaResolutionLimit ? new Date(ticket.slaResolutionLimit).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';

  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #4f46e5; margin: 0 0 5px 0; font-size: 20px;">PENUGASAN TIKET BARU</h2>
        <span style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Pemberitahuan untuk IT Support Agent</span>
      </div>

      <!-- Greeting -->
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">Halo <strong>${agent.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        Sebuah tiket baru telah dialokasikan / ditugaskan kepada Anda untuk ditindaklanjuti. Harap berikan tanggapan pertama (*first response*) tepat waktu untuk mencegah *SLA Breach*.
      </p>

      <!-- Details Card -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 35%;">ID Tiket:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #1e293b; font-size: 14px;">${ticket.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Subjek / Masalah:</td>
            <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${ticket.title}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Kategori / Detail:</td>
            <td style="padding: 6px 0; color: #1e293b;">${ticket.category} - ${ticket.subCategory || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Prioritas:</td>
            <td style="padding: 6px 0; color: #ef4444; font-weight: bold;">${ticket.priority}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Pelapor (User):</td>
            <td style="padding: 6px 0; color: #1e293b;">${ticket.requester.name} (${ticket.requester.department})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Perusahaan & Cabang:</td>
            <td style="padding: 6px 0; color: #1e293b;">${ticket.company.name} (${ticket.company.location})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Waktu Masuk:</td>
            <td style="padding: 6px 0; color: #1e293b;">${formattedDate}</td>
          </tr>
        </table>
      </div>

      <!-- Description Block -->
      <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px; color: #334155; margin-bottom: 20px;">
        <strong>Deskripsi Masalah:</strong><br/>
        <p style="margin: 5px 0 0 0; line-height: 1.5; white-space: pre-line;">${ticket.description}</p>
      </div>

      <!-- SLA Commitments -->
      <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #9b2c2c;">
        <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #c53030; font-weight: bold;">⏰ Target Waktu Penanganan (SLA):</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 4px 0; width: 45%;"><strong>Target Respon Pertama:</strong></td>
            <td style="padding: 4px 0;">${responseTarget}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Target Resolusi Selesai:</strong></td>
            <td style="padding: 4px 0;">${resolutionTarget}</td>
          </tr>
        </table>
      </div>

      <!-- Button Link (Redirect to Dashboard Tickets Page) -->
      <div style="text-align: center; margin: 25px 0 15px 0;">
        <a href="http://localhost:5173/tickets" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
          Buka Tickets List Dashboard
        </a>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8; margin-top: 25px;">
        <p style="margin: 0; font-weight: bold;">MRA Group IT Infrastructure & Support Team</p>
        <p style="margin: 5px 0 0 0; color: #cbd5e1;">Pesan ini dibuat secara otomatis oleh sistem helpdesk.</p>
      </div>

    </div>
  `;

  return sendMail({ to: agent.email, subject, html }).catch(err => {
    console.error('Suppressed sendTicketAssignedEmail error:', err.message);
  });
}

module.exports = {
  transporter,
  sendTicketCreatedEmail,
  sendTicketStatusChangedEmail,
  sendTicketAssignedEmail
};
