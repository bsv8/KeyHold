import { defineConfig } from "vitepress";
import typedocSidebar from "../api/typedoc-sidebar.json";

function normalizeBasePath(input: string | undefined): string {
  const value = input?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  if (!value) return "/";
  return `/${value}/`;
}

const base = normalizeBasePath(process.env.DOCS_BASE);
const repositoryUrl = process.env.DOCS_REPOSITORY_URL?.trim().replace(/\/+$/, "") || "https://github.com/bsv8/KeyHold";
const repositoryBranch = process.env.DOCS_REPOSITORY_BRANCH?.trim() || "main";
const sourceUrl = repositoryUrl
  ? `${repositoryUrl}/tree/${encodeURIComponent(repositoryBranch)}/typescript/src`
  : "";

export default defineConfig({
  lang: "en-US",
  title: "KeyHold",
  description: "A minimal JSON backup format for one password and one secp256k1 private key.",
  base,
  appearance: "dark",
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ["meta", { name: "theme-color", content: "#07110f" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "KeyHold SDK" }],
    ["meta", { property: "og:description", content: "One JSON file, one password, one secp256k1 private key." }]
  ],
  themeConfig: {
    logo: { src: "/keyhold-mark.svg", alt: "KeyHold" },
    siteTitle: "KeyHold",
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Format", link: "/concepts/document-format" },
      {
        text: "API",
        items: [
          { text: "TypeScript API", link: "/api/" },
          { text: "Go package docs", link: "https://pkg.go.dev/github.com/bsv8/KeyHold/go/v2" }
        ]
      },
      { text: "v2.0.0", items: [{ text: "Release notes", link: "/release-notes" }] }
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [
            { text: "Getting started", link: "/guide/getting-started" },
            { text: "Export & unlock", link: "/guide/export-unlock" },
            { text: "Validate & serialize", link: "/guide/validate-serialize" },
            { text: "Errors", link: "/guide/errors" }
          ]
        }
      ],
      "/concepts/": [
        {
          text: "Concepts",
          items: [
            { text: "Document format", link: "/concepts/document-format" },
            { text: "Password & crypto", link: "/concepts/password-crypto" },
            { text: "Interoperability", link: "/concepts/interoperability" },
            { text: "Security model", link: "/concepts/security" }
          ]
        }
      ],
      "/api/": [
        {
          text: "TypeScript API",
          items: typedocSidebar
        }
      ]
    },
    search: {
      provider: "local",
      options: {
        detailedView: true
      }
    },
    socialLinks: repositoryUrl ? [{ icon: "github", link: repositoryUrl }] : [],
    ...(repositoryUrl ? {
      editLink: {
        pattern: `${repositoryUrl}/edit/${encodeURIComponent(repositoryBranch)}/docs-site/site/:path`,
        text: "Edit this page on GitHub"
      }
    } : {}),
    outline: { level: [2, 3], label: "On this page" },
    docFooter: { prev: "Previous", next: "Next" },
    footer: {
      message: "One file. One password. One private key.",
      copyright: "KeyHold"
    }
  },
  vite: {
    define: {
      __KEYHOLD_SOURCE_URL__: JSON.stringify(sourceUrl)
    }
  }
});
