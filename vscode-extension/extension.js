const vscode = require('vscode');

function activate(context) {
  const disposable = vscode.commands.registerCommand('myExtension.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from VS Code extension!');
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
