//@ts-check
import './index.scss';
import { Terminal } from '@xterm/xterm';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import ansi from 'ansi-escape-sequences';

const containerId = 'terminal';

document.addEventListener('DOMContentLoaded', () => {

    const terminalOptions = {
        cols: 80,
        rows: 32,
        /** @type import("@xterm/xterm").LogLevel */
        logLevel: 'info'
    };

    
    const terminalInstance = new Terminal(terminalOptions);
    
    /**
     * Calculates the position of the cursor. Check if the cursor is located
     * on the start of a row but not in the first row (0).
     * 
     * @returns {boolean}
     *      True the cursor is not positioned in the first row but at the start 
     *      of a row; false otherwise
     */
    function isStartOfRowExceptFirstRow() {
        return terminalInstance.buffer.active.cursorX === 0 &&
            terminalInstance.buffer.active.cursorY > 0;
    }
       

    /**
     * Calculates if the cursor is positioned in a row that contains
     * wrapped input.
     * 
     * @returns {boolean}
     *      True if the current input line is wrapped, false otherwise
     */
    function inputIsWrapped() {
        return terminalInstance.buffer.active.getLine(
            terminalInstance.buffer.active.cursorY)?.isWrapped ?? false;
    } 
    
    /**
     * Calculates if the cursor is positioned in end of the line
     * 
     * @returns {boolean}
     *      True if cursor is positioned on the end, false otherwise
     */
    function cursorIsEndOfLine() {
        return terminalInstance.cols === terminalInstance.buffer.active.cursorX;
    }
        

    /**
     * Calculates if each column in the row contains a character.
     * 
     * @returns {boolean}
     *      True if each column contains a character, false otherwise
     */
    function eachColumnInTheRowIsOccupied() {
        return terminalInstance.buffer.active.getLine(
            terminalInstance.buffer.active.cursorY)?.length ===
            terminalInstance.cols;
    }
       
    /**
     * Deletes the character above the cursor.
     */
    function deleteCharacter() {
        terminalInstance.write('\x1B[1P');
    }
    
    terminalInstance.onData(data => {
        switch (data) {
            case '\r': // enter
                terminalInstance.writeln('');
                break;
            case '\u007F': // backspace
                if ((isStartOfRowExceptFirstRow() && inputIsWrapped())) {
                    
                    let curLine = terminalInstance.buffer.active.getLine(
                        terminalInstance.buffer.active.cursorY);
                    
                    if (curLine) {
                        terminalInstance.write(ansi.cursor.previousLine()
                            + ansi.cursor.forward(curLine?.length))
                        deleteCharacter();
                    }   
                }
                else if ((cursorIsEndOfLine() &&
                    eachColumnInTheRowIsOccupied())) {
                        deleteCharacter();
                    }
                else {
                    terminalInstance.write('\b \b');
                }
                break;
            case '\x1B[A': // arrow up
                terminalInstance.write('\u001B[1A');
                break;
            case '\x1B[B': // arrow down
                terminalInstance.write('\u001B[1B');
                break;
            case '\x1B[C': // arrow right
                terminalInstance.write('\u001B[1C');
                break;
            case '\x1B[D': // arrow left
                terminalInstance.write('\u001B[1D');
                break;
            case '\x1B[3~': // delete
                terminalInstance.write('\x1B[1P');
                break;
            default:
                if (data >= String.fromCharCode(0x20) &&
                    data <= String.fromCharCode(0x7E) ||
                    data >= '\u00a0') { // write visible character to terminal
                    terminalInstance.write(data);
                }
        }
    });

    let containerElement = document.getElementById(containerId);
    let webglRenderer;
    let canvasRenderer;

    const setupWebGlRenderer = () => {
        if (!terminalInstance?.element || webglRenderer) {
            return;
        }
        console.log('initiate Webgl renderer');
        webglRenderer = new WebglAddon(true);
        disposeCanvasRenderer();
        try {
            console.log('load addon');
            terminalInstance.loadAddon(webglRenderer);
            webglRenderer.onContextLoss(() => {
                disposeWebglRenderer();
            });
            console.log('..done');
        }
        catch {
            disposeWebglRenderer();
            setupCanvasRenderer();
        }
    };

    const setupCanvasRenderer = () => {
        if (!terminalInstance?.element || canvasRenderer) {
            return;
        }

        canvasRenderer = new CanvasAddon();
        disposeWebglRenderer();
        try {
            terminalInstance.loadAddon(canvasRenderer);
        }
        catch {
            disposeCanvasRenderer();
        }
    };

    const disposeWebglRenderer = () => {
        try {
            webglRenderer?.dispose();
        }
        catch {
            //ignore
        }
        webglRenderer = undefined;
    };

    const disposeCanvasRenderer = () => {
        try {
            canvasRenderer?.dispose();
        }
        catch {
            //ignore
        }
        canvasRenderer = undefined;
    };

    if (containerElement) {
        terminalInstance.open(containerElement);
        setupWebGlRenderer();    
        console.log('terminal initiated');
    }
    else {
        console.log('unable to initiate terminal - no container element found');
    }
});