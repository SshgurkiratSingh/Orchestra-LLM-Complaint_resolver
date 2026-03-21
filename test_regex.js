const textContent = "```json\n\n{\n  \"title\": \"Pot Hole Complaint in Sector 34 Market, Near Toshio\",\n  \"description\": \"The user is reporting a pot hole issue located in the market area of Sector 34, specifically near Toshio. No further details have been provided.\",\n  \"type\": \"Infrastructure Report\"\n}\n\n```"
const match = textContent.match(/\{[\s\S]*\}/);
console.log(match);
