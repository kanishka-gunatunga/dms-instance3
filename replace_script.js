const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error("Please provide a file path.");
  process.exit(1);
}

let content = fs.readFileSync(file, 'utf8');

// We look for hasPermission(permissions, "Group Name", "Action Name")
// and replace it with hasPermission(permissions, "Group Name", "Action Name", item?.sector_category)
// Note: We should specifically target places where 'item' is in scope (which is inside the document table map)
// But to be safe, if we just blindly do it, it might break places where 'item' does NOT exist (like the 'Add Document' button at the top).
// So let's use a regex that only replaces if it's NOT followed by a parenthesis (to handle ones already having it)
// AND we might just do a targeted replace for all "item" related actions.

const regex = /hasPermission\(\s*permissions,\s*"([^"]+)",\s*"([^"]+)"\s*\)/g;

content = content.replace(regex, (match, group, action) => {
  // If the action is "Create Document" or similar global actions that don't depend on an item, we shouldn't add item?.sector_category
  const globalActions = ["Create Document", "Advanced Search", "Deep Search"];
  if (globalActions.includes(action)) {
     return match;
  }
  return `hasPermission(permissions, "${group}", "${action}", item?.sector_category)`;
});

fs.writeFileSync(file, content);
console.log(`Replaced hasPermission calls in ${file}`);
