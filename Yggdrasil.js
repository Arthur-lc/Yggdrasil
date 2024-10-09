import { createRequire } from 'module';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs'
import promptSync from 'prompt-sync';
import { exit } from 'process';

const require = createRequire(import.meta.url);
const serviceAccount = require('./firebase-keys.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://yggdrasil-82b4b.appspot.com',
});

const bucket = admin.storage().bucket();


// get local path from .Ygg
const data = fs.readFileSync('./.Ygg', 'utf-8');
const lines = data.split('\n');
const localFolderPath = lines[0].trim();
const worldName = lines[1].trim();

console.log(localFolderPath);
console.log(`World Name: ${worldName}`);

main();
async function main() {
    console.log("Login in... (Heimdall is examining your ID)");
    console.log("you're fit to cross the Bifröst");

    
    while (true) {    
        console.log("\nWhat do you whant? - Heimdall asks with his deep voice");
        console.log(" - up: sobe o seu save local para a nuvem");
        console.log(" - down: substitui o save local pelo save da nuvem\n");
        console.log(" - exit: fecha o programa\n");

        const prompt = promptSync();
        const command = prompt('');
        
        if (command === 'up' || command == 'u') {
            console.log("Criando backup");
            await createBackUp();
            
            console.log("\nSubindo arquivos");
            await upload()
        } 
        else if (command === 'down' || command == 'd') {
            console.log("Fazendo download");
            await download();
        }
        else if (command === 'exit' || command == 'e') {
            console.log("closing the Bifröst");
            exit()
        }
        else {
            console.log("Não entendi\n\n");
        }
    }
}



async function uploadFile(localFilePath, destination) {    
    await bucket.upload(localFilePath, {
        destination: destination,
        public: true,
    });
}

async function downloadFile(filePath, localDestPath) {
    const options = {
        destination: localDestPath,
    };
  
    await bucket.file(filePath).download(options);
    console.log(`Downloaded ${filePath} to ${localDestPath}`);
}

const getCurrentDateTime = () => {
    const now = new Date();
  
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(now.getDate()).padStart(2, '0');
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

async function renameFile(oldFilePath, newFilePath) {
    const oldFile = bucket.file(oldFilePath);

    // Copy the file to the new location (newFilePath)
    await oldFile.copy(newFilePath);
    console.log(`File copied to: ${newFilePath}`);

    // Delete the old file
    await oldFile.delete();
    console.log(`Old file deleted: ${oldFilePath}`);
}

// Function to rename all files in a Firebase Storage folder
async function createBackUp() {
    const currentTime = getCurrentDateTime();
    // List all files in the folder
    const [files] = await bucket.getFiles({ prefix: `${worldName}/` });

    if (files.length === 0) {
    console.log('No files found in the folder.');
    return;
    }

    // Loop through each file
    for (const file of files) {
        const oldFilePath = file.name;
        const fileName = oldFilePath.split('/').pop();  // Get the filename

        if (oldFilePath === `${worldName}/${fileName}`) {
            // Apply your renaming logic (renameFn can customize the name)
            const newFilePath = `${worldName}/backup/${currentTime}/${fileName}`;
    
            // Rename the file
            await renameFile(oldFilePath, newFilePath);
        }
    }
}

async function upload() {
    const localFilePath = path.join(localFolderPath, worldName);
    const fwl_localFilePath = path.join(localFilePath + '.fwl')
    const db_localFilePath = path.join(localFilePath + '.db')
    
    if (!fs.statSync(fwl_localFilePath).isFile()) {
        console.log("ERRO - UPLOAD ABORTADO: " + fwl_localFilePath + "is not a file.");
        return;
    }
    if (!fs.statSync(db_localFilePath).isFile()) {
        console.log("ERRO - UPLOAD ABORTADO: " + db_localFilePath + "is not a file.");
        return;
    }
    
    
    let destination = worldName + '/' + worldName + '.fwl';
    console.log(" > " + worldName + '.fwl');
    uploadFile(fwl_localFilePath, destination);
    
    destination = worldName + '/' + worldName + '.db';
    console.log(" > " + worldName + '.db');
    uploadFile(db_localFilePath, destination);
}

async function download() {
    if (!fs.existsSync(localFolderPath)) {
        console.log(`ERRO: ${localFolderPath} does not exist`);
    }

    const [files] = await bucket.getFiles({ prefix: worldName });

    if (files.length === 0) {
        console.log('No files found in the folder.');
        return;
    }

    for (const file of files) {
        const filePath = file.name;
        const fileName = filePath.split('/').pop();

        // Check if the file is directly in the ´worldName´/
        if (filePath === `${worldName}/${fileName}`) {
            const localFilePath = path.join(localFolderPath, fileName);
            await downloadFile(filePath, localFilePath);
        }
    }
}