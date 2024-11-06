let variables = [];

function runCode() {
    const code = document.getElementById('codeInput').value.replaceAll('console.log', 'window.alert');
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