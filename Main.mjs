import path from 'path';
import fs from 'fs/promises';

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
            
        } catch (e) {

        }
    }

}