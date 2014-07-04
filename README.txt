Canvas based vi clone text editor for Moodle.

QUICK INSTALL
=============
Put this entire directory at:

PATHTOMOODLE/lib/editors/webvi

Visit your site notifications page to install the new plugins.

Enable the new editor type on the page:

Site administration / ► Plugins / ► Text editors / ► Manage editors

Now anyone can choose it in their profile as their default editor.

SUPPORTED COMMANDS
==================
This is not a perfect vi clone by any means - but it does support most of the functions I use, and I find it natural to type in.

Vi primer for the un-enlightened.

Vi is simply the best. It is a purely keyboard based text editor with separate "modes". 

Visual Mode
This is the mode that you will be in when the text editor opens. This mode lets you quickly navigate around your document
and perform commands like copy/paste.

Visual Mode Commands
Arrow keys: Move the cursor
h: Left
j: Down
k: Up
l: Right
w: Move one word right
^: Start of line
$: End of line
G: Move to last line
<number>G: Move to line number
<number>%: Move to <number>% of doc
y<optional number>y: Copy this many lines (default 1)
y<optional number>y: Cut this many lines (default 1)
<optional number>dd: Delete this many lines (default 1)
d<navigation command>: Delete from the current position to the new position
<optional number>x: Delete this many characters (default 1)
<optional number>r<any char>: Replace this many chars with the new char (default 1)
u: undo
<ctrl>r: redo
<optional number>.: repeat the last command this many times
/<string>: Search for string
?<string>: Search backwards for string
m<a-z>: Mark a cursor position
'<a-z>: Move to a saved cursor position
i: Enter edit mode at the current cursor position
a: Enter edit mode after the current cursor position
A: Enter edit mode at the end of the line
I: Enter edit mode at the start of the line
~: Toggle the caps of the current char


Edit Mode
In this mode, anything you type will be added at the current cursor position. The only other command in this mode is 
ESCAPE to return to visual mode.
