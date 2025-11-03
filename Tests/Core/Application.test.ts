import {
    Application,
    ApplicationSpecification,
    Log,
    LayerStack,
    ServiceContainer,
    ServiceLocator,
    EventBus,
    Service,
    Layer,
    Event,
} from "../../Source"; // Tu import de 'Source' está bien

// --- Instancias de Mocks ---
const mockContainerInstance = {
    Register: jest.fn(),
    Initialize: jest.fn(),
    Shutdown: jest.fn(),
    Get: jest.fn(),
};
const mockLayerStackInstance = {
    PushLayer: jest.fn(),
    PushOverlay: jest.fn(),
    OnEvent: jest.fn(),
    OnUpdate: jest.fn(),
    Shutdown: jest.fn(() => true),
};

// --- Mocks de Dependencias ---
jest.mock("../../Source/Core/Log", () => ({
    Log: {
        Initialize: jest.fn(),
        Info: jest.fn(),
        Warning: jest.fn(),
        SetAppName: jest.fn(),
        Fatal: jest.fn(), // Añadido para el test de 'unhandledRejection'
    },
}));

jest.mock("../../Source/Core/ServiceContainer", () => {
    return {
        ServiceContainer: jest.fn(() => mockContainerInstance),
    };
});
jest.mock("../../Source/Core/LayerStack", () => {
    return {
        LayerStack: jest.fn(() => mockLayerStackInstance),
    };
});

jest.mock("../../Source/Core/ServiceLocator");
jest.mock("../../Source/Core/EventBus");

const mockProcessExit = jest
    .spyOn(process, "exit")
    .mockImplementation(
        (code?: string | number | null | undefined) => undefined as never
    );
// ---

describe("Application", () => {
    let spec: ApplicationSpecification;
    let app: Application;

    beforeAll(() => {
        jest.useFakeTimers();
    });

    beforeEach(() => {
        // --- ¡¡LA CORRECCIÓN MÁS IMPORTANTE!! ---
        // Reseteamos el Singleton de Application antes de cada test
        (Application as any).instance = undefined;
        // ------------------------------------------

        jest.clearAllMocks();

        // Reseteamos el mock de Shutdown de LayerStack a su valor por defecto
        mockLayerStackInstance.Shutdown.mockReturnValue(true);

        spec = { Name: "TestApp" };
        app = Application.Create(spec);
    });

    afterAll(() => {
        jest.useRealTimers();
        mockProcessExit.mockRestore();
    });

    it("should create a singleton instance", () => {
        expect(app).toBeInstanceOf(Application);
        const app2 = Application.Create({ Name: "App2" });
        expect(app2).toBe(app);
        expect(Log.SetAppName).toHaveBeenCalledWith("App2");
    });

    it("should initialize all core components on create", () => {
        // app se crea en beforeEach, llamando a Initialize 1 vez
        expect(Log.Initialize).toHaveBeenCalledTimes(1); // <-- Corregido
        expect(Log.Initialize).toHaveBeenCalledWith(
            expect.objectContaining({ Name: "TestApp" })
        );
        expect(ServiceLocator.Initialize).toHaveBeenCalledWith(
            mockContainerInstance
        );
        expect(EventBus.Initialize).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should register and initialize services", async () => {
        class MockSvc extends Service {
            Initialize = jest.fn();
            Shutdown = jest.fn();
        }
        const mockService = new MockSvc();

        app.RegisterService(MockSvc, mockService);
        await app.InitializeServices();

        expect(mockContainerInstance.Register).toHaveBeenCalledWith(
            MockSvc,
            mockService
        );
        expect(mockContainerInstance.Initialize).toHaveBeenCalledTimes(1);
    });

    it("should push layers to the layer stack", () => {
        class MockLyr extends Layer {
            OnAttach = jest.fn();
            OnDetach = jest.fn();
            OnUpdate = jest.fn();
            OnEvent = jest.fn();
        }
        const mockLayer = new MockLyr();
        const mockOverlay = new MockLyr();

        app.PushLayer(mockLayer);
        app.PushOverlay(mockOverlay);

        expect(mockLayerStackInstance.PushLayer).toHaveBeenCalledWith(
            mockLayer
        );
        expect(mockLayerStackInstance.PushOverlay).toHaveBeenCalledWith(
            mockOverlay
        );
    });

    it("should emit events to the layer stack", () => {
        const mockEvent = {} as Event;
        app.EmitEvent(mockEvent);
        expect(mockLayerStackInstance.OnEvent).toHaveBeenCalledWith(mockEvent);
    });

    it("should run the tick loop and update layers", () => {
        app.Run();

        // --- Corrección de Lógica de Tick ---
        // Run() llama a Tick() 1 vez sincrónicamente
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(1);
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledWith(
            expect.any(Number)
        );

        jest.runOnlyPendingTimers(); // Avanza 1 tick de setImmediate
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(2);

        jest.runOnlyPendingTimers(); // Avanza otro tick
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(3);
    });

    it("should stop the loop and shut down on Close()", async () => {
        app.Run(); // Tick 1 (sync)

        jest.runOnlyPendingTimers(); // Tick 2 (async)

        // --- Corrección de Lógica de Tick ---
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(2);

        app.Close();

        jest.runOnlyPendingTimers(); // Avanza el tick que detectará running = false

        // No debió actualizarse de nuevo
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(2); // <-- Corregido
        expect(mockContainerInstance.Shutdown).toHaveBeenCalledTimes(1);
        expect(mockLayerStackInstance.Shutdown).toHaveBeenCalledTimes(1);
        expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    // --- Tests Adicionales para Cobertura ---
    it("should return specification", () => {
        expect(app.GetSpecification()).toBe(spec);
    });

    it("should return service container", () => {
        expect(app.GetServiceContainer()).toBe(mockContainerInstance);
    });

    it("should handle shutdown failure from layerstack", async () => {
        // Hacemos que Shutdown() de LayerStack devuelva 'false'
        mockLayerStackInstance.Shutdown.mockReturnValue(false);

        app.Run();
        app.Close();
        jest.runOnlyPendingTimers(); // Shutdown corre

        // Debe salir con código 1
        expect(mockProcessExit).toHaveBeenCalledWith(1); // <-- Corregido
    });
});
