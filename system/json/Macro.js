// Apps Script (macro) Code
function doGet(e) {
  // 1. Define the sheet and range
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Sheet1"); // IMPORTANT: Change this if your sheet name is different
  const range = sheet.getDataRange();
  const values = range.getValues();

  // 2. Extract Headers and Data
  const headers = values.shift(); // First row is headers (keys)
  const data = [];

  // 3. Convert Rows to Array of JSON Objects
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const asset = {};
    for (let j = 0; j < headers.length; j++) {
      let key = headers[j];
      // Convert 'sub-category' to 'sub-category' for consistency with JS
      if (key) {
        asset[key] = row[j];
      }
    }
    data.push(asset);
  }

  // 4. Configure and return a JSON response
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// *** IMPORTANT DEPLOYMENT STEP ***
// 1. Save the script.
// 2. Click 'Deploy' -> 'New Deployment'.
// 3. Select 'Type' as 'Web App'.
// 4. Set 'Execute as' to 'Me'.
// 5. Set 'Who has access' to 'Anyone'.
// 6. Click 'Deploy' and copy the resulting **Web App URL**. This URL is your new `jsonPath`.
