# User Secrets Manager

A Visual Studio Code extension that provides quick access to .NET user secrets files directly from the context menu of `.csproj` files.

## Features

- **Right-click Context Menu**: Right-click any `.csproj` file in the Explorer and select "Open User Secrets" to instantly open the associated `secrets.json` file
- **Automatic File Creation**: If the secrets file doesn't exist, it will be created automatically with proper JSON structure
- **Cross-Platform Support**: Works on Windows, macOS, and Linux with correct path resolution for each platform
- **Helpful Guidance**: If a project doesn't have a `UserSecretsId`, the extension will offer to open documentation on how to add one

## Usage

1. Right-click on any `.csproj` file in the VS Code Explorer
2. Select **"Open User Secrets"** from the context menu
3. The corresponding `secrets.json` file will open in the editor

## Requirements

Your `.csproj` file must contain a `<UserSecretsId>` element in a `<PropertyGroup>`:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <UserSecretsId>your-guid-here</UserSecretsId>
  </PropertyGroup>
</Project>
```

If you don't have a `UserSecretsId`, you can add one using the .NET CLI:

```bash
dotnet user-secrets init
```

## User Secrets File Locations

The extension follows the standard .NET user secrets file locations:

- **Windows**: `%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json`
- **macOS**: `~/.microsoft/usersecrets/<UserSecretsId>/secrets.json`
- **Linux**: `~/.microsoft/usersecrets/<UserSecretsId>/secrets.json`

## Installation

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the TypeScript code
4. Press `F5` in VS Code to launch the Extension Development Host
5. Test the extension with your `.csproj` files

### Package and Install

1. Install `vsce`: `npm install -g @vscode/vsce`
2. Package the extension: `vsce package`
3. Install the `.vsix` file: `code --install-extension user-secrets-extension-0.1.0.vsix`

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run linting
npm run lint
```

## Known Issues

None at this time. Please report issues on the GitHub repository.

## Release Notes

### 0.1.0

Initial release with basic functionality:
- Context menu integration for `.csproj` files
- Automatic user secrets file opening
- Cross-platform path resolution
- Automatic file and directory creation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
