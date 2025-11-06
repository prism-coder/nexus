import {
    Application,
    ApplicationSpecification,
    Log,
    ServiceLocator,
    EventBus,
    Service,
    Layer,
    Event,
} from "../../Source";

const mockContainerInstance = {
    Register: jest.fn(),
    Initialize: jest.fn(),
    Shutdown: jest.fn(() => Promise.resolve()),
    Get: jest.fn(),
};

const mockLayerStackInstance = {
    PushLayer: jest.fn(),
    PushOverlay: jest.fn(),
    OnEvent: jest.fn(),
    OnUpdate: jest.fn(),
    Shutdown: jest.fn(),
};

jest.mock("../../Source/Core/Log", () => ({
    Log: {
        Initialize: jest.fn(),
        Info: jest.fn(),
        Warning: jest.fn(),
        Error: jest.fn(),
        Fatal: jest.fn(),
        SetAppName: jest.fn(),
        GetSpecification: jest.fn(() => ({ Name: "MockLog" })),
    },
}));

jest.mock("../../Source/Core/ServiceContainer", () => ({
    ServiceContainer: jest.fn(() => mockContainerInstance),
}));

jest.mock("../../Source/Core/LayerStack", () => ({
    LayerStack: jest.fn(() => mockLayerStackInstance),
}));

jest.mock("../../Source/Core/ServiceLocator");
jest.mock("../../Source/Core/EventBus");

const mockProcessExit = jest
    .spyOn(process, "exit")
    .mockImplementation(
        (code?: string | number | null | undefined) => undefined as never
    );

describe("Application", () => {
    let spec: ApplicationSpecification;
    let app: Application;

    beforeAll(() => {
        jest.useFakeTimers();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        spec = { Name: "TestApp" };
        app = new Application(spec);
    });

    afterEach(async () => {
        if ((app as any).running) {
            app.Close();
        }

        jest.runOnlyPendingTimers();
        await Promise.resolve();
    });

    afterAll(() => {
        jest.useRealTimers();
        mockProcessExit.mockRestore();
    });

    it("should create a new instance", () => {
        expect(app).toBeInstanceOf(Application);
        const app2 = new Application({ Name: "App2" });
        expect(app2).not.toBe(app);
    });

    it("should initialize all core components on create", () => {
        expect(Log.Initialize).toHaveBeenCalledWith(
            expect.objectContaining({ Name: "TestApp" })
        );
        expect(ServiceLocator.Initialize).toHaveBeenCalledWith(
            mockContainerInstance
        );
        expect(EventBus.Initialize).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should register and initialize services", async () => {
        class MockService extends Service {
            OnInitialize = jest.fn();
            OnShutdown = jest.fn();
        }
        const mockService = new MockService();

        app.RegisterService(MockService, mockService);
        await app.InitializeServices();

        expect(mockContainerInstance.Register).toHaveBeenCalledWith(
            MockService,
            mockService
        );
        expect(mockContainerInstance.Initialize).toHaveBeenCalledTimes(1);
    });

    it("should push layers to the layer stack", () => {
        class MockLayer extends Layer {
            OnAttach = jest.fn();
            OnDetach = jest.fn();
            OnUpdate = jest.fn();
            OnEvent = jest.fn();
        }

        const mockLayer = new MockLayer();
        const mockOverlay = new MockLayer();

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

        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(1);
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledWith(
            expect.any(Number)
        );

        jest.runOnlyPendingTimers();
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(2);

        jest.runOnlyPendingTimers();
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(3);
    });

    it("should stop the loop and shut down on Close()", async () => {
        app.Run();
        jest.runOnlyPendingTimers();

        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(2);

        app.Close();

        jest.runOnlyPendingTimers();
        await Promise.resolve();

        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(2);
        expect(mockContainerInstance.Shutdown).toHaveBeenCalledTimes(1);
        expect(mockLayerStackInstance.Shutdown).toHaveBeenCalledTimes(1);
        expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
    
    it("should return specification", () => {
        expect(app.GetSpecification()).toBe(spec);
    });

    it("should return service container", () => {
        expect(app.GetServiceContainer()).toBe(mockContainerInstance);
    });

    it("should handle shutdown failure from layerstack", async () => {
        mockLayerStackInstance.Shutdown.mockImplementation(() => {
            throw new Error("Test Shutdown Failure");
        });

        app.Run();
        app.Close();

        jest.runOnlyPendingTimers();
        await Promise.resolve();

        expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
});
