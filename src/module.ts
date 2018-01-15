import p = require("path");
import {GitTag} from "./resolver/git";

const moduleDir = "UpkModules";
export function resolveModuleDir(path: string = ".") {
    return p.resolve(moduleDir, path);
}
export type ResolverType = "git" | "asset" | "upk" | "zip";
export type SemverString = string;
export type FixedModuleVersion = string | GitTag;
export type ModuleVersion = SemverString | GitTag;
export type DependencyInfo = {
    name: string,
    type: ResolverType
    version?: ModuleVersion,
    lockedVersion?: FixedModuleVersion,
    dependencies?: DependencyTree
}
export const DependencyTreeFormatVersion = "1.0.0";
export type DependencyTree = {
    formatVersion: string,
    modules: {[name: string]: DependencyInfo }
}
export function createDependencyTree(modules: {[name: string]: DependencyInfo} = {}): DependencyTree {
    return {formatVersion: DependencyTreeFormatVersion, modules}
}