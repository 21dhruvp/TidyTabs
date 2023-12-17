// On init get all tabs and save their names to a json for easy retrieval
// On tab creation, add it to the json
// When user creates a group tab, make sure it doesnt call onCreated, and 
//      create a new section in the json with the name they specify
// When a tab is closed, remove it from the json

browser.runtime.onInstalled.addListener(() => {console.log("Installed"); handleInstalled();});

browser.menus.onClicked.addListener(createNewGroup);
browser.menus.onClicked.addListener(addTab);

browser.tabs.onRemoved.addListener(removeTab);
browser.tabs.onActivated.addListener(changeActiveGroup);

async function handleInstalled() {
    browser.menus.create(
        {
            "id": "Create New Group",
            "title": "Create New Tab Group",
            "type": "normal",
            "contexts": ["tab", "tools_menu"]
        });
    browser.menus.create(
        {
            "id": "Add to Group",
            "title": "Add To Group",
            "type": "normal",
            "contexts": ["tab"]
        });
    browser.menus.create(
        {
            "id": "Move To Group",
            "title": "Move to Group",
            "type": "normal",
            "contexts": ["tab"]
        });
    browser.storage.local.set({ActiveGroup: -1});
}

function onError(error) {
    console.log("An error has occurred:\n" + error + "\nPlease try again later.");
}

async function createNewGroup(info, tab) {
    if (info.menuItemId != "Create New Group") return;
    // Make a popup to set name
    let groupTitle = "Group " + tab.id.toString();
    let currGroup = await browser.tabs.create({
        "active": false,
        "index": 0
    });
    
    // Handle if the user highlights multiple tabs, add them all to TabGroup
    let highlighted = await browser.tabs.query({highlighted: true});
    let tg = {[currGroup.id.toString()]: Array(tab.id)};
    let highlightedIds = [];
    let activeGroup = await browser.storage.local.get(
        await browser.storage.local.get("ActiveGroup"));

    if (highlighted.length) {
        for (let t of highlighted) {
            // Check if user tries to inner groups and don't let them (bad practice!)
            if (t.id in activeGroup) {
                // TODO: Tell user they can't nest groups
                return;
            }
            highlightedIds.push(t.id);
        }
        tg[currGroup.id.toString()] = highlightedIds;
    } else if (activeGroup != -1) {
        if (tab.id in activeGroup) {
            // TODO: Tell user they can't nest groups
            return;
        }
    }
    // store in JSON
    await browser.storage.local.set(tg).catch(onError);
    await browser.storage.local.set({ActiveGroup: currGroup.id}).catch(onError);
    console.log(await browser.storage.local.get(null));
}

async function removeTab(tabId, info) {
    // This handles when user tries to remove the tab group
    // TODO: Prompt them to either remove all tabs or remove the group itself
    tabId = tabId.toString()
    console.log("removing " + tabId);
    let getTab = await browser.storage.local.get(tabId);
    
    if (Object.keys(getTab).length != 0) {
        // Remove a group of tabs
        await browser.tabs.remove(getTab[tabId]);
        await browser.storage.local.remove(tabId);
        await browser.storage.local.set({ActiveGroup: -1});
    } else {
        // Remove an individual tab
        let currGroup = await browser.storage.local.get("ActiveGroup");
        getTab = await browser.storage.local.get(currGroup);
        for (let tab = 0; tab < getTab.length; tab += 1) {
            if (getTab[tab] === Number(tabId)) {
                getTab.splice(tab, 1);
                await browser.storage.local.set({[currGroup]: [getTab]})
                console.log(getTab);
                return;
            }
        }
        console.log(await browser.storage.local.get(null));
    }
}

async function addTab(tabId, info) {
    if (info.menuItemId != "Add To Group") return;
    console.log("Tab Added");
    // TODO: Add tabs to a specific group
}

async function changeActiveGroup(info) {
    let newActive = await browser.storage.local.get(info.tabId.toString());
    if (Object.keys(newActive).length != 0 && info.tabID != (await browser.storage.local.get("ActiveGroup")).ActiveGroup) {
        console.log("changed tab group to: " + info.tabId.toString());
        await browser.storage.local.set({ActiveGroup: [info.tabId]});
        let OldActive = await browser.storage.local.get(info.previousTabId.toString());
        browser.tabs.hide(oldActive[info.previousTabId]);
        browser.tabs.show(newActive[info.tabId]);
        console.log("--------------Old-----------------")
        console.log(oldActive);
        console.log("--------------New-----------------")
        console.log(newActive);
    }
}
