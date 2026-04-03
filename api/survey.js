const { google } = require('googleapis');

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

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Survey submission error:', err);
    return res.status(500).json({ error: 'Failed to record response' });
  }
};
