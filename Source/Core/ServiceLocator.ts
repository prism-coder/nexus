import { ServiceContainer, ServiceIdentifier } from "./ServiceContainer";
import { Service } from "./Service";
import { Log } from "./Log";

/**
 * A static `ServiceLocator` pattern implementation.
 * 
 * It holds the single `ServiceContainer` instance for
 * the entire application, allowing any part of the app
 * to retrieve services without "prop drilling".
 *
 * It is initialized automatically by the `Application`.
 *
 * @export
 * @class ServiceLocator
 * @example
 * ```typescript
 * // In a Layer's OnAttach() method:
 * import { ServiceLocator } from "@prism-dev/nexus";
 * import { ConfigService } from "../Services/ConfigService";
 *
 * class MyLayer extends Layer {
 *     private config: ConfigService;
 *
 *     OnAttach(): void {
 *         // Get the service from the static locator.
 *         this.config = ServiceLocator.Get(ConfigService);
 *         const port = this.config.GetPort();
 *         Log.Info(`MyLayer attached, port is ${port}`);
 *     }
 * 
 *     // ...
 * }
 * ```
 */
export class ServiceLocator {
    /**
     * The single, static container instance.
     *
     * @private
     * @static
     * @type {(ServiceContainer | null)}
     * @memberof ServiceLocator
     */
    private static container: ServiceContainer | null = null;

    /**
     * Initializes the `ServiceLocator` with the app's `ServiceContainer`.
     * This should only be called once by the `Application`.
     *
     * @static
     * @param {ServiceContainer} container The `ServiceContainer` instance.
     * @internal
     * @throws {Error} If the `ServiceLocator` has already been initialized.
     * @memberof ServiceLocator
     */
    public static Initialize(container: ServiceContainer): void {
        if (this.container) {
            throw new Error(
                "ServiceLocator::Initialize - ServiceLocator has already been initialized! " +
                "Did you call 'ServiceLocator.Initialize()' more than once?"
            );
        }

        this.container = container;
    }

    /**
     * Retrieves a `Service` instance from the global `ServiceContainer`.
     *
     * @template T
     * @param {ServiceIdentifier<T>} identifier The `Service` class.
     * @returns {T} The requested `Service` instance.
     * @throws {Error} If the `ServiceLocator` hasn't been initialized.
     * @throws {Error} If the `Service` is not found in the container.
     * @throws {Error} If the `Service` hasn't been initialized.
     * @memberof ServiceLocator
     */
    public static Get<T extends Service>(identifier: ServiceIdentifier<T>): T {
        if (!this.container) {
            throw new Error(
                "ServiceLocator::Get - ServiceLocator has not been initialized! " +
                "Did you forget to call 'ServiceLocator.Initialize()'?"
            );
        }

        // The container.Get() will throw if the service isn't registered.
        const service = this.container.Get(identifier);

        // Ensure the Service is initialized.
        if (!service.IsInitialized()) {
            throw new Error(
                `ServiceLocator::Get - An attempt was made to retrieve the service '${identifier.name}' before it was initialized. ` +
                `Did you forget to call 'app.InitializeServices()' in your main.ts file?`
            );
        }
        
        return service;
    }
}