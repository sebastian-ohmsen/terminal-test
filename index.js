//@ts-check
import './index.scss';
import { Terminal } from '@xterm/xterm';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import ansi from 'ansi-escape-sequences';

const containerId = 'terminal';

document.addEventListener('DOMContentLoaded', () => {

    const terminalOptions = {
        cols: 20,
        rows: 10,
        /** @type import("@xterm/xterm").LogLevel */
        logLevel: 'info'
    };

    
    const terminalInstance = new Terminal(terminalOptions);
    
    /**
     * Calculates the position of the cursor. Check if the cursor is located
     * on the start of a row that contains wrapped content from the
     * row above.
     * 
     * @returns {boolean}
     *      True if all cursor position meets the following criteria: 
     *          not first row, cursor position on start of the row and 
     *          content from previous row is wrapped;
     *      False otherwise
     */
    const isStartOfRowAndWrappedFromPreviousLine = () => 
        terminalInstance.buffer.active.cursorX === 0 &&
        terminalInstance.buffer.active.cursorY > 0 &&
        (terminalInstance.buffer.active.getLine(
            terminalInstance.buffer.active.cursorY)?.isWrapped??false);

    terminalInstance.onData(data => {
        switch (data) {
            case '\r': // enter
                terminalInstance.writeln('');
                break;
            case '\u007F': // backspace
                if (isStartOfRowAndWrappedFromPreviousLine()
                ) {
                    let curLine = terminalInstance.buffer.active.getLine(
                        terminalInstance.buffer.active.cursorY);
                    if (curLine) {
                        terminalInstance.write(ansi.cursor.previousLine()
                            + ansi.cursor.forward(curLine?.length))
                        terminalInstance.write('\x1B[1P');
                    }   
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