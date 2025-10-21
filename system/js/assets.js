function doGet(e) {
  try {
    // === 1. Initialization ===
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("assetBlockBuilder"); // ✅ fixed sheet name
    if (!sheet) throw new Error("Sheet 'assetBlockBuilder' not found.");

    // === 2. Read Sheet Data ===
    const range = sheet.getDataRange();
    const values = range.getValues();
    if (values.length < 2) throw new Error("No data found in the sheet.");

    const headers = values.shift();

    // === 3. Convert to JSON Objects ===
    const allAssets = values.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        if (header) obj[header.trim()] = row[i];
      });
      return obj;
    });

    // === 4. Handle Filtering via URL Parameters ===
    const params = e.parameter; // e.g. ?category=other&page=2
    let filteredAssets = [...allAssets];

    Object.keys(params).forEach(key => {
      const val = params[key].toString().trim().toLowerCase();
      if (!val) return;

      filteredAssets = filteredAssets.filter(asset => {
        const field = (asset[key] || "").toString().trim().toLowerCase();
        return field === val;
      });
    });

    // === 5. Return Filtered JSON ===
    return ContentService
      .createTextOutput(JSON.stringify(filteredAssets, null, 2))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // === 6. Error Handling ===
    const errResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };

    return ContentService
      .createTextOutput(JSON.stringify(errResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
