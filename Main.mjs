import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { timeStamp } from 'console';

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

}

(async () => {
    const grut = new Grut();
    await grut.add('test.txt');
    await grut.commit('Initial commit');
})();