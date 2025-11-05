import { Event } from "./Event";
import { Log } from "./Log";

// Define a type for the emit function that will be provided by the Application.
type EventEmitFunction = (event: Event) => void;

/**
 * A static, global `EventBus` for emitting application-wide events.
 * Layers, Services or any other part of the application can use this
 * to send events into the `LayerStack` without needing a direct
 * reference to the `Application` instance.
 * 
 * It acts as a `ServiceLocator` for event emitting.
 *
 * @export
 * @class EventBus
 * @example
 * ```typescript
 * // In a Service or Layer...
 * import { EventBus } from "@prism-dev/nexus";
 * import { UserRegisteredEvent } from "../Events/UserRegisteredEvent";
 *
 * // ...
 * const payload = { userId: '123', username: 'api-user' };
 * const event = new UserRegisteredEvent(payload);
 * EventBus.Emit(event);
 * ```
 */
export class EventBus {
    /**
     * The internal emit function, bound from the `Application` instance.
     *
     * @private
     * @static
     * @type {(EventEmitFunction | null)}
     * @memberof EventBus
     */
    private static emitFunction: EventEmitFunction | null = null;

    /**
     * Initializes the `EventBus`.
     *
     * This method should *only* be called by the `Application` upon startup.
     *
     * @static
     * @param {EventEmitFunction} emitFn The Application's internal `EmitEvent` function.
     * @internal
     * @memberof EventBus
     */
    public static Initialize(emitFn: EventEmitFunction): void {
        Log.Info("EventBus::Initialize - Initializing the EventBus");

        this.emitFunction = emitFn;
    }

    /**
     * Emits an `Event` to the application's `LayerStack`.
     *
     * @static
     * @param {Event} event The `Event` to emit.
     * @returns {void}
     * @throws {Error} If `EventBus` hasn't been initialized.
     * @memberof EventBus
     */
    public static Emit(event: Event): void {
        if (!this.emitFunction) {
            // This is a developer error, so we throw.
            throw new Error(
                "EventBus::Emit - EventBus has not been initialized! " +
                "Did you forget to call 'EventBus.Initialize()'?"
            );
        }

        this.emitFunction(event);
    }
}