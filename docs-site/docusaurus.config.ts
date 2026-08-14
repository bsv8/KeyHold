import type {Config} from '@docusaurus/types';
import {themes as prismThemes} from 'prism-react-renderer';

function normalizedBaseUrl(value: string | undefined): string {
  const base = value ?? '/';
  return `/${base.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
}

const config: Config = {
  title: 'KeyHold',
  tagline: 'One document format. Two SDKs. A clear path from key to ciphertext.',
  favicon: 'img/keyhold-mark.svg',
  url: process.env.DOCS_URL ?? 'https://docs.keyhold.dev',
  baseUrl: normalizedBaseUrl(process.env.DOCS_BASE_URL),
  organizationName: process.env.DOCS_GITHUB_OWNER ?? 'bsv8',
  projectName: process.env.DOCS_GITHUB_REPO ?? 'KeyHold',
  deploymentBranch: process.env.DOCS_DEPLOY_BRANCH ?? 'gh-pages',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  markdown: {hooks: {onBrokenMarkdownLinks: 'throw'}},
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN'],
    localeConfigs: {
      en: {label: 'English', htmlLang: 'en-US'},
      'zh-CN': {label: '简体中文', htmlLang: 'zh-CN'},
    },
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          showLastUpdateTime: false,
          breadcrumbs: true,
          editUrl: ({locale, docPath}: {locale: string; versionDocsDirPath: string; docPath: string}) => {
            const branch = process.env.DOCS_GITHUB_BRANCH ?? 'main';
            const owner = process.env.DOCS_GITHUB_OWNER ?? 'bsv8';
            const repo = process.env.DOCS_GITHUB_REPO ?? 'KeyHold';
            const base = `https://github.com/${owner}/${repo}`;
            if (docPath.startsWith('api/') && locale === 'zh-CN') return `${base}/edit/${branch}/docs-site/i18n/api.zh-CN.json`;
            if (docPath.startsWith('api/typescript/')) return `${base}/tree/${branch}/typescript/src`;
            if (docPath.startsWith('api/go/')) return `${base}/tree/${branch}/go`;
            const source = locale === 'zh-CN' ? `i18n/zh-CN/docusaurus-plugin-content-docs/current/${docPath}` : `docs/${docPath}`;
            return `${base}/edit/${branch}/docs-site/${source}`;
          },
        },
        theme: {customCss: ['./src/css/custom.css', './src/css/sdk-toggle.css']},
      },
    ],
  ],
  themeConfig: {
    image: 'img/keyhold-social-card.svg',
    navbar: {
      title: 'KeyHold',
      logo: {alt: 'KeyHold mark', src: 'img/keyhold-mark.svg'},
      items: [
        {to: '/guide/getting-started', label: 'Guide', position: 'left'},
        {to: '/operations', label: 'SDK operation map', position: 'left'},
        {label: 'API reference', type: 'dropdown', position: 'left', items: [{label: 'TypeScript API', to: '/api/typescript'}, {label: 'Go API', to: '/api/go'}]},
        {type: 'docSidebar', sidebarId: 'concepts', label: 'Concepts', position: 'left'},
        {type: 'localeDropdown', position: 'right'},
        {href: 'https://github.com/bsv8/KeyHold', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {title: 'Explore', items: [{label: 'Getting started', to: '/guide/getting-started'}, {label: 'Operation map', to: '/operations'}, {label: 'Release notes', to: '/release-notes'}]},
        {title: 'Reference', items: [{label: 'TypeScript API', to: '/api/typescript'}, {label: 'Go API', to: '/api/go'}, {label: 'Security model', to: '/concepts/security-model'}]},
      ],
      copyright: `Copyright © ${new Date().getFullYear()} KeyHold contributors.`,
    },
    prism: {theme: prismThemes.github, darkTheme: prismThemes.dracula},
  },
};

export default config;
