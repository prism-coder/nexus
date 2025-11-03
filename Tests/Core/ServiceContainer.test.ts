// Sobrescribe este fichero. Combina tus tests anteriores con los que faltaban.
import { ServiceContainer, Service, Log } from '../../Source';

// --- Servicio Falso (Mock) ---
class MockService extends Service {
    Initialize = jest.fn(() => Promise.resolve());
    Shutdown = jest.fn(() => Promise.resolve());
    DoWork = () => 'work_done';
}

// Suprimir logs
jest.spyOn(Log, 'Info').mockImplementation(() => {});

describe('ServiceContainer', () => {

    let container: ServiceContainer;
    let service: MockService;

    beforeEach(() => {
        container = new ServiceContainer();
        service = new MockService();
        container.Register(MockService, service);
    });

    it('should register and retrieve a service', () => {
        const retrieved = container.Get(MockService);
        expect(retrieved).toBe(service);
        expect(retrieved.DoWork()).toBe('work_done');
    });

    it('should call Initialize on all services', async () => {
        await container.Initialize();
        expect(service.Initialize).toHaveBeenCalledTimes(1);
    });

    // --- TEST AÑADIDO ---
    it('should call Shutdown on all services', async () => {
        await container.Shutdown();
        expect(service.Shutdown).toHaveBeenCalledTimes(1);
    });

    // --- TEST AÑADIDO ---
    it('should log a warning when registering a duplicate service', () => {
        const warnSpy = jest.spyOn(Log, 'Warning').mockImplementation(() => {});
        const service2 = new MockService();

        container.Register(MockService, service2);

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Service already registered: MockService')
        );
        // El contenedor NO debe sobreescribir el servicio original
        expect(container.Get(MockService)).toBe(service);
        
        warnSpy.mockRestore();
    });

    it('should throw an error if Get is called for an unregistered service', () => {
        class UnregisteredService extends Service {
            Initialize = jest.fn();
            Shutdown = jest.fn();
        }
        expect(() => {
            container.Get(UnregisteredService);
        }).toThrow('Service not found: UnregisteredService');
    });

    it('should catch and re-throw error if a service fails to initialize', async () => {
        const errorSpy = jest.spyOn(Log, 'Error').mockImplementation(() => {});

        class FailingService extends Service {
            Initialize = jest.fn(async () => { 
                throw new Error('DB connection failed'); 
            });
            Shutdown = jest.fn();
        }

        container.Register(FailingService, new FailingService());

        // Assert
        // Verificamos que la promesa es rechazada con el error
        await expect(container.Initialize())
            .rejects
            .toThrow('DB connection failed');
        
        // El servicio original SÍ fue inicializado
        expect(service.Initialize).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to init FailingService'));

        errorSpy.mockRestore();
    });
});