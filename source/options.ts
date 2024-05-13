export type Options = {
    /**
     * A selector or array of selectors to nodes that will not be included in the output.
     */
    ignore: string[],
    /**
     * A callback that allows you to modify the body of the cloned document.
     */
    bodyCallback: (clonedBody: HTMLBodyElement, clonedElement: Element) => HTMLBodyElement
}

export const defaults = {
    ignore: [],
    bodyCallback: (clonedBody: HTMLBodyElement, _clonedElement: Element) => clonedBody
} as const

export const normalize = (options: Partial<Options>): Options =>
    Object.assign({}, defaults, options)
