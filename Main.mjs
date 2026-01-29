import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

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
        await fs.writeFile(newFileHashedObjectPath, fileData);
        
    }

}


const grut = new Grut();