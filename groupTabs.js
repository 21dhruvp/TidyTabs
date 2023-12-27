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
    // TODO: Make a popup to set name
    let groupTitle = "Group " + tab.id.toString();
    let currGroup = await browser.tabs.create({
        "active": false,
        "index": 0
    });
    
    // Handle if the user highlights multiple tabs, add them all to TabGroup
    let highlighted = await browser.tabs.query({highlighted: true});
    let tg = {[currGroup.id.toString()]: Array(tab.id)};
    let highlightedIds = [];
    let activeGroupNum = (await browser.storage.local.get("ActiveGroup")).ActiveGroup; 

    let activeGroup = Object()
    if(activeGroupNum != -1) {
        activeGroup = await browser.storage.local.get(activeGroupNum.toString()).catch(onError);
    }

    if (highlighted.length) {
        for (let t of highlighted) {
            // Check if user tries to inner groups and don't let them (bad practice!)
            //console.log(activeGroup[activeGroupNum].includes(t.id));
            if (activeGroupNum != -1 && activeGroup[activeGroupNum].includes(t.id)) {
                // TODO: Tell user they can't nest groups
                await browser.tabs.remove(currGroup.id);
                return;
            }
            highlightedIds.push(t.id);
        }
        tg[currGroup.id.toString()] = highlightedIds;
    } else if (activeGroupNum != -1) {
        if (activeGroup[activeGroupNum].includes(t.id)) {
            // TODO: Tell user they can't nest groups
            await browser.tabs.remove(currGroup.id);
            return;
        }
    }
    // store in JSON
    await browser.storage.local.set(tg).catch(onError);
    // TODO: Hide tabs in old group before setting new active group
    if(activeGroupNum != -1) {
        await browser.tabs.hide(activeGroup[activeGroupNum.toString()]);
    }
    await browser.storage.local.set({ActiveGroup: currGroup.id}).catch(onError);
    console.log(await browser.storage.local.get(null));
}

async function removeTab(tabId, info) {
    // This handles when user tries to remove a tab from a group or the group itself
    // TODO: Prompt them to either remove all tabs or remove the group itself
    tabId = tabId.toString()
    console.log("removing " + tabId);
    let getTab = await browser.storage.local.get(tabId);
    
    if (Object.keys(getTab).length != 0) {
        // Remove a group of tabs
        await browser.tabs.remove(getTab[tabId]);
        await browser.storage.local.remove(tabId);
        if((await browser.storage.local.get("ActiveGroup")).ActiveGroup === tabId) {
            await browser.storage.local.set({ActiveGroup: -1});
        }
    } else {
        // Remove an individual tab
        let currGroup = (await browser.storage.local.get("ActiveGroup")).ActiveGroup;
        if(currGroup === -1) return;
        getTab = (await browser.storage.local.get(currGroup.toString()))[currGroup.toString()];
        for (let tab = 0; tab < getTab.length; tab += 1) {
            if (getTab[tab] === Number(tabId)) {
                getTab.splice(tab, 1);
                await browser.storage.local.set({[currGroup.toString()]: getTab})
                break;
            }
        }
    }
    console.log(await browser.storage.local.get(null));
}

async function addTab(tabId, info) {
    if (info.menuItemId != "Add To Group") return;
    console.log("Tab Added");
    // TODO: Add tabs to a specific group
}

async function changeActiveGroup(info) {
    console.log("-----------------Changed Group----------------------");
    let newActive = await browser.storage.local.get((info.tabId).toString());
    let oldActiveNum = (await browser.storage.local.get("ActiveGroup")).ActiveGroup;
    if (Object.keys(newActive).length != 0 && info.tabId != oldActiveNum) {
        console.log("changed tab group to: " + info.tabId.toString());
        await browser.storage.local.set({ActiveGroup: info.tabId});
        let oldActive = await browser.storage.local.get(oldActiveNum.toString());
        console.log("--------------Old-----------------")
        console.log(oldActive);
        console.log("--------------New-----------------")
        console.log(newActive);
        console.log("bingo");
        browser.tabs.show(newActive[(info.tabId).toString()]);
        console.log("bango");
        browser.tabs.hide(oldActive[oldActiveNum]);
        console.log("bongo");
    }
}
