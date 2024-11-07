let variables = [[],[],[]];
let state = true; 
let focusOnTerm = 0;
let terminalInputs = ['','',''];
let helpCommands = [
    ['ls', 'Display all files in a directory'],
    ['debug', 'Show all debug variables'],
    ['open', 'Open a file for viewing'],
    ['benjs','Built in js compiler for running programs on fs'],
    ['clear', 'Clears terminal']
];

function runCode(num, displayType) {
    let code = document.getElementById('codeInput' + String(num)).value;
    code = parseCode(num, displayType, code);
    runCodeFromString(code);
    finaliseDisplaying(num, displayType);
}

function parseCode(num, displayType, code) {
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
    console.log(vars);
    let debug = toString(vars, num);
    let debugCode = code + debug;
    return debugCode;
}

function runCodeFromString(code) {
    try {
        const wrappedCode = `(function() { ${code} })()`;
        const result = eval(wrappedCode);
        if (JSON.stringify(result) !== undefined) {
            resultVar = JSON.stringify(result);
            resultVar = JSON.parse(resultVar);
            variables[resultVar[0]-1] = resultVar[1]
            console.log(variables);
        }
    } catch (error) {
        window.alert('Error: ' + error.message);
    }
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

function toString(vars, num) {
    let stringAcc = ';return [' + String(num) + ', [';
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

function debugCode(num) {
    const debugList = document.getElementById('debugList' + String(num));
    debugList.style.display = 'block';
    let tempHTML = '';
    let vars = variables[num-1];
    console.log(vars);
    for (let i = 0; i < vars.length; i++) {
        let cVar = vars[i];
        tempHTML += '<b>' + cVar.name + '</b>: ' + cVar.val + '<br>';
    }
    debugList.innerHTML = tempHTML;
    setTimeout(() => {
        debugList.style.display = 'none';
    }, 2000);
}

function displayOnTerm(num, stringInput) {
    const displayTerminal = document.getElementById('console' + String(num));
    state = false;
    displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + '<br>&ensp;';
    displayTerminal.innerHTML += String(stringInput) + ' ';
}

function finaliseDisplaying(num, displayType) {
    if (displayType === 2) {
        const displayTerminal = document.getElementById('console' + String(num));
        displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + ' ';
        displayTerminal.innerHTML += '<br>[yourname]@liveconsole ~  ';
    }
    state = true;
    terminalInputs[num-1] = '';
}

function displayDebugOnTerm(num) {
    let tempHTML = '';
    let vars = variables[num-1];
    for (let i = 0; i < vars.length; i++) {
        let cVar = vars[i];
        tempHTML += '&ensp;<b>' + cVar.name + '</b>: ' + cVar.val;
        if (i !== vars.length - 1) {
            tempHTML += '<br>'
        }
    }
    displayOnTerm(num, tempHTML);
}

function clearTerminal(num) {
    const displayTerminal = document.getElementById('console' + String(num));
    state = false;
    displayTerminal.innerHTML = '[yourname]@liveconsole ~  ';
    terminalInputs[num-1] = [];
    state = true;
}

function waitForInput(num, stringInput) {
    const displayTerminal = document.getElementById('console' + String(num));
    displayTerminal.innerHTML += '> ' + String(stringInput) + '<br>';
}

let flickerKey2 = setInterval(() => flickerKeyForTerminal(2), 500);
let flickerKey3 = setInterval(() => flickerKeyForTerminal(3), 500);

function flickerKeyForTerminal(num) {
    const displayTerminal = document.getElementById('console' + String(num));
    const lastChar = displayTerminal.innerHTML.slice(-1);
    if (state === true && focusOnTerm === num) {
        if (lastChar === '│') {
            displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + ' ';
        } else {
            displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + '│';
        }
    } else if (focusOnTerm !== num) {
        displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + ' ';
    }   
}

function insertKeysToTerminal(num) {
    const displayTerminal = document.getElementById('console' + String(num));
    let lengthOfTermInpt = terminalInputs[num-1].length > 0 ? terminalInputs[num-1].length : 1;
    displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -lengthOfTermInpt) + terminalInputs[num-1] + ' ';
}

function deleteCharOfTerminal(num) {
    const displayTerminal = document.getElementById('console' + String(num));
    let lengthOfTermInpt = terminalInputs[num-1].length
    if (lengthOfTermInpt > 0 ) {
        terminalInputs[num-1] = removeLastChar(terminalInputs[num-1]);
        displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -lengthOfTermInpt-1) + terminalInputs[num-1] + ' ';
    }
}

function executeCode(num) {
    const executeString = terminalInputs[num-1].split(' ');
    switch (executeString[0]) {
        case 'ls' : 
            fetchFiles().then(files => {
                for (let i = 0; i < files.length; i++) {
                    displayOnTerm(num, ' - ' + files[i].name);
                }
                finaliseDisplaying(num, 2);
            }).catch(error => {
                displayOnTerm(num, 'This directory is empty...');
                finaliseDisplaying(num, 2);
            });
            break;
        case 'open':
            fetchFiles().then(files => {
                console.log(files);
                const foundFile = files.find(file => file.name === executeString[1]);
                if (foundFile !== undefined) {
                    displayOnTerm(num, foundFile.content.replace(/\n/g, '<br>&ensp;'));
                } else {
                    displayOnTerm(num, 'File not found');
                }
                finaliseDisplaying(num, 2);
            }).catch(error => {
                displayOnTerm(num, 'File not found' + error);
                finaliseDisplaying(num, 2);
            });
            break;
        case 'benjs':
            fetchFiles().then(files => {
                console.log(files);
                const foundFile = files.find(file => file.name === executeString[1]);
                if (foundFile !== undefined) {
                    runCodeFromString(parseCode(num, 2, foundFile.content));
                } else {
                    displayOnTerm(num, 'File not found');
                }
                finaliseDisplaying(num, 2);
            }).catch(error => {
                displayOnTerm(num, 'File not found' + error);
                finaliseDisplaying(num, 2);
            });
            break;
        case 'help':
            for (let i = 0; i < helpCommands.length; i++) {
                displayOnTerm(num, helpCommands[i][0] + ' --- ' + helpCommands[i][1]);
            }
            finaliseDisplaying(num, 2);
            break;
        case 'clear':
            clearTerminal(num);
            break;
        case 'debug':
            displayDebugOnTerm(num);
            finaliseDisplaying(num, 2);
            break;
        default:
            displayOnTerm(num, 'Command <u>' + executeString[0] + '</u> not found');
            finaliseDisplaying(num, 2);
            break;
    }
}

function removeLastChar(str) {
    return str.length > 0 ? str.slice(0, -1) : str;
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
        if (event.target.id === 'console2') {
            const displayTerminal = document.getElementById('console2');
            displayTerminal.focus();    
            focusOnTerm = 2;
        } else if (event.target.id === 'console3') {
            const displayTerminal = document.getElementById('console3');
            displayTerminal.focus();    
            focusOnTerm = 3;
        } else {
            focusOnTerm = 0;
        }
    } else {
        focusOnTerm = 0;
    }
});

document.addEventListener('keydown', function(event) {
    let key = event.key;
    if (state) {
        if ([2, 3].includes(focusOnTerm)) {
            if (/^[a-zA-Z]$/.test(key) || ['.'].includes(key)) {
                terminalInputs[focusOnTerm-1] += key
                insertKeysToTerminal(focusOnTerm);
            } else if (key === 'Backspace') {
                deleteCharOfTerminal(focusOnTerm);
            } else if (key === ' ') {
                event.preventDefault();
                terminalInputs[focusOnTerm-1] += key
                insertKeysToTerminal(focusOnTerm);
            }
        }
        if (key === 'Enter' && focusOnTerm === 3) {
            executeCode(3);
        }
    }
});