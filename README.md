# Simple Terminal Test

Project to test [Xterm.js](https://xtermjs.org/) functionality especially the 
reflow behavior and the delete function with wrapped text input.

## Add-on

There are two Add-ons for Xterm.js that implement different strategies to 
fit the terminal content to the available space.

### Resize-Fit Add-on

This [Add-on](./XtermResizeFitAddon.js) extends the 
[fit Add-on](https://www.npmjs.com/package/@xterm/addon-fit) with a resize 
functionality. It extends or shrinks the number of terminal columns and rows 
according to the available space and set font size.

### Resize-Scale Add-on

This [Add-on](./XtermResizeScaleAddon.js) adds resize functionality to the 
terminal. It implements font scaling to fit the terminal content in the 
available space. The column and row count is not changed.

## Run the project

The project uses [Vite](https://vite.dev/) as build tool. Please type `npx vite`
 to start the project. 
