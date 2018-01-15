import {exec} from "child-process-promise";
import {resolveModuleDir} from "../module";
import {isVersionString} from "../version";
import {ResolvingModuleInfo} from "./index";
import gh = require("parse-github-url");
import {exists} from "mz/fs";
import * as path from "path";
const debug = require("debug")("upk:git");
export type GitTag = string;
export type GitOptions = {}
import semver = require("semver");
async function checkoutIdealVersion(gitdir: string, version?: GitTag) {
    if (!version) return;
    let coVersion = version;
    const cwd = process.cwd();
    try {
        if (isVersionString(version)) {
            debug(`semantic version was specified: ${version}`);
            // v0.1.0 or 1.0.0 ~>0.1.2 etc...
            const tags = (await exec("git tag")).stdout.split("\n").filter(isVersionString);
            coVersion = semver.maxSatisfying(tags, version);
        }
        process.chdir(gitdir);
        debug(`try to checkout: ${version}`);
        await exec(`git checkout ${coVersion}`);
    } finally {
        process.chdir(cwd);
    }
}

export async function isGitDir(gitpath: string): Promise<boolean> {
    return await exists(path.resolve(gitpath, ".git"));
}

export async function currentRef(path: string): Promise<string> {
    const cwd = process.cwd();
    if (!await isGitDir(path)) throw new Error(`path: ${path} may not be git directory.`);
    try {
        process.chdir(path);
        const {stdout} = (await exec(`git symbolic-ref --short HEAD`));
        return parseGitRef(stdout);
    } catch (err) {
        // may be checkouted commit?
        try {
            const {stdout} = (await exec(`git rev-parse --short HEAD`));
            return stdout;
        } catch (err2) {
            debug("unknown error occured while retrieving git revision within : "+path);
            // unknwon
            throw err2;
        }
    } finally {
        process.chdir(cwd);
    }
}

export function parseGitRef(ref: string) {
    const m = ref.match(/^heads\/(.+)$/);
    if (m) {
        return m[1];
    }
    throw new Error(`ref:${ref} is not result of git symbolic-ref`);
}

export async function lsRemote(gitUrl: string): Promise<string[]> {
    const result = (await exec(`git ls-remote -t ${gitUrl}`)).stdout as string;
    return result.split("\n").map(ln => ln.split("\t")[1]);
}

export async function clone(gitUrl: string, version?: GitTag, opts?: GitOptions) {
    const gitComps = gh(gitUrl);
    let {name, host, path, protocol} = gitComps;
    if (!protocol && gitComps.host === "github.com") {
        protocol = "https";
    }
    const url = `${protocol}://${host}/${path}`;
    if (!protocol || !host || !path || !name) {
        throw new Error(`invalid git url: ${url}`);
    }
    debug(`try to clone git repo: ${url} -> ${resolveModuleDir(name)}`);
    let cmd = `git clone ${url} ${resolveModuleDir(name)}`;
    if (version) cmd +=  ` -b ${version}`;
    await exec(cmd);
    return resolveModuleDir(name);
}

export async function runGit(context: ResolvingModuleInfo, urlLike: string, version?: GitTag, opts?: GitOptions) {
    const gitdir = await clone(urlLike);
    await checkoutIdealVersion(gitdir, version);
    return resolveModuleDir(context.moduleName)
}

export async function git(urlLike: string, version?: GitTag, opts?: GitOptions) {
    return await clone(urlLike, version, opts);
}