import { Event } from "./Event";
import { Layer } from "./Layer";
import { Log } from "./Log";

/**
 * Manages the stack of layers for the application.
 * This class handles the attachment, detachment and propagation
 * of updates and events through the layers.
 * 
 * This class is managed internally by the `Application`.
 *
 * @export
 * @class LayerStack
 * @internal
 */
export class LayerStack {
    /**
     * The array holding all active layers.
     *
     * @private
     * @type {Layer[]}
     * @memberof LayerStack
     */
    private layers: Layer[] = [];

    /**
     * The index where overlays start.
     * Layers are pushed normally up to this index.
     * Overlays are pushed after this index.
     *
     * @private
     * @type {number}
     * @memberof LayerStack
     */
    private layerInsertIndex: number = 0;

    /**
     * Destroys the LayerStack and detaches all layers.
     *
     * @returns {boolean} True if shutdown was successful, false otherwise.
     * @memberof LayerStack
     */
    public Shutdown(): boolean {
        Log.Info("LayerStack::Shutdown - Detaching all layers");

        let success: boolean = false;

        try {
            for (const layer of this.layers) {
                layer.OnDetach();
            }

            this.layers = [];
            this.layerInsertIndex = 0;

            success = true;
        } catch (error: any) {
            Log.Error(error.message);

            success = false;
        }

        return success;
    }

    /**
     * Pushes a regular `Layer` onto the stack.
     * Regular layers are inserted before overlays.
     *
     * @param {Layer} layer The layer to push.
     * @memberof LayerStack
     */
    public PushLayer(layer: Layer): void {
        Log.Info(`LayerStack::PushLayer - Pushing layer: ${layer.constructor.name}`);

        // Insert layer at the dedicated insert index.
        this.layers.splice(this.layerInsertIndex, 0, layer);
        this.layerInsertIndex++; // Increment index to keep overlays at the end.

        layer.OnAttach();
    }

    /**
     * Pushes an Overlay onto the stack.
     * Overlays are always "on top" of regular layers.
     *
     * @param {Layer} overlay The overlay to push.
     * @memberof LayerStack
     */
    public PushOverlay(overlay: Layer): void {
        Log.Info(`LayerStack::PushOverlay - Pushing overlay: ${overlay.constructor.name}`);

        // Overlays are just pushed to the end.
        this.layers.push(overlay);

        overlay.OnAttach();
    }

    /**
     * Pops a regular `Layer` from the stack.
     *
     * @param {Layer} layer The layer to pop.
     * @memberof LayerStack
     */
    public PopLayer(layer: Layer): void {
        const index = this.layers.indexOf(layer);

        // Ensure layer exists and is a regular layer (before the overlay index).
        if (index > -1 && index < this.layerInsertIndex) {
            Log.Info(`LayerStack::PopLayer - Popping layer: ${layer.constructor.name}`);

            layer.OnDetach();

            this.layers.splice(index, 1);
            this.layerInsertIndex--; // Decrement the insert index.
        }
    }

    /**
     * Pops an Overlay from the stack.
     *
     * @param {Layer} overlay The overlay to pop.
     * @memberof LayerStack
     */
    public PopOverlay(overlay: Layer): void {
        const index = this.layers.indexOf(overlay);

        // Ensure layer exists and is an overlay (at or after the overlay index).
        if (index > -1 && index >= this.layerInsertIndex) {
            Log.Info(`LayerStack::PopOverlay - Popping overlay: ${overlay.constructor.name}`);

            overlay.OnDetach();

            this.layers.splice(index, 1);
        }
    }

    /**
     * Returns the array of layers.
     *
     * @returns {Layer[]} The array of layers.
     * @memberof LayerStack
     */
    public GetLayers(): Layer[] {
        return this.layers;
    }

    /**
     * Propagates an update tick to all layers (bottom-to-top).
     *
     * @param {number} ts Timestep
     * @memberof LayerStack
     */
    public OnUpdate(ts: number): void {
        for (const layer of this.layers) {
            layer.OnUpdate(ts);
        }
    }

    /**
     * Propagates an event to all layers (top-to-bottom).
     * Propagation stops if the event is consumed.
     *
     * @param {Event} event The event to propagate.
     * @memberof LayerStack
     */
    public OnEvent(event: Event): void {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            if (event.Consumed()) {
                break;
            }

            this.layers[i].OnEvent(event);
        }
    }
}