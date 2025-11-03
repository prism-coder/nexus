import { ServiceContainer, ServiceIdentifier } from "./ServiceContainer";
import { Service } from "./Service";
import { Log } from "./Log";

/**
 * A static Service Locator pattern implementation.
 * It holds the single `ServiceContainer` instance for
 * the entire application, allowing any part of the app
 * to retrieve services without "prop drilling".
 *
 * It is initialized automatically by the Application.
 *
 * @export
 * @class ServiceLocator
 * @example
 * ```typescript
 * // In a Layer's OnAttach() method:
 * import { ServiceLocator } from "nexus";
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
     * Initializes the `ServiceLocator` with the app's container.
     * This should only be called once by the Application.
     *
     * @static
     * @param {ServiceContainer} container The container instance.
     * @internal
     * @memberof ServiceLocator
     */
    public static Initialize(container: ServiceContainer): void {
        if (this.container) {
            Log.Warning("ServiceLocator::Initialize - Already initialized.");
            return;
        }

        this.container = container;
    }

    /**
     * Retrieves a service instance from the global container.
     *
     * @template T
     * @param {ServiceIdentifier<T>} identifier The class.
     * @returns {T} The requested service instance.
     * @throws {Error} If the locator hasn't been initialized.
     * @throws {Error} If the service is not found in the container.
     * @memberof ServiceLocator
     */
    public static Get<T extends Service>(
        identifier: ServiceIdentifier<T>
    ): T {
        if (!this.container) {
            throw new Error(
                "ServiceLocator::Get - ServiceLocator has not been initialized! Did you forget to call Application.Create()?"
            );
        }

        // The container.Get() will throw if the service isn't registered.
        return this.container.Get(identifier);
    }
}