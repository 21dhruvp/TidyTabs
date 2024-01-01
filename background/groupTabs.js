// On init get all tabs and save their names to a json for easy retrieval
// On tab creation, add it to the json
// When user creates a group tab, make sure it doesnt call onCreated, and 
//      create a new section in the json with the name they specify
// When a tab is closed, remove it from the json

browser.runtime.onInstalled.addListener(() => {console.log("TidyTabs Installed Successfully!"); handleInstalled();});

browser.menus.onClicked.addListener(createNewGroup);
browser.menus.onClicked.addListener(addTab);

browser.tabs.onRemoved.addListener(removeTab);
browser.tabs.onActivated.addListener(changeActiveGroup);

async function handleInstalled() {
    await browser.menus.create(
        {
            "id": "CNG",
            "title": "Create New Tab Group",
            "type": "normal",
            "contexts": ["tab", "tools_menu"]
        });
    await browser.menus.create(
        {
            "id": "ATG",
            "title": "Add To Group",
            "type": "normal",
            "contexts": ["tab"]
        });
    await browser.menus.create(
        {
            "id": "MTG",
            "title": "Move to Group",
            "type": "normal",
            "contexts": ["tab"]
        });
    await browser.storage.local.set({ActiveGroup: -1}).catch(onError);
}

function onError(error) {
    console.error("An error has occurred in TidyTabs:\n" + error + "\nPlease try again later.");
}

async function createNewGroup(info, tab) {
    if (info.menuItemId != "CNG") return;
    
    // Handle if the user highlights multiple tabs, add them all to TabGroup
    let highlighted = await browser.tabs.query({highlighted: true});
    let tg = [tab.id]; 
    let highlightedIds = [];
    let activeGroupNum = (await browser.storage.local.get("ActiveGroup").catch(onError)).ActiveGroup; 

    let activeGroup = Object()
    if(activeGroupNum != -1) {
        activeGroup = await browser.storage.local.get(activeGroupNum.toString()).catch(onError);
    }

    if (highlighted.length) {
        for (let t of highlighted) {
            // Check if user tries to inner groups and don't let them (bad practice!)
            if (activeGroupNum != -1) {
                if(activeGroup[activeGroupNum].includes(t.id)) {
                    // TODO: Tell user they can't nest groups
                    return;
                }
            }
            highlightedIds.push(t.id);
        }
        tg = highlightedIds;
    } else if (activeGroupNum != -1) {
        if (activeGroup[activeGroupNum].includes(tab.id)) {
            // TODO: Tell user they can't nest groups
            return;
        }
    }

    // TODO: Ask user to set name -- placeholder for now
    let groupTitle = "Group " + Object.keys(await browser.storage.local.get(null)).length.toString();
    let currGroup = await browser.tabs.create({
        "active": false,
        "index": (tg.length > 1) ? highlighted[0].index : tab.index,
        "discarded": true,
        "title": groupTitle,
        "url": "/webpages/group.html"
    }).catch(onError);

    // Move tabs to condense the group to their own consecutive space 
    if(tg.length > 1) {
        let firstInd = highlighted[0].index;
        for(let i = 1; i < highlighted.length; i++) {
            await browser.tabs.move(highlighted[i].id, {index: firstInd + i + 1}).catch(onError);
        }
    }

    // store in JSON
    await browser.storage.local.set({[currGroup.id.toString()]: tg}).catch(onError);

    // Hide tabs in old group before setting new active group
    if(activeGroupNum != -1) {
        await browser.tabs.hide(activeGroup[activeGroupNum.toString()]).catch(onError);
    }
    await browser.storage.local.set({ActiveGroup: currGroup.id}).catch(onError);

    browser.menus.create({
        "id": currGroup.id.toString(),
        "title": groupTitle,
        "parentId": "ATG",
        "type": "normal",
        "contexts": ["tab"]
    });
}

async function removeTab(tabId, info) {
    // This handles when user tries to remove a tab from a group or the group itself
    // TODO: Prompt them to either remove all tabs or remove the group itself
    tabId = tabId.toString()
    let getTab = await browser.storage.local.get(tabId).catch(onError);
    
    if (Object.keys(getTab).length != 0) {
        // Remove a group of tabs
        await browser.tabs.remove(getTab[tabId]).catch(onError);
        await browser.storage.local.remove(tabId).catch(onError);
        if((await browser.storage.local.get("ActiveGroup").catch(onError)).ActiveGroup.toString() === tabId) {
            await browser.storage.local.set({ActiveGroup: -1}).catch(onError);
        }
        await browser.menus.remove(tabId).catch(onError);
    } else {
        // Remove an individual tab
        let currGroup = (await browser.storage.local.get("ActiveGroup").catch(onError)).ActiveGroup;
        if(currGroup === -1) return;
        getTab = (await browser.storage.local.get(currGroup.toString()).catch(onError))[currGroup.toString()];
        for (let tab = 0; tab < getTab.length; tab += 1) {
            if (getTab[tab] === Number(tabId)) {
                getTab.splice(tab, 1);
                await browser.storage.local.set({[currGroup.toString()]: getTab}).catch(onError);
                break;
            }
        }
    }
}

async function addTab(info, tab) {
    if (info.parentMenuItemId != "ATG") return;
    let gid = info.menuItemId;
    let tabsInGroup = Object.values(await browser.storage.local.get(gid).catch(onError))[0];
    // Handle if user wants to add multiple, highlighted tabs to a new group
    let highlighted = await browser.tabs.query({highlighted: true}).catch(onError);
    for(let i = 0; i < highlighted.length; i++) {
        highlighted[i] = highlighted[i].id;
    }

    let tabsToAdd = [tab.id];
    if(highlighted.length > 1) tabsToAdd = highlighted;
    // Check if user tries to add a tab already in a group to a new group and do not allow them to
    let activeNum = Object.values(await browser.storage.local.get("ActiveGroup").catch(onError))[0];
    if(activeNum != -1) {
        let activeGroup = Object.values(await browser.storage.local.get(activeNum.toString()).catch(onError))[0];
        let intersect = tabsToAdd.filter((t) => tabsInGroup.includes(t) || activeGroup.includes(t));
        if(intersect.length != 0) return;
    } else {
        let intersect = tabsToAdd.filter((t) => tabsInGroup.includes(t));
        if(intersect.length != 0) return;
    }
    // Check if user tries to add a group to a group, and disallows this
    let allKeys = Object.keys(await browser.storage.local.get(null).catch(onError));
    if(tabsToAdd.filter((t) => allKeys.includes(t.toString())).length != 0) return;

    // Add the tab to the new group
    await browser.storage.local.set({[gid]: tabsInGroup.concat(tabsToAdd)}).catch(onError);

    // Move tabs into the group 
    let startInd = (await browser.tabs.get(tabsInGroup.at(0)).catch(onError)).index;
    let endInd = (await browser.tabs.get(tabsInGroup.at(-1)).catch(onError)).index;
    for(let t of tabsToAdd) {
        let currInd = (await browser.tabs.get(t).catch(onError)).index;
        if(currInd < startInd) {
            await browser.tabs.move(t, {index: startInd-1});
        } else if(currInd > endInd) {
            endInd++;
            await browser.tabs.move(t, {index: endInd});
        }
    }

    // If the group the tab was added to is not the active group, hide it
    if(parseInt(gid) != activeNum) {
        // switch to a tab next to it (left tab preffered), then hide it
        let nonGroupTabs = (await browser.tabs.query({hidden: false})
            .catch(onError))
            .map((tab) => tab.id)
            .filter((t) => !(allKeys.includes(t.toString())));
        if(nonGroupTabs.indexOf(tabsToAdd[0]) != 0) {
            await browser.tabs.update(nonGroupTabs[nonGroupTabs.indexOf(tabsToAdd[0])-1], {active: true}).catch(onError);
        } else {
            await browser.tabs.update(nonGroupTabs[nonGroupTabs.indexOf(tabsToAdd[tabsToAdd.length-1])+1], {active: true}).catch(onError);
        }
        await browser.tabs.hide(tabsToAdd).catch(onError);
    }
}

async function changeActiveGroup(info) {
    let newActive = await browser.storage.local.get((info.tabId).toString()).catch(onError);
    let oldActiveNum = (await browser.storage.local.get("ActiveGroup").catch(onError)).ActiveGroup;
    if (Object.keys(newActive).length != 0 && info.tabId != oldActiveNum) {
        await browser.storage.local.set({ActiveGroup: info.tabId}).catch(onError);
        let oldActive = await browser.storage.local.get(oldActiveNum.toString()).catch(onError);
        await browser.tabs.show(newActive[(info.tabId).toString()]).catch(onError);
        await browser.tabs.hide(oldActive[oldActiveNum]).catch(onError);
    }
}

// TODO: Add Merging Groups
