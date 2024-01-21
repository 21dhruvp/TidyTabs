export async function getTabsInGroup() {
    return (await browser.storage.local.get(
        await browser.storage.local.get("ActiveGroup")
    )).length;
}

export async function getNumGroups() {
    return (Object.keys(await browser.storage.local.get(null)).length);
}
