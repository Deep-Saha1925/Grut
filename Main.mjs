#!/usr/bin/env node

import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { diffLines } from 'diff';
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();

class Grut {

    constructor(repoPath = ".") {
        this.repoPath = path.join(repoPath, '.grut');
        this.objectsPath = path.join(this.repoPath, 'objects');
        this.headPath = path.join(this.repoPath, 'HEAD');
        this.indexPath = path.join(this.repoPath, 'index');
    }

    async init() {
        await fs.mkdir(this.objectsPath, { recursive: true });

        try {
            await fs.writeFile(this.headPath, '', { flag: 'wx' });
            await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: 'wx' });
            console.log('Initialized empty Grut repository');
        } catch {
            console.log('Repository already initialized.');
        }
    }

    async ensureRepo() {
        try {
            await fs.access(this.repoPath);
        } catch {
            throw new Error("Not a grut repository. Run `grut init` first.");
        }
    }

    hashObject(data) {
        return crypto.createHash('sha1').update(data, 'utf-8').digest('hex');
    }

    async add(fileToAdd) {
        await this.ensureRepo();

        const fileData = await fs.readFile(fileToAdd, 'utf-8');
        const fileHash = this.hashObject(fileData);

        const objectPath = path.join(this.objectsPath, fileHash);

        // write object only if not exists
        try {
            await fs.writeFile(objectPath, fileData, { flag: 'wx' });
        } catch { }

        await this.updateStagingArea(fileToAdd, fileHash);
        console.log(`Added ${fileToAdd}`);
    }

    async updateStagingArea(filePath, fileHash) {
        const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));

        // remove duplicate entry
        const filtered = index.filter(f => f.path !== filePath);
        filtered.push({ path: filePath, hash: fileHash });

        await fs.writeFile(this.indexPath, JSON.stringify(filtered, null, 2));
    }

    async commit(message) {
        await this.ensureRepo();

        const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
        if (index.length === 0) {
            console.log("Nothing to commit");
            return;
        }

        const parent = await this.getCurrentHead();

        const commitData = {
            timestamp: new Date().toISOString(),
            message,
            parent,
            files: index
        };

        const commitHash = this.hashObject(JSON.stringify(commitData));
        await fs.writeFile(
            path.join(this.objectsPath, commitHash),
            JSON.stringify(commitData, null, 2)
        );

        await fs.writeFile(this.headPath, commitHash);
        await fs.writeFile(this.indexPath, JSON.stringify([]));

        console.log(`Committed as ${commitHash}`);
    }

    async getCurrentHead() {
        try {
            const head = await fs.readFile(this.headPath, 'utf-8');
            return head.trim() || null;
        } catch {
            return null;
        }
    }

    /* ---------------- LOG ---------------- */

    async log() {
        await this.ensureRepo();

        let hash = await this.getCurrentHead();

        while (hash) {
            const commit = JSON.parse(
                await fs.readFile(path.join(this.objectsPath, hash), 'utf-8')
            );

            console.log(chalk.yellow(`commit ${hash}`));
            console.log(`Date: ${commit.timestamp}`);
            console.log(`Message: ${commit.message}`);
            console.log('------------------------');

            hash = commit.parent;
        }
    }

    /* ---------------- DIFF ---------------- */

    async showCommitDiff(commitHash) {
        await this.ensureRepo();

        const commitData = await this.getCommitData(commitHash);
        if (!commitData) return;

        console.log("Changes:\n");

        for (const file of commitData.files) {
            const newContent = await this.getFileContent(file.hash);

            if (!commitData.parent) {
                console.log(chalk.green(`New file: ${file.path}`));
                console.log(newContent);
                continue;
            }

            const parentCommit = await this.getCommitData(commitData.parent);
            const oldContent = await this.getParentFileContent(parentCommit, file.path);

            if (oldContent === undefined) {
                console.log(chalk.green(`New file: ${file.path}`));
                console.log(newContent);
                continue;
            }

            console.log(chalk.cyan(`Diff for ${file.path}:`));
            const diff = diffLines(oldContent, newContent);

            diff.forEach(part => {
                if (part.added) process.stdout.write(chalk.green("+" + part.value));
                else if (part.removed) process.stdout.write(chalk.red("-" + part.value));
                else process.stdout.write(part.value);
            });

            console.log('\n------------------------\n');
        }
    }

    async getParentFileContent(parentCommit, filePath) {
        const file = parentCommit.files.find(f => f.path === filePath);
        return file ? this.getFileContent(file.hash) : undefined;
    }

    async getFileContent(fileHash) {
        return fs.readFile(path.join(this.objectsPath, fileHash), 'utf-8');
    }

    async getCommitData(commitHash) {
        try {
            return JSON.parse(
                await fs.readFile(path.join(this.objectsPath, commitHash), 'utf-8')
            );
        } catch {
            console.error("Commit not found");
            return null;
        }
    }
}

/* ---------------- CLI ---------------- */

program.command('init').action(async () => {
    const grut = new Grut();
    await grut.init();
});

program.command('add <file>').action(async (file) => {
    const grut = new Grut();
    await grut.add(file);
});

program.command('commit <message>').action(async (message) => {
    const grut = new Grut();
    await grut.commit(message);
});

program.command('log').action(async () => {
    const grut = new Grut();
    await grut.log();
});

program.command('show <commitHash>').action(async (hash) => {
    const grut = new Grut();
    await grut.showCommitDiff(hash);
});

program.command('--help').action(() => {
    console.log(`
Usage: grut <command> [options]
Commands:
  init                 Initialize a new Grut repository
  add <file>          Add a file to the staging area
    commit <message>   Commit staged changes with a message
    log                  Show commit history
    show <commitHash>   Show diff of a specific commit
    `);
});

program.parse(process.argv);