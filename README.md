# TidyTabs
A Firefox extension that helps you manage your tabs by grouping them!

### Disclaimer
TidyTabs is still in early development and bugs are still very likely. If you find a bug please create an issue highlighting the bug and how it can be reproduced so I can look into it further. Provide a screenshot if it helps present the issue easier.

## Installation
Since TidyTabs is still currently in development, the current way to install is only through cloning the repo and building it yourself! <br>

### Dependencies
First, you'll need to get the following dependencies if you don't already have them:
- npm/Node.js LTS
    - install via your [package manager](https://nodejs.org/en/download/package-manager) of your choice, or [download](https://nodejs.org/en/download) it
- web-ext
    - install through npm: `npm install -g web-ext`
- react
    - install through npm: `npm install -g react`

### Building From Source
To start, from your terminal, navigate to the `webpages` subdirectory. From here run `npm run build` to build the frontend. Next, run the following:
```sh
cd ..
web-ext build
```

This will build and bundle the extension into a .zip file located under the `web-ext-artifacts` subdirectory. From here, the extension is built and ready for temporary use! To load the extension into Firefox, head to [`about:debugging`](about:debugging) and click `This Firefox`, then `Load Temporary Add-on...`. Lastly, navigate to and select the .zip file we just built and voilà! The extension is loaded and ready to be used.

### Obtaining from the Mozilla Extension Store
Coming soon...

## Using The Extension
Using the extension is incredibly simple! 

### Create a new group
First select a tab, or group of tabs, you want to group. 
Then, right click in the tab bar and go to `TidyTabs -> Create New Tab Group` to create a new tab group! 
A new group has a default name, but if you would like to change this, simply click on the tab group that you want to change and enter the name you would like into the text box and submit. 

### Add to a group
If you want to add a tab or group of tabs to an already existing group, simply select them and right click -> `TidyTabs -> Add To Group` and select the group you want to add the tab(s) to.

### Move to a group
Coming soon...