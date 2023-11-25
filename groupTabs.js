// On init get all tabs and save their names to a json for easy retrieval
// On tab creation, add it to the json
// When user creates a group tab, make sure it doesnt call onCreated, and 
//      create a new section in the json with the name they specify
// When a tab is closed, remove it from the json

async function handleInstalled() {
    browser.menus.create(
        {
            "id": "Create New Group",
            "title": "Create New Tab Group",
            "type": "normal",
            "contexts": ["tab", "tools_menu"]
        });
}

browser.runtime.onInstalled.addListener(() => {console.log("Installed"); handleInstalled();});

browser.tabs.onCreated.addListener((tab) => {
    console.log("Tab opened");
});


async function CreateNewGroup(info, tab) {
    if (info.menuItemId != "Create New Group") return;
    var currGroup = await browser.tabs.create({
        "active": false,
        "index": 0
    });
}

browser.menus.onClicked.addListener(CreateNewGroup);
