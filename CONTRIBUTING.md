# Contributing guidelines
Thank you for your interest in contributing to NotesReview!

If you want to work on improving the application, the following tips and hints may be useful for you. 😉

## Building and running
NotesReview is a web application and is therefore mainly written in Javascript. `npm` is used as the preferred package manager, [`Vite` ⚡](https://github.com/vitejs/vite) is used as a module bundler.

You may want to take a look at the [`package.json`](https://github.com/ENT8R/NotesReview/blob/main/package.json) file in order to get an overview on which modules are being used and what commands to run.

Before running the application, make sure the file `app/.env` with the following required environment variables exists:
```shell
NOTESREVIEW_API_URL=https://notesreview.kongruent.xyz/api
OPENSTREETMAP_SERVER=https://www.openstreetmap.org
```
There are a few more environment variables that are used for additional features, but they are not mandatory to run the application, so in most cases the configuration above should be sufficient.

To setup, change and run the application locally, simply follow these steps:
```shell
# 1. Install all necessary dependencies using npm
npm install
# 2. Start the application by running the following command
# and visiting http://localhost:5173 in your browser
npm run dev
# 3. Now it's your turn — change, fix or improve something!
```
That's it already! Now you can submit your change as a [pull request on Github](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests).

## Translating
If you want to translate the website into your language or fix a wrong term, you can do so by visiting the project at POEditor.

Follow [**this link** to improve the translations](https://poeditor.com/join/project/oVilUChBdf):

[![POEditor](https://poeditor.com/public/images/logo_small.png)](https://poeditor.com/join/project/oVilUChBdf)

The use of POEditor is preferred over proposing new translations via pull requests.

## Testing and reporting bugs
The easiest way to contribute is of course to use and test the application and report bugs on Github using the [issue tracker](https://github.com/ENT8R/NotesReview/issues/). Just let me know if you spot something that looks suspicious. 🙃
