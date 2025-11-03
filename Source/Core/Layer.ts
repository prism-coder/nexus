import { Event } from "./Event";

/**
 * The base abstract class for all Layers.
 * 
 * Layers are the building blocks of the Application,
 * each handling a specific piece of logic.
 *
 * @export
 * @abstract
 * @class Layer
 * @example
 * ```typescript
 * import { Layer, Event, EventHandler, Log, ServiceLocator } from "nexus";
 * import { MyConfigService } from "../Services/MyConfigService";
 *
 * class MyLayer extends Layer {
 *     private config: MyConfigService;
 *
 *     OnAttach(): void {
 *         // Get services from the locator.
 *         this.config = ServiceLocator.Get(MyConfigService);
 *         Log.Info("MyLayer attached! Port is: " + this.config.Get("PORT"));
 *     }
 *
 *     OnDetach(): void {
 *         Log.Info("MyLayer detached");
 *     }
 *
 *     OnUpdate(ts: number): void {
 *         // This code runs on every application tick.
 *     }
 *
 *     OnEvent(event: Event): void {
 *         // Use the EventHandler to route events.
 *         const handler = new EventHandler(event);
 * 
 *         handler.Handle<MyCustomEvent>(EventType.MyCustom, (e) => {
 *             Log.Debug("Handled MyCustomEvent!");
 *             return true; // Consume the event.
 *         });
 *     }
 * }
 * ```
 */
export abstract class Layer {
    /**
     * Method that fires when the Layer is Attached (pushed)
     * to the Application's `LayerStack`.
     *
     * This is the ideal place to retrieve services from the `ServiceLocator`.
     *
     * @abstract
     * @memberof Layer
     */
    abstract OnAttach(): void;

    /**
     * Method that fires when the Layer is Detached (popped)
     * from the Application's `LayerStack`.
     *
     * Used for cleanup.
     *
     * @abstract
     * @memberof Layer
     */
    abstract OnDetach(): void;

    /**
     * Method that fires every time the Application loop runs.
     * Used for Layer-specific logic.
     *
     * @abstract(
     * @param {number} ts The Timestep or Delta Time (in milliseconds).
     * @memberof Layer
     */
    abstract OnUpdate(ts: number): void;

    /**
     * Method that fires every time an Event is emitted to this Layer.
     * The Layer can choose to process, ignore, or consume the Event.
     *
     * @abstract
     * @param {Event} event The Event to be processed.
     * @memberof Layer
     */
    abstract OnEvent(event: Event): void;
}