import {
    chain as chainFluture,
    fork as forkFluture,
    map as mapFluture
} from 'fluture'
import {fromEither as flutureFromEither} from 'fp-ts-fluture/es6/Future'
import {flow} from 'fp-ts/es6/function'
import {pipe} from 'fp-ts/es6/pipeable'

import {cloneBody} from './clone'
import {Container, createContainer} from './container'
import {DetailedError} from './error'
import {
    ErrorStack,
    fromErrors as errorStackFromErrors
} from './error-stack'
import {
    containerToPngBlob,
    containerToPngDataURL,
    containerToSVGBlob,
    createObjectURL
} from './export'
import {Fluture} from './future'
import {inlineExternalResources} from './inline'
import {
    Options,
    defaults as defaultOptions_,
    normalize as normalizeOptions
} from './options'

export const defaultOptions = defaultOptions_

const generateExport = (
    $window: Window,
    $element: Element,
    options: Options
): Fluture<DetailedError, ErrorStack<Container>> =>
    pipe(
        // Create container where we'll store extracted
        // information about the window (which could fail) in
        createContainer($window, $element),

        flutureFromEither,

        // Clone existing window data into a container,
        // including filling out <input>'s, copying <canvas>
        // elements, etc.  mapEither(cloneBody),
        mapFluture(cloneBody($element, options.ignore, options.bodyCallback)),

        // Inline external stylesheets, images, fonts as data
        // URL's inside of the copied tree
        chainFluture(inlineExternalResources)
    )

export const objectURLFluture = (
    $element: Element,
    options: Options
): Fluture<DetailedError, ErrorStack<string>> =>
    pipe(
        generateExport(window, $element, options),

        // Export tree into a png object URL and return it
        // together with all accumulated errors
        chainFluture(({value: container, errors}) =>
            pipe(
                containerToPngBlob(container),
                chainFluture(
                    flow(createObjectURL, flutureFromEither)
                ),
                mapFluture(objectURL =>
                    errorStackFromErrors(objectURL)(errors)
                )
            )
        )
    )

export const svgObjectURLFluture = (
    $element: Element,
    options: Options
): Fluture<DetailedError, ErrorStack<string>> =>
    pipe(
        generateExport(window, $element, options),

        // Export tree into a object URL containing SVG data and
        // return it together with all accumulated errors
        chainFluture(({value: container, errors}) =>
            pipe(
                containerToSVGBlob(container),
                chainFluture(
                    flow(createObjectURL, flutureFromEither)
                ),
                mapFluture(objectURL =>
                    errorStackFromErrors(objectURL)(errors)
                )
            )
        )
    )

export const dataURLFluture = (
    $element: Element,
    options: Options
): Fluture<DetailedError, ErrorStack<string>> =>
    pipe(
        generateExport(window, $element, options),

        // Export tree into a png object URL and return it
        // together with all accumulated errors
        chainFluture(({value: container, errors}) =>
            pipe(
                containerToPngDataURL(container),
                mapFluture(objectURL =>
                    errorStackFromErrors(objectURL)(errors)
                )
            )
        )
    )

const promisifyExport = <T>(
    fn: (
        $element: Element,
        options: Options
    ) => Fluture<DetailedError, ErrorStack<T>>
) => (
    $element: Element,
    partialOptions: Partial<Options> = {}
): Promise<ErrorStack<T>> => {
    return new Promise((res, rej) =>
        pipe(
            fn($element, normalizeOptions(partialOptions)),
            forkFluture<DetailedError>(x => rej(x.error))(res)
        )
    )
}

export const objectURL = promisifyExport(objectURLFluture)
export const svgObjectURL = promisifyExport(svgObjectURLFluture)
export const dataURL = promisifyExport(dataURLFluture)
