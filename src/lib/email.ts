import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Mengirim email menggunakan Resend API.
 * Jika RESEND_API_KEY tidak dikonfigurasi di .env.local, email akan dicatat di console log sebagai simulasi.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = 'IQ-RA System <onboarding@resend.dev>', // Menggunakan domain onboarding default untuk sandbox/uji coba gratis
}: SendEmailParams) {
  if (!resend) {
    console.log('============= SIMULASI EMAIL (RESEND KEY BELUM DIATAS) =============');
    console.log(`Kepada: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`Subjek: ${subject}`);
    console.log(`Konten HTML: \n${html}`);
    console.log('====================================================================');
    return { 
      success: true, 
      simulated: true,
      message: 'Simulasi sukses karena RESEND_API_KEY belum dikonfigurasi.' 
    };
  }

  try {
    const recipients = Array.isArray(to) ? to : [to];
    const data = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
    });
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Gagal mengirim email melalui Resend:', error);
    return { success: false, error: error.message || error };
  }
}
