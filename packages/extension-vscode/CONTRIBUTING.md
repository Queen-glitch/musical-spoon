# Contributing

Instructions for getting started contributing to `webhint`
for Visual Studio Code.

## Compile and Run

* Run `yarn` to install dependencies.
* Run `yarn build` from the root `hint` directory.
* Open VS Code on this directory.
* Switch to the Debug viewlet.
* Select `Client + Server` from the drop down.
* Run the launch config.

NOTE: Make sure you open a file in the launched vscode instance
that webhint is registered for (like html or tsconfig.json), otherwise,
the server won't start.

## Running Tests

* Run `yarn test` from this directory.

## Packaging

* Install the packager via `npm install -g vsce`.
* Run `vsce package`.
* Install the generated `*.vsix` package in VSCode:
  * Go to `View > Extensions`.
  * Click `...` in the top-right of the panel.
  * Click `Install from VSIX...`.
  * Choose the generated `*.vsix` package from disk.

## Publishing

Full instructions available at the [Publishing Extensions][publishing]
page in the Visual Studio Code documentation. You must be a member of
the [`webhint` Visual Studio Marketplace publisher][webhint pub] to
publish.

* Install the packager via `npm install -g vsce`
* Run `vsce login webhint`
* Provide your [Personal Access Token][token]
* Run the release script
  * Preferred: Run `npm run release` from the root of this repo
    (publishes all webhint packages - automatically calculates version bump)
  * Alternate: Run `vsce publish` from this directory
    (publishes only this extension - requires manual version bump)

Note `vsce` saves your login information so only `npm install` and
`vsce publish` are necessary on subsequent attempts.

<!-- Link labels: -->

[publishing]: https://code.visualstudio.com/docs/extensions/publish-extension
[webhint pub]: https://marketplace.visualstudio.com/manage/publishers/webhint
[token]: https://code.visualstudio.com/docs/extensions/publish-extension#_get-a-personal-access-token
