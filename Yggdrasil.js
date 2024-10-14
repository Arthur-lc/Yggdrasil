const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const promptSync = require('prompt-sync')();
const readline = require('readline');
const { exit } = require('process');

const serviceAccount = require('./firebase-keys.json');
const { version } = require('os');

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
console.log(`\nWorld Name: ${worldName}`);


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
    const currentTime = new Date().toISOString();
    // List all files in the folder
    const [files] = await bucket.getFiles({ prefix: `${worldName}/` });

    if (files.length === 0) {
        console.log('No files found in the cloud.');
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
    const fwl_localFilePath = localFilePath + '.fwl';
    const db_localFilePath = localFilePath + '.db';
    
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

    
    const dataYggPath = path.join(localFolderPath, `${worldName}.Ygg`);
    fs.writeFile(dataYggPath, 'subiu', (err) => {
        if (err) console.log(err);
        else {
            console.log("File written successfully\n");
        }
    });
}

async function download() {
    if (!fs.existsSync(localFolderPath)) {
        console.log(`ERRO: ${localFolderPath} does not exist`);
    }

    const dataYggPath = path.join(localFolderPath, `${worldName}.Ygg`)
    const dataYgg = fs.readFileSync(dataYggPath, 'utf8').trim();
    if (dataYgg === "desceu") {
        console.log("\n\nERRO: Voce ja fez o download\nPor segurança voce nao pode fazer o download novamente.\nSe voce tem certeza que precisa fazer o download, contate o suporte par areceber instrucoes.");
        return;
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

    fs.writeFile(dataYggPath, "desceu", (err) => {});
}

async function downloadFolder(folderPath, destination) {
    const [files] = await bucket.getFiles({ prefix: folderPath });

    if (files.length === 0) {
        console.log('No files found in the specified folder.');
        return;
    }

    // Loop through the files and download each one
    for (const file of files) {
        const remoteFilePath = file.name; // Full path of the file in Firebase Storage
        const relativeFilePath = path.relative(folderPath, remoteFilePath); // Get the relative path from the prefix

        const localFilePath = path.join(destination, relativeFilePath.replace(/:/g, '-')); // Local destination path

        // Ensure the local directory structure exists
        const localDir = path.dirname(localFilePath);
        
        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
        }

        // Download the file
        await file.download({ destination: localFilePath });

        console.log(`Downloaded ${remoteFilePath} to ${localFilePath}`);
    }

    console.log('All files downloaded successfully.');
}

async function downloadBackup() {
    const backupPath = path.join(localFolderPath, `${worldName}-backup`);
    
    await downloadFolder(`${worldName}/backup`, backupPath)
}

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function interface() {
    let continueLoop = true;

    while (continueLoop) {
        console.log("\nWhat would you like to do?");
        console.log(" - up: sobe o seu save local para a nuvem");
        console.log(" - down: substitui o save local pelo save da nuvem");
        console.log(" - backup: baixa todos os arquivos de backup");
        console.log(" - exit: sair do programa");

        const command = await askQuestion('> ');

        if (command === 'up' || command === 'u') {
            console.log("Criando backup...");
            await createBackUp();

            console.log("\nSubindo arquivos...");
            await upload();
        } else if (command === 'down' || command === 'd') {
            console.log("Fazendo download...");
            await download();
        } else if (command === 'backup' || command === 'b') {
            console.log("Fazendo download...");
            await downloadBackup();
        } else if (command === 'exit' || command === 'e') {
            continueLoop = false;
            console.log("Saindo do programa...");
        } else {
            console.log("Comando inválido, tente novamente.");
        }
    }
    rl.close();
}


interface();