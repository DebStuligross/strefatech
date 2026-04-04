const { google } = require('googleapis');
const { Resend } = require('resend');

const SPREADSHEET_ID = '1WSz-7yVQ7fPvhmdD25TU5LewjWOPZJj-ztfAqJgUxBE';
const SHEET_NAME = 'Sheet1';

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      perspective,
      position,
      positionName,
      conditionalSelections,
      otherText,
      sixMonths,
      feedback,
      name,
      email,
    } = req.body;

    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const timestamp = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:J`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          timestamp,
          perspective || '',
          position !== undefined ? String(position) : '',
          positionName || '',
          (conditionalSelections || []).join(', '),
          otherText || '',
          sixMonths || '',
          feedback || '',
          name || '',
          email || '',
        ]],
      },
    });

    // Send confirmation email if respondent provided an address
    if (email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const firstName = name ? name.split(' ')[0] : 'there';
        await resend.emails.send({
          from: 'Deb Stuligross <debstuligross@gmail.com>',
          to: email,
          subject: 'Thanks for taking the StrefaTECH survey!',
          html: `
            <p>Hi ${firstName},</p>
            <p>Thanks so much for taking a few minutes to share where you are on the AI journey. I read every response — it genuinely shapes what I write about.</p>
            <p>You placed yourself at: <strong>${positionName}</strong>${perspective ? ` (${perspective})` : ''}.</p>
            <p>I'll be sharing what I learn from the survey in an upcoming issue of StrefaTECH. Stay tuned.</p>
            <p>— Deb</p>
            <hr style="border:none;border-top:1px solid #eee;margin:1.5rem 0;">
            <p style="font-size:0.85rem;color:#888;">
              StrefaTECH · <a href="https://strefatech.org" style="color:#C9A04A;">strefatech.org</a>
            </p>
          `,
        });
      } catch (emailErr) {
        // Don't fail the submission if email sending fails
        console.error('Email send error:', emailErr);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Survey submission error:', err);
    return res.status(500).json({ error: 'Failed to record response' });
  }
};
