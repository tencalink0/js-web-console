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
    constructor(id, displayType, title = '') {
        this.id = id;
        this.displayType = displayType;
        this.terminalInput = '';
        this.vars = [];
        this.tempFilesInternet = [];
        this.state = true; // If it's free to process other things

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
                        <div class="console" id="terminal${this.id}">[yourname]@liveconsole ~  <br></div>
                    </div>
                    <br>
                `;
                break;
            case 3:
            case 4:
                terminalDiv.innerHTML += `
                    <h1>${title}</h1>
                    <div class="code-box">
                        <div class="console" id="terminal${this.id}">[yourname]@liveconsole ~  <br></div>
                    </div>
                `;
                break;
        }
    }

    initListeners() {
        document.addEventListener('click', (event) => {
            console.log(event.target.id)
            if (event.target.matches('div')) { 
                if (event.target.id === `terminal${this.id}`) {
                    focusTerminal = this.id;
                }
            } else if ([1,2].includes(this.id)) {
                if (event.target.id === `debugCode${this.id}`) {
                    console.log('2a');
                    this.debugCode();
                } else if (event.target.id === `runCode${this.id}`) {
                    console.log('asda')
                    this.runCode();
                }
            }

        });
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
                        //this.executeCode(focusTerminal);
                    }
                }
            }
        });
        document.addEventListener('paste', (event) => {
            console.log('yes', focusTerminal, this.id);
            if (focusTerminal === this.id) {
                this.pasteFromClipboard(event); 
            }
        });
        if ([2,3,4].includes(this.id)) {
            setInterval(() => flickerKeyTerminal(this.id, this.state), 500);
        }
    }

    runCode() {
        let code = document.getElementById(`codeInput${this.id}`).value;
        code = parseCode(this.id, this.displayType, code);
        this.runCodeFromString(code);
        this.finaliseDisplaying();
    }
    
    runCodeFromString(code) {
        try {
            const wrappedCode = `(function() { ${code} })()`;
            const result = eval(wrappedCode);
    
            if (JSON.stringify(result) !== undefined) {
                resultVar = JSON.stringify(result);
                resultVar = JSON.parse(resultVar);
                this.vars = resultVar[1];
            }
        } catch (error) {
            if ([2,3,4].includes(this.displayType)) {
                this.displayOnTerm(num, 'Error: ' + error.message);
            } else {
                window.alert('Error: ' + error.message);
            }
            return false;
        }
    }

    displayOnTerm(stringInput) {
        const displayTerminal = document.getElementById(`terminal${this}`);
        this.state = false;
        displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + '<br>&ensp;';
        displayTerminal.innerHTML += String(stringInput) + ' ';
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
        if (this.displayType === 2) {
            const displayTerminal = document.getElementById(`terminal${this.id}`);
            displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + ' ';
            displayTerminal.innerHTML += '<br>[yourname]@liveconsole ~  ';
        }
        this.state = true;
        this.terminalInput = '';
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

function removeLastChar(str) {
    return str.length > 0 ? str.slice(0, -1) : str;
}

function parseCode(id, displayType, code) {
    code = code.replace(/\/\/# sourceMappingURL=.*$/, '').trim();

    if (displayType === 2) {
        code = code.replaceAll('console.log(', 'displayOnTerm(' + String(num) + ',');
        code = code.replaceAll('prompt(', 'waitForInput(' + String(num) + ',');
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
    let stringAcc = ';return [' + String(id) + ', [';
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

function fetchFiles() {
    return fetch('files.json')
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