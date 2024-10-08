import { ConfigHandler } from "../config/ConfigHandler.js";
import { IContinueServerClient } from "../continueServer/interface.js";
import { IDE, IndexTag, IndexingProgressUpdate } from "../index.js";
import { CodeSnippetsCodebaseIndex } from "./CodeSnippetsIndex.js";
import { FullTextSearchCodebaseIndex } from "./FullTextSearch.js";
import { LanceDbIndex } from "./LanceDbIndex.js";
import { ChunkCodebaseIndex } from "./chunk/ChunkCodebaseIndex.js";
import { getComputeDeleteAddRemove } from "./refreshIndex.js";
import { CodebaseIndex, IndexResultType } from "./types.js";
import { walkDir } from "./walkDir.js";

export class PauseToken {
  constructor(private _paused: boolean) {}

  set paused(value: boolean) {
    this._paused = value;
  }

  get paused(): boolean {
    return this._paused;
  }
}

export class CodebaseIndexer {
  constructor(
    private readonly configHandler: ConfigHandler,
    private readonly ide: IDE,
    private readonly pauseToken: PauseToken,
    private readonly continueServerClient: IContinueServerClient,
  ) {}

  private async getIndexesToBuild(): Promise<CodebaseIndex[]> {
    const config = await this.configHandler.loadConfig();

    const indexes = [
      new ChunkCodebaseIndex(
        this.ide.readFile.bind(this.ide),
        this.continueServerClient,
        config.embeddingsProvider.maxChunkSize,
      ), // Chunking must come first
      new LanceDbIndex(
        config.embeddingsProvider,
        this.ide.readFile.bind(this.ide),
        this.continueServerClient,
      ),
      new FullTextSearchCodebaseIndex(),
      new CodeSnippetsCodebaseIndex(this.ide),
    ];

    return indexes;
  }

  public async refreshFile(file: string): Promise<void> {
    if (this.pauseToken.paused) {
      // NOTE: by returning here, there is a chance that while paused a file is modified and
      // then after unpausing the file is not reindexed
      return;
    }
    const workspaceDir = await this.getWorkspaceDir(file);
    if (!workspaceDir) {
      return;
    }
    const branch = await this.ide.getBranch(workspaceDir);
    const repoName = await this.ide.getRepoName(workspaceDir);
    const stats = await this.ide.getLastModified([file]);
    const indexesToBuild = await this.getIndexesToBuild();
    for (const codebaseIndex of indexesToBuild) {
      const tag: IndexTag = {
        directory: workspaceDir,
        branch,
        artifactId: codebaseIndex.artifactId,
      };
      const [results, lastUpdated, markComplete] = await getComputeDeleteAddRemove(
        tag,
        { ...stats },
        (filepath) => this.ide.readFile(filepath),
        repoName,
      );
      for await (const _ of codebaseIndex.update(tag, results, markComplete, repoName)) {
        lastUpdated.forEach((lastUpdated, path) => {
          markComplete([lastUpdated], IndexResultType.UpdateLastUpdated);
        });
      }
    }
  }

  async *refresh(
    workspaceDirs: string[],
    abortSignal: AbortSignal,
  ): AsyncGenerator<IndexingProgressUpdate> {
    let progress = 0;

    if (workspaceDirs.length === 0) {
      yield {
        progress,
        desc: "Nothing to index",
        status: "disabled",
      };
      return;
    }

    const config = await this.configHandler.loadConfig();
    if (config.disableIndexing) {
      yield {
        progress,
        desc: "Indexing is disabled in config.json",
        status: "disabled",
      };
      return;
    } else {
      yield {
        progress,
        desc: "Starting indexing",
        status: "loading",
      };
    }

    const indexesToBuild = await this.getIndexesToBuild();
    let completedDirs = 0;
    const totalRelativeExpectedTime = indexesToBuild.reduce(
      (sum, index) => sum + index.relativeExpectedTime,
      0,
    );

    // Wait until Git Extension has loaded to report progress
    // so we don't appear stuck at 0% while waiting
    await this.ide.getRepoName(workspaceDirs[0]);

    yield {
      progress,
      desc: "Starting indexing...",
      status: "loading",
    };

    for (const directory of workspaceDirs) {
      const files = await walkDir(directory, this.ide);
      const stats = await this.ide.getLastModified(files);
      const branch = await this.ide.getBranch(directory);
      const repoName = await this.ide.getRepoName(directory);
      let completedRelativeExpectedTime = 0;

      for (const codebaseIndex of indexesToBuild) {
        // TODO: IndexTag type should use repoName rather than directory
        const tag: IndexTag = {
          directory,
          branch,
          artifactId: codebaseIndex.artifactId,
        };
        const [results, lastUpdated, markComplete] = await getComputeDeleteAddRemove(
          tag,
          { ...stats },
          (filepath) => this.ide.readFile(filepath),
          repoName,
        );

        try {
          for await (let {
            progress: indexProgress,
            desc,
          } of codebaseIndex.update(tag, results, markComplete, repoName)) {
            // Handle pausing in this loop because it's the only one really taking time
            if (abortSignal.aborted) {
              yield {
                progress: 1,
                desc: "Indexing cancelled",
                status: "disabled",
              };
              return;
            }

            if (this.pauseToken.paused) {
              yield {
                progress,
                desc: "Paused",
                status: "paused",
              };
              while (this.pauseToken.paused) {
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
            }

            progress =
              (completedDirs +
                (completedRelativeExpectedTime +
                  Math.min(1.0, indexProgress) *
                    codebaseIndex.relativeExpectedTime) /
                  totalRelativeExpectedTime) /
              workspaceDirs.length;
            yield {
              progress,
              desc,
              status: "indexing",
            };
          }

          lastUpdated.forEach((lastUpdated, path) => {
            markComplete([lastUpdated], IndexResultType.UpdateLastUpdated);
          });

          completedRelativeExpectedTime += codebaseIndex.relativeExpectedTime;
          yield {
            progress:
              (completedDirs +
                completedRelativeExpectedTime / totalRelativeExpectedTime) /
              workspaceDirs.length,
            desc: "Completed indexing " + codebaseIndex.artifactId,
            status: "indexing",
          };
        } catch (e: any) {
          let errMsg = `${e}`;

          const errorRegex =
            /Invalid argument error: Values length (\d+) is less than the length \((\d+)\) multiplied by the value size \(\d+\)/;
          const match = e.message.match(errorRegex);

          if (match) {
            const [_, valuesLength, expectedLength] = match;
            errMsg = `Generated embedding had length ${valuesLength} but was expected to be ${expectedLength}. This may be solved by deleting ~/.pearai/index and refreshing the window to re-index.`;
          }

          yield {
            progress: 0,
            desc: errMsg,
            status: "failed",
          };

          console.warn(
            `Error updating the ${codebaseIndex.artifactId} index: ${e}`,
          );
          return;
        }
      }

      completedDirs++;
      progress = completedDirs / workspaceDirs.length;
      yield {
        progress,
        desc: "Indexing Complete",
        status: "done",
      };
    }
  }

  private async getWorkspaceDir(filepath: string): Promise<string | undefined> {
    const workspaceDirs = await this.ide.getWorkspaceDirs();
    for (const workspaceDir of workspaceDirs) {
      if (filepath.startsWith(workspaceDir)) {
        return workspaceDir;
      }
    }
    return undefined;
  }
}
