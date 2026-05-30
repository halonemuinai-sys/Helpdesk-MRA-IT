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

  const subject = `[MRA IT Helpdesk] Tiket Baru Terdaftar: ${ticket.id} - ${ticket.title}`;
  
  const formattedDate = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
  const responseTarget = ticket.slaResponseLimit ? new Date(ticket.slaResponseLimit).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
  const resolutionTarget = ticket.slaResolutionLimit ? new Date(ticket.slaResolutionLimit).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';

  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #1d4ed8; margin: 0 0 5px 0; font-size: 22px;">MRA IT HELPDESK</h2>
        <span style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Konfirmasi Registrasi Tiket</span>
      </div>

      <!-- Greeting -->
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">Halo <strong>${ticket.requester.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #475569;">
        Kami informasikan bahwa pengaduan / laporan kendala IT Anda telah berhasil terdaftar di sistem pusat IT Helpdesk MRA Group dengan detail sebagai berikut:
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
            <td style="padding: 6px 0; color: #1e293b;">${ticket.title}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Kategori:</td>
            <td style="padding: 6px 0; color: #1e293b;">${ticket.category} ${ticket.subCategory && ticket.subCategory !== '-' ? `(${ticket.subCategory})` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Prioritas:</td>
            <td style="padding: 6px 0; color: #1e293b;">
              <span style="font-weight: bold; color: ${ticket.priority === 'HIGH' ? '#ef4444' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#3b82f6'};">${ticket.priority}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Sumber Laporan:</td>
            <td style="padding: 6px 0; color: #1e293b;">${ticket.source || 'System'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Waktu Kejadian:</td>
            <td style="padding: 6px 0; color: #1e293b;">${formattedDate}</td>
          </tr>
        </table>
      </div>

      <!-- SLA Commitments -->
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #1e3a8a;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1d4ed8; font-weight: bold;">🎯 Komitmen Target Layanan (SLA):</h4>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
          <li><strong>Target Respon Pertama:</strong> Sebelum ${responseTarget} (IT Agent akan memberikan tanggapan awal).</li>
          <li><strong>Target Penyelesaian Masalah:</strong> Sebelum ${resolutionTarget} (Estimasi tiket diselesaikan).</li>
        </ul>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
        IT Support Engineer kami akan segera menganalisis laporan Anda dan menghubungi Anda untuk koordinasi lebih lanjut jika diperlukan.
      </p>

      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8;">
        <p style="margin: 0 0 5px 0;">Terima Kasih atas Kerjasamanya.</p>
        <p style="margin: 0; font-weight: bold;">MRA Group IT Infrastructure & Support Team</p>
        <p style="margin: 5px 0 0 0; color: #cbd5e1;">Pesan ini dibuat secara otomatis oleh sistem, mohon tidak membalas email ini.</p>
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
