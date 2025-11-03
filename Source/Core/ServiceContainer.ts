import { Service } from "./Service";
import { Log } from "./Log";

/**
 * A type alias for a Service's constructor.
 * This is used as the key for registering and retrieving services.
 * 
 * @export
 * @template T The Service type.
 * @example
 * ```typescript
 * ServiceContainer.Get(DatabaseService)
 * ```
 */
export type ServiceIdentifier<T extends Service> = new (...args: any[]) => T;

/**
 * The `ServiceContainer` is responsible for managing
 * the lifecycle of Services within the Application.
 * 
 * This class is managed internally by the `Application`.
 *
 * @export
 * @class ServiceContainer
 * @internal
 */
export class ServiceContainer {
    /**
     * The Map holding all registered service instances.
     * The key is the class and the value is the instance.
     *
     * @private
     * @type {Map<ServiceIdentifier<Service>, Service>}
     * @memberof ServiceContainer
     */
    private services: Map<ServiceIdentifier<Service>, Service> = new Map();

    /**
     * Registers a service instance against its class identifier.
     *
     * @template T
     * @param {ServiceIdentifier<T>} identifier The class.
     * @param {T} instance The instance.
     * @returns {void}
     * @memberof ServiceContainer
     */
    public Register<T extends Service>(
        identifier: ServiceIdentifier<T>,
        instance: T
    ): void {
        if (this.services.has(identifier)) {
            Log.Warning(`ServiceContainer::Register - Service already registered: ${identifier.name}`);
            return;
        }

        this.services.set(identifier, instance);
    }

    /**
     * Retrieves a service instance using its class identifier.
     *
     * @template T
     * @param {ServiceIdentifier<T>} identifier The class to retrieve.
     * @returns {T} The service instance.
     * @throws {Error} If the service is not registered.
     * @memberof ServiceContainer
     */
    public Get<T extends Service>(identifier: ServiceIdentifier<T>): T {
        const service = this.services.get(identifier) as T;

        if (!service) {
            // This is a developer error, so we throw.
            throw new Error(
                `ServiceContainer::Get - Service not found: ${identifier.name}. Did you forget to app.RegisterService()?`
            );
        }

        return service;
    }

    /**
     * Calls the `Initialize()` method on all registered services.
     *
     * @returns {Promise<void>}
     * @memberof ServiceContainer
     */
    public async Initialize(): Promise<void> {
        Log.Info("ServiceContainer::Initialize - Initializing all services...");

        for (const [identifier, service] of this.services) {
            try {
                Log.Info(`ServiceContainer::Initialize - Initializing service: ${identifier.name}`);
                await service.Initialize();
            } catch (error: any) {
                Log.Error(`ServiceContainer::Initialize - Failed to initialize service: ${identifier.name}: ${error.message}`);
                throw error;
            }
        }

        Log.Info("ServiceContainer::Initialize - All services have been initialized");
    }

    /**
     * Calls the `Shutdown()` method on all registered services.
     *
     * @returns {Promise<void>}
     * @memberof ServiceContainer
     */
    public async Shutdown(): Promise<void> {
        Log.Info("ServiceContainer::Shutdown - Shutting down all services...");

        for (const [identifier, service] of this.services) {
            Log.Info(`ServiceContainer::Shutdown - Shutting down service: ${identifier.name}`);

            await service.Shutdown();
        }

        Log.Info("ServiceContainer::Shutdown - All services have been shut down");
    }
}