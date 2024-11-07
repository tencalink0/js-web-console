let variables = [];
let state = true; 
let focusOnTerm = 0;

function runCode(num, displayType) {
    let code = document.getElementById('codeInput' + String(num)).value;
    if (displayType === 2) {
        code = code.replaceAll('console.log(', 'displayOnTerm(' + String(num) + ',');
        code = code.replaceAll('prompt(', 'waitForInput(' + String(num) + ',');
    } else {
        code = code.replaceAll('console.log(', 'window.alert');
    }
    const outputDiv = document.getElementById('output');

    let vars = [];
    vars = getVars(vars, 'let', code);
    vars = getVars(vars, 'var', code);
    vars = getVars(vars, 'const', code);
    console.log(vars);
    let debug = toString(vars);
    let debugCode = code + debug;
    try {
        const wrappedCode = `(function() { ${debugCode} })()`;
        const result = eval(wrappedCode);
        if (JSON.stringify(result) !== undefined) {
            variables = JSON.stringify(result);
        }
    } catch (error) {
        window.alert('Error: ' + error.message);
    }
    if (displayType === 2) {
        finaliseDisplaying(num);
    }
    console.log(variables);
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

function toString(vars) {
    let stringAcc = ';return [';
    for (let i = 0; i < vars.length; i++) {
        let varName = vars[i].name;
        stringAcc += `{'name': '${varName}', 'val': ${varName}}`;
        
        if (i < vars.length - 1) {
            stringAcc += ', ';
        }
    }
    stringAcc += '];';
    return stringAcc;
}

function debugCode() {
    console.log('debugList');
    const debugList = document.getElementById('debugList');
    debugList.style.display = 'block';
    let tempHTML = '';
    let vars = JSON.parse(variables);
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
    displayTerminal.innerHTML = displayTerminal.innerHTML.slice(0, -1) + '<br>';
    displayTerminal.innerHTML += '> ' + String(stringInput) + ' ';
}

function finaliseDisplaying(num) {
    const displayTerminal = document.getElementById('console' + String(num));
    displayTerminal.innerHTML += '<br>[yourname]@liveconsole ~  ';
    state = true;
}

function waitForInput(num, stringInput) {
    const displayTerminal = document.getElementById('console' + String(num));
    displayTerminal.innerHTML += '> ' + String(stringInput) + '<br>';
}

let flickerKey = setInterval(() => flickerKeyForTerminal(2), 500);

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

document.addEventListener('click', function(event) {
    if (event.target.matches('div')) {
        console.log('Clicked div id:', event.target.id);
        if (event.target.id === 'console2') {
            const displayTerminal = document.getElementById('console2');
            displayTerminal.focus();    
            focusOnTerm = 2;
        } else {
            focusOnTerm = 0;
        }
    } else {
        focusOnTerm = 0;
    }
});

document.addEventListener('keypress', function(event) {
    let key = event.key;
  
    // A-z checker
    if (/^[a-zA-Z]$/.test(key)) {
      //console.log('Character pressed:', key);
    }
  });