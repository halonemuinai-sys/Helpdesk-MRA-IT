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

// Shared email footer template
const EMAIL_FOOTER_HTML = `
        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <p style="margin: 0 0 4px 0; font-weight: bold; color: #0f172a; font-size: 12px;">IT MRA - Service Helpdesk</p>
          <p style="margin: 0 0 2px 0;">Wisma MRA Lt.6</p>
          <p style="margin: 0 0 2px 0;">Telp: +62 (21) 2765 1957 ext 6637;&nbsp; | &nbsp;Email: <a href="mailto:helpdesk@mra.co.id" style="color: #0ea5e9; text-decoration: none;">helpdesk@mra.co.id</a></p>
          <p style="margin: 0 0 16px 0;">Working hours: Monday - Friday (excluding Public Holidays) 9 a.m to 5 p.m.</p>
          <p style="margin: 0; font-size: 10px; color: #94a3b8; border-top: 1px dashed #f1f5f9; padding-top: 12px;">This is an automated system notification. Please do not reply directly to this email.</p>
        </div>
`;

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

        ${EMAIL_FOOTER_HTML}
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
    'OPEN': '#2563eb',
    'IN_PROGRESS': '#1d4ed8',
    'PENDING': '#d97706',
    'RESOLVED': '#16a34a',
    'CLOSED': '#4b5563'
  };

  const statusNameMap = {
    'OPEN': 'Terbuka (Open)',
    'IN_PROGRESS': 'Sedang Dikerjakan (In Progress)',
    'PENDING': 'Ditangguhkan (Pending / Paused)',
    'RESOLVED': 'Selesai (Resolved)',
    'CLOSED': 'Ditutup (Closed)'
  };

  const statusColor = statusColorMap[newStatus] || '#2563eb';
  const statusName = statusNameMap[newStatus] || newStatus;
  const updateTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  // Map explanation text
  let explanationText = '';
  if (newStatus === 'IN_PROGRESS') {
    explanationText = 'Tiket Anda saat ini sedang ditangani oleh tim kami. Kami akan terus memberikan update dan menginformasikan jika ada perkembangan lebih lanjut.';
  } else if (newStatus === 'PENDING') {
    explanationText = 'Pengerjaan tiket Anda ditangguhkan sementara karena membutuhkan respon balik dari Anda (user), menunggu ketersediaan barang/sparepart, atau kendala eksternal dari pihak ketiga (vendor).';
  } else if (newStatus === 'RESOLVED') {
    explanationText = 'Masalah Anda telah diselesaikan oleh tim IT Support kami. Silakan periksa kembali perangkat atau layanan Anda. Jika masih ada kendala, Anda dapat merespon kembali.';
  } else if (newStatus === 'OPEN') {
    explanationText = 'Tiket Anda telah terdaftar di sistem kami dan sedang menunggu alokasi ke teknisi IT Support.';
  } else {
    explanationText = 'Status tiket Anda telah diperbarui. Tim kami akan terus memantau pengerjaan tiket ini hingga selesai.';
  }

  const HEADER_LAPTOP_SVG = `
    <svg width="150" height="100" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="15" width="170" height="105" rx="8" fill="#1e3a8a" stroke="#ffffff" stroke-width="4"/>
      <rect x="30" y="20" width="160" height="95" rx="4" fill="#0f172a"/>
      <path d="M10 120 L210 120 L200 132 L20 132 Z" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="110" cy="62" r="22" fill="none" stroke="#3b82f6" stroke-width="6" stroke-dasharray="10 4"/>
      <circle cx="110" cy="62" r="14" fill="#3b82f6"/>
      <circle cx="110" cy="62" r="6" fill="#0f172a"/>
      <rect x="55" y="94" width="110" height="8" rx="4" fill="#1e293b"/>
      <rect x="55" y="94" width="75" height="8" rx="4" fill="#3b82f6"/>
      <path d="M182 28 C182 22, 197 22, 197 28 C197 34, 189 34, 185 37 L183 40 L183 35 C179 35, 182 28, 182 28 Z" fill="#3b82f6"/>
      <circle cx="186" cy="28" r="1" fill="white"/>
      <circle cx="190" cy="28" r="1" fill="white"/>
      <circle cx="194" cy="28" r="1" fill="white"/>
    </svg>
  `;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
      
      <!-- Header Banner -->
      <table cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); border-collapse: collapse;">
        <tr>
          <td style="padding: 30px 24px; vertical-align: middle; text-align: left;">
            <span style="font-size: 11px; font-weight: bold; color: #93c5fd; letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 6px;">PEMBARUAN TIKET</span>
            <h1 style="font-size: 28px; font-weight: 800; color: #ffffff; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${ticket.id}</h1>
            <span style="font-size: 12px; font-weight: 700; color: #fef08a; text-transform: uppercase; letter-spacing: 0.5px;">STATUS: ${statusName.toUpperCase()}</span>
          </td>
          <td style="padding: 20px 24px; vertical-align: middle; text-align: right; width: 160px;">
            ${HEADER_LAPTOP_SVG}
          </td>
        </tr>
      </table>

      <div style="padding: 24px 24px 0 24px;">
        <!-- Greeting -->
        <p style="font-size: 15px; line-height: 1.6; color: #1e293b; margin: 0 0 12px 0;">Halo <strong>${ticket.requester.name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
          Kami menginformasikan bahwa status pengaduan IT Anda telah diperbarui oleh tim IT Support kami.
        </p>

        <!-- Detail Tiket Card -->
        <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; background-color: #ffffff;">
          <!-- Card Header -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
            <tr>
              <td style="vertical-align: middle; padding-right: 8px;">
                <table cellpadding="0" cellspacing="0" style="background-color: #2563eb; border-radius: 6px; width: 26px; height: 26px; text-align: center;">
                  <tr>
                    <td style="vertical-align: middle; text-align: center; padding: 5px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="vertical-align: middle;">
                <span style="font-size: 14px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">DETAIL TIKET</span>
              </td>
            </tr>
          </table>

          <!-- Table Content -->
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <!-- Row 1: ID Tiket -->
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; width: 44px; vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; width: 34px; height: 34px; text-align: center;">
                  <tr>
                    <td style="vertical-align: middle; text-align: center; padding: 7px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-3-8.2-7-9a8 8 0 0 0-8 8v1a4 4 0 0 0 4 4c2.2 0 4-1.8 4-4v-3a2 2 0 0 0-4 0v1"></path><path d="M12 2a10 10 0 0 0-10 10c0 1.2.2 2.3.6 3.4"></path><path d="M12 6a6 6 0 0 0-6 6c0 .8.2 1.5.5 2.1"></path><path d="M12 10a2 2 0 0 0-2 2"></path></svg>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding: 10px 8px; font-weight: 500; color: #4b5563; font-size: 13px; vertical-align: middle; width: 140px;">
                ID Tiket
              </td>
              <td style="padding: 10px 4px; color: #9ca3af; font-size: 13px; vertical-align: middle; width: 10px; text-align: center;">
                :
              </td>
              <td style="padding: 10px 8px; font-weight: bold; color: #1f2937; font-size: 13px; vertical-align: middle;">
                ${ticket.id}
              </td>
            </tr>
            <!-- Row 2: Subjek / Masalah -->
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; width: 44px; vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; width: 34px; height: 34px; text-align: center;">
                  <tr>
                    <td style="vertical-align: middle; text-align: center; padding: 7px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path></svg>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding: 10px 8px; font-weight: 500; color: #4b5563; font-size: 13px; vertical-align: middle;">
                Subjek / Masalah
              </td>
              <td style="padding: 10px 4px; color: #9ca3af; font-size: 13px; vertical-align: middle; text-align: center;">
                :
              </td>
              <td style="padding: 10px 8px; font-weight: 500; color: #374151; font-size: 13px; vertical-align: middle;">
                ${ticket.title}
              </td>
            </tr>
            <!-- Row 3: Status Sebelumnya -->
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; width: 44px; vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; width: 34px; height: 34px; text-align: center;">
                  <tr>
                    <td style="vertical-align: middle; text-align: center; padding: 7px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding: 10px 8px; font-weight: 500; color: #4b5563; font-size: 13px; vertical-align: middle;">
                Status Sebelumnya
              </td>
              <td style="padding: 10px 4px; color: #9ca3af; font-size: 13px; vertical-align: middle; text-align: center;">
                :
              </td>
              <td style="padding: 10px 8px; color: #6b7280; font-size: 13px; vertical-align: middle; text-decoration: line-through;">
                ${oldStatus}
              </td>
            </tr>
            <!-- Row 4: Status Baru -->
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; width: 44px; vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; width: 34px; height: 34px; text-align: center;">
                  <tr>
                    <td style="vertical-align: middle; text-align: center; padding: 7px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding: 10px 8px; font-weight: 500; color: #4b5563; font-size: 13px; vertical-align: middle;">
                Status Baru
              </td>
              <td style="padding: 10px 4px; color: #9ca3af; font-size: 13px; vertical-align: middle; text-align: center;">
                :
              </td>
              <td style="padding: 10px 8px; font-weight: bold; color: #1d4ed8; font-size: 13px; vertical-align: middle;">
                ${statusName}
              </td>
            </tr>
            <!-- Row 5: Waktu Pembaruan -->
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; width: 44px; vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; width: 34px; height: 34px; text-align: center;">
                  <tr>
                    <td style="vertical-align: middle; text-align: center; padding: 7px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding: 10px 8px; font-weight: 500; color: #4b5563; font-size: 13px; vertical-align: middle;">
                Waktu Pembaruan
              </td>
              <td style="padding: 10px 4px; color: #9ca3af; font-size: 13px; vertical-align: middle; text-align: center;">
                :
              </td>
              <td style="padding: 10px 8px; color: #374151; font-size: 13px; vertical-align: middle;">
                ${updateTime}
              </td>
            </tr>
            <!-- Row 6: Ditangani Oleh -->
            <tr>
              <td style="padding: 10px 0; width: 44px; vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; width: 34px; height: 34px; text-align: center;">
                  <tr>
                    <td style="vertical-align: middle; text-align: center; padding: 7px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding: 10px 8px; font-weight: 500; color: #4b5563; font-size: 13px; vertical-align: middle;">
                Ditangani Oleh
              </td>
              <td style="padding: 10px 4px; color: #9ca3af; font-size: 13px; vertical-align: middle; text-align: center;">
                :
              </td>
              <td style="padding: 10px 8px; color: #374151; font-size: 13px; vertical-align: middle;">
                ${ticket.assignedTo ? `${ticket.assignedTo.name} (IT Support)` : 'IT Agent Support (IT Support)'}
              </td>
            </tr>
          </table>
        </div>

        <!-- Explanation Info Box -->
        <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #eff6ff; border-radius: 12px; margin-bottom: 24px; border-collapse: collapse;">
          <tr>
            <td style="padding: 16px; vertical-align: top; width: 32px;">
              <table cellpadding="0" cellspacing="0" style="background-color: #2563eb; border-radius: 50%; width: 32px; height: 32px; text-align: center;">
                <tr>
                  <td style="vertical-align: middle; text-align: center; padding: 5px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 16px 16px 16px 4px; vertical-align: top; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #1e3a8a;">Apa artinya?</h4>
              <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
                ${explanationText}
              </p>
            </td>
          </tr>
        </table>

        <!-- IT Support Comment / Note -->
        ${comment ? `
        <div style="border-left: 4px solid #2563eb; background-color: #f8fafc; padding: 16px; border-radius: 4px; font-size: 13px; color: #374151; margin-bottom: 24px; font-style: italic; border: 1px solid #e2e8f0; border-left-width: 4px;">
          <strong>Catatan dari IT Support:</strong><br/>
          "${comment}"
        </div>` : ''}

        <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          Terima kasih telah mempercayakan kebutuhan IT Anda kepada kami.
        </p>
      </div>

      <!-- Footer -->
      ${EMAIL_FOOTER_HTML}

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

      ${EMAIL_FOOTER_HTML}

    </div>
  `;

  return sendMail({ to: agent.email, subject, html }).catch(err => {
    console.error('Suppressed sendTicketAssignedEmail error:', err.message);
  });
}

// 4. Send Ticket Closed Notification Email to IT Agent
async function sendTicketClosedToAgentEmail(ticket) {
  if (!ticket || !ticket.assignedTo || !ticket.assignedTo.email) {
    console.log('Skipping Ticket Closed to Agent Email: assigned agent email not found.');
    return;
  }

  const subject = `[MRA IT Helpdesk] Tiket Ditutup (Closed): ${ticket.id} - ${ticket.title}`;
  const formattedDate = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
  const closedTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #1e293b; margin: 0 0 5px 0; font-size: 20px;">TIKET TELAH DITUTUP (CLOSED)</h2>
        <span style="font-size: 12px; color: #ef4444; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Status: CLOSED</span>
      </div>

      <!-- Greeting -->
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px;">Halo <strong>${ticket.assignedTo.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        Tiket penugasan di bawah ini telah resmi ditutup dalam sistem.
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
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Kategori:</td>
            <td style="padding: 6px 0; color: #1e293b;">${ticket.category} - ${ticket.subCategory || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Pelapor (User):</td>
            <td style="padding: 6px 0; color: #1e293b;">${ticket.requester.name} (${ticket.requester.department})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Perusahaan:</td>
            <td style="padding: 6px 0; color: #1e293b;">${ticket.company.name} (${ticket.company.location})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Waktu Masuk:</td>
            <td style="padding: 6px 0; color: #1e293b;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Waktu Ditutup:</td>
            <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${closedTime}</td>
          </tr>
        </table>
      </div>

      ${EMAIL_FOOTER_HTML}

    </div>
  `;

  return sendMail({ to: ticket.assignedTo.email, subject, html }).catch(err => {
    console.error('Suppressed sendTicketClosedToAgentEmail error:', err.message);
  });
}

module.exports = {
  transporter,
  sendTicketCreatedEmail,
  sendTicketStatusChangedEmail,
  sendTicketAssignedEmail,
  sendTicketClosedToAgentEmail
};
