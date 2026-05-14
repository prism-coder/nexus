import { Service } from "./Service";
import { Log } from "./Log";
import {
    InvalidArgumentError,
    ServiceAlreadyRegisteredError,
    ServiceNotFoundError,
    ServiceShutdownError,
} from "./Errors";

/**
 * A type alias for a `Service`'s constructor.
 *
 * This is used as the key for registering and retrieving services.
 *
 * @export
 * @template T The `Service` type.
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
     * The Map holding all registered `Service` instances.
     * The key is the class and the value is the instance.
     *
     * @private
     * @type {Map<ServiceIdentifier<Service>, Service>}
     * @memberof ServiceContainer
     */
    private services: Map<ServiceIdentifier<Service>, Service> = new Map();

    /**
     * Registers a `Service` instance against its class identifier.
     *
     * @template T
     * @param {ServiceIdentifier<T>} identifier The `Service` class.
     * @param {T} instance The `Service` instance.
     * @returns {void}
     * @throws {InvalidArgumentError} If `instance` is null or undefined.
     * @throws {ServiceAlreadyRegisteredError} If the `Service` is already registered.
     * @memberof ServiceContainer
     */
    public Register<T extends Service>(
        identifier: ServiceIdentifier<T>,
        instance: T,
    ): void {
        if (!instance) {
            throw new InvalidArgumentError(
                `ServiceContainer::Register - 'instance' must not be null or undefined.`,
            );
        }

        if (this.services.has(identifier)) {
            // This is a developer error, so we throw.
            throw new ServiceAlreadyRegisteredError(
                `ServiceContainer::Register - Service already registered: '${identifier.name}'`,
            );
        }

        this.services.set(identifier, instance);
    }

    /**
     * Retrieves a `Service` instance using its class identifier.
     *
     * @template T
     * @param {ServiceIdentifier<T>} identifier The class to retrieve.
     * @returns {T} The `Service` instance.
     * @throws {InvalidArgumentError} If `identifier` is null or undefined.
     * @throws {ServiceNotFoundError} If the `Service` is not registered.
     * @memberof ServiceContainer
     */
    public Get<T extends Service>(identifier: ServiceIdentifier<T>): T {
        if (!identifier) {
            throw new InvalidArgumentError(
                "ServiceContainer::Get - 'identifier' must not be null or undefined."
            );
        }

        const service = this.services.get(identifier) as T;

        if (!service) {
            throw new ServiceNotFoundError(
                `ServiceContainer::Get - Service not found: '${identifier.name}'. ` +
                    `Did you forget to call 'app.RegisterService()'?`,
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
                Log.Info(
                    `ServiceContainer::Initialize - Initializing service: ${identifier.name}`,
                );
                await service.Initialize();
            } catch (error: any) {
                Log.Error(
                    `ServiceContainer::Initialize - Failed to initialize service '${identifier.name}': ${error.message}`,
                );
                throw error;
            }
        }

        Log.Info(
            "ServiceContainer::Initialize - All services have been initialized",
        );
    }

    /**
     * Calls the `Shutdown()` method on all registered services.
     *
     * @returns {Promise<void>}
     * @throws {ServiceShutdownError} If one or more services fail to shut down. The error message will contain details on which services failed.
     * @remarks Even if one service fails to shut down, this method will attempt to shut down all services before throwing the error.
     * This is to ensure that all services have a chance to clean up resources, even if one service encounters an issue during shutdown.
     * The error message in the thrown `ServiceShutdownError` will contain details on which services failed to shut down and their respective error messages.
     * @memberof ServiceContainer
     */
    public async Shutdown(): Promise<void> {
        Log.Info("ServiceContainer::Shutdown - Shutting down all services...");

        const errors: string[] = [];

        for (const [identifier, service] of this.services) {
            Log.Info(
                `ServiceContainer::Shutdown - Shutting down service: ${identifier.name}`,
            );

            try {
                await service.Shutdown();
            } catch (error: any) {
                Log.Error(
                    `ServiceContainer::Shutdown - Failed to shut down service '${identifier.name}': ${error.message}`,
                );
                errors.push(`'${identifier.name}': ${error.message}`);
            }
        }

        if (errors.length > 0) {
            throw new ServiceShutdownError(
                `ServiceContainer::Shutdown - One or more services failed to shut down:\n${errors.join("\n")}`,
            );
        }

        Log.Info(
            "ServiceContainer::Shutdown - All services have been shut down",
        );
    }
}
