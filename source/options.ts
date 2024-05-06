export type Options = {
    /**
     * A selector or array of selectors to nodes that will not be included in the output.
     */
    ignore: string[],
    bodyCallback: (body: HTMLBodyElement) => HTMLBodyElement
}

export const defaults = {
    ignore: [],
    bodyCallback: (body: HTMLBodyElement) => body
} as const

export const normalize = (options: Partial<Options>): Options =>
    Object.assign({}, defaults, options)
