export async function GetTabsInGroup() {
    return (await browser.storage.local.get(
        await browser.storage.local.get("ActiveGroup")
    )).length;
}

export async function GetNumGroups() {
    return (Object.keys(await browser.storage.local.get(null)).length);
}