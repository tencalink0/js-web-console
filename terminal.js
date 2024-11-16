const terminalName = 'liveconsole';
const helpCommands = [
    ['ls', 'Display all files in a directory'],
    ['debug', 'Show all debug variables'],
    ['open', 'Open a file for viewing'],
    ['benjs','Built in js compiler for running programs on fs'],
    ['clear', 'Clears terminal'],
    ['load', 'Loads and run program from the internet']
];
const allowedKeys = ['.', ':', '/', '_', '-'];
let focusTerminal = 0;

class Terminal {
    constructor(id, displayType, title = '', user = 'localhost', fsPath = '/files.json') {
        this.id = id;
        this.displayType = displayType;
        this.user = user;
        this.fsPath = fsPath;

        this.terminalInput = '';
        this.vars = [];
        this.tempFilesInternet = [];
        this.state = true; // If it's free to process other things
        this.inputBlock = false;

        //this.initListeners = this.initListeners.bind(this);

        this.initHTML(title);
        this.initListeners();
    }

    initHTML(title) {
        const terminalDiv = document.getElementById('terminal-div');
        switch (this.displayType) {
            case 1:
                terminalDiv.innerHTML += `
                    <h1>${title}</h1>
                    <div class="code-box">
                        <textarea class="code-input" id="codeInput${this.id}" rows="10" cols="50"></textarea>
                        <div class="console-btn-col">
                            <button class="terminal-btn" id="runCode${this.id}">►</button>
                            <button class="terminal-btn" id="debugCode${this.id}">≡</button>
                        </div>
                    </div>
                    <div class="debugList" id="debugList${this.id}"></div>
                    <br>
                `;
                break;
            case 2:
                terminalDiv.innerHTML += `
                    <h1>${title}</h1>
                    <div class="code-box">
                        <textarea class="code-input" id="codeInput${this.id}" rows="10" cols="50"></textarea>
                        <div class="console-btn-col">
                            <button class='terminal-btn' id="runCode${this.id}">►</button>
                        </div>
                        <div class="console" id="terminal${this.id}">[${this.user}]@${terminalName} ~  <br></div>
                    </div>
                    <br>
                `;
                break;
            case 3:
            case 4:
                terminalDiv.innerHTML += `
                    <h1>${title}</h1>
                    <div class="code-box">
                        <div class="console" id="terminal${this.id}">[${this.user}]@${terminalName} ~  <br></div>
                    </div>
                `;
                break;
        }
    }

    initListeners() {
        document.addEventListener('click', (event) => {
            if (event.target.matches('div')) { 
                if (event.target.id === `terminal${this.id}`) {
                    focusTerminal = this.id;
                }
            } else if ([1,2].includes(this.id)) {
                if (event.target.id === `debugCode${this.id}`) {
                    this.debugCode();
                } else if (event.target.id === `runCode${this.id}`) {
                    this.runCode();
                }
            }

        });
        if ([2,3,4].includes(this.id)) {
            setInterval(() => flickerKeyTerminal(this.id, this.state), 500);
            document.addEventListener('keydown', (event) => {
                let key = event.key;
                const displayTerminal = document.getElementById(`terminal${this.id}`);
                if (this.state === true && this.id === focusTerminal) {
                    if (/^[a-zA-Z0-9]$/.test(key) || allowedKeys.includes(key)) {
                        this.insertKeyToTerminal(key);
                        displayTerminal.scrollTop = displayTerminal.scrollHeight;
                    } else if (key === 'Backspace') {
                        this.deleteKeyOfTerminal();
                        displayTerminal.scrollTop = displayTerminal.scrollHeight;
                    } else if (key === ' ') {
                        event.preventDefault();
                        this.insertKeyToTerminal(key);
                        displayTerminal.scrollTop = displayTerminal.scrollHeight;
                    } else if (this.displayType === 3) {
                        if (key === 'Enter') {
                            this.executeCode();
                            displayTerminal.scrollTop = displayTerminal.scrollHeight;
                        }
                    } else if (this.displayType === 4) {
                        if (key === 'Enter') {
                            this.executeCode(true);
                            displayTerminal.scrollTop = displayTerminal.scrollHeight;
                        }
                    }
                }
            });
            document.addEventListener('paste', (event) => {
                if (focusTerminal === this.id) {
                    this.pasteFromClipboard(event); 
                }
            });
            document.addEventListener('messageBroadcast', (event) => {
                const message = event.detail;
                if (message.id === this.id) {
                    this.displayOnTerm(message.string);
                } 
            });
            document.addEventListener('inputBroadcast', (event) => {
                const message = event.detail;
                if (message.id === this.id) {
                    this.waitForInput(message.string);
                } 
            });
        }
    }

    initOnload(path, type = true) { // Type is (true for link) and (false for file inside fs)
        if (this.id === 4) {
            this.displayOnTerm('', true);
            if (type === true) {
                loadFrom(path).then(code => {
                    this.runCodeFromString(parseCode(code, this.id, this.displayType));
                    this.finaliseDisplaying();
                }).catch(error => {
                    this.displayOnTerm('<r>Error: ' + error.message + '</r>');
                    this.finaliseDisplaying();
                });
            } else {
                fetchFiles(this.fsPath).then(files => {
                    const foundFile = files.find(file => file.name === path);
                    if (foundFile !== undefined) {
                        this.runCodeFromString(parseCode(foundFile.content, this.id, this.displayType));
                    } else {
                        this.displayOnTerm('<r>Error: File not found</r>');
                    }
                    this.finaliseDisplaying();
                }).catch(error => {
                    this.displayOnTerm('<r>Error: ' + error.message + '</r>');
                    this.finaliseDisplaying();
                });
            }
        }
    }

    executeCode(runBlock = false) {
        let executeString = this.terminalInput.split(' ');
        if (this.inputBlock !== true && runBlock === false) {
            switch (executeString[0]) {
                case 'ls' : 
                    if (executeString[1] === '--help') {
                        this.displayOnTerm("<y>ls [args]\n\targs:\n\t\t-s : size (include size)\n\t\t-d : include description</y>");
                        this.finaliseDisplaying();
                    } else {
                        fetchFiles(this.fsPath).then(files => {
                            let argPos = executeString.indexOf('-s');
                            let includeSize = false;
                            if (argPos !== -1) {
                                executeString.splice(argPos, 1);
                                includeSize = true;
                            }

                            argPos = executeString.indexOf('-d');
                            let includeDescription = false;
                            if (argPos !== -1) {
                                executeString.splice(argPos, 1);
                                includeDescription = true;
                            }

                            for (let i = 0; i < this.tempFilesInternet.length; i++) {
                                files.push(this.tempFilesInternet[i]);
                            }
                            for (let i = 0; i < files.length; i++) {
                                if (includeSize) {
                                    if (includeDescription) {
                                        this.displayOnTerm('<b> - ' + files[i].name + ' | ' + estimateFileSize(files[i].content) + '\n\tdescription: ' + files[i].description + '</b>');
                                    } else {
                                        this.displayOnTerm('<b> - ' + files[i].name + ' | ' + estimateFileSize(files[i].content) + '</b>');
                                    }
                                } else {
                                    if (includeDescription) {
                                        this.displayOnTerm('<b> - ' + files[i].name + '\n\tdescription: ' + files[i].description + '</b>');
                                    } else {
                                        this.displayOnTerm('<b> - ' + files[i].name + '</b>');
                                    }
                                }
                            }
                            this.finaliseDisplaying();
                        }).catch(error => {
                            this.displayOnTerm('<r>This directory is empty...</r>');
                            this.finaliseDisplaying();
                        });
                    }
                    break;
                case 'open':
                    if (executeString[1] === '--help') {
                        this.displayOnTerm('<y>open [args] [file]\n\targs:\n\t\t-d : debug\n\tsources:\n\t\tfs\n\t\tbuffer fs</y>');
                        this.finaliseDisplaying();
                    } else {
                        fetchFiles(this.fsPath).then(files => {
                            let foundFile = files.find(file => file.name === executeString[1]);
                            if (executeString[1] === '-d' && executeString.length > 2) {
                                foundFile = files.find(file => file.name === executeString[2]);
                                if (foundFile !== undefined) {
                                    foundFile.content = parseCode(foundFile.content, this.id, this.displayType);
                                }
                            }
                            if (foundFile !== undefined) {
                                let codeFinal = foundFile.content;
                                let codeLines = codeFinal.split('\n');
                                for (let i = 0; i < codeLines.length; i++) {
                                    codeLines[i] = `${i+1}. \t<b>${codeLines[i]}</b>`;
                                }
                                codeFinal = codeLines.join('\n'); 
                                this.displayOnTerm(codeFinal);
                            } else {
                                let localFileFound = this.tempFilesInternet.find(file => file.name === executeString[1]);
                                if (executeString[1] === '-d' && executeString.length > 2) {
                                    localFileFound = files.find(file => file.name === executeString[2]);
                                    if (localFileFound !== undefined) {
                                        localFileFound.content = parseCode(localFileFound.content, this.id, this.displayType);
                                    }
                                }
                                if (localFileFound !== undefined) {
                                    let codeFinal = localFileFound.content;
                                    let codeLines = codeFinal.split('\n');
                                    for (let i = 0; i < codeLines.length; i++) {
                                        codeLines[i] = `${i+1}. \t<b>${codeLines[i]}</b>`;
                                    }
                                    codeFinal = codeLines.join('\n'); 
                                    this.displayOnTerm(codeFinal);
                                } else {
                                    this.displayOnTerm('<r>File not found ' + error + '</r>');
                                }
                            }
                            this.finaliseDisplaying();
                        }).catch(error => {
                            this.displayOnTerm('<r>File not found: ' + error + '</r>');
                            this.finaliseDisplaying();
                        });
                    }
                    break;
                case 'benjs':
                    if (executeString[1] === '--help') {
                        this.displayOnTerm("<y>benjs [args] [file]\n\targs:\n\t\t-c : clean run (no debug)\n\t\t-r : raw execute (prevent wrapping)\n\t\t-cr : clean & raw\n\tsources:\n\t\tfs\n\t\tbuffer fs</y>");
                        this.finaliseDisplaying();
                    } else {
                        fetchFiles(this.fsPath).then(files => {
                            let terminalArgs;
                            let argPos = executeString.indexOf('-c');
                            let debugEnabled = true;
                            if (argPos !== -1) {
                                executeString.splice(argPos, 1);
                                debugEnabled = false;
                            }
                            argPos = executeString.indexOf('-r');
                            let wrappedEnabled = true;
                            if (argPos !== -1) {
                                executeString.splice(argPos, 1);
                                wrappedEnabled = false;
                            }
                            argPos = executeString.indexOf('-cr');
                            if (argPos !== -1) {
                                executeString.splice(argPos, 1);
                                debugEnabled = false;
                                wrappedEnabled = false;
                            }
                            const foundFile = files.find(file => file.name === executeString[1]);
                            if (foundFile !== undefined) {
                                if (executeString.length > 2) terminalArgs = executeString.slice(2);
                                this.runCodeFromString(parseCode(foundFile.content, this.id, this.displayType, debugEnabled, terminalArgs), wrappedEnabled);
                            } else {
                                const localFileFound = this.tempFilesInternet.find(file => file.name === executeString[1]);
                                if (localFileFound !== undefined) {
                                    if (executeString.length > 2) terminalArgs = executeString.slice(2);
                                    this.runCodeFromString(parseCode(localFileFound.content, this.id, this.displayType, true, terminalArgs), wrappedEnabled);
                                } else {
                                    this.displayOnTerm('<r>File not found ' + error + '</r>');
                                }
                            }
                            this.finaliseDisplaying();
                        }).catch(error => {
                            this.displayOnTerm('<r>File not found: ' + error + '</r>');
                            this.finaliseDisplaying();
                        });
                    }
                    break;
                case 'help':
                    for (let i = 0; i < helpCommands.length; i++) {
                        this.displayOnTerm('<y>' + helpCommands[i][0] + ' --- ' + helpCommands[i][1] + '</y>');
                    }
                    this.finaliseDisplaying();
                    break;
                case 'clear':
                    this.clearTerminal();
                    break;
                case 'debug':
                    this.displayDebugOnTerm();
                    this.finaliseDisplaying();
                    break;
                case 'load':
                    loadFrom(executeString[1]).then(code => {
                        let filePath = executeString[1];
                        let pathSplit = filePath.split('/');
                        let name;
                        if (pathSplit.length > 0) {
                            name = pathSplit.slice(-1)[0];
                        } else {
                            name = 'unknown';
                        }
                        this.tempFilesInternet.push({
                            "name": name,
                            "content": code
                        });
                        this.displayOnTerm('Success!');
                        this.finaliseDisplaying();
                    }).catch(error => {
                        this.displayOnTerm('<r>Error: ' + error.message + '</r>');
                        this.finaliseDisplaying();
                    });
                    break;
                default:
                    this.displayOnTerm('Command <u>' + executeString[0] + '</u> not found');
                    this.finaliseDisplaying();
                    break;
            }
        } else {
            this.unblockInput(executeString);
        }
    }

    runCode() {
        let code = document.getElementById(`codeInput${this.id}`).value;
        code = parseCode(code, this.id, this.displayType);
        this.runCodeFromString(code);
        this.finaliseDisplaying();
    }
    
    runCodeFromString(code, wrapped = true) {
        try {
            let finalCode; 
            if (wrapped) {
                finalCode = `(function() { ${code} })()`;
            } else {
                finalCode = code;
            }
            const result = eval(finalCode);
    
            if (JSON.stringify(result) !== undefined) {
                let resultVar = JSON.stringify(result);
                resultVar = JSON.parse(resultVar);
                this.vars = resultVar[1];
            }
        } catch (error) {
            if ([2,3,4].includes(this.displayType)) {
                this.displayOnTerm(`<r>Error: ${error.message} \nType: ${error.name} \nLine: ${error.lineNumber}</r>`);
            } else {
                window.alert('Error: ' + error.message);
            }
            return false;
        }
    }

    displayOnTerm(stringInput, override = false) {
        stringInput = String(stringInput);
        stringInput = stringInput.replace(/\n/g, '<br>&ensp;');
        stringInput = stringInput.replace(/\t/g, '&ensp;&ensp;');
        const displayTerminal = document.getElementById(`terminal${this.id}`);
        let displayWait = setInterval(() => {
            if (this.inputBlock === false || override === true) {
                this.state = false;
                displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + '<br>&ensp;';
                displayTerminal.innerHTML += String(stringInput) + ' ';
                this.state = true;
                clearInterval(displayWait);
            }
        }, 100);
    }

    displayDebugOnTerm() {
        let tempHTML = '';
        let vars = this.vars;
        for (let i = 0; i < vars.length; i++) {
            let cVar = vars[i];
            tempHTML += '&ensp;<b>' + cVar.name + '</b>: ' + cVar.val;
            if (i !== vars.length - 1) {
                tempHTML += '<br>'
            }
        }
        this.displayOnTerm(tempHTML);
    }

    clearTerminal() {
        const displayTerminal = document.getElementById(`terminal${this.id}`);
        this.state = false;
        displayTerminal.innerHTML = `[${this.user}]@${terminalName} ~  `;
        this.terminalInput = [];
        this.state = true;
    }
    
    waitForInput(stringInput) {
        const displayTerminal = document.getElementById(`terminal${this.id}`);
        this.inputBlock = true;
        this.state = true;
        this.displayOnTerm(stringInput + ' ', true);
        this.terminalInput = '';
    }

    unblockInput(value) {
        this.inputBlock = false;
    }

    debugCode() {
        const debugList = document.getElementById(`debugList${this.id}`);
        debugList.style.display = 'block';
        let tempHTML = '';
        let vars = this.vars;
        for (let i = 0; i < vars.length; i++) {
            let cVar = vars[i];
            tempHTML += '<b>' + cVar.name + '</b>: ' + cVar.val + '<br>';
        }
        debugList.innerHTML = tempHTML;
        setTimeout(() => {
            debugList.style.display = 'none';
        }, 2000);
    }

    insertKeyToTerminal(key) {
        this.terminalInput += key;
        const displayTerminal = document.getElementById(`terminal${this.id}`);
        let lengthOfTermInpt = this.terminalInput.length > 0 ? this.terminalInput.length : 1;
        displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -lengthOfTermInpt) + this.terminalInput + ' ';
    }

    deleteKeyOfTerminal() {
        const displayTerminal = document.getElementById(`terminal${this.id}`);
        let lengthOfTermInpt = this.terminalInput.length
        if (lengthOfTermInpt > 0 ) {
            this.terminalInput = removeLastChar(this.terminalInput);
            displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -lengthOfTermInpt-1) + this.terminalInput + ' ';
        }
    }

    finaliseDisplaying() {
        if ([2,3,4].includes(this.displayType)) {
            let displayWait = setInterval(() => {
                if (this.inputBlock === false) {
                    this.state = false;
                    const displayTerminal = document.getElementById(`terminal${this.id}`);
                    displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + ' ';
                    displayTerminal.innerHTML += `<br>[${this.user}]@${terminalName} ~  `;
                    this.state = true;
                    this.terminalInput = '';
                    clearInterval(displayWait);
                }
            }, 100);
        }
    }

    pasteFromClipboard(event) {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (clipboardData) {
            const text = clipboardData.getData('text');
            if (this.terminalInput.slice(-1) === 'v') {
                this.deleteKeyOfTerminal();
            }
            for (let i = 0; i < text.length; i++) { 
                this.insertKeyToTerminal(text[i]);
            } 
        } else {
            console.error('Clipboard data is not available.');
        }
    }
}

function globalDisplayOnTerm(id, stringInput) {
    const broadcastMessage = new CustomEvent('messageBroadcast', {
        detail: {id: id, string: stringInput},
      });
      document.dispatchEvent(broadcastMessage);
}

function globalWaitForInput(id, stringInput) {
    const broadcastMessage = new CustomEvent('inputBroadcast', {
        detail: {id: id, string: stringInput},
      });
      document.dispatchEvent(broadcastMessage);
}

function removeLastChar(str) {
    return str.length > 0 ? str.slice(0, -1) : str;
}

function parseCode(code, id, displayType, debugEnabled = true, terminalArgs = undefined) {
    code = code.replace(/\/\/# sourceMappingURL=.*$/, '').trim();
    console.log('TARGS:', terminalArgs);
    if ([2,3,4].includes(displayType)) {
        code = code.replaceAll('console.log(', 'globalDisplayOnTerm(' + String(id) + ',');
        code = code.replaceAll('prompt(', 'globalWaitForInput(' + String(id) + ',');
        if (terminalArgs !== undefined) {
            for (let i = 0; i < terminalArgs.length; i++) {
                code = code.replaceAll(`tArg${i}`, terminalArgs[i]);
            }
        }
    } else {
        code = code.replaceAll('console.log', 'window.alert');
    }

    let debugCode;
    if (debugEnabled) {
        let vars = [];
        vars = getVars(vars, 'let', code);
        vars = getVars(vars, 'var', code);
        vars = getVars(vars, 'const', code);
        let debug = varsToDebug(vars, id);
        debugCode = code + debug;
    } else {
        debugCode = code;
    }
    return debugCode;
}

function varsToDebug(vars, id) {
    let stringAcc = '\nreturn [' + String(id) + ', [';
    for (let i = 0; i < vars.length; i++) {
        let varName = vars[i].name;
        stringAcc += `{'name': '${varName}', 'val': ${varName}}`;
        
        if (i < vars.length - 1) {
            stringAcc += ', ';
        }
    }
    stringAcc += ']];';
    return stringAcc;
}

function getVars(vars, type, code) {
    let lastVar = 0;
    while (true) {
        let pos = code.indexOf(type, lastVar);
        if (pos !== -1) {
            let varStart = indexOfNot(code, ' ', pos + type.length);
            if (varStart !== -1) {
                let varEnd = code.indexOf('=', varStart);
                if (varEnd === -1) {
                    varEnd = indexOfNot(code, ';', varStart);
                }
                if (varEnd === -1) {
                    varEnd = code.length;
                }
                let varName = code.substring(varStart, varEnd).trim();
                if (varName) {
                    vars.push({
                        'type' : type, 
                        'name' : varName
                    });
                }
                lastVar = varEnd;
            } else {
                lastVar = pos + type.length;
            }
        } else {
            return vars;
        }
    }
}

function indexOfNot(str, char, startIndex = 0) {
    for (let i = startIndex; i < str.length; i++) {
        if (str[i] !== char) {
            return i;
        }
    }
    return -1;
}

function flickerKeyTerminal(id, state) {
    const displayTerminal = document.getElementById(`terminal${id}`);
    const lastChar = displayTerminal.innerHTML.slice(-1);

    const selection = window.getSelection();
    const isSelectingText = selection && selection.toString().length > 0;

    if (!isSelectingText) {
        if (state === true && focusTerminal === id) {
            if (lastChar === '│') {
                displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + ' ';
            } else {
                displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + '│';
            }
        } else if (focusTerminal !== id) {
            displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + ' ';
        }
    }
}


function loadFrom(internetPath) {
    return fetch(internetPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            throw error;
    });
}

function fetchFiles(fsPath) {
    return fetch(fsPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            throw error;
    });
}

function estimateFileSize(string) {
    if (typeof string !== 'string') {
        return "?";
    }
    const charCount = string.length;

    let sizeInBytes = charCount * 1.5;

    if (sizeInBytes < 1024) {
        return sizeInBytes.toFixed(2) + " B";
    } else if (sizeInBytes < 1048576) {
        return (sizeInBytes / 1024).toFixed(0) + " KB";
    } else {
        return (sizeInBytes / 1048576).toFixed(0) + " MB";
    }
}

document.addEventListener('click', function(event) {
    if (event.target.matches('div')) { 
        if (event.target.id.indexOf("terminal") !== 0) {
            focusTerminal = 0;
        };
    }
});