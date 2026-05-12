import {
    Application,
    ApplicationSpecification,
    Log,
    ServiceLocator,
    EventBus,
    Service,
    Layer,
    Event,
    InvalidArgumentError,
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

        spec = { Name: "TestApp", RunLoop: true };
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

    it("should run the tick loop when RunLoop is true", () => {
        app.Run();

        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(1);
        jest.runOnlyPendingTimers();
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(2);
    });

    it("should NOT run the tick loop when RunLoop is false", () => {
        const apiSpec: ApplicationSpecification = {
            Name: "API",
            RunLoop: false,
        };

        const apiApp = new Application(apiSpec);

        apiApp.Run();

        expect(mockLayerStackInstance.OnUpdate).not.toHaveBeenCalled();
        jest.runOnlyPendingTimers();
        expect(mockLayerStackInstance.OnUpdate).not.toHaveBeenCalled();

        apiApp.Close();
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

        expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it("should throw InvalidArgumentError if Name is empty", () => {
        expect(() => {
            new Application({ Name: "" });
        }).toThrow(InvalidArgumentError);
    });

    it("should throw InvalidArgumentError if Name is whitespace", () => {
        expect(() => {
            new Application({ Name: "   " });
        }).toThrow(InvalidArgumentError);
    });

    it("should log a warning and not double-shutdown when Close() is called twice", async () => {
        const warnSpy = jest.spyOn(Log, "Warning");

        app.Run();
        app.Close();
        app.Close();

        jest.runOnlyPendingTimers();
        await Promise.resolve();

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("Close() was called more than once")
        );
        expect(mockContainerInstance.Shutdown).toHaveBeenCalledTimes(1);

        warnSpy.mockRestore();
    });

    it("should catch an OnUpdate error in Tick(), log it, and call Close()", async () => {
        const errorSpy = jest.spyOn(Log, "Error");
        mockLayerStackInstance.OnUpdate.mockImplementationOnce(() => {
            throw new Error("Tick error");
        });

        app.Run();

        jest.runOnlyPendingTimers();
        await Promise.resolve();

        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Tick error")
        );
        // Loop should have stopped — no further OnUpdate calls after the error
        jest.runOnlyPendingTimers();
        expect(mockLayerStackInstance.OnUpdate).toHaveBeenCalledTimes(1);

        errorSpy.mockRestore();
    });

    it("should catch an OnEvent error in EmitEvent() and log it", () => {
        const errorSpy = jest.spyOn(Log, "Error");
        mockLayerStackInstance.OnEvent.mockImplementationOnce(() => {
            throw new Error("EmitEvent error");
        });

        const mockEvent = {} as Event;
        app.EmitEvent(mockEvent);

        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("EmitEvent error")
        );

        errorSpy.mockRestore();
    });

    it("should continue to shut down LayerStack when serviceContainer.Shutdown() throws", async () => {
        const errorSpy = jest.spyOn(Log, "Error");
        mockContainerInstance.Shutdown.mockRejectedValueOnce(
            new Error("Service shutdown failed")
        );

        app.Run();
        app.Close();

        jest.runOnlyPendingTimers();
        await Promise.resolve();

        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Service shutdown failed")
        );
        expect(mockLayerStackInstance.Shutdown).toHaveBeenCalledTimes(1);

        errorSpy.mockRestore();
    });
});
