const table = document.getElementById("word_table");
if(table)
{
    table.addEventListener("click",(event) =>{console.log(event.target)})
}

function SaveTableChanges()
{
    let table = document.getElementById("word_table");
    if(!table) {return;}
    let doc_list = [];
    let table_rows = table.getElementsByTagName("tr");
    if(!table_rows) {return;}
    for(let dat in table_rows)
    {
        let row = table_rows[dat];
        try
        {
            let values = table_rows[dat].getElementsByTagName("td");
            doc_list.push({word:values[0].textContent,translations:values[1].textContent.split(","),unit:values[2].textContent,type:values[3].textContent});
        }
        catch(error)
        {
            continue;
        }
    }
    
 fetch('/auth/savetable',
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify(doc_list)
    }).then((res) => res.json()).then((result) => {
        let last_save_date = document.getElementById("last_save_date");
        if(!last_save_date){return;}
        last_save_date.innerText = result.message;
    }).catch(error => console.log(error));
}

function LoadTables(words)
{
    const table = document.getElementById("word_table");
    let table_string = "<tr><th>Word</th><th>Translations</th><th>Unit</th><th>Type</th></tr>";
    for(let w in words)
    {
        let new_html = `<tr><td contenteditable="true">${words[w].word}</td><td contenteditable="true">${words[w].translations}</td><td contenteditable="true">${words[w].unit}</td><td contenteditable="true">${words[w].type}</td></tr>`;
        table_string += new_html;
    }
    table.innerHTML = table_string;

    //TODO BUILD TABLES WITH WORD LIST
}

function GetWordTables()
{
    let word_list; 
    fetch('/auth/getwordtables').then((res) => res.json()).then(data => word_list = data).then(() => LoadTables(word_list));
}

function FilterWords()
{
    let table = document.getElementById("word_table");
    let input = document.getElementById("filter");
    input = input.value.toUpperCase();
    let tr = table.getElementsByTagName("tr");
    for(let i = 1; i< tr.length;i++)
    {
        let trow = tr[i];
        if(!trow){return;}
        let tdat = trow.getElementsByTagName("td")[0];
        let txt_content = tdat.textContent.toUpperCase();
        if(txt_content.indexOf(input) > -1)
        {
            trow.style.display = "";
        }
        else
        {
            trow.style.display = "none";
        }
        
       
    }
}
function ShowHideInfo()
{
    let info = document.getElementById("info");
    if(!info){return;}
    let a = info.getAnimations()[0];
    if(!a)
    {
        info.style.animationName = "show_info";
        return;
    }
    let anim = a.animationName;
    if(anim == "show_info")
    {
        info.style.animationName = "hide_info";
        return;
    }
    info.style.animationName = "show_info";
}