//@ts-check
// eslint-disable-next-line no-unused-vars
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

/**
 * The border used as handle for the resize element
 * @type {number}
 */
const borderWidth = 4;

/**
 * Adds the options to resize the terminal horizontally as well as vertically
 * and uses xterm's fit addon to match the terminal size.
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

    /**
     * Used to register functions to remove registered events on dispose
     * @type {Function[]}
     */
    this._onDispose = [];

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
}

/**
 * Creates a wrapper HTMLDivElement around the terminal element
 *
 * @param {HTMLElement} element
 *      The terminal element
 */
const createResizeWrapper = function createResizeWrapper(element) {
    let resizeWrapper = document.createElement('div');
    resizeWrapper.id = 'resizeWrapper';
    resizeWrapper.style.setProperty('position', 'absolute');
    resizeWrapper.style.setProperty(
        'border-right',
        `${borderWidth}px solid lightgray`
    );
    resizeWrapper.style.setProperty(
        'border-bottom',
        `${borderWidth}px solid lightgray`
    );
    resizeWrapper.style.setProperty('overflow', 'hidden');
    element.parentElement?.insertBefore(resizeWrapper, element);
    resizeWrapper.appendChild(element);
    return resizeWrapper;
};

/**
 * Removes the resize wrapper element around the terminal
 * 
 * @param {HTMLDivElement} wrapper 
 *      The wrapper element
 */
const removeResizeWrapper = function removeResizeWrapper(wrapper) {
    // we assume that the terminal is always the first element of the wrapper
    let terminalElement = wrapper.children[0];
    wrapper.parentNode?.insertBefore(terminalElement, wrapper);
    wrapper.remove();
};
 

/**
 * Use the addon on the given terminal
 *
 * @param {Terminal} terminal
 *      The terminal instance
 */
XTermResizeFitAddon.prototype.activate = function activate(terminal) {
    if (terminal && terminal.element) {
        this.terminal = terminal;
        let fitAddon = new FitAddon();

        let wrapper = createResizeWrapper(terminal.element);

        let addon = this;
        let resizeStarted = false;
        let inResize = false;
        let edge = {
            right: false,
            bottom: false
        };

        /**
         * Calculates if the mouse is positioned over or near the right edge of
         * the wrapper element
         *
         * @param {number} mousePosX
         *      Horizontal position of the mouse in regard to the browser window
         * @param {number} mousePosY
         *      Vertical position of the mouse in regard to the browser window
         * @returns {boolean}
         *      True if the mouse is positioned over or near the right edge,
         *      false otherwise
         */
        const rightEdgeHit = (mousePosX, mousePosY) => {
            let boundingRect = wrapper.getBoundingClientRect();
            let normX = mousePosX - boundingRect.left;
            let normY = mousePosY - boundingRect.top;
            return (
                normX >= boundingRect.width - borderWidth &&
                normX <= boundingRect.width &&
                normY <= boundingRect.height
            );
        };

        /**
         * Calculates if the mouse is positioned over or near the bottom edge of
         * the wrapper element
         *
         * @param {number} mousePosX
         *      Horizontal position of the mouse in regard to the browser window
         * @param {number} mousePosY
         *      Vertical position of the mouse in regard to the browser window
         * @returns {boolean}
         *      True if the mouse id over or near the bottom edge, false otherwise
         */
        const bottomEdgeHit = (mousePosX, mousePosY) => {
            let boundingRect = wrapper.getBoundingClientRect();
            let normX = mousePosX - boundingRect.left;
            let normY = mousePosY - boundingRect.top;
            return (
                normY >= boundingRect.height - borderWidth &&
                normY <= boundingRect.height &&
                normX <= boundingRect.width
            );
        };

        /**
         * Sets the target width and checking that the new width is between the
         * configs minWidth and maxWidth value
         *
         * @param {number} newWidth
         *      New width in pixel
         */
        const setWidth = (newWidth) => {
            wrapper.style.width = `${newWidth <= addon.minWidth
                    ? addon.minWidth
                    : newWidth >= addon.maxWidth
                        ? addon.maxWidth
                        : newWidth
                }px`;
        };

        /**
         * Sets the target height and checking that the new height is between the
         * configs minHeight and maxHeight value
         *
         * @param {number} newHeight
         *      New height in pixel
         */
        const setHeight = (newHeight) => {
            wrapper.style.height = `${newHeight <= addon.minHeight
                    ? addon.minHeight
                    : newHeight >= addon.maxHeight
                        ? addon.maxHeight
                        : newHeight
                }px`;
        };

        /**
         * Calculates the new dimensions of the target based on the actual mouse
         * position.
         *
         * @param {number} mouseX
         *      Horizontal position of the mouse in regard to the browser window
         * @param {number} mouseY
         *      Vertical position of the mouse in regard to the browser window
         */
        const calculateNewDimensions = function (mouseX, mouseY) {
            if (!resizeStarted) {
                return;
            }
            if (!inResize) {
                inResize = true;
            }

            let boundingRect = wrapper.getBoundingClientRect();

            let normWidth = mouseX - boundingRect.left;
            let normHeight = mouseY - boundingRect.top;

            if (edge.right) {
                setWidth(
                    Math.min(
                        addon.maxWidth,
                        Math.max(normWidth, addon.minWidth)
                    )
                );
            }
            if (edge.bottom) {
                setHeight(
                    Math.min(
                        Math.max(normHeight, addon.minHeight),
                        addon.maxHeight
                    )
                );
            }
        };

        let mouseMoveHandler = (ev) => {
            if (!resizeStarted) {
                if (rightEdgeHit(ev.clientX, ev.clientY)) {
                    if (wrapper.parentElement) {
                        wrapper.parentElement.style.setProperty(
                            'cursor',
                            'ew-resize',
                            'important'
                        );
                        // target.parentElement.style.cursor = 'ew-resize';
                    }
                } else if (bottomEdgeHit(ev.clientX, ev.clientY)) {
                    if (wrapper.parentElement) {
                        wrapper.parentElement.style.setProperty(
                            'cursor',
                            'ns-resize',
                            'important'
                        );
                        // target.parentElement.style.cursor = 'ns-resize';
                    }
                } else {
                    if (wrapper.parentElement) {
                        wrapper.parentElement.style.cursor = 'default';
                    }
                }
                return;
            }
            calculateNewDimensions(ev.clientX, ev.clientY);
        };

        wrapper.ownerDocument.addEventListener('mousemove', mouseMoveHandler);

        addon._onDispose.push(() => {
            wrapper.ownerDocument.removeEventListener(
                'mousemove',
                mouseMoveHandler
            );
        });

        let mouseDownHandler = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            edge.right = rightEdgeHit(ev.clientX, ev.clientY);
            edge.bottom = bottomEdgeHit(ev.clientX, ev.clientY);
            if (edge.right || edge.bottom) {
                resizeStarted = true;
            }
        };

        wrapper.ownerDocument.addEventListener('mousedown', mouseDownHandler);

        addon._onDispose.push(() => {
            wrapper.ownerDocument.removeEventListener(
                'mousedown',
                mouseDownHandler
            );
        });

        let mouseUpHandler = () => {
            if (resizeStarted) {
                fitAddon.fit();
            }
            resizeStarted = false;
            inResize = false;
        };

        wrapper.ownerDocument.addEventListener('mouseup', mouseUpHandler);

        addon._onDispose.push(() => {
            wrapper.ownerDocument.removeEventListener(
                'mouseup',
                mouseUpHandler
            );
        });

        terminal.loadAddon(fitAddon);
        addon._onDispose.push(() => {
            fitAddon.dispose();
        });

        this._onDispose.push(() => removeResizeWrapper(wrapper));
    }
};

/**
 * Clean up and release all resources
 */
XTermResizeFitAddon.prototype.dispose = function dispose() {
    this._onDispose.forEach(fn => fn());
};

export { XTermResizeFitAddon };