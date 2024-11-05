let variables = [];

function runCode() {
    const code = document.getElementById('codeInput').value.replaceAll('console.log', 'window.alert');
    const outputDiv = document.getElementById('output');

    let variableCheck = false;
    while (variableCheck != true) {
        getVars('let');
        variableCheck = true;
    }

    try {
        const wrappedCode = `(function() { ${code} })()`;
        const result = eval(wrappedCode);
        if (JSON.stringify(result) !== undefined) {
            window.alert('Result: ' + JSON.stringify(result));
        }
    } catch (error) {
        window.alert('Error: ' + error.message);
    }
}

function getVars(type) {
    let lastVar = 0;
    let pos = code.indexOf("let", lastVar);
    if (pos != -1) {
        window.alert(code[pos + type.length]);
    }
}