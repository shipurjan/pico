export type Options = {
    /**
     * A selector or array of selectors to nodes that will not be included in the output.
     */
    ignore: string[],
    bodyCallback: (clonedBody: HTMLBodyElement, clonedElement: Element) => HTMLBodyElement
}

export const defaults = {
    ignore: [],
    bodyCallback: (clonedBody: HTMLBodyElement, clonedElement: Element) => clonedBody
} as const

export const normalize = (options: Partial<Options>): Options =>
    Object.assign({}, defaults, options)
