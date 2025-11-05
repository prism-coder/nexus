/**
 * An enumeration of all possible event categories.
 * Allows for easy filtering of event types using bitwise operations.
 *
 * @export
 * @enum {number}
 * @example
 * ```typescript
 * if (event.IsInCategory(EventCategory.User | EventCategory.Database)) {
 *     // Is a user or database Event
 * }
 * ```
 */
export enum EventCategory {
    None        = 0,      // 0  - No category
    Application = 1 << 0, // 1  - App lifecycle events
    Network     = 1 << 1, // 2  - API events, WebSocket, etc.
    Database    = 1 << 2, // 4  - Database I/O Events
    User        = 1 << 3, // 8  - User-specific events (generic)
    Custom      = 1 << 4, // 16 - For anything else that the app defines
}

/**
 * Base abstract class for all Events.
 * 
 * Events are data packets that flow through the `LayerStack`
 * and can be consumed by Layers.
 *
 * @export
 * @abstract
 * @class Event
 * @example
 * ```typescript
 * // Define your application's Event types as string constants.
 * export const EventType = {
 *     User: {
 *         Registered: "User:Registered",
 *         LoggedIn: "User:LoggedIn",
 *     }
 * }
 * 
 * // Define a payload interface.
 * export interface UserRegisteredPayload {
 *     userId: number;
 *     username: string;
 * }
 *
 * // Create your custom event class.
 * export class UserRegisteredEvent extends Event {
 *     public readonly Name: string = "UserRegistered";
 *     public readonly Category: EventCategory = EventCategory.User;
 *     public readonly Type: string = EventType.User.Registered;
 *     public readonly Payload: UserRegisteredPayload;
 *
 *     constructor(payload: UserRegisteredPayload) {
 *         super();
 *         this.Payload = payload;
 *     }
 * }
 * ```
 */
export abstract class Event {
    /**
     * The unique name of the `Event`.
     *
     * Used for logging and debugging.
     *
     * @abstract
     * @type {string}
     * @memberof Event
     */
    public abstract readonly Name: string;

    /**
     * The Category of the `Event`.
     *
     * @abstract
     * @type {EventCategory}
     * @memberof Event
     */
    public abstract readonly Category: EventCategory;

    /**
     * The specific type of the `Event`.
     *
     * @abstract
     * @type {string}
     * @memberof Event
     */
    public abstract readonly Type: string;

    /**
     * Flag indicating if the `Event` has been consumed.
     *
     * @protected
     * @type {boolean}
     * @memberof Event
     */
    protected consumed: boolean = false;

    /**
     * Checks if the `Event` has been consumed.
     *
     * @returns {boolean} `true` if the `Event` is consumed, `false` otherwise.
     * @memberof Event
     */
    public Consumed(): boolean {
        return this.consumed;
    }

    /**
     * Marks the `Event` as consumed.
     * Once consumed, subsequent layers in the stack will not process it.
     *
     * @memberof Event
     */
    public Consume(): void {
        this.consumed = true;
    }

    /**
     * Checks if the `Event` belongs to a specific category.
     *
     * @param {EventCategory} category The category to check against.
     * @returns {boolean} `true` if the `Event` is in the specified category, `false` otherwise.
     * @memberof Event
     * @example
     * ```typescript
     * if (event.IsInCategory(EventCategory.Network)) {
     *     // It's a network event
     * }
     * ```
     */
    public IsInCategory(category: EventCategory): boolean {
        // Use bitwise AND to check if the category flag is set
        return (this.Category & category) !== 0;
    }
}