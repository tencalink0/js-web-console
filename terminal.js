const terminalName = 'liveconsole';
const helpCommands = [
    ['ls', 'Display all files in a directory'],
    ['debug', 'Show all debug variables'],
    ['open', 'Open a file for viewing'],
    ['benjs','Built in js compiler for running programs on fs'],
    ['clear', 'Clears terminal'],
    ['load', 'Loads and run program from the internet']
];
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
                if (this.state === true && this.id === focusTerminal) {
                    if (/^[a-zA-Z]$/.test(key) || ['.', ':', '/'].includes(key)) {
                        this.insertKeyToTerminal(key);
                    } else if (key === 'Backspace') {
                        this.deleteKeyOfTerminal();
                    } else if (key === ' ') {
                        event.preventDefault();
                        this.insertKeyToTerminal(key);
                    } else if (this.displayType === 3) {
                        if (key === 'Enter') {
                            this.executeCode();
                        }
                    } else if (this.displayType === 4) {
                        if (key === 'Enter') {
                            this.executeCode(true);
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
            if (type === true) {
                this.displayOnTerm('');
                loadFrom(path).then(code => {
                    this.runCodeFromString(parseCode(code, this.id, this.displayType));
                    this.finaliseDisplaying();
                }).catch(error => {
                    this.displayOnTerm('Error: ' + error.message);
                    this.finaliseDisplaying();
                });
            } else {
                this.displayOnTerm('');
                fetchFiles(this.fsPath).then(files => {
                    const foundFile = files.find(file => file.name === path);
                    if (foundFile !== undefined) {
                        this.runCodeFromString(parseCode(foundFile.content, this.id, this.displayType));
                    } else {
                        this.displayOnTerm('Error: File not found');
                    }
                    this.finaliseDisplaying();
                }).catch(error => {
                    this.displayOnTerm('Error: ' + error.message);
                    this.finaliseDisplaying();
                });
            }
        }
    }

    executeCode(runBlock = false) {
        const executeString = this.terminalInput.split(' ');
        if (this.inputBlock !== true && runBlock === false) {
            switch (executeString[0]) {
                case 'ls' : 
                    fetchFiles(this.fsPath).then(files => {
                        for (let i = 0; i < this.tempFilesInternet.length; i++) {
                            files.push(this.tempFilesInternet);
                        }
                        for (let i = 0; i < files.length; i++) {
                            this.displayOnTerm(' - ' + files[i].name);
                        }
                        this.finaliseDisplaying();
                    }).catch(error => {
                        this.displayOnTerm('This directory is empty...');
                        this.finaliseDisplaying();
                    });
                    break;
                case 'open':
                    fetchFiles(this.fsPath).then(files => {
                        const foundFile = files.find(file => file.name === executeString[1]);
                        if (foundFile !== undefined) {
                            this.displayOnTerm(foundFile.content.replace(/\n/g, '<br>&ensp;'));
                        } else {
                            const localFileFound = files.find(file => file.name === executeString[1]);
                            if (localFileFound !== undefined) {
                                this.displayOnTerm(localFileFound.content.replace(/\n/g, '<br>&ensp;'));
                            } else {
                                this.displayOnTerm('File not found ' + error);
                            }
                        }
                        this.finaliseDisplaying();
                    }).catch(error => {
                        this.displayOnTerm('File not found: ' + error);
                        this.finaliseDisplaying();
                    });
                    break;
                case 'benjs':
                    fetchFiles(this.fsPath).then(files => {
                        const foundFile = files.find(file => file.name === executeString[1]);
                        if (foundFile !== undefined) {
                            this.runCodeFromString(parseCode(foundFile.content, this.id, this.displayType));
                        } else {
                            const localFileFound = this.tempFilesInternet.find(file => file.name === executeString[1]);
                            if (localFileFound !== undefined) {
                                this.runCodeFromString(parseCode(localFileFound.content, this.id, this.displayType));
                            } else {
                                this.displayOnTerm('File not found ' + error);
                            }
                        }
                        this.finaliseDisplaying();
                    }).catch(error => {
                        this.displayOnTerm('File not found: ' + error);
                        this.finaliseDisplaying();
                    });
                    break;
                case 'help':
                    for (let i = 0; i < helpCommands.length; i++) {
                        this.displayOnTerm(helpCommands[i][0] + ' --- ' + helpCommands[i][1]);
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
                            name = pathSplit.slice(-1);
                        } else {
                            name = 'unknown';
                        }
                        
                        let success = this.runCodeFromString(parseCode(code, this.id, this.displayType));
                        if (success !== false) {
                            tempFilesInternet.push({
                                'name': name,
                                'content': code
                            });
                        }
                        this.finaliseDisplaying();
                    }).catch(error => {
                        this.displayOnTerm('Error: ' + error.message);
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
    
    runCodeFromString(code) {
        try {
            const wrappedCode = `(function() { ${code} })()`;
            const result = eval(wrappedCode);
    
            if (JSON.stringify(result) !== undefined) {
                let resultVar = JSON.stringify(result);
                resultVar = JSON.parse(resultVar);
                this.vars = resultVar[1];
            }
        } catch (error) {
            if ([2,3,4].includes(this.displayType)) {
                this.displayOnTerm('Error: ' + error.message);
            } else {
                window.alert('Error: ' + error.message);
            }
            return false;
        }
    }

    displayOnTerm(stringInput, override = false) {
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
    }

    unblockInput(value) {
        console.log(value);
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

function parseCode(code, id, displayType) {
    code = code.replace(/\/\/# sourceMappingURL=.*$/, '').trim();

    if ([2,3,4].includes(displayType)) {
        code = code.replaceAll('console.log(', 'globalDisplayOnTerm(' + String(id) + ',');
        code = code.replaceAll('prompt(', 'globalWaitForInput(' + String(id) + ',');
    } else {
        code = code.replaceAll('console.log', 'window.alert');
    }

    let vars = [];
    vars = getVars(vars, 'let', code);
    vars = getVars(vars, 'var', code);
    vars = getVars(vars, 'const', code);
    let debug = varsToDebug(vars, id);
    let debugCode;
    debugCode = code + debug;
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

document.addEventListener('click', function(event) {
    if (event.target.matches('div')) { 
        if (event.target.id.indexOf("terminal") !== 0) {
            focusTerminal = 0;
        };
    }
});