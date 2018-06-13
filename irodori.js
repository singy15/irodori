
const {app, Menu, Tray, globalShortcut, BrowserWindow} = electron = require('electron')
const Config = require('electron-config');
const config = new Config();
const fs = require('fs');
var __ = require('underscore');
typeof __.each === 'function'

let wnd = null;

app.on('ready', () => {
  // Create window.
  wnd = new BrowserWindow({
    // useContentSize: true,
    width: 300, 
    height: 300,
    // show: false,
    // show: false,
    show: true,
    // minimizable: false,
    // maximizable: false,
    // alwaysOnTop: true,
    // skipTaskbar: true,
    // frame: false,
    // transparent: true,
    // resizable : false
  });

  // Load html.
  wnd.loadURL('file://' + __dirname + '/index.html');

  // wnd.setMenu(null);

  wnd.on('closed', function() {
    exitApp();
  });

  // DEBUG:
  //wnd.webContents.openDevTools();

  // Load and apply config.
  loadConfig();

  // var tray = new Tray(__dirname + "/irodori-simple-icon.ico");
  var tray = new Tray(__dirname + "/img/irodori-icon.ico");
  tray.setContextMenu(
    Menu.buildFromTemplate([
        { label: "Exit", click: function () { exitApp(); } }
    ])
  );
  tray.on("click", function () {
    showWindow();
  });
});

app.on('will-quit', function () {
  unregisterShortcut();
  wnd = null;
})

function toggleVisibility() {
  if(wnd.isVisible()) {
    hideWindow();
  } else {
    showWindow();
  }
}

function setConfigDefault() {
  if(getSystemConfig("shortcut") === undefined) {
    setSystemConfig("shortcut", 'ctrl+up');
  }
  if(getSystemConfig("opacity") === undefined) {
    setSystemConfig("opacity", "1.0");
  }
  if(getSystemConfig("recent") === undefined) {
    setSystemConfig("recent", JSON.stringify([]));
  }
  if(getSystemConfig("historyMax") === undefined) {
    setSystemConfig("historyMax", "10");
  }
}

function unregisterShortcut() {
  globalShortcut.unregisterAll()
}

function registerShortcut() {
  globalShortcut.register(getSystemConfig("shortcut"), function () {
    toggleVisibility();
  })
}

function applyConfig() {
  wnd.setOpacity(parseFloat(getSystemConfig("opacity")));
  unregisterShortcut();
  registerShortcut();
}

function loadConfig() {
  setConfigDefault();
  applyConfig();
}

function getConfig(key) {
  return config.get(key);
}

function setConfig(key, val) {
  console.log("set config key=" + key + " , val=" + val);
  config.set(key, val);
  applyConfig();
}

function setSystemConfig(key,val) {
  setConfig("system." + key, val);
}

function getSystemConfig(key) {
  return getConfig("system." + key);
}

function setUserConfig(key,val) {
  setConfig("user." + key, val);
}

function getUserConfig(key) {
  return getConfig("user." + key);
}

function hideWindow() {
  wnd.hide();
}

function showWindow() {
  wnd.show();
}

function isCmd(str) {
  var splitted = str.split(" ");
  return (splitted.length > 0) && (splitted[0].slice(0,1) === "@");
}

function parseCmd(str) {
  var splitted = str.split(" ");
  var cmd = splitted[0].trim().substr(1);
  var param = (splitted.slice(1).join(" ")).split("=").map(function(e) { return e.trim();});

  return {cmd : cmd, param : param};
}

function execCmd(compiled) {
  var cmd = compiled.cmd;
  var param = compiled.param;

  console.log(cmd, param);

  switch (cmd){
    case "set":
      setUserConfig(param[0], param[1]);
      break;
    case "config":
      setSystemConfig(param[0], param[1]);
      break;
    case "clear":
      clearConfig();
      break;
    // case "edit-config":
    //   editConfig();
    //   break;
    case "exit":
      exitApp();
      break;
  }
}

function procInput(str) {
  if(isCmd(str)) {
    execCmd(parseCmd(str));
  } else {
    execUserCmd(str);
    addRecent(str);
  }
}

function isDirectory(filepath) {
  if(filepath.substr(-1) !== "\\") {
    return false;
  }
  return fs.existsSync(filepath) && fs.statSync(filepath).isDirectory();
}

function startProc(cmd) {
  const exec = require('child_process').exec;

  var cmdStr = "start \"\" \"" + cmd + "\"";
  console.log(cmdStr);
  exec(cmdStr, (err, stdout, stderr) => {
    if (err) { 
      console.log(err); 
    }
    console.log(stdout);
  });
}

function execUserCmd(cmd) {
  var cnf = config.get("user." + cmd);
  if(cnf !== undefined) {
    startProc(cnf);
  } else {
    startProc(cmd);
  }
}

function clearConfig() {
  config.delete('user');
}

function editConfig() {
  config.openInEditor();
}

function exitApp() {
  app.quit();
}

function addRecent(recent) {
  var recents = JSON.parse(getSystemConfig("recent"));
  if(!(__.contains(recents, recent))) {
    recents.unshift(recent);
  }
  if(recents.length > getSystemConfig("historyMax")) {
    recents = recents.slice(0,getSystemConfig("historyMax"));
  }
  setSystemConfig("recent", JSON.stringify(recents));
}

function getRecent() {
  return JSON.parse(getSystemConfig("recent"));
}

function getDirectoryLs(path, after) {
  fs.readdir(path, function(err, files){
    if(after) {
      after(path,err,files);
    }
    if (err) throw err;
    console.log(files);
  });

  return ls;
}

exports.procInput = procInput;

exports.isDirectory = isDirectory;

exports.setSystemConfig = setSystemConfig;

exports.getSystemConfig = getSystemConfig;

exports.setUserConfig = setUserConfig;

exports.getUserConfig = getUserConfig;

exports.hideWindow = hideWindow;

exports.execUserCmd = execUserCmd;

exports.clearConfig = clearConfig;

exports.exitApp = exitApp;

exports.addRecent = addRecent;

exports.getRecent = getRecent;

exports.getDirectoryLs = getDirectoryLs;

const clipboardy = require('clipboardy');

// clipboardy.writeSync('🦄');
// 
// clipboardy.readSync();

exports.getClipboard = function(after) {
  after(clipboardy.readSync());
} 

