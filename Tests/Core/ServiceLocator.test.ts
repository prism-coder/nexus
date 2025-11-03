import { ServiceLocator, ServiceContainer, Service, Log } from "../../Source";

// --- Servicio Falso (Mock) ---
class MockService extends Service {
    Initialize = jest.fn(() => Promise.resolve());
    Shutdown = jest.fn(() => Promise.resolve());
    DoWork = () => "work_done";
}

// Suprimir logs
jest.spyOn(Log, "Info").mockImplementation(() => {});

describe("ServiceLocator", () => {
    let container: ServiceContainer;
    let service: MockService;

    beforeEach(() => {
        // Reseteamos el ServiceLocator
        (ServiceLocator as any).container = null;

        container = new ServiceContainer();
        service = new MockService();
        container.Register(MockService, service);
    });

    it("should throw an error if Get is called before Initialize", () => {
        expect(() => {
            ServiceLocator.Get(MockService);
        }).toThrow("ServiceLocator has not been initialized!");
    });

    it("should Get a service after being initialized", () => {
        ServiceLocator.Initialize(container);
        const retrieved = ServiceLocator.Get(MockService);

        expect(retrieved).toBe(service);
        expect(retrieved.DoWork()).toBe("work_done");
    });

    // --- NUEVO TEST ---
    it("should log a warning if initialized more than once", () => {
        const warnSpy = jest.spyOn(Log, "Warning").mockImplementation(() => {});
        const container2 = new ServiceContainer();

        // Act
        ServiceLocator.Initialize(container); // Primera llamada
        ServiceLocator.Initialize(container2); // Segunda llamada

        // Assert
        expect(warnSpy).toHaveBeenCalledWith(
            "ServiceLocator::Initialize - Already initialized."
        );
        // El contenedor NO debe cambiar
        expect(ServiceLocator.Get(MockService)).toBe(service);

        warnSpy.mockRestore();
    });
});
