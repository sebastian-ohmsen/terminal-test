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

/**
 * Calculates the width of a font for a given font size and family
 *
 * @param {number} fontsize
 *      The font size
 * @param {string} fontFamily
 *      Font family used for the calculation
 * @returns {number}
 *      The width in pixel
 */
const calculateFontWidth = function calculateMinWidth(fontsize, fontFamily) {
    const canvas = new OffscreenCanvas(100, 100);
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.font = `${fontsize}px ${fontFamily}`;
        const metrics = ctx.measureText('M');
        if (!('width' in metrics)) {
            throw new Error('Required font metrics not supported');
        }
        console.log(metrics);
        return metrics.width;
    }
    throw new Error('Unable to use offscreen canvas for calculation');
};

/**
 * Calculate the minimal width of the terminal for a given font-size
 *
 * @param {Terminal} terminal
 *      The terminal instance
 * @param {number} fontSize
 *      The font size
 * @returns {number}
 *      Width in pixel
 */
const calculateMinWidth = function calculateMinWidth(terminal, fontSize) {
    const fontFamily = terminal.options.fontFamily
        ? terminal.options.fontFamily
        : 'monospace';
    const fontWidth = calculateFontWidth(fontSize, fontFamily);
    const scrollbarWidth = terminal.options.overviewRulerWidth
        ? terminal.options.overviewRulerWidth
        : 0;
    const padding = 0;
    return fontWidth * terminal.cols + scrollbarWidth + padding;
};

/**
 * Addon for xterm that adds resize functionality that keeps the col and row
 * count but scales the font size in order to use the available size best.
 */
function XtermResizeScaleAddon(minFontSize) {
    /** @type {Terminal | undefined} */
    this.terminal = undefined;

    /**
     * The minimum font size that the terminal can scale down to
     * @type {number}
     */
    this.minFontSize = minFontSize;

    /** @type {number} */
    this.minWidth = 0;

    /**
     * Used to register functions to remove registered events on dispose
     * @type {Function[]}
     */
    this._onDispose = [];
}

/**
 * Calculates the current terminal width without left and right padding
 *
 * @param {HTMLElement | undefined} element
 *      The terminal HTML element
 * @returns {number}
 *      Calculated width
 *
 */
const calculateTargetWidth = function calculateTargetWidth(element) {
    if (element) {
        let targetWidth = element.clientWidth;
        targetWidth -= parseFloat(
            window.getComputedStyle(element).getPropertyValue('padding-left')
        );
        targetWidth -= parseFloat(
            window.getComputedStyle(element).getPropertyValue('padding-right')
        );
        return targetWidth;
    }
    throw new Error('Unable to calculate terminal width');
};

/**
 * Calculates the ratio that is used for scaling the font.
 *
 * @param {Terminal} terminal
 *      The Xterm.js terminal instance
 * @returns {number}
 *      Calculated ratio
 */
const calculateScalingRatio = function calculateScalingRatio(terminal) {
    const canvasWidth =
        terminal._core._renderService.dimensions.css.canvas.width;
    let targetWidth = calculateTargetWidth(terminal.element);
    targetWidth -= terminal._core.viewport.scrollBarWidth;
    return targetWidth / canvasWidth;
};

/**
 * Calculates the font size needed to scale the terminal so that it fills
 * the available space best.
 *
 * @param {Terminal} terminal
 *      The Xterm.js terminal instance
 * @returns {number}
 *      The new font size
 */
const calculateFontSize = function calculateFontSize(terminal) {
    const scaleRatio = calculateScalingRatio(terminal);
    return Math.floor(
        (terminal._core._charSizeService.height / window.devicePixelRatio) *
            scaleRatio
    );
};

/**
 * Use the addon on the given terminal
 *
 * @param {Terminal} terminal
 *      The terminal instance
 */
XtermResizeScaleAddon.prototype.activate = function activate(terminal) {
    if (terminal && terminal.element) {
        this.terminal = terminal;
        this.minWidth = calculateMinWidth(terminal, this.minFontSize);
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
            wrapper.style.width = `${
                newWidth <= addon.minWidth ? addon.minWidth : newWidth
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

            setWidth(Math.max(normWidth, addon.minWidth));
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

        let setFontSize = function setFontSize(newSize) {
            console.log(`set font size: ${newSize}`);
            terminal.options.fontSize = newSize;
        };

        let mouseUpHandler = () => {
            if (resizeStarted) {
                let calculatedFontSize = calculateFontSize(terminal);
                if (calculatedFontSize <= addon.minFontSize) {
                    calculatedFontSize = addon.minFontSize;
                }
                setFontSize(calculatedFontSize);
                let newCanvasWidth =
                    terminal._core._renderService.dimensions.css.canvas.width;
                const targetWidth = calculateTargetWidth(
                    terminal.element
                );
                while (newCanvasWidth >= targetWidth) {
                    calculatedFontSize = calculatedFontSize - 1;
                    setFontSize(calculatedFontSize);
                    if (calculatedFontSize < addon.minFontSize) {
                        break;
                    }
                    newCanvasWidth =
                        terminal._core._renderService.dimensions.css.canvas
                            .width;
                }
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
                    }
                } else {
                    if (wrapper.parentElement) {
                        wrapper.parentElement.style.setProperty(
                            'cursor',
                            'default'
                        );
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
};

/**
 * Clean up and release all resources
 */
XtermResizeScaleAddon.prototype.dispose = function dispose() {
    this._onDispose.forEach((fn) => fn());
};

export { XtermResizeScaleAddon };
