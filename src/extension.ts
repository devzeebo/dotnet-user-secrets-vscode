import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { Builder, parseString } from "xml2js";

export function activate(context: vscode.ExtensionContext) {
  console.log("User Secrets Extension is now active");

  let disposable = vscode.commands.registerCommand(
    "dotnet-user-secrets.openUserSecrets",
    async (uri: vscode.Uri) => {
      try {
        await openUserSecretsFile(uri);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open user secrets: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function openUserSecretsFile(uri: vscode.Uri): Promise<void> {
  // Read the .csproj file
  const csprojPath = uri.fsPath;
  let csprojContent = fs.readFileSync(csprojPath, "utf8");

  // Parse XML to find UserSecretsId
  let userSecretsId = await extractUserSecretsId(csprojContent);

  if (!userSecretsId) {
    // Generate a new UserSecretsId from the csproj filename
    userSecretsId = generateUserSecretsId(csprojPath);

    // Add the UserSecretsId to the csproj file
    csprojContent = await addUserSecretsIdToCsproj(
      csprojContent,
      userSecretsId
    );
    fs.writeFileSync(csprojPath, csprojContent, "utf8");

    vscode.window.showInformationMessage(
      `Created new UserSecretsId: ${userSecretsId}`
    );
  }

  // Construct the path to the secrets.json file
  const secretsPath = getUserSecretsPath(userSecretsId);

  // Create all parent directories if they don't exist
  const secretsDir = path.dirname(secretsPath);
  fs.mkdirSync(secretsDir, { recursive: true });

  // Create the file with empty JSON if it doesn't exist
  if (!fs.existsSync(secretsPath)) {
    fs.writeFileSync(secretsPath, "{\n  \n}", "utf8");
  }

  // Open the file in the editor
  const document = await vscode.workspace.openTextDocument(secretsPath);
  await vscode.window.showTextDocument(document);

  vscode.window.showInformationMessage(
    `Opened user secrets for: ${path.basename(csprojPath)}`
  );
}

function extractUserSecretsId(csprojContent: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    parseString(csprojContent, (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        // Navigate through the XML structure to find UserSecretsId
        const project = result.Project;
        if (!project || !project.PropertyGroup) {
          resolve(null);
          return;
        }

        // PropertyGroup can be an array
        const propertyGroups = Array.isArray(project.PropertyGroup)
          ? project.PropertyGroup
          : [project.PropertyGroup];

        for (const group of propertyGroups) {
          if (group.UserSecretsId) {
            const userSecretsId = Array.isArray(group.UserSecretsId)
              ? group.UserSecretsId[0]
              : group.UserSecretsId;

            // Handle both string and object with _ property
            const id =
              typeof userSecretsId === "string"
                ? userSecretsId
                : userSecretsId._;

            if (id && typeof id === "string") {
              resolve(id.trim());
              return;
            }
          }
        }

        resolve(null);
      } catch (error) {
        reject(error);
      }
    });
  });
}

function getUserSecretsPath(userSecretsId: string): string {
  const homeDir = os.homedir();
  let secretsBasePath: string;

  // Determine the secrets path based on the platform
  switch (process.platform) {
    case "win32":
      secretsBasePath = path.join(
        process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
        "Microsoft",
        "UserSecrets"
      );
      break;
    case "darwin":
      secretsBasePath = path.join(homeDir, ".microsoft", "usersecrets");
      break;
    case "linux":
    default:
      secretsBasePath = path.join(homeDir, ".microsoft", "usersecrets");
      break;
  }

  return path.join(secretsBasePath, userSecretsId, "secrets.json");
}

function generateUserSecretsId(csprojPath: string): string {
  // Get the filename without extension
  const basename = path.basename(csprojPath, ".csproj");

  // Convert to lowercase and replace all non-word characters with dashes
  const id = basename.toLowerCase().replace(/\W+/g, "-");

  return id;
}

function addUserSecretsIdToCsproj(
  csprojContent: string,
  userSecretsId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    parseString(
      csprojContent,
      { preserveChildrenOrder: true },
      (err: any, result: any) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const project = result.Project;
          if (!project) {
            reject(new Error("Invalid csproj file: No Project element found"));
            return;
          }

          // Find or create the first PropertyGroup
          if (!project.PropertyGroup) {
            project.PropertyGroup = [{}];
          }

          const propertyGroups = Array.isArray(project.PropertyGroup)
            ? project.PropertyGroup
            : [project.PropertyGroup];

          // Add UserSecretsId to the first PropertyGroup
          propertyGroups[0].UserSecretsId = [userSecretsId];

          // Build the XML back
          const builder = new Builder({
            xmldec: {
              version: "1.0",
              encoding: undefined,
              standalone: undefined,
            },
            renderOpts: { pretty: true, indent: "  ", newline: "\n" },
          });
          const xml = builder.buildObject(result);

          resolve(xml);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

export function deactivate() {}
