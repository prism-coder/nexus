import {
    ServiceContainer,
    Service,
    Log
} from '../../Source';

class MockService extends Service {
    OnInitialize = jest.fn(() => Promise.resolve());
    OnShutdown = jest.fn(() => Promise.resolve());
    DoWork = () => 'work_done';
}

jest.spyOn(Log, 'Info').mockImplementation(() => {});
let errorSpy: jest.SpyInstance;

describe('ServiceContainer', () => {
    let container: ServiceContainer;
    let service: MockService;

    beforeEach(() => {
        errorSpy = jest.spyOn(Log, "Error").mockImplementation(() => {});
        container = new ServiceContainer();
        service = new MockService();
        container.Register(MockService, service);
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    it('should register and retrieve a service', () => {
        const retrieved = container.Get(MockService);
        expect(retrieved).toBe(service);
        expect(retrieved.DoWork()).toBe('work_done');
    });

    it('should call OnInitialize on all services', async () => {
        await container.Initialize();
        expect(service.OnInitialize).toHaveBeenCalledTimes(1);
    });

    it('should call OnShutdown on all services', async () => {
        await container.Shutdown();
        expect(service.OnShutdown).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when registering a duplicate service', () => {
        const service2 = new MockService();

        expect(() => {
            container.Register(MockService, service2);
        }).toThrow(
            `ServiceContainer::Register - Service already registered: 'MockService'`
        );

        expect(container.Get(MockService)).toBe(service);
    });

    it('should throw an error if Get is called for an unregistered service', () => {
        class UnregisteredService extends Service {
            OnInitialize = jest.fn();
            OnShutdown = jest.fn();
        }

        expect(() => {
            container.Get(UnregisteredService);
        }).toThrow(
            `ServiceContainer::Get - Service not found: 'UnregisteredService'. ` +
            `Did you forget to call 'app.RegisterService()'?`
        );
    });

    it('should catch and re-throw error if a service fails to initialize', async () => {
        class FailingService extends Service {
            OnInitialize = jest.fn(async () => { 
                throw new Error('DB connection failed'); 
            });
            OnShutdown = jest.fn();
        }

        container.Register(FailingService, new FailingService());

        await expect(container.Initialize())
            .rejects
            .toThrow('DB connection failed');
        
        expect(service.OnInitialize).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
            `ServiceContainer::Initialize - Failed to initialize service 'FailingService': DB connection failed`
        );
    });
});