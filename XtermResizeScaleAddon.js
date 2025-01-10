//@ts-check
// eslint-disable-next-line no-unused-vars
import { Terminal } from '@xterm/xterm';

/**
 * Addon for xterm that adds resize functionality that keeps the col and row 
 * count but scales the font size in order to use the available size best.
 */
function XtermResizeScaleAddon() {
    /** @type {Terminal | undefined} */
    this.terminal = undefined;
}

/**
 * Use the addon on the given terminal
 *
 * @param {Terminal} terminal
 *      The terminal instance
 */
XtermResizeScaleAddon.prototype.activate = function activate(terminal) {
    this.terminal = terminal;
}

export { XtermResizeScaleAddon };