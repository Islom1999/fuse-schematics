export interface Schema {
  /** Project name (dasherized for the folder and the package.json name). */
  name: string;
  /** Parent directory to create the project in. */
  directory?: string;
  /** Do not run `npm install` in the new project. */
  skipInstall?: boolean;
  /** Do not initialize a git repository with an initial commit. */
  skipGit?: boolean;
}
