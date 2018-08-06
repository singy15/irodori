
var electron = require('electron');
var irodori = electron.remote.require('./irodori');

var context = this;
var saveTimer = null;
var editor = null;

var footerUpper = $("#footer-fixed-upper");
var cmbInputMode = $("#inputMode");

function getContent() {
  return editor.getValue();
}

function safeEval(script,after) {
  iframe = document.getElementById("sandbox");
  iframe.contentWindow.___safeEval___(script,
    function(result,err) { 
      if(err) {
        $(".out_script").remove();
        $("#outEval").append('<span class="out_script icon icon-cancel-circle" style="color:#FAA">' + "" + '</span>');
      } else {
        $(".out_script").remove();
        $("#outEval").append('<span class="out_script icon icon-checkmark" style="color:#AFA">' + "" + '</span>');
      }

      if(after) {
        after(result,err);
      }
    });
}

function unsafeEval(script, after) {
  var result = undefined;
  try {
    result = eval.call(context,script);
    if(after) {
      after(result,undefined);
    }
  } catch(ex) {
    if(after) {
      after(result,ex);
    }
  }
}

function getSelectedText() {
  return editor.getSelectedText();
}

function printUnderCursor(str) {
  var range = editor.getSelectionRange();
  var endLine = range.end.row;
    editor.session.insert({row:endLine + 1,column:0}, "> " + str + "\n");
}

function printOutput(result,err) {
  if(result) {
    printUnderCursor(result.toString());
  } else {
    printUnderCursor(err.toString());
  }
}

function printShellOutput(err, stdout, stderr) {
  if(err) {
    printUnderCursor(err.toString());
  }
  if(stdout) {
    printUnderCursor(stdout.toString());
  }
  if(stderr) {
    printUnderCursor(stderr.toString());
  }
}

function createSpanButton(label, klass, onClick) {
  var btn = $('<span class="'+ klass +'">'+ label +'</span>');
  btn.click(onClick);
  return btn;
}

function appendSpanButtonByFunction(fn) {
  if(fn.type === "sh") {
    footerUpper.prepend(createSpanButton(fn.label, "span-button span-button-shell", function() {
      irodori.execProc(fn.content);
    }));
  } else if(fn.type === "shf") {
    footerUpper.prepend(createSpanButton(fn.label, "span-button span-button-shell", function() {
      irodori.execProcFile(fn.content);
    }));
  } else if(fn.type === "js") {
    footerUpper.prepend(createSpanButton(fn.label, "span-button span-button-script", function() {
      safeEval(fn.content);
    }));
  }
}

function changeInputMode(mode) {
  if(mode === "vim") {
    editor.setKeyboardHandler("ace/keyboard/vim");
  } else if(mode === "emacs") {
    editor.setKeyboardHandler("ace/keyboard/emacs");
  } else {
    editor.setKeyboardHandler(null);
  }
}

function onChangeInputMode(evnt) {
  changeInputMode(cmbInputMode.val());
}

var syntax = [
  {pattern : new RegExp(/^\#sh\((.*)\)$/), type : "function", data : {type : "sh"}},
  {pattern : new RegExp(/^\#shf\((.*)\)$/), type : "function", data : {type : "shf"}},
  {pattern : new RegExp(/^\#js\((.*)\)$/), type : "function", data : {type : "js"}},
  {pattern : new RegExp(/^\#end/), type : "end", data : null}
];

function parseLine(line) {
  for(var i = 0; i < syntax.length; i++) {
    var stx = syntax[i];
    var mt = line.match(stx.pattern);
    if(mt) {
      return {line : line, matchedSyntax : stx, match : mt};
    }
  }

  return {line : line, matchedSyntax : null, match : null};
}

function createFunction(type, label) {
  return { label : label, type : type, content : "" };
}

function createFunctionByParseResult(parseResult) {
  return createFunction(parseResult.matchedSyntax.data.type, parseResult.match[1]);
}

function clearButtons() {
  $(".span-button").remove();
  // $(".span-button-script").remove();
}

function parseAndCreateButtons() {
  // Parse content
  var lines = getContent().split("\n");
  var fns = [];
  var fn = null;
  for(var i = 0; i < lines.length; i+=1) {
    var cur = lines[i];
    var parseResult = parseLine(cur);
    if(parseResult.matchedSyntax != null) {
      if(parseResult.matchedSyntax.type === "function") {
        fn = createFunctionByParseResult(parseResult);
        continue;
      } else if((fn != null) && (parseResult.matchedSyntax.type === "end")) {
        fns.push(fn);
        fn = null;
        continue;
      }
    } else if(fn != null) {
      fn.content = fn.content + parseResult.line + "\n";
      continue;
    }
  }

  // Delete buttons.
  clearButtons();

  // Create buttons.
  _.map(fns, appendSpanButtonByFunction);
}

function formatDateTime(d) {
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var dd = d.getDate();
    var hh = d.getHours();
    var mm = d.getMinutes();
    var ss = d.getSeconds();
    var y0 = ('0000' + y).slice(-4);
    var m0 = ('00' + m).slice(-2);
    var d0 = ('00' + dd).slice(-2);
    var hx = ('00' + hh).slice(-2);
    var mx = ('00' + mm).slice(-2);
    var sx = ('00' + ss).slice(-2);
    return y0 + "/" + m0 + "/" + d0 + " " + hx + ":" + mx + ":" + sx  ;
}

function saveNotification() {
  // Remove notification.
  $(".out").remove();

  // Append notification.
  $("#outSave").append('<span class="out">'+"SAVED : " + formatDateTime(new Date())+'</span>');
}

function safeEvalByEvent(print) {
  if(e.shiftKey) {
    safeEval(getSelectedText(), printOutput);
  } else {
    safeEval(getSelectedText());
  }
}

function inlineExecute(executor, handleResult, resultHandler) {
  if(handleResult) {
    executor(getSelectedText(), resultHandler);
  } else {
    executor(getSelectedText());
  }
}

function loadDataFile(editor) {
  irodori.readData(function(err,data) {
    if(err) {
      editor.setValue("", -1);
    } else {
      editor.setValue(data, -1);
    }
  });
}

$(document).ready(function() {
  editor = ace.edit("editor");
  //editor.setTheme("ace/theme/github");
  editor.session.setMode("ace/mode/markdown");

  editor.setOptions({
    fontFamily: "ＭＳ ゴシック",
    fontSize: "12px"
  });

  loadDataFile(editor);

  editor.getSession().on('change', function() {
    // Clear if timer is already set.
    if(saveTimer) {
      clearTimeout(saveTimer);
    }

    // Set timer for save.
    saveTimer = setTimeout(function() {
      // Write datafile.
      irodori.writeData(getContent(), function() {});
 
      // Show notification.
      saveNotification();

      // Parse and create buttons.
      parseAndCreateButtons();
    }, 1000);
  });

  $("#btnDevTools").click(function() {
    irodori.openDevTools();
  });

  $("#inputMode").change(onChangeInputMode);

  $(window).on("beforeunload",function(e){
      irodori.writeData(getContent(), function() {});
  });

  $(document).keydown(function(e) {
    if(e.ctrlKey) {
      // Execute shell script.
      if(e.keyCode == 13) {
        inlineExecute(irodori.execProc, e.shiftKey, printShellOutput);
      }

      // Execute safe evaluate.
      if(e.keyCode == 74) {
        inlineExecute(safeEval, e.shiftKey, printOutput);
      }

      // Execute unsafe evaluate.
      if(e.keyCode == 71) {
        inlineExecute(unsafeEval, e.shiftKey, printOutput);
      }
    }
  });
});
