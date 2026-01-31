import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { diffLines } from 'diff';
import chalk from 'chalk';

class Grut{
 
    constructor(repoPath = "."){
        this.repoPath = path.join(repoPath, '.grut');
        this.objectsPath = path.join(this.repoPath, 'objects');
        this.headPath = path.join(this.repoPath, 'HEAD');
        this.indexPath = path.join(this.repoPath, 'index');
        this.init();
    }

    async init(){
        await fs.mkdir(this.objectsPath, { recursive: true });
        try{
            await fs.writeFile(this.headPath, '', { flag: 'wx' });
            await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: 'wx' });
        } catch (e) {
            console.log('Repository already initialized.');
        }
    }

    hashObject(data){
        return crypto.createHash('sha1').update(data, 'utf-8').digest('hex');
    }

    async add(fileToAdd){
        const fileData = await fs.readFile(fileToAdd, 'utf-8');
        const fileHash = this.hashObject(fileData);

        const newFileHashedObjectPath = path.join(this.objectsPath, fileHash);
        await this.updateStagingArea(fileToAdd, fileHash);
        await fs.writeFile(newFileHashedObjectPath, fileData);

    }

    async updateStagingArea(filePath, fileHash){
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8'}));

        index.push({ path: filePath, hash: fileHash });
        await fs.writeFile(this.indexPath, JSON.stringify(index));
    }

    async commit(message){
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8'}));
        const parentCommit = await this.getCurrentHead();

        const commitData = {
            timeStamp: new Date().toISOString(),
            message: message,
            parent: parentCommit,
            files: index
        };

        const commitHash = this.hashObject(JSON.stringify(commitData));
        const commitPath = path.join(this.objectsPath, commitHash);
        await fs.writeFile(commitPath, JSON.stringify(commitData));
        await fs.writeFile(this.headPath, commitHash);
        await fs.writeFile(this.indexPath, JSON.stringify([]));
        console.log(`Committed as ${commitHash}`);

    }

    async getCurrentHead(){
        try{
            return await fs.readFile(this.headPath, { encoding: 'utf-8' });
        } catch (e) {
            return null;
        }
    }

    async log(){
        let currentCommitHash = await this.getCurrentHead();
        while(currentCommitHash){
            const commitPath = path.join(this.objectsPath, currentCommitHash);
            const commitData = JSON.parse(await fs.readFile(commitPath, { encoding: 'utf-8' }));
            console.log(`Commit: ${currentCommitHash}`);
            console.log(`Date: ${commitData.timeStamp}`);
            console.log(`Message: ${commitData.message}`);
            console.log('-------------------------');
            currentCommitHash = commitData.parent;
        }

    }

    async showCommitDiff(commitHash){
        const commitData = JSON.parse(await this.getCommitData(commitHash));
        if (!commitData) return;

        console.log("Changes in the last commit are: ");

        for (const file of commitData.files) {
            console.log(`- ${file.path} (hash: ${file.hash})`);
            const fileContent = await this.getFileContent(file.hash);
            console.log(fileContent);

            if (commitData.parent) {
                const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent));
                const parentFileContent = await this.parentFileContent(parentCommitData, file.path);

                if(parentFileContent != undefined ){
                    console.log("\nDiff:");
                    const diff = diffLines(parentFileContent, fileContent);
                    diff.forEach(part => {

                        if(part.added){
                            process.stdout.write(chalk.green( "++" + part.value));
                        }else if(part.removed){
                            process.stdout.write(chalk.red("--" + part.value));
                        }else{
                            process.stdout.write(chalk.gray(part.value));
                        }
                    });
                    console.log('\n-------------------------\n');
                } else {
                    console.log("\nNew file in this commit:");
                    console.log(chalk.green(fileContent));
                    console.log('\n-------------------------\n');
                }
            }else{
                console.log("First commit, no parent to compare.");
            }
        }
    }

    async getParentFileContent(parentCommitData, filePath){
        const parentFile = parentCommitData.files.find(file => file.path === filePath);
        if (parentFile) {
            // read parent file content
            return await this.getFileContent(parentFile.hash);
        }
    }

    async getFileContent(fileHash){
        const filePath = path.join(this.objectsPath, fileHash);
        try {
            return await fs.readFile(filePath, { encoding: 'utf-8' });
        } catch (error) {
            console.error('File not found');
            return null;
        }
    }

    async getCommitData(commitHash){
        const commitPath = path.join(this.objectsPath, commitHash);
        try {
            return await fs.readFile(commitPath, { encoding: 'utf-8' });
        } catch (error) {
            console.error('Commit not found');
            return null;
        }
    }
}

(async () => {
    const grut = new Grut();
    await grut.add('test.txt');
    await grut.commit('Initial commit');
})();