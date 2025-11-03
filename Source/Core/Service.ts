/**
 * Base abstract class for all Services.
 * 
 * Services are typically long-lived objects that handle
 * infrastructure concerns like database connections,
 * API clients, configuration, etc.
 * 
 * They are managed by the Application's `ServiceContainer`.
 *
 * @export
 * @abstract
 * @class Service
 * @example
 * ```typescript
 * import { Service, Log } from "nexus";
 *
 * // Example: A service to manage configuration.
 * export class ConfigService extends Service {
 *     private port: number = 3000;
 *
 *     public async Initialize(): Promise<void> {
 *         // Load .env file, etc.
 *         this.port = parseInt(process.env.PORT || '3000', 10);
 *         Log.Info("ConfigService Initialized");
 *     }
 *
 *     public async Shutdown(): Promise<void> {
 *         Log.Info("ConfigService Shut Down");
 *     }
 *
 *     public GetPort(): number {
 *         return this.port;
 *     }
 * }
 * ```
 */
export abstract class Service {
    /**
     * Variable that says whether the Service has been initialized or not.
     *
     * @protected
     * @type {boolean}
     * @memberof Service
     */
    protected Initialized: boolean = false;

    /**
     * Method that fires when the Service is initialized
     * by the Application (via `app.InitializeServices()`).
     *
     * Use this for async setup, database connections, etc.
     *
     * @abstract
     * @returns {Promise<void>}
     * @memberof Service
     */
    abstract Initialize(): Promise<void>;

    /**
     * Method that fires when the Service is shut down.
     * (via `app.Close()`).
     *
     * Use this for cleanup and closing connections.
     *
     * @abstract
     * @returns {Promise<void>}
     * @memberof Service
     */
    abstract Shutdown(): Promise<void>;
}