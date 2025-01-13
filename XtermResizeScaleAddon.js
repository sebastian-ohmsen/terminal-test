//@ts-check
// eslint-disable-next-line no-unused-vars
import { Terminal } from '@xterm/xterm';


/**
 * The border used as handle for the resize element
 * @type {number}
 */
const borderWidth = 4;


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
    resizeWrapper.style.setProperty('overflow', 'hidden');
    element.parentElement?.insertBefore(resizeWrapper, element);
    resizeWrapper.appendChild(element);
    return resizeWrapper;
};

const calculateMinWidth = function calculateMinWidth(fontsize) {
    
};

/**
 * Addon for xterm that adds resize functionality that keeps the col and row 
 * count but scales the font size in order to use the available size best.
 */
function XtermResizeScaleAddon(minWidth, maxWidth) {
    /** @type {Terminal | undefined} */
    this.terminal = undefined;

    /**
     * The minimal width of the terminal
     * @type {number}
     */
    this.minWidth = minWidth;

    /**
     * The maximal width of the terminal
     * @type {number}
     */
    this.maxWidth = maxWidth;

        /**
     * Used to register functions to remove registered events on dispose
     * @type {Function[]}
     */
        this._onDispose = [];
    this._onDispose = [];
}

/**
 * Use the addon on the given terminal
 *
 * @param {Terminal} terminal
 *      The terminal instance
 */
XtermResizeScaleAddon.prototype.activate = function activate(terminal) {
    if (terminal && terminal.element) {
        this.terminal = terminal;
        let wrapper = createResizeWrapper(terminal.element);

        let addon = this;
        let resizeStarted = false;
        let inResize = false;

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
         * Calculates the new dimensions of the target based on the actual mouse
         * position.
         *
         * @param {number} mouseX
         *      Horizontal position of the mouse in regard to the browser window
         */
        const calculateNewDimensions = function (mouseX) {
            if (!resizeStarted) {
                return;
            }
            if (!inResize) {
                inResize = true;
            }

            let boundingRect = wrapper.getBoundingClientRect();
            let normWidth = mouseX - boundingRect.left;

            setWidth(
                Math.min(
                    addon.maxWidth,
                    Math.max(normWidth, addon.minWidth)
                )
            );
        };

        let mouseDownHandler = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            resizeStarted = rightEdgeHit(ev.clientX, ev.clientY);
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
                // calculate and set new font size
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
                } 
                else {
                    if (wrapper.parentElement) {
                        wrapper.parentElement.style.cursor = 'default';
                    }
                }
                return;
            }
            calculateNewDimensions(ev.clientX);
        };

        wrapper.ownerDocument.addEventListener('mousemove', mouseMoveHandler);

        addon._onDispose.push(() => {
            wrapper.ownerDocument.removeEventListener(
                'mousemove',
                mouseMoveHandler
            );
        });
    }
}

/**
 * Clean up and release all resources
 */
XtermResizeScaleAddon.prototype.dispose = function dispose() {
    this._onDispose.forEach(fn => fn());
};

export { XtermResizeScaleAddon };