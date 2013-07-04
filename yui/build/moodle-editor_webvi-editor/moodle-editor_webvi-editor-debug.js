YUI.add('moodle-editor_webvi-editor', function (Y, NAME) {

/*******************************************************************************
 * WebVI
 *
 * Javascript VI replacement for boring html textareas.
 *
 ******************************************************************************/
/*******************************************************************************
 * Utils
 *
 * Useful utilities
 ******************************************************************************/

/*******************************************************************************
 * Array.clone
 *
 * Add a clone function to the array object to copy an array
 ******************************************************************************/
Array.prototype.clone = function () {
    var newArray = new Array();
    for (var property in this) {
        newArray[property] = typeof (this[property]) == 'object' ? this[property].clone() : this[property]
    }
    return newArray;
}


/*******************************************************************************
 * Globals
 ******************************************************************************/
webvi_stateList = [];


/*******************************************************************************
 * Functions
 ******************************************************************************/
/*******************************************************************************
 * webvi_defaults
 *
 * Returns a default options array with the default settings for a webvi textarea
 ******************************************************************************/
function webvi_defaults() {
    var defaults = [];
    defaults["backgroundColor"] = "rgb(90,90,90)";
    defaults["statusBackgroundColor"] = "rgb(30,30,30)";
    defaults["borderColor"] = "rgb(0,0,0)";
    defaults["borderWidth"] = 3;
    defaults["paddingWidth"] = 3;
    defaults["textColor"] = "rgb(255,255,255)";
    defaults["statusTextColor"] = "rgb(255,255,255)";
    defaults["editCursorColor"] = "rgb(180,180,255)";
    defaults["eolCursorColor"] = "rgb(255,255,180)";
    defaults["visualCursorColor"] = "rgb(180,255,180)";
    defaults["lineWrapColor"] = "rgb(255,255,0)";
    defaults["font"] = "12px monospace";

    return defaults;
}

webvi_COMMANDMODE = 0;
webvi_EDITMODE = 1;
webvi_VISUALMODE = 2;

/*******************************************************************************
 * webvi_validateCursorPosition...
 *
 * Make sure that the cursor position is within the bounds of the text buffer
 *
 * @param state
 * @return - none
 *
 ******************************************************************************/
function webvi_validateCursorPosition(state) {
    state.currentTextBuffer = state.currentTextBuffer.replace("\r\n", "\n");
    if (state.currentTextBuffer.charAt(state.currentTextBuffer.length - 1) != "\n") {
        state.currentTextBuffer += "\n";
        state.hiddenInput.value = state.currentTextBuffer;
    }
    // not real good to do this all the time.
    lines = state.currentTextBuffer.split("\n");


    if (state.cursorPosition.y >= lines.length - 1)
        state.cursorPosition.y = lines.length - 2;

    if (state.cursorPosition.y < 0)
        state.cursorPosition.y = 0;

    if (state.cursorPosition.x > lines[state.cursorPosition.y].length)
        state.cursorPosition.x = lines[state.cursorPosition.y].length;

    if (state.cursorPosition.x < 0)
        state.cursorPosition.x = 0;

    webvi_fillDisplayBuffer(state);
}

/*******************************************************************************
 * webvi_moveCursorUp...
 *
 * Move the cursor up and then validate
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorUp(state) {
    state.cursorPosition.y--;
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_moveCursorDown...
 *
 * Move the cursor down and then validate
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorDown(state) {
    state.cursorPosition.y++;
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_moveCursorLeft...
 *
 * Move the cursor left and then validate
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorLeft(state) {
    state.cursorPosition.x--;
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_moveCursorEndOfLine...
 *
 * Move the cursor to end of line and then validate
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorEndOfLine(state) {
    state.currentTextBuffer = state.currentTextBuffer.replace("\r\n", "\n");
    // not real good to do this all the time.
    lines = state.currentTextBuffer.split("\n");

    state.cursorPosition.x = lines[state.cursorPosition.y].length;
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_moveCursorStartOfLine...
 *
 * Move the cursor to start of line and then validate
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorStartOfLine(state, skipWhitespace) {
    state.currentTextBuffer = state.currentTextBuffer.replace("\r\n", "\n");
    // not real good to do this all the time.
    lines = state.currentTextBuffer.split("\n");

    state.cursorPosition.x = 0;

    if (skipWhitespace) {
        // skip over white space a the beginning
        while (state.cursorPosition.x < lines[state.cursorPosition.y].length && lines[state.cursorPosition.y].charAt(state.cursorPosition.x) == ' ')
            state.cursorPosition.x++;
    }
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_findTextBufferPositionIndex...
 *
 * Translate pos to a single index.
 *
 * @param pos, state
 * @return - index
 ******************************************************************************/
function webvi_findTextBufferPositionIndex(pos, state) {
    lines = state.currentTextBuffer.split("\n");

    var bufferIndex = 0;
    for (var i = 0; i < pos.y; i++) {
        bufferIndex += lines[i].length + 1;
    }
    bufferIndex += pos.x;

    return bufferIndex;
}

/*******************************************************************************
 * webvi_findTextBufferIndex...
 *
 * Translate currentPosition to a single index.
 *
 * @param state
 * @return - index
 ******************************************************************************/
function webvi_findTextBufferIndex(state) {
    lines = state.currentTextBuffer.split("\n");

    var bufferIndex = 0;
    for (var i = 0; i < state.cursorPosition.y; i++) {
        bufferIndex += lines[i].length + 1;
    }
    bufferIndex += state.cursorPosition.x;

    return bufferIndex;
}

/*******************************************************************************
 * webvi_moveCursorToNextWordBoundary...
 *
 * Move the cursor right to the next word boundary (wrapping) and then validate
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorToNextWordBoundary(state) {
    var bufferIndex = webvi_findTextBufferIndex(state);

    var searchBuffer = state.currentTextBuffer.substring(bufferIndex) + "\n" + state.currentTextBuffer.substring(0, bufferIndex);

    var searchIndex = searchBuffer.search(/[^\w]\w/);

    while (searchIndex-- >= 0) {
        webvi_moveCursorRightWithWrap(state);
    }
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_moveCursorLeftWithWrap...
 *
 * Move the cursor left (wrapping on newlines and eof)
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorLeftWithWrap(state) {
    lines = state.currentTextBuffer.split("\n");

    state.cursorPosition.x--;
    if (state.cursorPosition.x < 0) {
        // wrap on new line and eof
        state.cursorPosition.y--;
        if (state.cursorPosition.y < 0) {
            state.cursorPosition.y = lines.length - 1;
        }
        state.cursorPosition.x = webvi_countLineLength(state.cursorPosition.y);
    }
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_moveCursorRightWithWrap...
 *
 * Move the cursor right (wrapping on newlines and eof)
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorRightWithWrap(state) {
    lines = state.currentTextBuffer.split("\n");

    state.cursorPosition.x++;
    if (state.cursorPosition.x == (lines[state.cursorPosition.y].length + 1)) {
        // wrap on new line and eof
        state.cursorPosition.x = 0;
        state.cursorPosition.y = (state.cursorPosition.y + 1) % lines.length;
    }
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_moveCursorRight...
 *
 * Move the cursor right and then validate
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorRight(state) {
    state.cursorPosition.x++;
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_moveCursorToLastLine...
 *
 * Move the cursor to the very last line
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorToLastLine(state) {
    lines = state.currentTextBuffer.split("\n");
    state.cursorPosition.x = 0;
    state.cursorPosition.y = lines.length - 1;
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_moveCursorToLinePercentage...
 *
 * Move the cursor to the specified line number
 *
 * @param p, state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorToLinePercentage(p, state) {
    lines = state.currentTextBuffer.split("\n");

    lineNumber = Math.round((p * lines.length) / 100);
    webvi_moveCursorToLine(lineNumber, state);
}

/*******************************************************************************
 * webvi_moveCursorToLine...
 *
 * Move the cursor to the specified line number
 *
 * @param line, state
 * @return - none
 ******************************************************************************/
function webvi_moveCursorToLine(line, state) {
    state.cursorPosition.x = 0;
    state.cursorPosition.y = line;
    webvi_validateCursorPosition(state);
}

webvi_FSMSTATESTART = 0;
webvi_FSMSTATEMIDDLE = 1;
webvi_FSMSTATEEND = 2;
webvi_FSMSTATEERROR = 3;

/*******************************************************************************
 * webvi_fsmState...
 *
 * Object to represent a single state in a fsm.
 *
 * @param type, name
 ******************************************************************************/
function webvi_fsmState(type, name) {
    this.type = type;
    this.name = name;
    this.transitions = [];
}

/*******************************************************************************
 * webvi_fsmTransition...
 *
 * Object to represent a valid transition in a fsm.
 *
 * @param type, name
 ******************************************************************************/
function webvi_fsmTransition(acceptRule, nextState, action) {
    this.acceptRule = acceptRule;
    this.nextState = nextState;
    this.action = action;
}

/*******************************************************************************
 * webvi_readRepeatCount...
 *
 * Parse the repeatBuffer to an int
 *
 * @param state
 * @return repeatCount
 ******************************************************************************/
function webvi_readRepeatCount(state) {
    var buf = state.repeatBuffer;
    if (buf == "")
        buf = "0";
    var repeatCount = parseInt(buf);
    if (repeatCount <= 0) {
        repeatCount = 1;
    }
    return repeatCount;
}

/*******************************************************************************
 * webvi_simpleNavigation...
 *
 * Move the cursor to a new location by processing the single input char
 *
 * @param input, state
 ******************************************************************************/
function webvi_simpleNavigation(input, state) {
    var repeat = webvi_readRepeatCount(state);
    switch (input) {
        case '^':
            webvi_moveCursorStartOfLine(state, true);
            break;
        case '$':
            webvi_moveCursorEndOfLine(state);
            break;
        case 'h':
            while (repeat-- > 0) { webvi_moveCursorLeft(state); }
            break;
        case 'j':
            while (repeat-- > 0) { webvi_moveCursorDown(state); }
            break;
        case 'k':
            while (repeat-- > 0) { webvi_moveCursorUp(state); }
            break;
        case 'l':
            while (repeat-- > 0) { webvi_moveCursorRight(state); }
            break;
        case 'w':
            while (repeat-- > 0) { webvi_moveCursorToNextWordBoundary(state); }
            break;
        case 'G':
            if (state.repeatBuffer == "") {
                webvi_moveCursorToLastLine(state);
            } else {
                webvi_moveCursorToLine(repeat - 1, state);
            }
            break;
        case '%':
            webvi_moveCursorToLinePercentage(repeat, state);
            break;
    }

}

/*******************************************************************************
 * webvi_runSearch...
 *
 * Run a search for the given string ( will search forwards or backwards )
 *
 * @param search, state
 ******************************************************************************/
function webvi_runSearch(search, state) {
    var repeat = webvi_readRepeatCount(state);

    state.lastSearch = search;
    while (repeat-- > 0) {
        var bufferIndex = webvi_findTextBufferIndex(state);
        var searchBuffer = state.currentTextBuffer.slice(bufferIndex+1) + '\n' + state.currentTextBuffer.slice(0, bufferIndex+1) + state.currentTextBuffer.slice(bufferIndex+1);



        var searchRe = new RegExp(search.slice(1));

        var matchIndex = -1;

        if (search.charAt(0) == '/') {
            matchIndex = searchBuffer.search(searchRe);
        } else if (search.charAt(0) == '?') {
            for (var i = 0; i < searchBuffer.length; i++) {
                matchIndex = searchBuffer.slice(searchBuffer.length - 1 - i).search(searchRe);
                if (matchIndex >= 0) {
                    matchIndex += searchBuffer.length - i - 1;
                    i = searchBuffer.length;
                }
            }
        }


        if (matchIndex < 0) {
            state.statusText = search.slice(1) + " not found.";
            return;
        }

        while (matchIndex-- >= 0) {
            // slow - should set a flag to only update display once at end

            webvi_moveCursorRightWithWrap(state);
        }
    }
}

/*******************************************************************************
 * webvi_capitalise...
 *
 * Reverse the capitalisation of the char under the cursor and move right one.
 *
 * @param state
 ******************************************************************************/
function webvi_capitalise(state) {
    var repeat = webvi_readRepeatCount(state);

    webvi_appendUndoBuffer(state);
    while (repeat-- > 0) {
        var bufferIndex = webvi_findTextBufferIndex(state);

        var c = state.currentTextBuffer.charAt(bufferIndex);
        if (c == c.toUpperCase()) {
            c = c.toLowerCase();
        } else {
            c = c.toUpperCase();
        }

        var tmpS = state.currentTextBuffer.slice(0, bufferIndex) + c + state.currentTextBuffer.slice(bufferIndex + 1);
        state.currentTextBuffer = tmpS;

        webvi_moveCursorRightWithWrap(state);
    }
}

/*******************************************************************************
 * webvi_insertTextRaw...
 *
 * Insert the text at the current cursor position.
 * Ignore undo buffer, repeat count and status.
 *
 * @param input, state
 ******************************************************************************/
function webvi_insertTextRaw(input, state) {
    var bufferIndex = webvi_findTextBufferIndex(state);

    state.simpleInsertBuffer += input;
    var tmpS = state.currentTextBuffer.slice(0, bufferIndex) + input + state.currentTextBuffer.slice(bufferIndex);

    state.cursorPosition.x += input.length;
    state.currentTextBuffer = tmpS;

    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_insertText...
 *
 * Insert the text at the current cursor position.
 * If repeat count is set - it will be used.
 *
 * @param input, state
 ******************************************************************************/
function webvi_insertText(input, state) {
    var repeat = webvi_readRepeatCount(state);
    var bufferIndex = webvi_findTextBufferIndex(state);
    var insertCount = 0;

    webvi_appendUndoBuffer(state);
    while (repeat-- > 0) {
        var tmpS = state.currentTextBuffer.slice(0, bufferIndex) + input + state.currentTextBuffer.slice(bufferIndex);
        insertCount += input.length;
        state.cursorPosition.x += input.length;
        state.currentTextBuffer = tmpS;
    }
    state.statusText = "Inserted " + (insertCount) + " character(s).";

    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_deletePreviousCharRaw...
 *
 * Cut the previous char with no undo, or status updates
 *
 * @param state
 ******************************************************************************/
function webvi_deletePreviousCharRaw(state) {
    var bufferIndex = webvi_findTextBufferIndex(state);
    bufferIndex--;

    if (bufferIndex >= 0) {
        var tmpS = state.currentTextBuffer.slice(0, bufferIndex) + state.currentTextBuffer.slice(bufferIndex + 1);
        state.cursorPosition.x--;
        if (state.cursorPosition.x < 0) {
            state.cursorPosition.y--;
            var lines = state.currentTextBuffer.split("\n");
            state.cursorPosition.x = lines[state.cursorPosition.y].length;
        }
        state.currentTextBuffer = tmpS;
        webvi_validateCursorPosition(state);
    }
}

/*******************************************************************************
 * webvi_deleteCurrentCharRaw...
 *
 * Cut the current char with no undo, or status updates
 *
 * @param state
 ******************************************************************************/
function webvi_deleteCurrentCharRaw(state) {
    var bufferIndex = webvi_findTextBufferIndex(state);

    var tmpS = state.currentTextBuffer.slice(0, bufferIndex) + state.currentTextBuffer.slice(bufferIndex + 1);
    state.currentTextBuffer = tmpS;
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_cutRange...
 *
 * Cut the text between 2 cursor positions. If the cursors are on different
 * lines - whole line cut is done.
 *
 * @param pos1, pos2, state
 ******************************************************************************/
function webvi_cutRange(pos1, pos2, state) {
    var bufferIndex = webvi_findTextBufferPositionIndex(pos1, state);
    var bufferEndIndex = webvi_findTextBufferPositionIndex(pos2, state);
    var cursorIndex = webvi_findTextBufferIndex(state);

    webvi_appendUndoBuffer(state);
    if (bufferIndex < bufferEndIndex) {
        for (var i = 0; i < cursorIndex - bufferIndex; i++) {
            webvi_moveCursorLeftWithWrap(state);
        }
        state.copyBuffer = state.currentTextBuffer.slice(bufferIndex, bufferEndIndex);
        var tmpS = state.currentTextBuffer.slice(0, bufferIndex) + state.currentTextBuffer.slice(bufferEndIndex);
        state.currentTextBuffer = tmpS;
        state.statusText = "Cut " + (bufferEndIndex - bufferIndex) + " character(s).";
    } else {
        for (var i = 0; i < cursorIndex - bufferEndIndex; i++) {
            webvi_moveCursorLeftWithWrap(state);
        }
        state.copyBuffer = state.currentTextBuffer.slice(bufferEndIndex, bufferIndex);
        var tmpS = state.currentTextBuffer.slice(0, bufferEndIndex) + state.currentTextBuffer.slice(bufferIndex);
        state.currentTextBuffer = tmpS;
        state.statusText = "Cut " + (bufferIndex - bufferEndIndex) + " character(s).";
    }

    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_copyRange...
 *
 * Copy the text between 2 cursor positions. If the cursors are on different
 * lines - whole line copying is done.
 *
 * @param pos1, pos2, state
 ******************************************************************************/
function webvi_copyRange(pos1, pos2, state) {
    var bufferIndex = webvi_findTextBufferPositionIndex(pos1, state);
    var bufferEndIndex = webvi_findTextBufferPositionIndex(pos2, state);

    if (bufferIndex < bufferEndIndex) {
        state.copyBuffer = state.currentTextBuffer.substring(bufferIndex, bufferEndIndex);
        state.statusText = "Copied " + (bufferEndIndex - bufferIndex) + " character(s).";
    } else {
        state.copyBuffer = state.currentTextBuffer.substring(bufferEndIndex, bufferIndex);
        state.statusText = "Copied " + (bufferIndex - bufferEndIndex) + " character(s).";
    }

}

/*******************************************************************************
 * webvi_copyLines...
 *
 * Copy N lines to the copy buffer.
 *
 * @param N, state
 ******************************************************************************/
function webvi_copyLines(N, state) {
    lines = state.currentTextBuffer.split("\n");
    for (var i = 0; i < N && (state.cursorPosition.y + i) < lines.length; i++) {
        state.copyBuffer += lines[state.cursorPosition.y + i] + "\n";
    }
    state.statusText = "Copied " + i + " line(s)";
}

/*******************************************************************************
 * webvi_appendUndoBuffer...
 *
 * Save the current state to the undo buffer
 *
 * @param state
 ******************************************************************************/
function webvi_appendUndoBuffer(state) {
    state.undoBuffer.push(state.currentTextBuffer);
    state.redoBuffer = [];
}

/*******************************************************************************
 * webvi_join...
 *
 * Delete the next "\n" in the current text buffer
 *
 * @param state
 ******************************************************************************/
function webvi_join(state) {
    var repeat = webvi_readRepeatCount(state);

    webvi_appendUndoBuffer(state);
    while (repeat-- > 0) {
        webvi_moveCursorEndOfLine(state);
        var bufferIndex = webvi_findTextBufferIndex(state);
        if (state.currentTextBuffer[bufferIndex + 1] == "\n") {
            var tmpS = state.currentTextBuffer.slice(0, bufferIndex + 1) + state.currentTextBuffer.slice(bufferIndex + 2);
            state.currentTextBuffer = tmpS;
        }
    }
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_undo...
 *
 * Save the current state to the redo buffer and restore one state from the undo
 * buffer
 *
 * @param state
 ******************************************************************************/
function webvi_undo(state) {
    if (state.undoBuffer.length > 0) {
        state.redoBuffer.push(state.currentTextBuffer);
        state.currentTextBuffer = state.undoBuffer.pop();
        state.statusText = "Undo";
    }
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_redo...
 *
 * Save the current state to the undo buffer and restore one state from the redo
 * buffer
 *
 * @param state
 ******************************************************************************/
function webvi_redo(state) {
    if (state.redoBuffer.length > 0) {
        state.undoBuffer.push(state.currentTextBuffer);
        state.currentTextBuffer = state.redoBuffer.pop();
        state.statusText = "Redo";
    }
    webvi_validateCursorPosition(state);
}

/*******************************************************************************
 * webvi_countLineLength...
 *
 * Get the length of line n.
 *
 * @param line, state
 ******************************************************************************/
function webvi_countLineLength(line, state) {
    var lines = state.currentTextBuffer.split("\n");
    return lines[line].length;
}

/*******************************************************************************
 * webvi_buildVisualModeFSM...
 *
 * Return the start state for a full FSM for accepting commands in visual mode.
 *
 * @param none
 ******************************************************************************/
function webvi_buildVisualModeFSM() {
    // valid visual mode commands are:
    //
    // Copy
    // y<optional num><navigation/y>
    // Cut
    // c<optional num><navigation/c>
    // Delete
    // d<optional num><navigation/d>
    // Replace
    // <optional num>r
    // Navigate
    // <optional num><navigation>
    // Delete Char
    // <optional num>x/delete
    // Navigate
    // <direction>/hjkl/^/G/<num>%/%/<backspace>/'<a-z>
    // Mark
    // m<a-z>
    // Insert mode
    // i
    // Command mode
    // u
    // Undo
    // <ctrl>r
    // Redo
    // :/?
    // Repeat
    // <optional num>.

    // The FSM looks like:
    //
    //  navigation=hjkl<arrow>^$G%<backspace>w - <navigation-end>
    //              ' -> <mark-navigation-start> - a-z - <mark-navigation-end>
    //
    //                              ---------------------
    //                              |                   |
    //              / -> <search-navigation-start> - !<enter>
    //                                             - <enter> - <search-navigation-end>
    //
    //                              ---------------------
    //                              |                   |
    //              ? -> <search-navigation-start> - !<enter>
    //                                             - <enter> - <search-navigation-end>
    //
    //      -------------------------------------------------
    //      |                                               |
    //  <start> - 0-9 - <numeric-start> ---------------------
    //
    //                  v---------------
    //          - y - <yank-start> - 0-9 -|
    //                          - navigation - <yank-end>
    //                          - y - <yank-end>
    //
    //                  v---------------
    //          - c - <cut-start> - 0-9 -|
    //                          - navigation - <cut-end>
    //                          - c - <cut-end>
    //
    //                  v---------------
    //          - d - <delete-start> - 0-9 -|
    //                          - navigation - <delete-end>
    //                          - d - <delete-end>
    //
    //
    //          - r - <replace-start> - * - <replace-end>
    //
    //          - x - <delete-end>
    //
    //          - p - <paste-end>
    //
    //          - navigation - <navigation-end>
    //
    //          - i - <insert-mode-end>
    //
    //          - : - <command-mode-end>
    //
    //          - a - <append-mode-end>
    //
    //          - m - <mark-start> - a-z - <mark-end>
    //
    //          - . - <repeat-mode-end>
    //
    //
    startState = new webvi_fsmState(webvi_FSMSTATESTART, "start");

    t = new webvi_fsmTransition(/[0-9]/,
                                startState,
                                function(input, state) { state.repeatBuffer += input; });

    startState.transitions.push(t);

    yankStartState = new webvi_fsmState(webvi_FSMSTATEMIDDLE, "yank-start");

    t = new webvi_fsmTransition(/y/,
                                yankStartState,
                                function(input, state) { });

    startState.transitions.push(t);

    t = new webvi_fsmTransition(/[0-9]/,
                                yankStartState,
                                function(input, state) { state.repeatBuffer += input; });

    yankStartState.transitions.push(t);

    yankEndState = new webvi_fsmState(webvi_FSMSTATEEND, "yank-end");

    t = new webvi_fsmTransition(/y/,
                                yankEndState,
                                function(input, state) {
                                    // copy the specified number of lines to the copyBuffer
                                    var cursorPos = new Object();
                                    var startCursorPos = new Object();
                                    var repeatCount = webvi_readRepeatCount(state);
                                    startCursorPos.x = 0;
                                    startCursorPos.y = state.cursorPosition.y;
                                    cursorPos.x = webvi_countLineLength(state.cursorPosition.y + repeatCount - 1, state) + 1;
                                    cursorPos.y = state.cursorPosition.y + repeatCount - 1;
                                    webvi_copyRange(startCursorPos, cursorPos, state);
                                });

    yankStartState.transitions.push(t);

    // single char navigation commands (yank)
    t = new webvi_fsmTransition(/[hjkl^$Gw%]/,
                                yankEndState,
                                function(input, state) {
                                    // copy the current cursor position
                                    var cursorPos = new Object();
                                    cursorPos.x = state.cursorPosition.x;
                                    cursorPos.y = state.cursorPosition.y;
                                    // move the cursor
                                    webvi_simpleNavigation(input, state);
                                    // copy the text we moved over
                                    webvi_copyRange(cursorPos, state.cursorPosition, state);
                                });

    yankStartState.transitions.push(t);

    deleteStartState = new webvi_fsmState(webvi_FSMSTATEMIDDLE, "delete-start");

    t = new webvi_fsmTransition(/[d]/,
                                deleteStartState,
                                function(input, state) { });

    startState.transitions.push(t);

    t = new webvi_fsmTransition(/[0-9]/,
                                deleteStartState,
                                function(input, state) { state.repeatBuffer += input; });

    deleteStartState.transitions.push(t);

    deleteEndState = new webvi_fsmState(webvi_FSMSTATEEND, "delete-end");

    t = new webvi_fsmTransition(/[d]/,
                                deleteEndState,
                                function(input, state) {
                                    // copy the specified number of lines to the copyBuffer
                                    var cursorPos = new Object();
                                    var startCursorPos = new Object();
                                    var repeatCount = webvi_readRepeatCount(state);
                                    startCursorPos.x = 0;
                                    startCursorPos.y = state.cursorPosition.y;
                                    cursorPos.x = webvi_countLineLength(state.cursorPosition.y + repeatCount - 1, state) + 1;
                                    cursorPos.y = state.cursorPosition.y + repeatCount - 1;
                                    webvi_cutRange(startCursorPos, cursorPos, state);
                                });

    deleteStartState.transitions.push(t);

    // single char navigation commands (delete)
    t = new webvi_fsmTransition(/[hjkl^$Gw%]/,
                                deleteEndState,
                                function(input, state) {
                                    // copy the current cursor position
                                    var cursorPos = new Object();
                                    cursorPos.x = state.cursorPosition.x;
                                    cursorPos.y = state.cursorPosition.y;
                                    // move the cursor
                                    webvi_simpleNavigation(input, state);
                                    // copy the text we moved over
                                    webvi_cutRange(cursorPos, state.cursorPosition, state);
                                });

    deleteStartState.transitions.push(t);

    cutStartState = new webvi_fsmState(webvi_FSMSTATEMIDDLE, "cut-start");

    t = new webvi_fsmTransition(/[c]/,
                                cutStartState,
                                function(input, state) { });

    startState.transitions.push(t);

    t = new webvi_fsmTransition(/[0-9]/,
                                cutStartState,
                                function(input, state) { state.repeatBuffer += input; });

    cutStartState.transitions.push(t);

    cutEndState = new webvi_fsmState(webvi_FSMSTATEEND, "cut-end");

    t = new webvi_fsmTransition(/[c]/,
                                cutEndState,
                                function(input, state) {
                                    // copy the specified number of lines to the copyBuffer
                                    var cursorPos = new Object();
                                    var startCursorPos = new Object();
                                    var repeatCount = webvi_readRepeatCount(state);
                                    startCursorPos.x = 0;
                                    startCursorPos.y = state.cursorPosition.y;
                                    cursorPos.x = webvi_countLineLength(state.cursorPosition.y + repeatCount - 1, state) + 1;
                                    cursorPos.y = state.cursorPosition.y + repeatCount - 1;
                                    webvi_cutRange(startCursorPos, cursorPos, state);
                                    webvi_insertTextRaw("\n", state);
                                    state.mode = webvi_EDITMODE;
                                    state.isSimpleInsert = true;
                                    state.simpleInsertBuffer = "";
                                    state.statusText = "Insert Mode";
                                });

    cutStartState.transitions.push(t);

    // single char navigation commands (cut)
    t = new webvi_fsmTransition(/[hjkl^$Gw%]/,
                                cutEndState,
                                function(input, state) {
                                    // copy the current cursor position
                                    var cursorPos = new Object();
                                    cursorPos.x = state.cursorPosition.x;
                                    cursorPos.y = state.cursorPosition.y;
                                    // move the cursor
                                    webvi_simpleNavigation(input, state);
                                    // copy the text we moved over
                                    webvi_cutRange(cursorPos, state.cursorPosition, state);
                                    state.mode = webvi_EDITMODE;
                                    state.isSimpleInsert = true;
                                    state.simpleInsertBuffer = "";
                                    state.statusText = "Insert Mode";
                                });

    cutStartState.transitions.push(t);


    endState = new webvi_fsmState(webvi_FSMSTATEEND, "end");
    // single char navigation commands
    t = new webvi_fsmTransition(/[hjkl^$Gw%]/,
                                endState,
                                function(input, state) {
                                    // move the cursor
                                    webvi_simpleNavigation(input, state);
                                });

    startState.transitions.push(t);

    t = new webvi_fsmTransition(/[0-9]/,
                                startState,
                                function(input, state) { state.repeatBuffer += input; });

    startState.transitions.push(t);

    // delete immediate
    t = new webvi_fsmTransition(/x/,
                                endState,
                                function(input, state) {
                                    var cursorPos = new Object();
                                    var repeatCount = webvi_readRepeatCount(state);
                                    cursorPos.x = state.cursorPosition.x+repeatCount;
                                    cursorPos.y = state.cursorPosition.y;
                                    webvi_cutRange(cursorPos, state.cursorPosition, state);
                                });

    startState.transitions.push(t);

    // replace
    replaceStartState = new webvi_fsmState(webvi_FSMSTATEMIDDLE, "replace-start");

    t = new webvi_fsmTransition(/r/,
                                replaceStartState,
                                function(input, state) { });

    startState.transitions.push(t);

    replaceEndState = new webvi_fsmState(webvi_FSMSTATEEND, "replace-end");

    t = new webvi_fsmTransition(/./,
                                replaceEndState,
                                function(input, state) {
                                    var cursorPos = new Object();
                                    var repeatCount = webvi_readRepeatCount(state);
                                    cursorPos.x = state.cursorPosition.x+repeatCount;
                                    cursorPos.y = state.cursorPosition.y;
                                    webvi_cutRange(cursorPos, state.cursorPosition, state);
                                    webvi_insertText(input, state);
                                });

    replaceStartState.transitions.push(t);

    insertEndState = new webvi_fsmState(webvi_FSMSTATEEND, "insert-end");

    t = new webvi_fsmTransition(/[ia]/,
                                insertEndState,
                                function(input, state) {
                                    if (input == "a") {
                                        webvi_moveCursorRight(state);
                                    }
                                    webvi_appendUndoBuffer(state)
                                    state.mode = webvi_EDITMODE;
                                    state.isSimpleInsert = true;
                                    state.simpleInsertBuffer = "";
                                    state.statusText = "Insert Mode";
                                });

    startState.transitions.push(t);

    pasteEndState = new webvi_fsmState(webvi_FSMSTATEEND, "paste-end");

    t = new webvi_fsmTransition(/p/,
                                pasteEndState,
                                function(input, state) {
                                    if (state.copyBuffer.indexOf("\n") > 0) {
                                        state.cursorPosition.x = 0;
                                        state.cursorPosition.y++;
                                    }
                                    webvi_insertText(state.copyBuffer, state);
                                });

    startState.transitions.push(t);

    undoEndState = new webvi_fsmState(webvi_FSMSTATEEND, "undo-end");

    t = new webvi_fsmTransition(/u/,
                                undoEndState,
                                function(input, state) {
                                    webvi_undo(state);
                                });

    startState.transitions.push(t);

    redoEndState = new webvi_fsmState(webvi_FSMSTATEEND, "redo-end");

    t = new webvi_fsmTransition(/R/,
                                redoEndState,
                                function(input, state) {
                                    webvi_redo(state);
                                });

    startState.transitions.push(t);

    joinEndState = new webvi_fsmState(webvi_FSMSTATEEND, "join-end");

    t = new webvi_fsmTransition(/J/,
                                joinEndState,
                                function(input, state) {
                                    webvi_join(state);
                                });

    startState.transitions.push(t);

    oEndState = new webvi_fsmState(webvi_FSMSTATEEND, "o-end");

    t = new webvi_fsmTransition(/o/,
                                oEndState,
                                function(input, state) {
                                    webvi_appendUndoBuffer(state)
                                    webvi_moveCursorDown(state);
                                    webvi_moveCursorStartOfLine(state, false);
                                    state.mode = webvi_EDITMODE;
                                    webvi_insertTextRaw("\n", state);
                                    state.isSimpleInsert = true;
                                    state.simpleInsertBuffer = "";
                                    state.statusText = "Insert Mode";
                                });

    startState.transitions.push(t);

    capsEndState = new webvi_fsmState(webvi_FSMSTATEEND, "caps-end");

    t = new webvi_fsmTransition(/~/,
                                capsEndState,
                                function(input, state) {
                                    webvi_capitalise(state);
                                });

    startState.transitions.push(t);

    repeatSearchEndState = new webvi_fsmState(webvi_FSMSTATEEND, "repeat-search-end");

    t = new webvi_fsmTransition(/n/,
                                repeatSearchEndState,
                                function(input, state) {
                                    webvi_runSearch(state.lastSearch, state);
                                });

    startState.transitions.push(t);

    startSearchEndState = new webvi_fsmState(webvi_FSMSTATEMIDDLE, "start-search-end");

    t = new webvi_fsmTransition(/[\/\?]/,
                                startSearchEndState,
                                function(input, state) {
                                    state.mode = webvi_COMMANDMODE;
                                    state.statusText = "";
                                    state.commandBuffer = input;
                                });

    startState.transitions.push(t);

    return startState;
}

/*******************************************************************************
 * webvi_executeFSM...
 *
 * Run the FSM by feeding on char at a time to the FSM. Return the final state
 * reached.
 *
 * @param fs, command, state
 * @return - none
 ******************************************************************************/
function webvi_executeFSM(fsm, command, state) {

    current = fsm;

    for (var i = 0; i < command.length; i++) {

        foundTransition = false;
        for (var j = 0; j < current.transitions.length && !foundTransition; j++) {
            if (current.transitions[j].acceptRule.test(command.charAt(i))) {
                // found a valid transition
                foundTransition = true;
                current.transitions[j].action(command.charAt(i), state);
                current = current.transitions[j].nextState;
                continue;
            }
        }
        // no matching transition - go to error
        if (!foundTransition) {
            return new webvi_fsmState(webvi_FSMSTATEERROR, "error");
        }
    }

    return current;
}

/*******************************************************************************
 * webvi_executeVisualModeCommandBuffer...
 *
 * If the command buffer forms a complete visual mode command, run it and clear
 * the buffer.
 *
 * @param state
 * @return - none
 ******************************************************************************/
function webvi_executeVisualModeCommandBuffer(state) {

    // if the buffer does not begin with a valid starting char, clear the buffer
    // and start again.

    fsm = webvi_buildVisualModeFSM();

    state.repeatBuffer = "";
    finalState = webvi_executeFSM(fsm, state.commandBuffer, state);

    if (finalState.type == webvi_FSMSTATEERROR) {
        state.statusText = "Invalid command: " + state.commandBuffer;
        state.commandBuffer = "";
    }

    if (finalState.type == webvi_FSMSTATEEND) {
        state.commandBuffer = "";
    }

}

/*******************************************************************************
 * webvi_appendVisualModeCommandChar...
 *
 * Append the char to the current command buffer and if the command buffer is in
 * an executable state, run the command and flush the buffer.
 *
 * @param c, state
 * @return - none
 ******************************************************************************/
function webvi_appendVisualModeCommandChar(c, state) {
    state.commandBuffer += c;
    webvi_executeVisualModeCommandBuffer(state);
}

/*******************************************************************************
 * webvi_interpretKeyPress...
 *
 * Interpret the pressed key into a valid char. Return "" if not a display char
 *
 * @param evt
 * @return - c
 ******************************************************************************/
function webvi_interpretKeyPress(e) {
    var c = "";

    var i = e.keyCode;
    if (i == 0) {
        i = e.charCode;
    }

    if (e.shiftKey) {
        if (i >= 65 && i <= 90) {
            return String.fromCharCode(i);
        }
        switch (i) {
            case 192:
                return '~';
            case 49:
                return '!';
            case 50:
                return '@';
            case 51:
                return '#';
            case 52:
                return '$';
            case 53:
                return '%';
            case 54:
                return '^';
            case 55:
                return '&';
            case 56:
                return '*';
            case 57:
                return '(';
            case 48:
                return ')';
            case 189:
                return '_';
            case 61:
                return '+';
            case 219:
                return '{';
            case 221:
                return '}';
            case 220:
                return '|';
            case 186:
            case 59:
                return ':';
            case 222:
                return '"';
            case 188:
                return '<';
            case 190:
                return '>';
            case 191:
                return '?';
            case 20:
                return ' ';
            case 42:
                return '*';
            case 187:
                return '+';
        }
    } else {
        if ((i >= 65 && i <= 90)) {
            return String.fromCharCode(i + 32);
        } else {
            switch (i) {
                case 192:
                    return '`';
                case 187:
                case 61:
                    return '=';
                case 189:
                    return '-';
                case 219:
                    return '[';
                case 221:
                    return ']';
                case 220:
                    return '\\';
                case 186:
                case 59:
                    return ';';
                case 222:
                    return '\'';
                case 188:
                    return ',';
                case 190:
                    return '.';
                case 191:
                    return '/';
                case 111:
                    return '/';
                case 106:
                    return '*';
                case 109:
                    return '-';
                case 107:
                    return '+';
                case 96:
                case 48:
                    return '0';
                case 97:
                case 49:
                    return '1';
                case 98:
                case 50:
                    return '2';
                case 99:
                case 51:
                    return '3';
                case 100:
                case 52:
                    return '4';
                case 101:
                case 53:
                    return '5';
                case 102:
                case 54:
                    return '6';
                case 103:
                case 55:
                    return '7';
                case 104:
                case 56:
                    return '8';
                case 105:
                case 57:
                    return '9';
                case 32:
                    return ' ';
            }
        }
    }
    return c;
}


/*******************************************************************************
 * webvi_handleKeyboardInput...
 *
 * Handle the keyboard input by updating the state and triggering a redraw.
 *
 * @param evt, state
 * @return - none
 *
 ******************************************************************************/
function webvi_handleKeyboardInput(e, state) {
    var code = webvi_interpretKeyPress(e);

    switch (state.mode) {
        case webvi_VISUALMODE:
            if (code != "") {
                if (code == 'r' && e.ctrlKey) {
                    code = 'R';
                }
                webvi_appendVisualModeCommandChar(code, state);

            } else if (e.keyCode > 0) {
                switch (e.keyCode) {
                    case 46:
                        webvi_appendVisualModeCommandChar('x', state);
                        break;
                    case 40:
                        webvi_appendVisualModeCommandChar('j', state);
                        break;
                    case 38:
                        webvi_appendVisualModeCommandChar('k', state);
                        break;
                    case 37:
                    case 8:
                        webvi_appendVisualModeCommandChar('h', state);
                        break;
                    case 39:
                        webvi_appendVisualModeCommandChar('l', state);
                        break;
                }
            }
            break;
        case webvi_EDITMODE:
            if (code != "") {
                webvi_insertTextRaw(code, state);
            } else if (e.keyCode > 0) {
                switch (e.keyCode) {
                    case 27:
                        state.mode = webvi_VISUALMODE;
                        var repeat = webvi_readRepeatCount(state);
                        var buffer = state.simpleInsertBuffer;
                        while (repeat-- > 1) {
                            webvi_insertTextRaw(buffer, state);
                        }
                        state.statusText = "Visual Mode";
                        break;
                    case 46:
                        webvi_deleteCurrentCharRaw(state);
                        break;
                    case 8:
                        webvi_deletePreviousCharRaw(state);
                        break;
                    case 40:
                        state.isSimpleInsert = false;
                        webvi_moveCursorDown(state);
                        state.statusText = "";
                        break;
                    case 38:
                        state.isSimpleInsert = false;
                        webvi_moveCursorUp(state);
                        state.statusText = "";
                        break;
                    case 37:
                        state.isSimpleInsert = false;
                        webvi_moveCursorLeft(state);
                        state.statusText = "";
                        break;
                    case 39:
                        state.isSimpleInsert = false;
                        webvi_moveCursorRight(state);
                        state.statusText = "";
                        break;
                    case 13:
                        webvi_insertTextRaw("\n", state);
                        webvi_moveCursorDown(state);
                        webvi_moveCursorStartOfLine(state, false);
                        state.statusText = "";
                        break;
                }
            }
            break;
        case webvi_COMMANDMODE:
            if (code != "") {
                state.commandBuffer += code;
            } else if (e.keyCode > 0) {
                switch (e.keyCode) {
                    case 27:
                        state.mode = webvi_VISUALMODE;
                        state.statusText = "Visual Mode";
                        state.commandBuffer = "";
                        break;
                    case 13:
                        state.mode = webvi_VISUALMODE;
                        state.statusText = "Search: " + state.commandBuffer;
                        webvi_runSearch(state.commandBuffer, state);
                        state.commandBuffer = "";
                        break;
                    case 37:
                        // Left
                        break;
                    case 39:
                        // Right
                        break;
                    case 8:
                        state.commandBuffer = state.commandBuffer.slice(0, state.commandBuffer.length - 2);
                        break;
                }
            }
            break;
    }
    webvi_renderCanvas(state);
}

/*******************************************************************************
 * webvi_handleDocumentKeyboardInput...
 *
 * Handle the keyboard input by locating the canvas state and defering to
 * handleKeyboardInput.
 *
 * @param stateIndex, evt
 * @return - none
 *
 ******************************************************************************/
function webvi_handleDocumentKeyboardInput(e) {
    // get the target
    for (var i = 0; i < webvi_stateList.length; i++) {
        if (webvi_stateList[i].canvasNode == e.target) {
            webvi_handleKeyboardInput(e, state);
            break;
        }
    }
    e.preventDefault();
}

/*******************************************************************************
 * webvi_fillDisplayBuffer...
 *
 * Loop through the current text buffer and set the character to display for
 * each grid position in the display buffer.
 *
 * @param state
 * @return - none
 *
 ******************************************************************************/
function webvi_fillDisplayBuffer(state) {
    state.currentTextBuffer = state.currentTextBuffer.replace("\r\n", "\n");
    var lines = state.currentTextBuffer.split("\n");
    var x = 0, y = 0;

    // clear the buffer
    for (var j = 0; j < state.windowSize.height; j++) {
        state.lineWrap[j] = false;
        for (var i = 0; i < state.windowSize.width; i++) {
            state.displayBuffer[i][j] = ' ';
        }
    }

    var line = 0;
    var cursorValid = false;
    // fill the buffer from the text buffer
    for (line = 0; line < lines.length && y < state.windowSize.height; line++) {
        for (x = 0; x < lines[line].length; x++) {
            if (x > 0 && ((x % state.windowSize.width) == 0)) {
                state.lineWrap[y] = true;
                y++;
            }
            state.displayBuffer[x % state.windowSize.width][y] = lines[line][x];
            if (line == state.cursorPosition.y && x == state.cursorPosition.x) {
                state.displayCursorPosition.x = x % state.windowSize.width;
                state.displayCursorPosition.y = y;
                cursorValid = true;
            }
        }
        state.displayBuffer[x % state.windowSize.width][y] = '\n';
        if (line == state.cursorPosition.y && x == state.cursorPosition.x) {
            state.displayCursorPosition.x = x % state.windowSize.width;
            state.displayCursorPosition.y = y;
            cursorValid = true;
        }

        y++;
    }
    if (!cursorValid) {
        state.displayCursorPosition.x = (x) % state.windowSize.width;
        state.displayCursorPosition.y = (y-1);
    }

}

/*******************************************************************************
 * webvi_state...
 *
 * This struct holds the state for a single vi instance
 *
 ******************************************************************************/
function webvi_state(hiddenInput, canvasNode, textareaNode) {
    this.hiddenInput = hiddenInput;
    this.canvasNode = canvasNode;
    this.options = new webvi_defaults();
    this.currentTextBuffer = hiddenInput.value;
    this.cursorPosition = new Object();
    this.cursorPosition.x = 0;
    this.cursorPosition.y = 0;
    this.displayCursorPosition = new Object();
    this.displayCursorPosition.x = 0;
    this.displayCursorPosition.y = 0;
    this.windowSize = new Object();
    this.windowSize.width = textareaNode.getAttribute("cols");
    this.windowSize.height = textareaNode.getAttribute("rows") - 1;
    this.mode = webvi_VISUALMODE;
    this.commandBuffer = "";
    this.copyBuffer = "";
    this.lastSearch = "";
    this.repeatBuffer = "";
    this.characterSize = new Object();
    this.characterSize.width = (canvasNode.getAttribute("width") - (this.options["borderWidth"] * 2) - (this.options["paddingWidth"] * 2)) / this.windowSize.width;
    this.characterSize.height = (canvasNode.getAttribute("height") - (this.options["borderWidth"] * 2) - (this.options["paddingWidth"] * 2)) / (this.windowSize.height + 1);
    this.statusText = "Ready: " + this.currentTextBuffer.split("\n").length + "L, " + this.currentTextBuffer.length + "C";
    this.undoBuffer = [];
    this.redoBuffer = [];
    this.simpleInsertBuffer = "";
    this.isSimpleInsert = true;

    this.displayBuffer = new Array(this.windowSize.width);
    for (var i = 0; i < this.windowSize.width; i++) {
        this.displayBuffer[i] = new Array(this.windowSize.height);
    }
    this.lineWrap = new Array(this.windowSize.height);

    webvi_fillDisplayBuffer(this);
}


/*******************************************************************************
 * webvi_bootstrap...
 *
 * This function adds the init function to the documents onload handler so that
 * init can run after the page has finished loading to replace all textareas
 * with the class "webvi" with a groovy new text area.
 *
 * @params none
 * @return none
 ******************************************************************************/
function webvi_bootstrap() {
    window.onload = webvi_init;
}

/*******************************************************************************
 * webvi_renderCanvas...
 *
 * This function will render the vi interface to the canvas
 *
 * @param canvas - the canvas to draw to
 * @param text - the contents of the text buffer
 ******************************************************************************/
function webvi_renderCanvas(state) {
    context = state.canvasNode.getContext('2d');
    context.fillStyle = state.options["borderColor"];
    context.fillRect(0, 0, state.canvasNode.width, state.canvasNode.height);
    context.fillStyle = state.options["backgroundColor"];
    context.fillRect(state.options["borderWidth"], state.options["borderWidth"], state.canvasNode.width-(state.options["borderWidth"] * 2), state.canvasNode.height-(state.options["borderWidth"] * 2));
    context.font = state.options["font"];
    context.fillStyle = state.options["textColor"];

    for (var y = 0; y < state.windowSize.height; y++) {
        for (var x = 0; x < state.windowSize.width; x++) {
            if (x == state.displayCursorPosition.x && y == state.displayCursorPosition.y && state.mode != webvi_COMMANDMODE) {
                // draw the cursor with the text inverted
                if (state.displayBuffer[x][y] == '\n') {
                    context.fillStyle = state.options["eolCursorColor"];
                } else if (state.mode == webvi_VISUALMODE) {
                    context.fillStyle = state.options["visualCursorColor"];
                } else if (state.mode == webvi_EDITMODE) {
                    context.fillStyle = state.options["editCursorColor"];
                }
                context.fillRect(state.characterSize.width * x + state.options["borderWidth"] + state.options["paddingWidth"],
                                    state.characterSize.height * y + state.options["borderWidth"] + state.options["paddingWidth"] + 4,
                                    state.characterSize.width,
                                     state.characterSize.height);
                context.fillStyle = state.options["backgroundColor"];
                context.fillText(state.displayBuffer[x][y], state.characterSize.width * x + state.options["borderWidth"] + state.options["paddingWidth"], state.characterSize.height * (y + 1) + state.options["borderWidth"] + state.options["paddingWidth"]);
                context.fillStyle = state.options["textColor"];
            } else {
                context.fillText(state.displayBuffer[x][y], state.characterSize.width * x + state.options["borderWidth"] + state.options["paddingWidth"], state.characterSize.height * (y + 1) + state.options["borderWidth"] + state.options["paddingWidth"]);
            }
        }
        // draw a wrap indicator at the end of a line to indicate wrapping.
        if (state.lineWrap[y] == true) {
            context.strokeStyle = state.options["lineWrapColor"];
            context.lineWidth = state.options["borderWidth"];
            context.beginPath();
            context.moveTo(state.canvasNode.width - (state.options["borderWidth"]/2), state.characterSize.height * (y) + state.options["borderWidth"] + state.options["paddingWidth"] + 4);
            context.lineTo(state.canvasNode.width - (state.options["borderWidth"]/2), state.characterSize.height * (y + 1) + state.options["borderWidth"] + state.options["paddingWidth"] + 1);
            context.stroke();
        }
    }

    // draw the status message
    context.fillStyle = state.options["statusBackgroundColor"];
    context.fillRect(state.options["borderWidth"], state.canvasNode.height - state.options["borderWidth"] - state.characterSize.height, state.canvasNode.width-(state.options["borderWidth"] * 2), state.characterSize.height);
    context.fillStyle = state.options["statusTextColor"];
    if (state.mode == webvi_COMMANDMODE) {
        context.fillText(state.commandBuffer, state.options["borderWidth"] + state.options["paddingWidth"], state.canvasNode.height - state.options["borderWidth"] - state.options["paddingWidth"]);
    } else {
        context.fillText(state.statusText, state.options["borderWidth"] + state.options["paddingWidth"], state.canvasNode.height - state.options["borderWidth"] - state.options["paddingWidth"]);
    }
}

/*******************************************************************************
 * webvi_createCanvasFromTextarea...
 *
 * This function will create a new canvas dom node for drawing a vi canvas.
 *
 * @params textareaNode - dom textarea node
 * @return canvas - the new canvas
 ******************************************************************************/
function webvi_createCanvasFromTextarea(textareaNode) {
    canvasNode = document.createElement("canvas");

    widthAttribute = document.createAttribute("width");
    widthAttribute.nodeValue = textareaNode.clientWidth;
    canvasNode.setAttributeNode(widthAttribute);

    heightAttribute = document.createAttribute("height");
    heightAttribute.nodeValue = textareaNode.clientHeight;
    canvasNode.setAttributeNode(heightAttribute);

    tabIndexAttribute = document.createAttribute("tabindex");
    tabIndexAttribute.nodeValue = 0;
    canvasNode.setAttributeNode(tabIndexAttribute);

    return canvasNode;
}



/*******************************************************************************
 * webvi_createHiddenInputFromTextarea...
 *
 * This function will create a new html dom node for a hidden input
 * based on an existing textarea. The new dom node will have the same
 * name id and value as the textarea.
 *
 * @params textareaNode - dom textarea node
 * @return hiddenInputNode - the new hidden input
 ******************************************************************************/
function webvi_createHiddenInputFromTextarea(textareaNode) {
    hiddenInput = document.createElement("input");

    typeAttribute = document.createAttribute("type");
    typeAttribute.nodeValue = "hidden";
    hiddenInput.setAttributeNode(typeAttribute);

    textareaName = textareaNode.getAttribute("name");
    nameAttribute = document.createAttribute("name");
    nameAttribute.nodeValue = textareaName;
    hiddenInput.setAttributeNode(nameAttribute);

    textareaId = textareaNode.getAttribute("id");
    idAttribute = document.createAttribute("id");
    idAttribute.nodeValue = textareaId;
    hiddenInput.setAttributeNode(idAttribute);

    textareaValue = textareaNode.value;
    valueAttribute = document.createAttribute("value");
    valueAttribute.nodeValue = textareaValue;
    hiddenInput.setAttributeNode(valueAttribute);

    return hiddenInput;
}



/*******************************************************************************
 * webvi_init...
 *
 * This function gets all text area elements with a class of webvi and
 * replaces them with a hidden field and a canvas to allow vi editing
 *
 * @params none
 * @return none
 ******************************************************************************/
function webvi_init(elementid) {
    textareaNode = document.getElementById(elementid);
    hiddenInput = webvi_createHiddenInputFromTextarea(textareaNode);
    canvas = webvi_createCanvasFromTextarea(textareaNode);

    parentEle = textareaNode.parentNode;
    parentEle.replaceChild(canvas, textareaNode);
    parentEle.appendChild(hiddenInput);


    state = new webvi_state(hiddenInput, canvas, textareaNode);
    webvi_stateList.push(state);
    webvi_renderCanvas(state);
    // register a keyboard listener for this canvas
    canvas.addEventListener('keydown', webvi_handleDocumentKeyboardInput, false);

}
M.editor_webvi = M.editor_webvi || {

    init : function(elementid) {
        Y.log(elementid);
        webvi_init(elementid);
    },


};



}, '@VERSION@', {"requires": ["node"]});
