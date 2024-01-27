var bPort = undefined;

browser.runtime.onInstalled.addListener((details) => {console.log("Installed CS")});

browser.runtime.onConnect.addListener(async (port) => {
    console.log("Connecting...");
    if(browser.tabs.getCurrent() == port.name) {
        bPort = port;
        await bPort.onMessage.addListener((message) => {
            ChangeNumTabs(message);
        });
    }
});

export function ChangeNumTabs(numTabs) {
    console.log("here");
    document.title = "(" + numTabs + ") " + document.title; // its not gonna work
}