# Next.js frontend

This is a static site generator (SSG) project built using [Next.js](https://nextjs.org/) and it's function called [getStaticProps](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props). It allows to generate static HTML files for the site, providing improved performance and easy deployment.

# Getting Started
## Prerequisites

Make sure you have Node.js and npm (Node Package Manager) installed on your machine.

Install the dependencies:
`npm install`

## Development

To start the development server and preview the site, use the following command:

`npm run dev`

The development server will start at http://localhost:3000. Any changes you make to your source files will be automatically reloaded in the browser.

## Build

To build static site and generate the optimized production-ready files, use the following command:

`npm run build`

The build command will generate the static HTML files and assets in the out directory.

## Start

To start a local server and preview your built static site, use the following command:

`npm start`

The static site will be served at http://localhost:3000.

## Export

To export static site to a directory that can be easily deployed to any web server, use the following command:

`npm run export`

The export command will generate a static version of the site in the out or dist directory, ready for deployment.

## Configuration

You can modify the configuration settings of the project by editing the relevant files.