/**
 * The base error class for all Nexus exceptions.
 * 
 * @export
 * @class NexusError
 * @extends {Error}
 */
export class NexusError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        // Set the prototype explicitly to support `instanceof` checks.
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Thrown when an operation is performed on a component that hasn't been initialized.
 * 
 * @export
 * @class NotInitializedError
 * @extends {NexusError}
 */
export class NotInitializedError extends NexusError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when a component that is only meant to be initialized once is initialized multiple times.
 * 
 * @export
 * @class AlreadyInitializedError
 * @extends {NexusError}
 */
export class AlreadyInitializedError extends NexusError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when trying to register a service that is already registered.
 * 
 * @export
 * @class ServiceAlreadyRegisteredError
 * @extends {NexusError}
 */
export class ServiceAlreadyRegisteredError extends NexusError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when trying to get a service that hasn't been registered.
 * 
 * @export
 * @class ServiceNotFoundError
 * @extends {NexusError}
 */
export class ServiceNotFoundError extends NexusError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when a null, undefined, or otherwise invalid argument is passed to a method.
 * 
 * @export
 * @class InvalidArgumentError
 * @extends {NexusError}
 */
export class InvalidArgumentError extends NexusError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when a `Layer` that is already present in the `LayerStack` is pushed again.
 * 
 * @export
 * @class DuplicateLayerError
 * @extends {NexusError}
 */
export class DuplicateLayerError extends NexusError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when an operation targets a `Layer` that is not present in the `LayerStack`.
 * 
 * @export
 * @class LayerNotFoundError
 * @extends {NexusError}
 */
export class LayerNotFoundError extends NexusError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when one or more `Service` instances fail during the shutdown sequence.
 * 
 * @export
 * @class ServiceShutdownError
 * @extends {NexusError}
 */
export class ServiceShutdownError extends NexusError {
    constructor(message: string) {
        super(message);
    }
}
