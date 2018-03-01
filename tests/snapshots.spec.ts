import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

// List all files in a directory in Node.js recursively in a synchronous fashion
function walkSync(dir: string, filelist?: string[]) {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        }
        else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

function expectFolderToMatchSnapshot(folder: string) {
    const absoluteFolder = path.resolve(path.join(__dirname, folder));
    const cwd = process.cwd();
    process.chdir(path.join(absoluteFolder, 'source'));
    execSync('node ../../../bin/texturer config.json');
    process.chdir(cwd);
    const calculatedHash = getHashFromBuffer(serializeFolderToBuffer(path.join(absoluteFolder, 'generated')));
    expect(calculatedHash).toMatchSnapshot();
}

function getHashFromBuffer(data: Buffer) {
    const sha1 = crypto.createHash('sha1');
    sha1.update(data, 'binary');
    return sha1.digest('hex');
}

function serializeFolderToBuffer(folder: string) {
    const files = walkSync(folder).sort();

    console.log(files.map((file, i) => '(' + i + ') ' + file + ' (' + getHashFromBuffer(fs.readFileSync(file) as any as Buffer) + ')').join('\n'));
    // files.forEach(file => {
    //   if (file.indexOf('texturePool.js') >= 0) {
    //     console.log(fs.readFileSync(file).toString('utf8'));
    //   }
    // });

    const chunks = files.map(file => fs.readFileSync(file) as any as Buffer);
    return Buffer.concat(chunks);
}

test('snapshot test, folder: default', () => {
    expectFolderToMatchSnapshot('default');
})
