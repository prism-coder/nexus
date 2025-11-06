import {
    Log,
    LogLevel,
    LogSpecification
} from '../../Source/Core/Log';

describe('Log', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleTraceSpy: jest.SpyInstance;
    let consoleDebugSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        consoleTraceSpy = jest.spyOn(console, 'trace').mockImplementation(() => {});
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        Log.SetLevel(LogLevel.Trace); 
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleTraceSpy.mockRestore();
        consoleDebugSpy.mockRestore();
        consoleInfoSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('should initialize and set app name', () => {
        const spec: LogSpecification = { Name: "MyApp" };
        Log.Initialize(spec);
        
        expect(Log.GetSpecification()).toEqual(spec);
        expect(consoleInfoSpy).toHaveBeenCalledTimes(2);

        Log.SetAppName("OtherApp");
        expect(Log.GetSpecification().Name).toBe("OtherApp");
    });

    it('should write logs based on level', () => {
        Log.Trace('trace msg');
        expect(consoleTraceSpy).toHaveBeenCalledWith(expect.stringContaining('TRACE'));
        Log.Debug('debug msg');
        expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('DEBUG'));
        Log.Info('info msg');
        expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('INFO'));
        Log.Warning('warn msg');
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'));
        Log.Error('error msg');
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
        Log.Fatal('fatal msg');
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('FATAL'));
    });

    it('should not log messages below the current level', () => {
        Log.SetLevel(LogLevel.Warning);

        Log.Trace('trace msg');
        Log.Debug('debug msg');
        Log.Info('info msg');
        Log.Warning('warn msg');
        Log.Error('error msg');

        expect(consoleTraceSpy).not.toHaveBeenCalled();
        expect(consoleDebugSpy).not.toHaveBeenCalled();
        expect(consoleInfoSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle unknown log level string', () => {
        (Log as any).Write(99, "unknown msg");

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('UNKNOWN'));
    });

    it('should cover branch for console.trace in Write', () => {
        Log.SetLevel(LogLevel.Trace);
        Log.Trace('test trace');
        expect(consoleTraceSpy).toHaveBeenCalled();
    });
});