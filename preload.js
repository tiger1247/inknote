const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  load: () => ipcRenderer.invoke('nb:load'),
  save: json => ipcRenderer.invoke('nb:save', json),
  saveSync: json => ipcRenderer.sendSync('nb:save-sync', json),
  dataPath: () => ipcRenderer.invoke('nb:path'),
  exportPdf: opts => ipcRenderer.invoke('export:pdf', opts),
  showFile: f => ipcRenderer.invoke('shell:show', f),
  openData: () => ipcRenderer.invoke('shell:data'),
  backupExport: json => ipcRenderer.invoke('backup:export', json),
  backupImport: () => ipcRenderer.invoke('backup:import'),
  titlebar: o => ipcRenderer.invoke('win:titlebar', o),
  fullscreen: () => ipcRenderer.invoke('win:fullscreen'),
  selftest: () => ipcRenderer.invoke('selftest:get'),
  selftestShot: n => ipcRenderer.invoke('selftest:shot', n),
  selftestDone: () => ipcRenderer.invoke('selftest:done'),
});
