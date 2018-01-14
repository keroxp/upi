import {GitOptions, GitTag, runGit} from "../resolver/git";
import {Resolvable, ResolvingModuleInfo} from "../resolver";
import {PathProvider, runZip} from "../resolver/zip";
import {UpkfileContext} from "./index";

export class ResolverContext implements UpkfileContext {
    constructor(private type: string, private context: ResolvingModuleInfo) {
    }
    async git (gitUrl: string, version?: GitTag, opts?: GitOptions) {
        return runGit(this.context, gitUrl, version, opts);
    }
    async zip (url: string, pathResolver: PathProvider) {
        return runZip(this.context.moduleName, url, pathResolver);
    }
    upk (name: string, resolver: Resolvable): Promise<string> {
        throw new Error(`puk is not allowed within "${this.type}"`);
    }
    asset (name: string, resolver: Resolvable): Promise<string> {
        throw new Error(`asset is not allowed within "${this.type}"`);
    }
}