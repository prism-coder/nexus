import { Log, LogSpecification } from "./Log";
import { Layer } from "./Layer";
import { Event } from "./Event";
import { LayerStack } from "./LayerStack";
import { EventBus } from "./EventBus";
import { ServiceContainer, ServiceIdentifier } from "./ServiceContainer";
import { ServiceLocator } from "./ServiceLocator";
import { Service } from "./Service";
import { InvalidArgumentError } from "./Errors";

/**
 * Holds specification data for the Application.
 *
 * @export
 * @interface ApplicationSpecification
 */
export interface ApplicationSpecification {
    /**
     * The name of the Application. Used for logging.
     *
     * @type {string}
     * @memberof ApplicationSpecification
     */
    Name: string;

    /**
     * If `true`, the application will run a continuous update loop (`Tick`).
     * This is useful for real-time applications like games or simulations.
     * If `false` or `undefined`, the application will run in Event-Driven mode
     * (no loop), which is ideal for REST APIs or WebSockets services to save resources.
     *
     * @type {boolean}
     * @memberof ApplicationSpecification
     */
    RunLoop?: boolean;
}

/**
 * The main `Application` class.
 * 
 * It is responsible for managing the `ServiceContainer`,
 * `LayerStack`, and the main application loop.
 *
 * @export
 * @class Application
 * @example
 * ```typescript
 * // Example 1: API Mode (Default)
 * const app = new Application({ Name: "MyAPI" });
 * app.Run(); // Runs without a loop, waiting for events.
 *
 * // Example 2: Game Loop Mode
 * const app = new Application({ Name: "MyGame", RunLoop: true });
 * app.Run(); // Starts the continuous Tick loop.
 * ```
 */
export class Application {
    /**
     * The `LayerStack` for the `Application`.
     *
     * @private
     * @type {LayerStack}
     * @memberof Application
     */
    private layerStack: LayerStack = new LayerStack();

    /**
     * The `ApplicationSpecification`.
     *
     * @private
     * @type {ApplicationSpecification}
     * @memberof Application
     */
    private specification: ApplicationSpecification;

    /**
     * Variable that holds the running state of the `Application`.
     *
     * @private
     * @type {boolean}
     * @memberof Application
     */
    private running: boolean = false;

    /**
     * Variable that holds the last tick time of the `Application`.
     *
     * @private
     * @type {number}
     * @memberof Application
     */
    private lastTickTime: number = 0;

    /**
     * The `Application`'s internal `ServiceContainer`.
     *
     * @private
     * @type {ServiceContainer}
     * @memberof Application
     */
    private serviceContainer: ServiceContainer = new ServiceContainer();

    /**
     * Variable that tracks whether a close/shutdown is already in progress
     * to prevent duplicate shutdown sequences.
     *
     * @private
     * @type {boolean}
     * @memberof Application
     */
    private closing: boolean = false;

    /**
     * Creates an instance of `Application`.
     *
     * @param {ApplicationSpecification} specification The `ApplicationSpecification`.
     * @throws {InvalidArgumentError} If the `Name` in the specification is null, undefined, or empty.
     * @memberof Application
     */
    constructor(specification: ApplicationSpecification) {
        if (!specification.Name || !specification.Name.trim()) {
            throw new InvalidArgumentError(
                "Application::constructor - 'Name' must be a non-empty string."
            );
        }

        this.specification = specification;

        this.Initialize();
    }

    /**
     * Starts the application.
     *
     * If `RunLoop` is `true`, it starts the non-blocking main loop, which will
     * begin processing `OnUpdate` ticks for all layers.
     * Otherwise, it runs in Event-Driven mode.
     *
     * @memberof Application
     */
    public Run(): void {
        Log.Info("Application::Run - Starting Application");

        // Set the `running` flag.
        this.running = true;

        // Only start the `Tick` if the configuration requests it.
        if (this.specification.RunLoop) {
            Log.Info("Application::Run - Starting Main Loop (Tick Mode)");

            // Initialize `lastTickTime` *before* starting the loop.
            this.lastTickTime = Date.now();

            // Start the first tick.
            // The Tick() method will schedule itself to run again,
            // creating the non-blocking loop.
            this.Tick();
        } else {
            Log.Info(
                "Application::Run - Started in Event-Driven Mode (No Loop)"
            );

            // Node.js will keep the process alive as long as there
            // are active event listeners (such as the HTTP server).
        }
    }

    /**
     * Internal method for the application's main loop.
     * Yields to the Node.js event loop using `setImmediate`
     * to prevent blocking.
     *
     * @private
     * @memberof Application
     */
    private Tick(): void {
        // If `running` was set to false
        // we stop the loop and run `Shutdown`.
        if (!this.running) {
            this.Shutdown();

            return;
        }

        // Calculate timstep.
        const time: number = Date.now();
        const timestep: number = time - this.lastTickTime;
        this.lastTickTime = time;

        // Propagate update to the `LayerStack`.
        try {
            this.layerStack.OnUpdate(timestep);
        } catch (error: any) {
            Log.Error(
                `Application::Tick - Unhandled error in LayerStack.OnUpdate: ${error.message}`
            );
            this.Close();
            return;
        }

        // Schedule the next tick.
        setImmediate(this.Tick.bind(this));
    }

    /**
     * Emits an `Event` to the `LayerStack`.
     *
     * The `Event` will propagate down the stack (from top-most to bottom-most layer)
     * until it is consumed.
     *
     * This is called internally by the `EventBus`.
     *
     * @param {Event} event The `Event` to emit.
     * @memberof Application
     */
    public EmitEvent(event: Event): void {
        // Propagate event to the layer stack.
        try {
            this.layerStack.OnEvent(event);
        } catch (error: any) {
            Log.Error(
                `Application::EmitEvent - Unhandled error in LayerStack.OnEvent: ${error.message}`
            );
        }
    }

    /**
     * Pushes a regular `Layer` to the `LayerStack`.
     *
     * Regular layers are processed in the order they are pushed (FIFO).
     *
     * @param {Layer} layer The `Layer` instance to push.
     * @memberof Application
     */
    public PushLayer(layer: Layer): void {
        this.layerStack.PushLayer(layer);
    }

    /**
     * Pushes an Overlay onto the `LayerStack`.
     *
     * Overlays are always processed *after* regular layers for `OnUpdate`,
     * but *before* regular layers for `OnEvent`.
     *
     * @param {Layer} overlay The Overlay instance to push.
     * @memberof Application
     */
    public PushOverlay(overlay: Layer): void {
        this.layerStack.PushOverlay(overlay);
    }

    /**
     * Registers a `Service` instance with the `Application`'s container.
     *
     * This must be called *before* `InitializeServices()`.
     *
     * @template T
     * @param {ServiceIdentifier<T>} identifier The `Service` class.
     * @param {T} instance The `Service` instance.
     * @memberof Application
     * @example
     * ```typescript
     * app.RegisterService(DatabaseService, new DatabaseService());
     * ```
     */
    public RegisterService<T extends Service>(
        identifier: ServiceIdentifier<T>,
        instance: T
    ): void {
        Log.Info(
            `Application::RegisterService - Registering service: ${identifier.name}`
        );

        this.serviceContainer.Register(identifier, instance);
    }

    /**
     * Calls the `Initialize()` method on all registered services.
     *
     * This must be called *after* registering all services
     * and *before* pushing layers that depend on them.
     *
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async InitializeServices(): Promise<void> {
        await this.serviceContainer.Initialize();
    }

    /**
     * Stops the `Application` from running.
     *
     * The loop will stop on the *next* tick and perform a graceful shutdown.
     *
     * @memberof Application
     */
    public Close(): void {
        Log.Info("Application::Close - Closing the Application");

        if (this.closing) {
            Log.Warning(
                "Application::Close - Close() was called more than once. Ignoring duplicate call."
            );
            return;
        }

        this.closing = true;

        // This will be detected by the `Tick()` method,
        // which will then trigger `Shutdown()`.
        this.running = false;

        // If we are NOT in a loop, we need to trigger shutdown manually immediately,
        // because the Tick() won't be there to detect `running = false`.
        if (!this.specification.RunLoop) {
            this.Shutdown();
        }
    }

    /**
     * Returns the `ApplicationSpecification`.
     *
     * @returns {ApplicationSpecification}
     * @memberof Application
     */
    public GetSpecification(): ApplicationSpecification {
        return this.specification;
    }

    /**
     * Returns the `Application`'s internal `ServiceContainer`.
     *
     * @returns {ServiceContainer}
     * @memberof Application
     */
    public GetServiceContainer(): ServiceContainer {
        return this.serviceContainer;
    }

    /**
     * Initializes the `Application`'s core components
     * (`Log`, `EventBus`, `ServiceLocator`...).
     *
     * @private
     * @memberof Application
     */
    private Initialize(): void {
        Log.Info("Application::Initialize - Initializing the Application");

        // Create the `LogSpecification`.
        const logSpecification: LogSpecification = {
            Name: this.specification.Name,
        };

        // Initialize the Log.
        Log.Initialize(logSpecification);

        // Initialize the `EventBus`.
        EventBus.Initialize(this.EmitEvent.bind(this));

        // Initialize the `ServiceLocator`.
        ServiceLocator.Initialize(this.serviceContainer);

        Log.Info("Application::Initialize - Application has been initialized");
    }

    /**
     * Shuts down the `Application`, services, and layers gracefully.
     *
     * @private
     * @memberof Application
     */
    private async Shutdown(): Promise<void> {
        Log.Info("Application::Shutdown - Shutting down the Application");

        // Shut down all services first.
        try {
            await this.serviceContainer.Shutdown();
        } catch (error: any) {
            Log.Error(
                `Application::Shutdown - ServiceContainer failed to shut down: ${error.message}`
            );
        }

        // Then shut down the `LayerStack`.
        try {
            this.layerStack.Shutdown();
        } catch (error: any) {
            Log.Error(
                `Application::Shutdown - LayerStack failed to shutdown: ${error.message}`
            );
        }

        Log.Info("Application::Shutdown - Shutdown complete. Exiting process.");

        process.exit(0);
    }
}