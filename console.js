function runCode() {
    const code = document.getElementById('codeInput').value;
    const outputDiv = document.getElementById('output');
    try {
        const wrappedCode = `(function() { ${code.replaceAll('console.log', 'window.alert')} })()`;
        const result = eval(wrappedCode);
        if (JSON.stringify(result) === "undefined") {
            window.alert('Result: ' + JSON.stringify(result));
        }
    } catch (error) {
        window.alert('Error: ' + error.message);
    }
}