// Mark <canvas>, <input> and <textarea> elements with
// unique id's so that their state can be later copied into
// a clone

import {Container} from './container'

const PICO_CLONE_ID_KEY = 'picocloneid'

const id = () =>
    Math.random()
        .toString(32)
        .substring(2)

function isHTMLElement(
    element: Element
): element is HTMLElement {
    return element instanceof HTMLElement
}

// Even though this function uses `querySelectorAll('*')` it's relatively
// fast - on a page with 25k nodes (youtube) it executes in 10-15ms
const getScrolledElements = (
    $target: HTMLElement
): HTMLElement[] =>
    Array.from($target.querySelectorAll('*'))
        .filter(
            $el => $el.scrollTop !== 0 || $el.scrollLeft !== 0
        )
        .filter(isHTMLElement)

const attachCloneID = ($target: HTMLElement) => {
    for (const $element of [
        ...$target.querySelectorAll('input'),
        ...$target.querySelectorAll('textarea'),
        ...$target.querySelectorAll('canvas'),
        ...getScrolledElements($target)
    ]) {
        $element.dataset[PICO_CLONE_ID_KEY] = id()
    }
}

const removeCloneID = ($target: HTMLElement) => {
    for (const $element of $target.querySelectorAll(
        `[data-${PICO_CLONE_ID_KEY}]`
    )) {
        if (!($element instanceof HTMLElement)) {
            console.warn(
                'Element that had a pico clone id attached was not an HTMLElement during cleanup',
                $element
            )

            continue
        }

        $element.removeAttribute(`data-${PICO_CLONE_ID_KEY}`)
    }
}

const cloneCanvases = (container: Container) => {
    for (const $clonedCanvas of container.tree.html.querySelectorAll(
        'canvas'
    )) {
        const cloneId = $clonedCanvas.dataset[PICO_CLONE_ID_KEY]
        if (cloneId === undefined) {
            console.warn(
                'Failed to get clone id from cloned canvas',
                $clonedCanvas
            )

            continue
        }

        const $originalCanvas = Array.from(
            container.parentWindow.document.querySelectorAll(
                'canvas'
            )
        ).find(
            $original =>
                $original.dataset[PICO_CLONE_ID_KEY] === cloneId
        )

        if ($originalCanvas === undefined) {
            console.warn(
                'Failed to find original canvas for cloned canvas',
                $clonedCanvas
            )

            continue
        }

        const $replacementImg = container.parentWindow.document.createElement(
            'img'
        )

        // Since we're changing the element's name the "canvas"
        // will be untargetable by css, therefore we need to
        // clone all the style properties over manually in this
        // particular case.
        $replacementImg.style.cssText = container.parentWindow.window.getComputedStyle(
            $originalCanvas
        ).cssText

        $replacementImg.src = $originalCanvas.toDataURL()

        const parent = $clonedCanvas.parentNode

        if (!parent) {
            console.warn(
                'Failed to get parent of node',
                $clonedCanvas
            )

            continue
        }

        parent.replaceChild($replacementImg, $clonedCanvas)
    }

    return container
}

// Input values set by JS don't get copied when performing a recursive
// `Node.cloneNode`, we need to set the attributes ourselves.
const cloneInputs = (container: Container) => {
    for (const $clonedInputOrTextarea of [
        ...container.tree.html.querySelectorAll('input'),
        ...container.tree.html.querySelectorAll('textarea')
    ]) {
        const cloneId =
            $clonedInputOrTextarea.dataset[PICO_CLONE_ID_KEY]

        if (cloneId === undefined) {
            console.warn(
                'Failed to get clone id from cloned input or textarea',
                $clonedInputOrTextarea
            )

            continue
        }

        const $originalInputOrTextarea = [
            ...container.parentWindow.document.querySelectorAll(
                'input'
            ),
            ...container.parentWindow.document.querySelectorAll(
                'textarea'
            )
        ].find(
            $original =>
                $original.dataset[PICO_CLONE_ID_KEY] === cloneId
        )

        if ($originalInputOrTextarea === undefined) {
            console.warn(
                'Failed to find original input or textarea for cloned input or textarea',
                $clonedInputOrTextarea
            )

            continue
        }

        if (
            $originalInputOrTextarea instanceof
            HTMLInputElement &&
            $clonedInputOrTextarea instanceof HTMLInputElement
        ) {
            if (
                ($clonedInputOrTextarea.type === 'checkbox' ||
                    $clonedInputOrTextarea.type === 'radio') &&
                $originalInputOrTextarea.checked
            ) {
                // <input type="checkbox | radio" />
                $clonedInputOrTextarea.setAttribute(
                    'checked',
                    'checked'
                )
            } else if (
                // <input type="number | text | range" />
                ['number', 'text', 'range'].indexOf(
                    $clonedInputOrTextarea.type
                ) !== -1
            ) {
                $clonedInputOrTextarea.setAttribute(
                    'value',
                    $originalInputOrTextarea.value
                )
            }
        } else if (
            $originalInputOrTextarea instanceof
            HTMLTextAreaElement &&
            $clonedInputOrTextarea instanceof HTMLTextAreaElement
        ) {
            // <textarea>
            const contents = container.parentWindow.document.createTextNode(
                $originalInputOrTextarea.value
            )

            $clonedInputOrTextarea.innerHTML = ''
            $clonedInputOrTextarea.appendChild(contents)
        }
    }

    return container
}


const removeNodesMatchingSelectors = (selectors: string[]) => (
    $node: Node
) => {
    if ($node instanceof Element) {
        selectors.forEach(selector => {
            for (const $child of $node.querySelectorAll(
                selector
            )) {
                $child.remove()
            }
        })
    }
}

// (ugly)
export const cloneBody = ($element: Element,
                          ignoredSelectors: string[],
                          bodyCallback: (clonedBody: HTMLBodyElement, clonedElement: Element) => HTMLBodyElement) => (
    container: Container
): Container => {
    attachCloneID(container.parentWindow.html)

    container.tree.html.className =
        container.parentWindow.html.className

    container.tree.html.style.cssText =
        container.parentWindow.html.style.cssText

    // Fix for `rem` units
    container.tree.svg.style.fontSize = container.parentWindow.window.getComputedStyle(
        container.parentWindow.html
    ).fontSize

    const $clonedBody = bodyCallback(container.parentWindow.body.cloneNode(
        true
    ) as HTMLBodyElement, $element.cloneNode(true) as Element);


    removeNodesMatchingSelectors(ignoredSelectors)($clonedBody)

    container.tree.html.appendChild($clonedBody)
    cloneInputs(container)
    cloneCanvases(container)
    // cloneScrolls(container)

    if ($clonedBody instanceof HTMLBodyElement) {
        container.tree.html.style.margin = '0'
    }

    removeCloneID(container.parentWindow.html)

    return container
}
