import { Event } from "./Event";

/**
 * A helper class to handle events to dedicated handler functions
 * based on the Event's type.
 * This provides a clean, type-safe way to handle events inside a Layer's `OnEvent` method.
 *
 * @export
 * @class EventHandler
 * @example
 * ```typescript
 * // Define your Event types
 * export const EventType = {
 *     User: {
 *         Registered: "User:Registered",
 *         LoggedIn: "User:LoggedIn",
 *     },
 *     Data: {
 *         Received: "Data:Received",
 *     }
 * }
 * 
 * // In your Layer's OnEvent method:
 * OnEvent(event: Event): void {
 *     const handler = new EventHandler(event);
 *
 *     // The handler will only call OnUserRegistered if the event
 *     // type matches EventType.User.Registered.
 *     handler.Handle<UserRegisteredEvent>(
 *         EventType.User.Registered,
 *         this.OnUserRegistered.bind(this)
 *     );
 *
 *     // Similarly for other event types:
 *     handler.Handle<DataReceivedEvent>(
 *         EventType.Data.Received,
 *         this.OnDataReceived.bind(this)
 *     );
 * }
 *
 * // The handler functions:
 * private OnUserRegistered(event: UserRegisteredEvent): boolean {
 *     Log.Info(`User registered: ${event.Payload.username}`);
 *     // Return true to consume the event
 *     return true;
 * }
 *
 * private OnDataReceived(event: DataReceivedEvent): boolean {
 *     // Return false to let the event propagate to other layers
 *     return false;
 * }
 * ```
 */
export class EventHandler {
    /**
     * The `Event` object to be handled.
     *
     * @private
     * @type {Event}
     * @memberof EventHandler
     */
    private event: Event;

    /**
     * Creates an instance of `EventHandler`.
     *
     * @param {Event} event The `Event` to be handled.
     * @memberof EventHandler
     */
    constructor(event: Event) {
        this.event = event;
    }

    /**
     * Dispatches the `Event` to a specific handler function if the Event's type matches.
     * If the handler function returns `true`, the event will be marked as consumed.
     *
     * @template T A class that extends `Event`.
     * @param {string} type The `Event` type to match against.
     * @param {(event: T) => boolean} handler The function to call if the type matches.
     * Should return `true` to consume the event.
     * @returns {void}
     * @memberof EventHandler
     */
    public Handle<T extends Event>(
        type: string,
        handler: (event: T) => boolean
    ): void {
        // If the Event is already consumed or types don't match, do nothing.
        if (this.event.Consumed() || this.event.Type !== type) {
            return;
        }

        // Call the handler and pass the type-casted event.
        // If the handler returns true, consume the event.
        if (handler(this.event as T)) {
            this.event.Consume();
        }
    }
}