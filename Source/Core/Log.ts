/**
 * Specification for initializing the `Log`.
 *
 * @export
 * @interface LogSpecification
 */
export interface LogSpecification {
    /**
     * The name of the `Application`.
     * Used as a prefix in log messages.
     *
     * @type {string}
     * @memberof LogSpecification
     */
    Name: string;
}

/**
 * Log Levels, from most verbose (`Trace`) to most critical (`Fatal`).
 *
 * @export
 * @enum {number}
 */
export enum LogLevel {
    Trace,
    Debug,
    Info,
    Warning,
    Error,
    Fatal
}

/**
 * The static `Log` class.
 * 
 * Responsible for logging messages to the Console.
 *
 * @export
 * @class Log
 * @example
 * ```typescript
 * import { Log, LogLevel } from "@prism-dev/nexus";
 *
 * // Set the minimum log level (optional)
 * Log.SetLevel(LogLevel.Debug);
 *
 * // Log messages
 * Log.Trace("This won't be seen if level is Debug.");
 * Log.Debug("A debug message.");
 * Log.Info("An info message.");
 * Log.Warning("A warning message.");
 * Log.Error("An error message.");
 * Log.Fatal("A fatal error message.");
 * ```
 */
export class Log {
    /**
     * The `LogSpecification`.
     *
     * @private
     * @static
     * @type {LogSpecification}
     * @memberof Log
     */
    private static specification: LogSpecification = {
        Name: "NexusApp",
    };

    /**
     * The current Log level.
     *
     * @private
     * @static
     * @type {LogLevel}
     * @memberof Log
     */
    private static currentLevel: LogLevel = LogLevel.Trace;

    /**
     * Initializes the `Log`.
     *
     * This method should *only* be called by the `Application` upon startup.
     *
     * @static
     * @param {LogSpecification} specification The Log Specification.
     * @internal
     * @memberof Log
     */
    public static Initialize(specification: LogSpecification): void {
        this.Info("Log::Initialize - Initializing the Log");

        this.specification = specification;

        this.Info("Log::Initialize - Log has been initialized");
    }

    /**
     * Sets the minimum log level.
     * Messages below this level will not be logged.
     *
     * @static
     * @param {LogLevel} level The new Log Level to be set.
     * @memberof Log
     */
    public static SetLevel(level: LogLevel): void {
        this.currentLevel = level;
    }

    /**
     * Sets the new Log (`Application`) name.
     *
     * @static
     * @param {string} name The new Log name.
     * @memberof Log
     */
    public static SetAppName(name: string): void {
        this.specification.Name = name;
    }

    /**
     * Logs a message with `Trace` level.
     *
     * @static
     * @param {string} message The Log message.
     * @memberof Log
     */
    public static Trace(message: string) {
        this.Write(LogLevel.Trace, message);
    }

    /**
     * Logs a message with `Debug` level.
     *
     * @static
     * @param {string} message The Log message.
     * @memberof Log
     */
    public static Debug(message: string): void {
        this.Write(LogLevel.Debug, message);
    }

    /**
     * Logs a message with `Info` level.
     *
     * @static
     * @param {string} message The Log message.
     * @memberof Log
     */
    public static Info(message: string): void {
        this.Write(LogLevel.Info, message);
    }

    /**
     * Logs a message with `Warning` level.
     *
     * @static
     * @param {string} message The Log message.
     * @memberof Log
     */
    public static Warning(message: string): void {
        this.Write(LogLevel.Warning, message);
    }

    /**
     * Logs a message with `Error` level.
     *
     * @static
     * @param {string} message The Log message.
     * @memberof Log
     */
    public static Error(message: string): void {
        this.Write(LogLevel.Error, message);
    }

    /**
     * Logs a message with `Fatal` level.
     *
     * @static
     * @param {string} message The Log message.
     * @memberof Log
     */
    public static Fatal(message: string): void {
        this.Write(LogLevel.Fatal, message);
    }

    /**
     * Returns the `LogSpecification`.
     *
     * @static
     * @returns {LogSpecification} The `LogSpecification`.
     * @memberof Log
     */
    public static GetSpecification(): LogSpecification {
        return this.specification;
    }

    /**
     * Writes a Log message based on a `LogLevel`.
     *
     * @private
     * @static
     * @param {LogLevel} level The `LogLevel`.
     * @param {string} message The Log message.
     * @returns {void}
     * @memberof Log
     */
    private static Write(level: LogLevel, message: string): void {
        if (level < this.currentLevel) {
            return;
        }

        const now: Date = new Date();
        const str: string = `${now.toISOString()} ${this.LevelToString(
            level
        )} ${this.GetProcessID()} --- [${this.specification.Name}]: ${message}`;

        switch (level) {
            case LogLevel.Trace:    console.trace(str);     break;
            case LogLevel.Debug:    console.debug(str);     break;
            case LogLevel.Info:     console.info(str);      break;
            case LogLevel.Warning:  console.warn(str);      break;
            case LogLevel.Error:    console.error(str);     break;
            case LogLevel.Fatal:    console.error(str);     break;
            default:                console.log(str);       break;
        }
    }

    /**
     * Converts the `LogLevel` to a string.
     *
     * @private
     * @static
     * @param {LogLevel} level The `LogLevel` to convert.
     * @returns {string} The string representation of the `LogLevel`.
     * @memberof Log
     */
    private static LevelToString(level: LogLevel): string {
        switch (level) {
            case LogLevel.Trace:    return "TRACE  ";
            case LogLevel.Debug:    return "DEBUG  ";
            case LogLevel.Info:     return "INFO   ";
            case LogLevel.Warning:  return "WARN   ";
            case LogLevel.Error:    return "ERROR  ";
            case LogLevel.Fatal:    return "FATAL  ";
            default:                return "UNKNOWN";
        }
    }

    /**
     * Returns the process ID.
     *
     * @private
     * @static
     * @returns {number} The process ID.
     * @memberof Log
     */
    private static GetProcessID(): number {
        return process.pid;
    }
}