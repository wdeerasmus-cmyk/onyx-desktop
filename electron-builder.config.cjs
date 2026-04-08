module.exports = {
  appId: "com.onyxaegis.desktop",
  productName: "Onyx - Cyber Security",
  copyright: "Copyright © 2026 Onyx Aegis",

  directories: {
    output: "dist/installers",
  },

  files: [
    "dist/public/**/*",
    "electron/**/*",
    "node_modules/**/*",
    "!node_modules/.bin",
  ],

  extraMetadata: {
    main: "electron/main.js",
  },

  mac: {
    category: "public.app-category.utilities",
    icon: "public/icon.icns",
    target: [
      { target: "dmg", arch: ["universal"] },
    ],
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "electron/entitlements.mac.plist",
    entitlementsInherit: "electron/entitlements.mac.plist",
  },

  dmg: {
    title: "Onyx - Cyber Security",
    icon: "public/icon.icns",
    contents: [
      { x: 410, y: 150, type: "link", path: "/Applications" },
      { x: 130, y: 150, type: "file" },
    ],
  },

  win: {
    target: [{ target: "nsis", arch: ["x64"] }],
    icon: "public/icon.ico",
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: "public/icon.ico",
    uninstallerIcon: "public/icon.ico",
    installerHeaderIcon: "public/icon.ico",
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Onyx Security",
  },

  publish: {
    provider: "github",
    owner: "onyxaegis",
    repo: "onyx-desktop",
  },

  linux: false,
};
