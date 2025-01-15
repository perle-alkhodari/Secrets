

function generateCode() {

    var code = "";
    for (var i = 0; i < 4; i++) {
        var rand = Math.ceil((Math.random() * 10)-1);   // Generate random number from 0 to 9
        code += rand;
    }
    parseInt(code);
    return code;
}

export {generateCode};