// On init get all tabs and save their names to a json for easy retrieval
// On tab creation, add it to the json
// When user creates a group tab, make sure it doesnt call onCreated, and 
//      create a new section in the json with the name they specify
// When a tab is closed, remove it from the json

browser.runtime.onInstalled.addListener(() => {console.log("Installed"); handleInstalled();});
browser.menus.onClicked.addListener(createNewGroup);
browser.menus.onRemoved.addListener(removeGroup);

async function handleInstalled() {
    browser.menus.create(
        {
            "id": "Create New Group",
            "title": "Create New Tab Group",
            "type": "normal",
            "contexts": ["tab", "tools_menu"]
        });
}

function onError(error) {
    console.log("An error has occurred:\n" + error + "\nPlease try again later");
}

class TabGroup {
    constructor(groupId) {
        this.groupId = groupId;
        this.tabs = [];
    }
    constructor(groupId, tabs) {
        this.groupId = groupId;
        this.tabs = tabs;
    }
    addTabs(tabs) {
        if (tabs instanceof Array) this.tabs = this.tabs.concat(tabs);
        else this.tabs.push(tabs);
    }
    removeTabs(tabs) {
        // If tabs is not an array, just do a simple removal
        if (!(tabs instanceof Array)) {
            this.tabs.splice(this.tabs.find(tabs), 1);
            return;
        }
        // Remove the tabs if given an array
        for (let t in tabs) {
            this.tabs.splice(this.tabs.find(t), 1);
        }
    }
}

async function createNewGroup(info, tab) {
    if (info.menuItemId != "Create New Group") return;
    let currGroup = await browser.tabs.create({
        "active": false,
        "index": 0
    }); 
    // Handle if the user highlights multiple tabs, add them all to TabGroup
    let highlighted = await brower.tabs.query({highlighted: true});
    let tg = {currGroup.id: [tab.id]};
    if (!highlighted.length) {
        let highlightedIds = [];
        for (let t in highlighted) {
            highlightedIds.push(t.id);
        }
        tg.currGroup.id = highlightedIds;
    }
    // store in JSON
    await browser.storage.local.set(tg).catch(onError);
}

async function removeGroup(tabId, info) {
    // This handles when user tries to remove the tab group
    // Prompt them to either remove all tabs or remove the group itself
    
}
