const str = `{
  "title": "Pothole Report in Sector 34 Market Near Toshih",
  "description": "The user is reporting a pothole issue located in the market area of Sector 34, near Toshih. No further details have been provided at this time.",
  "type": "Public Works Request - Pothole"
} `;
const match = str.match(/\{[\s\S]*\}/);
if (match) {
  try {
    JSON.parse(match[0]);
    console.log("Success");
  } catch (e) {
    console.log("Failed", e);
  }
}
