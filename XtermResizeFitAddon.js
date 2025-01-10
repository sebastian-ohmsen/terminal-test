//@ts-check
// eslint-disable-next-line no-unused-vars
import { Terminal } from '@xterm/xterm'

/**
 * Adds the options to resize the terminal horizontally as well as vertically
 * and uses the fit addon to match the terminal size.
 * 
 * @param {number} minWidth
 *      The minimal width of the terminal
 * @param {number} minHeight
 *      The minimal height of the terminal 
 * @param {number} maxWidth
 *      The maximal width of the terminal  
 * @param {number} maxHeight
 *      The maximal height of the terminal 
 */
function XTermResizeFitAddon(minWidth, minHeight, maxWidth, maxHeight) {
    /** @type {Terminal | undefined} */
    this.terminal = undefined;

    this._onResizedHandler = [];

    /**
     * The minimal width of the terminal
     * @type {number}
     */
    this.minWidth = minWidth;

    /**
     * The minimal height of the terminal
     * @type {number}
     */
    this.minHeight = minHeight;

    /**
     * The maximal width of the terminal
     * @type {number}
     */
    this.maxWidth = maxWidth;

    /**
     * The maximal height of the terminal
     * @type {number}
     */
    this.maxHeight = maxHeight;

    /**
     * Adds an event handler that is invoked after the terminal was resized.
     * 
     * @param {Function} handler
     *      Invoked after a the resize was finished 
     */
    this.addOnResizedHandler = function addOnResizedHandler(handler) {
        if (handler) {
            if (this._onResizedHandler.indexOf(handler) < 0) {
                this._onResizedHandler.push(handler);
            }
        }
    }
}

/**
 * Use the addon on the given terminal
 * 
 * @param {Terminal} terminal 
 *      The terminal instance
 */
XTermResizeFitAddon.prototype.activate = function activate(terminal) {
    if (terminal) {
        this.terminal = terminal;
    }
}

export {XTermResizeFitAddon}