/**
 * An enumeration of all possible event categories.
 * Allows for easy filtering of event types using bitwise operations.
 *
 * @export
 * @enum {number}
 * @example
 * ```typescript
 * if (event.IsInCategory(EventCategory.Mouse | EventCategory.Keyboard)) {
 *     // Is any kind of input event
 * }
 * ```
 */
export enum EventCategory {
    None        = 0,      // 0
    Application = 1 << 0, // 1
    Input       = 1 << 1, // 2
    Keyboard    = 1 << 2, // 4
    Mouse       = 1 << 3, // 8
    MouseButton = 1 << 4, // 16
    Data        = 1 << 5, // 32
    Test        = 1 << 6, // 64
}

/**
 * An enumeration of all specific event types.
 *
 * @export
 * @enum {number}
 */
export enum EventType {
    None,
    // Application events
    WindowClose, WindowResize,
    UserRegistered, UserLogin,
    // Key events
    KeyPressed, KeyReleased, KeyTyped,
    // Mouse events
    MouseMoved, MouseScrolled,
    MouseButtonPressed, MouseButtonReleased,
    // Data/Service events
    DataReceived, DataError,
    // Test event
    Test,
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
 * // Define a custom event
 * export interface UserRegisteredPayload {
 *     userId: string;
 *     username: string;
 * }
 *
 * export class UserRegisteredEvent extends Event {
 *     public readonly Name: string = "UserRegistered";
 *     public readonly Category: EventCategory = EventCategory.Application;
 *     public readonly Type: EventType = EventType.UserRegistered;
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
     * The unique name of the Event.
     *
     * Used for logging and debugging.
     *
     * @abstract
     * @type {string}
     * @memberof Event
     */
    public abstract readonly Name: string;

    /**
     * The Category of the Event.
     *
     * @abstract
     * @type {EventCategory}
     * @memberof Event
     */
    public abstract readonly Category: EventCategory;

    /**
     * The specific type of the Event.
     *
     * @abstract
     * @type {EventType}
     * @memberof Event
     */
    public abstract readonly Type: EventType;

    /**
     * Flag indicating if the event has been consumed.
     *
     * @protected
     * @type {boolean}
     * @memberof Event
     */
    protected consumed: boolean = false;

    /**
     * Checks if the Event has been consumed.
     *
     * @returns {boolean} True if the Event is consumed, false otherwise.
     * @memberof Event
     */
    public Consumed(): boolean {
        return this.consumed;
    }

    /**
     * Marks the event as consumed.
     * Once consumed, subsequent layers in the stack will not process it.
     *
     * @memberof Event
     */
    public Consume(): void {
        this.consumed = true;
    }

    /**
     * Checks if the event belongs to a specific category.
     *
     * @param {EventCategory} category The category to check against.
     * @returns {boolean} True if the event is in the specified category.
     * @memberof Event
     * @example
     * ```typescript
     * if (event.IsInCategory(EventCategory.Input)) {
     *     // It's a keyboard or mouse event
     * }
     * ```
     */
    public IsInCategory(category: EventCategory): boolean {
        // Use bitwise AND to check if the category flag is set
        return (this.Category & category) !== 0;
    }
}