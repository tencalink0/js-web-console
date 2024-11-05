function runCode() {
    const code = document.getElementById('codeInput').value.replaceAll('console.log', 'window.alert');
    const outputDiv = document.getElementById('output');
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