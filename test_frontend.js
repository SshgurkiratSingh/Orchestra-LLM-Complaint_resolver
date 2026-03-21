const str = `{
  "title": "Pot Hole Complaint in Sector 34 Market, Near Toshih",
  "description": "The user is reporting a pot hole located in the market area of Sector 34, specifically near Toshih. No further details about the size or severity of the pot hole have been provided.",
  "type": "Road and Infrastructure - Pot Hole"
}`;
const match = str.match(/\{[\s\S]*\}/);
if (match) {
    try {
        const parsed = JSON.parse(match[0]);
        console.log("Parsed:", parsed.title);
    } catch(e) {
        console.error("Parse error:", e);
    }
}
