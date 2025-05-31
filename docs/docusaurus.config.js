const config = {
  title: 'insulA Documentation',
  tagline: 'Manual de Usuario de insulA',
  favicon: 'img/favicon.ico',
  url: 'https://tpp-insula.github.io',
  baseUrl: '/TPP_insulA_mobile_app/',
  organizationName: 'TPP-insulA',
  projectName: 'TPP_insulA_mobile_app',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/TPP-insulA/TPP_insulA_mobile_app/edit/main/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'insulA Documentation',
      logo: {
        alt: 'insulA Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Manual',
        },
        {
          href: 'https://github.com/TPP-insulA/TPP_insulA_mobile_app',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Manual',
              to: '/docs/intro',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} insulA. Built with Docusaurus.`,
    },
  },
};

module.exports = config; 