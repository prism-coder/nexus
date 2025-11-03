import { Log, LogSpecification } from "./Log";
import { Layer } from "./Layer";
import { Event } from "./Event";
import { LayerStack } from "./LayerStack";
import { EventBus } from "./EventBus";
import { ServiceContainer, ServiceIdentifier } from "./ServiceContainer";
import { ServiceLocator } from "./ServiceLocator";
import { Service } from "./Service";

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
}

/**
 * The main Application class.
 * It follows a Singleton pattern and is responsible for managing the
 * service container, layer stack, and the main application loop.
 *
 * @export
 * @class Application
 * @example
 * ```typescript
 * import { Application, ApplicationSpecification, Log, Service, Layer } from "nexus";
 *
 * // (Define custom Services and Layers...)
 *
 * class MyService extends Service {
 *     async Initialize(): Promise<void> {
 *         Log.Info("Service initialized");
 *     }
 * 
 *     async Shutdown(): Promise<void> {
 *        Log.Info("Service shut down");
 *     }
 * }
 *
 * class MyLayer extends Layer {
 *     OnAttach(): void {
 *         Log.Info("MyLayer attached");
 *     }
 * 
 *     OnDetach(): void {}
 *     OnUpdate(ts: number): void {}
 *     OnEvent(event: Event): void {}
 * }
 *
 * // Main application entry point.
 * (async () => {
 *     // 1. Create the application.
 *     const spec: ApplicationSpecification = { Name: "MyApp" };
 *     const app: Application = Application.Create(spec);
 *
 *     try {
 *         // 2. Register services.
 *         app.RegisterService(MyService, new MyService());
 *     
 *         // 3. Initialize services (async).
 *         await app.InitializeServices();
 *     
 *     } catch (error: any) {
 *         Log.Fatal(`Failed to initialize services!: ${error.message}`);
 *         process.exit(1);
 *     }
 *     
 *     // 4. Push layers.
 *     app.PushLayer(new MyLayer());
 *     
 *     // 5. Run the application.
 *     app.Run();
 *     
 *     // 6. Handle graceful shutdown.
 *     process.on('SIGINT', () => app.Close());
 * })();
 * ```
 */
export class Application {
    /**
     * The Layer Stack for the Application.
     *
     * @private
     * @type {LayerStack}
     * @memberof Application
     */
    private layerStack: LayerStack;

    /**
     * The Application Specification.
     *
     * @private
     * @type {ApplicationSpecification}
     * @memberof Application
     */
    private specification: ApplicationSpecification;

    /**
     * Variable that holds the running state of the Application.
     *
     * @private
     * @type {boolean}
     * @memberof Application
     */
    private running: boolean = true;

    /**
     * Variable that holds the last frame time of the Application.
     *
     * @private
     * @type {number}
     * @memberof Application
     */
    private lastFrameTime: number = 0;

    /**
     * The Application's internal Service Container.
     *
     * @private
     * @type {ServiceContainer}
     * @memberof Application
     */
    private serviceContainer: ServiceContainer;

    /**
     * The Singleton instance of the Application Class.
     *
     * @private
     * @static
     * @type {Application}
     * @memberof Application
     */
    private static instance: Application;

    /**
     * Creates an instance of Application.
     * The constructor is private to enforce the Singleton pattern.
     *
     * @param {ApplicationSpecification} specification The Application Specification.
     * @memberof Application
     */
    private constructor(specification: ApplicationSpecification) {
        this.specification = specification;
        this.layerStack = new LayerStack();
        this.serviceContainer = new ServiceContainer();

        this.Initialize();
    }

    /**
     * Creates or retrieves the Application Singleton instance.
     * This is the entry point for creating the application.
     *
     * @static
     * @param {ApplicationSpecification} specification The Application Specification.
     * @returns {Application} The singleton Application instance.
     * @memberof Application
     */
    public static Create(specification: ApplicationSpecification): Application {
        if (!this.instance) {
            this.instance = new Application(specification);
        } else {
            // Update specification if instance already exists.
            this.instance.specification = specification;
            Log.SetAppName(specification.Name);
        }

        return this.instance;
    }

    /**
     * Starts the Application's non-blocking main loop.
     * The application will begin processing `OnUpdate` ticks for all layers.
     *
     * @memberof Application
     */
    public Run(): void {
        Log.Info("Application::Run - Running the Application's main loop");

        // Set the running flag.
        this.running = true;

        // Initialize lastFrameTime *before* starting the loop.
        this.lastFrameTime = Date.now();

        // Start the first tick.
        // The Tick() method will schedule itself to run again,
        // creating the non-blocking loop.
        this.Tick();
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
        // If 'running' was set to false
        // we stop the loop and run shutdown.
        if (!this.running) {
            this.Shutdown();

            return;
        }

        // Calculate timstep.
        const time: number = Date.now();
        const timestep: number = time - this.lastFrameTime;
        this.lastFrameTime = time;

        // Propagate update to the LayerStack.
        this.layerStack.OnUpdate(timestep);

        // Schedule the next tick.
        setImmediate(this.Tick.bind(this));
    }

    /**
     * Emits an event to the Layer Stack.
     * The event will propagate down the stack (from top-most to bottom-most layer)
     * until it is consumed.
     *
     * This is called internally by the `EventBus`.
     *
     * @param {Event} event The event to emit.
     * @memberof Application
     */
    public EmitEvent(event: Event): void {
        // Propagate event to the layer stack.
        this.layerStack.OnEvent(event);
    }

    /**
     * Pushes a regular Layer to the `LayerStack`.
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
     * Registers a service instance with the Application's container.
     * This must be called *before* `InitializeServices()`.
     *
     * @template T
     * @param {ServiceIdentifier<T>} identifier The class.
     * @param {T} instance The instance.
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
     * Stops the Application from running.
     *
     * The loop will stop on the *next* tick and perform a graceful shutdown.
     *
     * @memberof Application
     */
    public Close(): void {
        Log.Info("Application::Close - Closing the Application");

        // This will be detected by the `Tick()` method,
        // which will then trigger `Shutdown()`.
        this.running = false;
    }

    /**
     * Returns the Application Singleton instance.
     *
     * @static
     * @returns {Application} The singleton instance.
     * @memberof Application
     */
    public static Get(): Application {
        return this.instance;
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
     * Returns the Application's internal `ServiceContainer`.
     *
     * @returns {ServiceContainer}
     * @memberof Application
     */
    public GetServiceContainer(): ServiceContainer {
        return this.serviceContainer;
    }

    /**
     * Initializes the Application's core components (`Log`, `EventBus`, `ServiceLocator`...).
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
     * Shuts down the Application, services, and layers gracefully.
     *
     * @private
     * @memberof Application
     */
    private async Shutdown(): Promise<void> {
        Log.Info("Application::Shutdown - Shutting down the Application");

        // Shut down all services first.
        await this.serviceContainer.Shutdown();

        // Then shut down the `LayerStack`.
        const layerStackSuccess = this.layerStack.Shutdown();

        Log.Info("Application::Shutdown - Shutdown complete. Exiting process.");

        const exitCode: number = layerStackSuccess ? 0 : 1;
        process.exit(exitCode);
    }
}