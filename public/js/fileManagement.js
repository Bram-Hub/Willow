function save() {
    filename = prompt("Enter file name")
    json_str = JSON.stringify(vm.root)
    var blob = new Blob([json_str], {type: "text/plain;charset=utf-8"});
    saveAs(blob, filename + ".txt");
}

function open() {
    var input = document.createElement('input');
    input.type = 'file';

    input.onchange = e => { 
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file,'UTF-8');

        reader.onload = readerEvent => {
            var content = readerEvent.target.result;
            console.log( content );
        }
    }

    input.click();
}