// Tests/Core/Log.test.ts

import { Log, LogLevel, LogSpecification } from '../../Source/Core/Log';

describe('Log', () => {
    // Definimos los spies fuera para que sean accesibles en todos los scopes
    let consoleTraceSpy: jest.SpyInstance;
    let consoleDebugSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        // Creamos los spies AQUI
        consoleTraceSpy = jest.spyOn(console, 'trace').mockImplementation(() => {});
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        Log.SetLevel(LogLevel.Trace); 
    });

    afterEach(() => {
        // Restauramos los spies DESPUÉS de CADA test
        consoleTraceSpy.mockRestore();
        consoleDebugSpy.mockRestore();
        consoleInfoSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('should initialize and set app name', () => {
        const spec: LogSpecification = { Name: 'MiApp' };
        Log.Initialize(spec); // Llama a console.info 2 veces
        
        expect(Log.GetSpecification()).toEqual(spec);
        expect(consoleInfoSpy).toHaveBeenCalledTimes(2);

        Log.SetAppName('OtraApp');
        expect(Log.GetSpecification().Name).toBe('OtraApp');
    });

    it('should write logs based on level', () => {
        Log.Trace('trace msg');
        expect(consoleTraceSpy).toHaveBeenCalledWith(expect.stringContaining('TRACE'));
        // ... (el resto de este test está bien) ...
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
        expect(consoleInfoSpy).not.toHaveBeenCalled(); // <-- Ahora sí pasará
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle unknown log level string', () => {
        // Forzamos un nivel desconocido para probar LevelToString
        (Log as any).Write(-1, 'unknown msg');
        // Gracias al 'default' que añadimos, esto ahora llama a console.info
        expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('UNKNOWN'));
    });

    // --- TEST ADICIONAL PARA COBERTURA ---
    it('should cover branch for console.trace in Write', () => {
        // Este test solo existe para cubrir el branch de Log.ts:244
        Log.SetLevel(LogLevel.Trace);
        Log.Trace('test trace');
        expect(consoleTraceSpy).toHaveBeenCalled();
    });
});